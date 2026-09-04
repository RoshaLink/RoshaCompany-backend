import * as newsletterService from '../services/newsletter.service.js';
import { createdResponse, successResponse, errorResponse } from '../utils/apiResponse.js';

export const handleSubscribe = async (req, res, next) => {
  try {
    const subscriberData = req.sanitizedBody;
    const clientMeta = {
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
    };

    const result = await newsletterService.subscribe(subscriberData, clientMeta);

    if (result.alreadySubscribed) {
      return successResponse(
        res,
        {
          id: result.subscriber.id,
          email: result.subscriber.email,
          alreadySubscribed: true,
        },
        'You are already subscribed to our newsletter!'
      );
    }

    return createdResponse(
      res,
      {
        id: result.subscriber.id,
        email: result.subscriber.email,
        alreadySubscribed: false,
      },
      'Subscribed successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const handleGetSubscribers = async (req, res, next) => {
  try {
    const { page, limit, status, search } = req.query;
    const result = await newsletterService.getSubscribers({ page, limit, status, search });
    return successResponse(res, result, 'Subscribers retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const handleGetNewsletterStats = async (req, res, next) => {
  try {
    const stats = await newsletterService.getNewsletterStats();
    return successResponse(res, stats, 'Newsletter statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const handleDeleteSubscriber = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await newsletterService.deleteSubscriber(id);

    if (!deleted) {
      return errorResponse(res, 'Subscriber not found', 404);
    }

    return successResponse(res, { id }, 'Subscriber deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const handleUpdateSubscriberStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return errorResponse(res, 'Status is required', 400);
    }

    const updated = await newsletterService.updateSubscriberStatus(id, status);
    if (!updated) {
      return errorResponse(res, 'Subscriber not found', 404);
    }

    return successResponse(res, updated, 'Subscriber status updated successfully');
  } catch (error) {
    next(error);
  }
};
