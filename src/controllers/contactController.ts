import { Request, Response } from 'express';
import { ContactService } from '../services/contactService';
import { IdentifyRequest } from '../types';

export class ContactController {
  private contactService: ContactService;

  constructor() {
    this.contactService = new ContactService();
  }

  /**
   * Handle the /identify endpoint
   */
  identify = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, phoneNumber }: IdentifyRequest = req.body;

      // Validate request
      if (!email && !phoneNumber) {
        res.status(400).json({
          error: 'At least one of email or phoneNumber must be provided',
        });
        return;
      }

      // Process the identification request
      const result = await this.contactService.identify({ email, phoneNumber });

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in identify endpoint:', error);
      
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Health check endpoint
   */
  health = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'ContactHub Identity Reconciliation',
    });
  };

  /**
   * Get all contacts with their relationships
   */
  getAllContacts = async (req: Request, res: Response): Promise<void> => {
    try {
      const contacts = await this.contactService.getAllContacts();
      res.status(200).json({
        contacts,
        count: contacts.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in getAllContacts endpoint:', error);
      
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get contact statistics and analytics
   */
  getContactStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.contactService.getContactStats();
      res.status(200).json({
        ...stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in getContactStats endpoint:', error);
      
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  /**
   * Get contact relationships in a hierarchical structure
   */
  getContactHierarchy = async (req: Request, res: Response): Promise<void> => {
    try {
      const hierarchy = await this.contactService.getContactHierarchy();
      res.status(200).json({
        hierarchy,
        count: hierarchy.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in getContactHierarchy endpoint:', error);
      
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}
