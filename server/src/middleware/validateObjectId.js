import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';

/**
 * Middleware factory to validate that specified route params are valid MongoDB ObjectIds.
 * Usage: validateObjectId('id') or validateObjectId('id', 'projectId')
 */
const validateObjectId = (...paramNames) => {
  return (req, res, next) => {
    for (const param of paramNames) {
      const value = req.params[param];
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw ApiError.badRequest(`Invalid ${param}: ${value}`);
      }
    }
    next();
  };
};

export default validateObjectId;
