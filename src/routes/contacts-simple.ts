import { Router } from 'express';
import { ContactService } from '../services/contactService';

const router = Router();
const contactService = new ContactService();

// tRPC-style approach - simpler and more direct

/**
 * POST /api/contacts/identify
 * Similar to tRPC mutation
 */
router.post('/identify', async (req, res): Promise<void> => {
  try {
    const { email, phoneNumber } = req.body;
    
    // Validation (like tRPC input)
    if (!email && !phoneNumber) {
      res.status(400).json({
        error: 'At least one of email or phoneNumber must be provided'
      });
      return;
    }
    
    // Business logic (like tRPC resolver)
    const result = await contactService.identify({ email, phoneNumber });
    
    // Return result (like tRPC return)
    res.json({ contact: result });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/contacts
 * Similar to tRPC query
 */
router.get('/', async (req, res): Promise<void> => {
  try {
    const contacts = await contactService.getAllContacts();
    res.json({ 
      contacts,
      count: contacts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/contacts/stats
 */
router.get('/stats', async (req, res): Promise<void> => {
  try {
    const stats = await contactService.getContactStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/contacts/hierarchy
 */
router.get('/hierarchy', async (req, res): Promise<void> => {
  try {
    const hierarchy = await contactService.getContactHierarchy();
    res.json({
      hierarchy,
      count: hierarchy.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
