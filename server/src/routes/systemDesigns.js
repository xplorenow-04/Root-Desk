import express from 'express';
import systemDesignController from '../controllers/systemDesignController.js';
import auth from '../middleware/auth.js';
import validateObjectId from '../middleware/validateObjectId.js';

const router = express.Router();

// Protect all endpoints
router.use(auth);

// ── Practice (must come before /:id) ──
router.get('/practice/problems', systemDesignController.listPracticeProblems);
router.get('/practice/problems/:problemId', validateObjectId('problemId'), systemDesignController.getPracticeProblem);
router.post('/practice/problems/:problemId/submit', validateObjectId('problemId'), systemDesignController.submitPractice);

// ── Templates (must come before /:id) ──
router.get('/templates', systemDesignController.listTemplates);
router.post('/templates/:templateId/use', validateObjectId('templateId'), systemDesignController.useTemplate);

// ── Import ──
router.post('/import', systemDesignController.importDesign);

// ── CRUD ──
router.route('/')
  .get(systemDesignController.listDesigns)
  .post(systemDesignController.createDesign);

router.route('/:id')
  .get(validateObjectId('id'), systemDesignController.getDesign)
  .patch(validateObjectId('id'), systemDesignController.updateDesign)
  .delete(validateObjectId('id'), systemDesignController.deleteDesign);

// ── Analysis, versions, export ──
router.post('/:id/validate', validateObjectId('id'), systemDesignController.validateDesign);
router.get('/:id/export', validateObjectId('id'), systemDesignController.exportDesign);
router.get('/:id/versions', validateObjectId('id'), systemDesignController.listVersions);
router.post('/:id/versions', validateObjectId('id'), systemDesignController.createVersion);
router.post('/:id/versions/restore/:versionNumber', validateObjectId('id'), systemDesignController.restoreVersion);
router.post('/:id/versions/compare', validateObjectId('id'), systemDesignController.compareVersions);

export default router;