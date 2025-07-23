import { Router } from 'express';
import { ContactController } from '../controllers/contactController';
import { validateContactInput, basicRateLimit } from '../middleware';

const router = Router();
const contactController = new ContactController();

// Apply rate limiting to all contact routes
router.use(basicRateLimit(200, 15 * 60 * 1000)); // 200 requests per 15 minutes

/**
 * @route   POST /api/contacts/identify
 * @desc    Main endpoint for contact identity reconciliation
 * @access  Public
 * @body    { email?: string, phoneNumber?: string }
 */
router.post('/identify', validateContactInput, contactController.identify);

/**
 * @route   GET /api/contacts
 * @desc    Retrieve all contacts with their relationships
 * @access  Public
 */
router.get('/', contactController.getAllContacts);

/**
 * @route   GET /api/contacts/stats
 * @desc    Get contact statistics and analytics
 * @access  Public
 */
router.get('/stats', contactController.getContactStats);

/**
 * @route   GET /api/contacts/hierarchy
 * @desc    Get contact hierarchy and relationships
 * @access  Public
 */
router.get('/hierarchy', contactController.getContactHierarchy);

export default router;
