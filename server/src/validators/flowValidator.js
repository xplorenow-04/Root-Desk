import { body, param, query } from 'express-validator';

export const createFlowValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Flow name is required')
    .isLength({ max: 100 }).withMessage('Flow name cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'active', 'archived', 'inactive']).withMessage('Invalid status'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  body('entryPoints')
    .optional()
    .isArray().withMessage('Entry points must be an array'),
  body('entryPoints.*')
    .optional()
    .isIn(['button_click', 'menu', 'sidebar', 'api', 'login', 'dashboard', 'user_action', 'deep_link', 'qr_code', 'manual']).withMessage('Invalid entry point'),
  body('permissions.allowedRoles')
    .optional()
    .isArray().withMessage('Allowed roles must be an array'),
  body('permissions.allowedRoles.*')
    .optional()
    .isIn(['admin', 'teacher', 'student', 'parent', 'super_admin', 'guest']).withMessage('Invalid role'),
  body('variables')
    .optional()
    .isArray().withMessage('Variables must be an array'),
  body('metadata')
    .optional()
    .isObject().withMessage('Metadata must be an object'),
];

export const updateFlowValidation = [
  param('id')
    .isMongoId().withMessage('Invalid flow ID'),
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Flow name cannot be empty')
    .isLength({ max: 100 }).withMessage('Flow name cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'active', 'archived', 'inactive']).withMessage('Invalid status'),
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  body('entryPoints')
    .optional()
    .isArray().withMessage('Entry points must be an array'),
  body('permissions')
    .optional()
    .isObject().withMessage('Permissions must be an object'),
  body('variables')
    .optional()
    .isArray().withMessage('Variables must be an array'),
  body('metadata')
    .optional()
    .isObject().withMessage('Metadata must be an object'),
];

export const flowIdValidation = [
  param('id')
    .isMongoId().withMessage('Invalid flow ID'),
];

export const saveFlowDataValidation = [
  param('id')
    .isMongoId().withMessage('Invalid flow ID'),
  body('nodes')
    .optional()
    .isArray().withMessage('Nodes must be an array'),
  body('edges')
    .optional()
    .isArray().withMessage('Edges must be an array'),
  body('variables')
    .optional()
    .isArray().withMessage('Variables must be an array'),
  body('changeLog')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Change log cannot exceed 500 characters'),
];

export const runFlowValidation = [
  param('id')
    .isMongoId().withMessage('Invalid flow ID'),
  body('variables')
    .optional()
    .isObject().withMessage('Variables must be an object'),
];

export const restoreFlowValidation = [
  param('id')
    .isMongoId().withMessage('Invalid flow ID'),
  param('version')
    .isInt({ min: 1 }).withMessage('Version must be a positive integer'),
];

export const importFlowValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Flow name is required'),
  body('nodes')
    .optional()
    .isArray().withMessage('Nodes must be an array'),
  body('edges')
    .optional()
    .isArray().withMessage('Edges must be an array'),
  body('variables')
    .optional()
    .isArray().withMessage('Variables must be an array'),
];

export const listFlowsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status')
    .optional()
    .isIn(['draft', 'active', 'archived', 'inactive']).withMessage('Invalid status filter'),
  query('search')
    .optional()
    .trim(),
  query('sort')
    .optional()
    .isIn(['name', 'createdAt', 'updatedAt', 'status']).withMessage('Invalid sort field'),
];
