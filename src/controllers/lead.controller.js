import * as leadService from '../services/lead.service.js';
import { createdResponse, successResponse, errorResponse } from '../utils/apiResponse.js';

export const handleCreateLead = async (req, res, next) => {
  try {
    const leadData = req.sanitizedBody;
    const clientMeta = {
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
    };

    const newLead = await leadService.createLead(leadData, clientMeta);

    return createdResponse(res, newLead, 'Lead received and stored successfully');
  } catch (error) {
    next(error);
  }
};

export const handleGetLeads = async (req, res, next) => {
  try {
    const { page, limit, status, source, search } = req.query;
    const result = await leadService.getLeads({ page, limit, status, source, search });

    return successResponse(res, result, 'Leads retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const handleGetLeadById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lead = await leadService.getLeadById(id);

    if (!lead) {
      return errorResponse(res, 'Lead not found', 404);
    }

    return successResponse(res, lead, 'Lead found');
  } catch (error) {
    next(error);
  }
};

export const handleUpdateLeadStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return errorResponse(res, 'Status is required in request body', 400);
    }

    const updatedLead = await leadService.updateLeadStatus(id, status);
    if (!updatedLead) {
      return errorResponse(res, 'Lead not found', 404);
    }

    return successResponse(res, updatedLead, 'Lead status updated successfully');
  } catch (error) {
    next(error);
  }
};

export const handleUpdateLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!updateData || Object.keys(updateData).length === 0) {
      return errorResponse(res, 'No update fields provided', 400);
    }

    const updatedLead = await leadService.updateLead(id, updateData);
    if (!updatedLead) {
      return errorResponse(res, 'Lead not found', 404);
    }

    return successResponse(res, updatedLead, 'Lead updated successfully');
  } catch (error) {
    if (
      error.message.includes('cannot be empty') ||
      error.message.includes('Invalid status')
    ) {
      return errorResponse(res, error.message, 400);
    }
    next(error);
  }
};

export const handleDeleteLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await leadService.deleteLead(id);

    if (!deleted) {
      return errorResponse(res, 'Lead not found', 404);
    }

    return successResponse(res, { id }, 'Lead deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const handleGetLeadStats = async (req, res, next) => {
  try {
    const stats = await leadService.getLeadStats();
    return successResponse(res, stats, 'Lead statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};
