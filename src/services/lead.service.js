import { Lead } from '../models/Lead.model.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';
import { escapeRegex, cleanString, isSafeString } from '../utils/sanitize.js';

export const createLead = async (leadData, clientMeta = {}) => {
  const newLead = new Lead({
    ...leadData,
    ipAddress: clientMeta.ip || '',
    userAgent: clientMeta.userAgent || '',
  });

  const savedLead = await newLead.save();
  logger.info(`New lead saved to MongoDB with ID: ${savedLead._id} from source: [${savedLead.source}]`);

  // Optional: Dispatch email notification via Resend if credentials are provided
  if (config.resend.apiKey && config.resend.leadToEmail) {
    try {
      await sendEmailNotification(savedLead);
    } catch (err) {
      logger.error('Failed to send Resend email notification:', err.message);
      // Non-blocking: we still return the saved lead even if email fails
    }
  }

  return savedLead;
};

export const getLeads = async ({ page = 1, limit = 20, status, source, search } = {}) => {
  const query = {};

  // Protect against NoSQL object injection: ensure values are primitive strings
  if (isSafeString(status) && status !== 'all') {
    query.status = cleanString(status, 50);
  }

  if (isSafeString(source) && source !== 'all') {
    query.source = cleanString(source, 50);
  }

  if (isSafeString(search)) {
    const trimmed = search.trim();
    if (trimmed) {
      // Escape special characters to prevent ReDoS or RegExp syntax crashes
      const escaped = escapeRegex(trimmed);
      const searchRegex = new RegExp(escaped, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { company: searchRegex },
        { service: searchRegex },
        { message: searchRegex },
      ];
    }
  }

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const [leads, total] = await Promise.all([
    Lead.find(query).sort({ createdAt: -1 }).skip(skip).limit(parsedLimit),
    Lead.countDocuments(query),
  ]);

  return {
    leads,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

export const getLeadById = async (id) => {
  return await Lead.findById(id);
};

export const updateLeadStatus = async (id, status) => {
  const validStatuses = ['new', 'in-progress', 'contacted', 'archived', 'closed'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: "${status}". Allowed: ${validStatuses.join(', ')}`);
  }

  const updatedLead = await Lead.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  if (!updatedLead) {
    return null;
  }

  logger.info(`Updated lead ${id} status to: [${status}]`);
  return updatedLead;
};

export const updateLead = async (id, updateData = {}) => {
  const allowedFields = ['name', 'email', 'company', 'service', 'budget', 'message', 'status'];
  const updatePayload = {};

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      const maxLen = field === 'message' ? 4000 : 200;
      updatePayload[field] = typeof updateData[field] === 'string'
        ? cleanString(updateData[field], maxLen)
        : updateData[field];
    }
  }

  if (updatePayload.name !== undefined && updatePayload.name === '') {
    throw new Error('Name cannot be empty.');
  }

  if (updatePayload.email !== undefined && updatePayload.email === '') {
    throw new Error('Contact email or phone cannot be empty.');
  }

  if (updatePayload.status) {
    const validStatuses = ['new', 'in-progress', 'contacted', 'archived', 'closed'];
    if (!validStatuses.includes(updatePayload.status)) {
      throw new Error(`Invalid status: "${updatePayload.status}". Allowed: ${validStatuses.join(', ')}`);
    }
  }

  const updatedLead = await Lead.findByIdAndUpdate(
    id,
    updatePayload,
    { new: true, runValidators: true }
  );

  if (!updatedLead) {
    return null;
  }

  logger.info(`Updated lead ${id} fields: [${Object.keys(updatePayload).join(', ')}]`);
  return updatedLead;
};

export const deleteLead = async (id) => {
  const deleted = await Lead.findByIdAndDelete(id);
  if (deleted) {
    logger.info(`Deleted lead with ID: ${id}`);
  }
  return deleted;
};

export const getLeadStats = async () => {
  const [total, byStatus, bySource, recent] = await Promise.all([
    Lead.countDocuments(),
    Lead.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Lead.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]),
    Lead.find().sort({ createdAt: -1 }).limit(5),
  ]);

  const statusMap = {
    new: 0,
    'in-progress': 0,
    contacted: 0,
    closed: 0,
    archived: 0,
  };

  byStatus.forEach((item) => {
    if (item._id) {
      statusMap[item._id] = item.count;
    }
  });

  const sourceMap = {};
  bySource.forEach((item) => {
    if (item._id) {
      sourceMap[item._id] = item.count;
    }
  });

  return {
    total,
    statusCounts: statusMap,
    sourceCounts: sourceMap,
    recentLeads: recent,
  };
};

const sendEmailNotification = async (lead) => {
  const { apiKey, leadToEmail, leadFromEmail } = config.resend;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: leadFromEmail,
      to: [leadToEmail],
      reply_to: lead.email.includes('@') ? lead.email : undefined,
      subject: `New enquiry from ${lead.name}${lead.company ? ` (${lead.company})` : ''}`,
      html: `
        <h2>New Enquiry Received (RoshaLink)</h2>
        <p><strong>Name:</strong> ${lead.name}</p>
        <p><strong>Contact:</strong> ${lead.email}</p>
        <p><strong>Company:</strong> ${lead.company || '-'}</p>
        <p><strong>Service:</strong> ${lead.service || '-'}</p>
        <p><strong>Budget:</strong> ${lead.budget || '-'}</p>
        <p><strong>Source:</strong> ${lead.source}</p>
        <p><strong>Language:</strong> ${lead.lang}</p>
        <p><strong>Message:</strong></p>
        <blockquote>${lead.message || '(No message)'}</blockquote>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend API returned status ${response.status}: ${errorText}`);
  }

  logger.info(`Email notification sent successfully for lead: ${lead._id}`);
};
