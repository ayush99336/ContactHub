import { Router } from 'express';
import contactRoutes from './contacts';
import healthRoutes from './health';
import docsRoutes from './docs';

const router = Router();

// Mount route modules
router.use('/contacts', contactRoutes);
router.use('/health', healthRoutes);
router.use('/docs', docsRoutes);

// Legacy routes for backward compatibility
router.post('/identify', (req, res, next) => {
  // Redirect to new endpoint
  req.url = '/contacts/identify';
  contactRoutes(req, res, next);
});

// Root API endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'ContactHub API v1.0.0',
    documentation: '/api/docs',
    health: '/api/health',
    endpoints: {
      contacts: '/api/contacts',
      identify: '/api/contacts/identify',
      stats: '/api/contacts/stats',
      hierarchy: '/api/contacts/hierarchy'
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
