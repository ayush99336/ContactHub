import { Router } from 'express';
import { ContactController } from '../controllers/contactController';

const router = Router();
const contactController = new ContactController();

// POST /identify - Main endpoint for identity reconciliation
router.post('/identify', contactController.identify);

// GET /health - Health check endpoint
router.get('/health', contactController.health);

// GET /contacts - Get all contacts
router.get('/contacts', contactController.getAllContacts);

// GET /stats - Get contact statistics
router.get('/stats', contactController.getContactStats);

// GET /hierarchy - Get contact hierarchy
router.get('/hierarchy', contactController.getContactHierarchy);

export default router;
