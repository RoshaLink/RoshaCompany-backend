import { Newsletter } from '../models/Newsletter.model.js';
import { logger } from '../utils/logger.js';
import { escapeRegex, cleanString, isSafeString } from '../utils/sanitize.js';

/**
 * Handle new or re-activated newsletter subscriptions
 */
export const subscribe = async (data, clientMeta = {}) => {
  const { email, lang = 'sv', source = 'footer-newsletter' } = data;
  const { ip = '', userAgent = '' } = clientMeta;

  // Check if subscriber already exists
  const existing = await Newsletter.findOne({ email });

  if (existing) {
    if (existing.status === 'active') {
      logger.info(`Newsletter email already active: ${email}`);
      return {
        alreadySubscribed: true,
        subscriber: existing,
      };
    }

    // Reactivate previously unsubscribed email
    existing.status = 'active';
    existing.lang = lang;
    existing.source = source;
    if (ip) existing.ipAddress = ip;
    if (userAgent) existing.userAgent = userAgent;
    await existing.save();

    logger.info(`Reactivated newsletter subscriber: ${email}`);
    return {
      reactivated: true,
      subscriber: existing,
    };
  }

  // Create new subscription record
  const newSubscriber = await Newsletter.create({
    email,
    lang,
    source,
    status: 'active',
    ipAddress: ip,
    userAgent,
  });

  logger.info(`New newsletter subscriber added: ${email}`);
  return {
    isNew: true,
    subscriber: newSubscriber,
  };
};

/**
 * Get paginated list of subscribers with optional search and status filter
 */
export const getSubscribers = async (options = {}) => {
  const page = Math.max(1, parseInt(options.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(options.limit || '20', 10)));
  const skip = (page - 1) * limit;

  const query = {};

  // Protect against NoSQL object injection
  if (isSafeString(options.status) && options.status !== 'all') {
    query.status = cleanString(options.status, 50);
  }

  if (isSafeString(options.search)) {
    const trimmed = options.search.trim();
    if (trimmed) {
      // Escape special regex chars for security against ReDoS & regex injection
      const escaped = escapeRegex(trimmed);
      query.email = { $regex: escaped, $options: 'i' };
    }
  }

  const [subscribers, total] = await Promise.all([
    Newsletter.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Newsletter.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    subscribers: subscribers.map((sub) => ({
      ...sub,
      id: sub._id.toString(),
    })),
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

/**
 * Get aggregated statistics for the admin dashboard
 */
export const getNewsletterStats = async () => {
  const [total, active, unsubscribed, last30Days] = await Promise.all([
    Newsletter.countDocuments({}),
    Newsletter.countDocuments({ status: 'active' }),
    Newsletter.countDocuments({ status: 'unsubscribed' }),
    Newsletter.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }),
  ]);

  return {
    total,
    active,
    unsubscribed,
    last30Days,
  };
};

/**
 * Delete a subscriber by ID
 */
export const deleteSubscriber = async (id) => {
  return Newsletter.findByIdAndDelete(id);
};

/**
 * Update subscriber status (active/unsubscribed)
 */
export const updateSubscriberStatus = async (id, status) => {
  if (!['active', 'unsubscribed'].includes(status)) {
    throw new Error('Invalid status. Must be "active" or "unsubscribed"');
  }
  return Newsletter.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
};
