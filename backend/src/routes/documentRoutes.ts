import { Router } from 'express';
import {
  createDocument,
  getUserDocuments,
  getDocumentByLink,
  updateDocument,
  deleteDocument,
} from '../controllers/documentController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Public route - optional authentication (works with or without login)
router.get('/link/:shareableLink', optionalAuthenticate, getDocumentByLink);

// All other routes require authentication
router.use(authenticate);

router.post('/', createDocument);
router.get('/', getUserDocuments);
router.put('/:id', updateDocument);
router.delete('/:id', deleteDocument);

export default router;