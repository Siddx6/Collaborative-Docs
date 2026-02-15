import { Router } from 'express';
import {
  createDocument,
  getUserDocuments,
  getDocumentByLink,
  updateDocument,
  deleteDocument,
} from '../controllers/documentController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/', createDocument);
router.get('/', getUserDocuments);
router.get('/link/:shareableLink', getDocumentByLink);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

export default router;