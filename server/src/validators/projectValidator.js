import { body } from 'express-validator';

export const createProjectValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Project name is required')
    .isLength({ max: 100 })
    .withMessage('Project name must be at most 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be at most 500 characters'),

  body('status')
    .optional()
    .trim()
    .isIn(['active', 'completed', 'archived', 'on-hold'])
    .withMessage('Invalid project status'),

  body('color')
    .optional()
    .trim()
    .matches(/^#[0-9a-fA-F]{6}$/)
    .withMessage('Color must be a valid hex code (e.g. #6366f1)'),

  body('icon')
    .optional()
    .trim()
    .isString()
    .withMessage('Icon must be a string identifier'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 10) {
        throw new Error('Project can have at most 10 tags');
      }
      if (!tags.every((tag) => typeof tag === 'string' && tag.length <= 30)) {
        throw new Error('Each tag must be a string of at most 30 characters');
      }
      return true;
    }),
];

export const updateProjectValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Project name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Project name must be at most 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be at most 500 characters'),

  body('status')
    .optional()
    .trim()
    .isIn(['active', 'completed', 'archived', 'on-hold'])
    .withMessage('Invalid project status'),

  body('color')
    .optional()
    .trim()
    .matches(/^#[0-9a-fA-F]{6}$/)
    .withMessage('Color must be a valid hex code (e.g. #6366f1)'),

  body('icon')
    .optional()
    .trim()
    .isString()
    .withMessage('Icon must be a string identifier'),

  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((tags) => {
      if (tags.length > 10) {
        throw new Error('Project can have at most 10 tags');
      }
      if (!tags.every((tag) => typeof tag === 'string' && tag.length <= 30)) {
        throw new Error('Each tag must be a string of at most 30 characters');
      }
      return true;
    }),
];
