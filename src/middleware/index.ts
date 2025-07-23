import { Request, Response, NextFunction } from 'express';

/**
 * Request logging middleware
 * Logs all incoming requests with timestamp, method, and path
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.connection.remoteAddress;
  
  console.log(`[${timestamp}] ${method} ${path} - ${ip}`);
  next();
};

/**
 * CORS middleware configuration
 */
export const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://contact-hub-seven.vercel.app', 'https://contacthub.com']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

/**
 * Rate limiting middleware (basic implementation)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const basicRateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Clean up old entries
    for (const [ip, data] of requestCounts.entries()) {
      if (now > data.resetTime) {
        requestCounts.delete(ip);
      }
    }
    
    // Get or create entry for this IP
    let clientData = requestCounts.get(clientIp);
    if (!clientData || now > clientData.resetTime) {
      clientData = { count: 0, resetTime: now + windowMs };
      requestCounts.set(clientIp, clientData);
    }
    
    // Check if limit exceeded
    if (clientData.count >= maxRequests) {
      res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil((clientData.resetTime - now) / 1000)} seconds.`,
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
      });
      return;
    }
    
    // Increment count
    clientData.count++;
    
    // Add headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': (maxRequests - clientData.count).toString(),
      'X-RateLimit-Reset': new Date(clientData.resetTime).toISOString()
    });
    
    next();
  };
};

/**
 * Input validation middleware
 */
export const validateContactInput = (req: Request, res: Response, next: NextFunction): void => {
  const { email, phoneNumber } = req.body;
  
  // Check if at least one field is provided
  if (!email && !phoneNumber) {
    res.status(400).json({
      error: 'Validation failed',
      message: 'At least one of email or phoneNumber must be provided',
      requiredFields: ['email', 'phoneNumber']
    });
    return;
  }
  
  // Validate email format if provided
  if (email && typeof email === 'string') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid email format',
        field: 'email'
      });
      return;
    }
  }
  
  // Validate phone number format if provided
  if (phoneNumber && typeof phoneNumber === 'string') {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''))) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid phone number format',
        field: 'phoneNumber'
      });
      return;
    }
  }
  
  next();
};
