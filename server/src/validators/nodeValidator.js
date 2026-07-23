import { body } from 'express-validator';
import mongoose from 'mongoose';

export const createNodeValidator = [
  body('projectId')
    .trim()
    .notEmpty()
    .withMessage('Project ID is required')
    .custom((val) => mongoose.Types.ObjectId.isValid(val))
    .withMessage('Invalid Project ID format'),

  body('parentId')
    .optional({ nullable: true })
    .trim()
    .custom((val) => val === '' || mongoose.Types.ObjectId.isValid(val))
    .withMessage('Invalid Parent ID format')
    .customSanitizer((val) => (val === '' ? null : val)),

  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 150 })
    .withMessage('Title must be at most 150 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be at most 1000 characters'),

  body('type')
    .optional()
    .trim()
    .isIn(['module', 'feature', 'task'])
    .withMessage('Invalid node type'),

  body('status')
    .optional()
    .trim()
    .isIn(['todo', 'in-progress', 'in-review', 'on-hold', 'completed', 'cancelled', 'archived'])
    .withMessage('Invalid node status'),

  body('priority')
    .optional()
    .trim()
    .isIn(['critical', 'high', 'medium', 'low', 'none'])
    .withMessage('Invalid node priority'),

  body('order')
    .optional()
    .isNumeric()
    .withMessage('Order must be a number'),

  body('labels')
    .optional()
    .isArray()
    .withMessage('Labels must be an array')
    .custom((labels) => {
      if (labels.length > 10) {
        throw new Error('Node can have at most 10 labels');
      }
      if (!labels.every((label) => typeof label === 'string' && label.length <= 30)) {
        throw new Error('Each label must be a string of at most 30 characters');
      }
      return true;
    }),

  body('dueDate')
    .optional({ nullable: true })
    .custom((val) => val === null || val === '' || !isNaN(Date.parse(val)))
    .withMessage('Invalid due date format')
    .customSanitizer((val) => (val === '' ? null : val)),
];

export const updateNodeValidator = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 150 })
    .withMessage('Title must be at most 150 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must be at most 1000 characters'),

  body('type')
    .optional()
    .trim()
    .isIn(['module', 'feature', 'task'])
    .withMessage('Invalid node type'),

  body('status')
    .optional()
    .trim()
    .isIn(['todo', 'in-progress', 'in-review', 'on-hold', 'completed', 'cancelled', 'archived'])
    .withMessage('Invalid node status'),

  body('priority')
    .optional()
    .trim()
    .isIn(['critical', 'high', 'medium', 'low', 'none'])
    .withMessage('Invalid node priority'),

  body('parentId')
    .optional({ nullable: true })
    .trim()
    .custom((val) => val === '' || val === null || mongoose.Types.ObjectId.isValid(val))
    .withMessage('Invalid Parent ID format')
    .customSanitizer((val) => (val === '' ? null : val)),

  body('order')
    .optional()
    .isNumeric()
    .withMessage('Order must be a number'),

  body('labels')
    .optional()
    .isArray()
    .withMessage('Labels must be an array')
    .custom((labels) => {
      if (labels.length > 10) {
        throw new Error('Node can have at most 10 labels');
      }
      if (!labels.every((label) => typeof label === 'string' && label.length <= 30)) {
        throw new Error('Each label must be a string of at most 30 characters');
      }
      return true;
    }),

  body('dueDate')
    .optional({ nullable: true })
    .custom((val) => val === null || val === '' || !isNaN(Date.parse(val)))
    .withMessage('Invalid due date format')
    .customSanitizer((val) => (val === '' ? null : val)),
];
