# Backend Architecture Documentation

## 📁 Project Structure

```
src/
├── controllers/         # Request handlers and business logic coordination
│   └── contactController.ts
├── middleware/         # Custom middleware functions
│   └── index.ts       # Request logging, rate limiting, validation
├── routes/            # API route definitions
│   ├── index.ts       # Main router with route mounting
│   ├── contacts.ts    # Contact-related endpoints
│   ├── health.ts      # Health check endpoints
│   └── docs.ts        # API documentation
├── services/          # Business logic and data operations
│   └── contactService.ts
├── lib/              # External library configurations
│   └── prisma.ts     # Database client
├── types/            # TypeScript type definitions
│   └── index.ts
└── server.ts         # Express server configuration
```

## 🛣️ API Routes

### Base URL: `/api`

#### Contact Management
- `POST /api/contacts/identify` - Identity reconciliation
- `GET /api/contacts` - Get all contacts
- `GET /api/contacts/stats` - Contact statistics
- `GET /api/contacts/hierarchy` - Contact relationships

#### System Health
- `GET /api/health` - Basic health check
- `GET /api/health/db` - Database connectivity check

#### Documentation
- `GET /api/docs` - API documentation and examples

#### Legacy Support
- `POST /identify` - Redirects to `/api/contacts/identify`
- `GET /contacts` - Redirects to `/api/contacts`
- `GET /stats` - Redirects to `/api/contacts/stats`
- `GET /hierarchy` - Redirects to `/api/contacts/hierarchy`

## 🔧 Middleware Features

### Request Logging
- Logs all incoming requests with timestamp, method, path, and IP
- Located in `src/middleware/index.ts`

### Rate Limiting
- Basic implementation: 200 requests per 15 minutes per IP
- Applied to contact routes
- Returns 429 status with retry information

### Input Validation
- Validates contact identification requests
- Ensures at least one of email or phone is provided
- Validates email and phone number formats

### CORS Configuration
- Environment-specific origin allowlist
- Production: ContactHub domains
- Development: localhost variants

## 📝 Route Documentation

Each route includes JSDoc comments with:
- Route path and method
- Description of functionality
- Access level
- Request body schema (where applicable)

## 🚀 Benefits of This Organization

1. **Separation of Concerns**: Routes, middleware, controllers, and services are clearly separated
2. **Scalability**: Easy to add new route modules and middleware
3. **Maintainability**: Clear file structure makes debugging and updates easier
4. **Type Safety**: Full TypeScript support with proper return types
5. **Documentation**: Built-in API documentation endpoint
6. **Backward Compatibility**: Legacy routes preserved during migration
7. **Security**: Rate limiting and input validation built-in

## 🔄 Migration Notes

- All existing endpoints remain functional
- New organized structure is additive
- Frontend code requires no changes
- Legacy routes automatically redirect to new structure
