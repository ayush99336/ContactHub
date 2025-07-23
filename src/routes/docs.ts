import { Router } from 'express';
import path from 'path';

const router = Router();

/**
 * @route   GET /api/docs
 * @desc    API documentation endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    title: 'ContactHub API Documentation',
    version: '1.0.0',
    description: 'Identity reconciliation service for contact management',
    endpoints: {
      identify: {
        method: 'POST',
        path: '/api/contacts/identify',
        description: 'Identify and reconcile contacts',
        body: {
          email: 'string (optional)',
          phoneNumber: 'string (optional)'
        }
      },
      contacts: {
        method: 'GET',
        path: '/api/contacts',
        description: 'Get all contacts'
      },
      stats: {
        method: 'GET',
        path: '/api/contacts/stats',
        description: 'Get contact statistics'
      },
      hierarchy: {
        method: 'GET',
        path: '/api/contacts/hierarchy',
        description: 'Get contact relationships hierarchy'
      },
      health: {
        method: 'GET',
        path: '/api/health',
        description: 'Service health check'
      }
    },
    examples: {
      identify: {
        request: {
          email: 'user@example.com',
          phoneNumber: '+1234567890'
        },
        response: {
          contact: {
            primaryContactId: 1,
            emails: ['user@example.com'],
            phoneNumbers: ['+1234567890'],
            secondaryContactIds: []
          }
        }
      }
    }
  });
});

export default router;
