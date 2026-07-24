import { body, param, query } from 'express-validator';

export const createWorkflowLinkValidator = [
  body('flowId')
    .notEmpty().withMessage('Flow ID is required')
    .isMongoId().withMessage('Invalid Flow ID'),
  body('targetType')
    .notEmpty().withMessage('Target type is required')
    .isIn(['page', 'button', 'sidebar', 'menu', 'form', 'module', 'route', 'event', 'api', 'crud', 'widget', 'action'])
    .withMessage('Invalid target type'),
  body('targetId')
    .notEmpty().withMessage('Target ID is required')
    .isString().withMessage('Target ID must be a string'),
  body('triggerOn')
    .optional()
    .isIn(['before', 'after', 'instead', 'parallel'])
    .withMessage('Invalid trigger timing'),
  body('priority')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Priority must be between 0 and 100'),
];

export const updateWorkflowLinkValidator = [
  param('id')
    .isMongoId().withMessage('Invalid link ID'),
  body('targetType')
    .optional()
    .isIn(['page', 'button', 'sidebar', 'menu', 'form', 'module', 'route', 'event', 'api', 'crud', 'widget', 'action'])
    .withMessage('Invalid target type'),
  body('triggerOn')
    .optional()
    .isIn(['before', 'after', 'instead', 'parallel'])
    .withMessage('Invalid trigger timing'),
];

export const getWorkflowLinksValidator = [
  query('targetType')
    .optional()
    .isIn(['page', 'button', 'sidebar', 'menu', 'form', 'module', 'route', 'event', 'api', 'crud', 'widget', 'action'])
    .withMessage('Invalid target type'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
];
