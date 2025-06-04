import prisma from '../lib/prisma';
import { IdentifyRequest, IdentifyResponse, ContactData } from '../types';

export class ContactService {
  /**
   * Main method to identify and reconcile contacts
   */
  async identify(request: IdentifyRequest): Promise<IdentifyResponse> {
    const { email, phoneNumber } = request;

    // Validate that at least one contact method is provided
    if (!email && !phoneNumber) {
      throw new Error('At least one of email or phoneNumber must be provided');
    }

    // Find existing contacts that match the email or phone number
    const existingContacts = await this.findExistingContacts(email, phoneNumber);

    if (existingContacts.length === 0) {
      // No existing contacts found, create a new primary contact
      const newContact = await this.createPrimaryContact(email, phoneNumber);
      return this.buildResponse([newContact]);
    }

    // Group contacts by their primary contact
    const contactGroups = await this.groupContactsByPrimary(existingContacts);
    
    if (contactGroups.length === 1) {
      // All contacts belong to the same primary group
      const primaryGroup = contactGroups[0];
      const needsNewSecondary = await this.needsNewSecondaryContact(
        primaryGroup.allContacts,
        email,
        phoneNumber
      );

      if (needsNewSecondary) {
        const newSecondary = await this.createSecondaryContact(
          email,
          phoneNumber,
          primaryGroup.primary.id
        );
        primaryGroup.allContacts.push(newSecondary);
      }

      return this.buildResponse(primaryGroup.allContacts);
    } else {
      // Multiple primary groups found, need to merge them
      const mergedContacts = await this.mergePrimaryGroups(contactGroups, email, phoneNumber);
      return this.buildResponse(mergedContacts);
    }
  }

  /**
   * Find existing contacts that match the provided email or phone number
   */
  private async findExistingContacts(email?: string, phoneNumber?: string): Promise<ContactData[]> {
    const whereConditions: any[] = [];

    if (email) {
      whereConditions.push({ email });
    }

    if (phoneNumber) {
      whereConditions.push({ phoneNumber });
    }

    return await prisma.contact.findMany({
      where: {
        OR: whereConditions,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Group contacts by their primary contact
   */
  private async groupContactsByPrimary(contacts: ContactData[]): Promise<Array<{
    primary: ContactData;
    allContacts: ContactData[];
  }>> {
    const primaryIds = new Set<number>();
    
    // Collect all primary IDs
    for (const contact of contacts) {
      if (contact.linkPrecedence === 'primary') {
        primaryIds.add(contact.id);
      } else if (contact.linkedId) {
        primaryIds.add(contact.linkedId);
      }
    }

    // For each primary ID, get all related contacts
    const groups: Array<{ primary: ContactData; allContacts: ContactData[] }> = [];

    for (const primaryId of primaryIds) {
      const allContacts = await prisma.contact.findMany({
        where: {
          OR: [
            { id: primaryId },
            { linkedId: primaryId },
          ],
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      const primary = allContacts.find(c => c.id === primaryId);
      if (primary) {
        groups.push({ primary, allContacts });
      }
    }

    return groups;
  }

  /**
   * Check if a new secondary contact needs to be created
   */
  private async needsNewSecondaryContact(
    existingContacts: ContactData[],
    email?: string,
    phoneNumber?: string
  ): Promise<boolean> {
    // Check if the exact combination already exists
    const exactMatch = existingContacts.find(contact => 
      contact.email === (email || null) && 
      contact.phoneNumber === (phoneNumber || null)
    );

    if (exactMatch) {
      return false; // Exact match found, no need for new contact
    }

    // Check if we have new information
    const hasNewEmail = email ? !existingContacts.some(c => c.email === email) : false;
    const hasNewPhone = phoneNumber ? !existingContacts.some(c => c.phoneNumber === phoneNumber) : false;

    return hasNewEmail || hasNewPhone;
  }

  /**
   * Merge multiple primary groups into one
   */
  private async mergePrimaryGroups(
    groups: Array<{ primary: ContactData; allContacts: ContactData[] }>,
    email?: string,
    phoneNumber?: string
  ): Promise<ContactData[]> {
    // Sort groups by creation date to determine which should remain primary
    groups.sort((a, b) => a.primary.createdAt.getTime() - b.primary.createdAt.getTime());

    const primaryGroup = groups[0];
    const groupsToMerge = groups.slice(1);

    // Convert other primary contacts to secondary
    for (const group of groupsToMerge) {
      await prisma.contact.update({
        where: { id: group.primary.id },
        data: {
          linkedId: primaryGroup.primary.id,
          linkPrecedence: 'secondary',
        },
      });

      // Update all secondary contacts in this group to point to the new primary
      for (const contact of group.allContacts) {
        if (contact.id !== group.primary.id) {
          await prisma.contact.update({
            where: { id: contact.id },
            data: {
              linkedId: primaryGroup.primary.id,
            },
          });
        }
      }
    }

    // Get all merged contacts
    const allMergedContacts = await prisma.contact.findMany({
      where: {
        OR: [
          { id: primaryGroup.primary.id },
          { linkedId: primaryGroup.primary.id },
        ],
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Check if we need to create a new secondary contact
    const needsNewSecondary = await this.needsNewSecondaryContact(
      allMergedContacts,
      email,
      phoneNumber
    );

    if (needsNewSecondary) {
      const newSecondary = await this.createSecondaryContact(
        email,
        phoneNumber,
        primaryGroup.primary.id
      );
      allMergedContacts.push(newSecondary);
    }

    return allMergedContacts;
  }

  /**
   * Create a new primary contact
   */
  private async createPrimaryContact(email?: string, phoneNumber?: string): Promise<ContactData> {
    return await prisma.contact.create({
      data: {
        email: email || null,
        phoneNumber: phoneNumber || null,
        linkPrecedence: 'primary',
      },
    });
  }

  /**
   * Create a new secondary contact
   */
  private async createSecondaryContact(
    email?: string,
    phoneNumber?: string,
    primaryId?: number
  ): Promise<ContactData> {
    return await prisma.contact.create({
      data: {
        email: email || null,
        phoneNumber: phoneNumber || null,
        linkedId: primaryId,
        linkPrecedence: 'secondary',
      },
    });
  }

  /**
   * Build the response format
   */
  private buildResponse(contacts: ContactData[]): IdentifyResponse {
    const primary = contacts.find(c => c.linkPrecedence === 'primary');
    if (!primary) {
      throw new Error('Primary contact not found');
    }

    const secondaryContacts = contacts.filter(c => c.linkPrecedence === 'secondary');

    // Collect unique emails and phone numbers
    const emails = Array.from(new Set(
      contacts
        .map(c => c.email)
        .filter(email => email !== null)
    )) as string[];

    const phoneNumbers = Array.from(new Set(
      contacts
        .map(c => c.phoneNumber)
        .filter(phone => phone !== null)
    )) as string[];

    // Sort to ensure primary contact's data comes first
    const primaryEmail = primary.email;
    const primaryPhone = primary.phoneNumber;

    if (primaryEmail) {
      emails.sort((a, b) => a === primaryEmail ? -1 : b === primaryEmail ? 1 : 0);
    }

    if (primaryPhone) {
      phoneNumbers.sort((a, b) => a === primaryPhone ? -1 : b === primaryPhone ? 1 : 0);
    }

    return {
      contact: {
        primaryContactId: primary.id,
        emails,
        phoneNumbers,
        secondaryContactIds: secondaryContacts.map(c => c.id),
      },
    };
  }

  /**
   * Get all contacts from the database
   */
  async getAllContacts(): Promise<ContactData[]> {
    return await prisma.contact.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: [
        { linkPrecedence: 'asc' },
        { createdAt: 'asc' },
      ],
    });
  }

  /**
   * Get contact statistics and analytics
   */
  async getContactStats() {
    const [
      totalContacts,
      primaryContacts,
      secondaryContacts,
      uniqueEmails,
      uniquePhones,
      contactGroups,
    ] = await Promise.all([
      // Total contacts
      prisma.contact.count({
        where: { deletedAt: null },
      }),
      
      // Primary contacts
      prisma.contact.count({
        where: {
          deletedAt: null,
          linkPrecedence: 'primary',
        },
      }),
      
      // Secondary contacts
      prisma.contact.count({
        where: {
          deletedAt: null,
          linkPrecedence: 'secondary',
        },
      }),
      
      // Unique emails
      prisma.contact.findMany({
        where: {
          deletedAt: null,
          email: { not: null },
        },
        select: { email: true },
        distinct: ['email'],
      }),
      
      // Unique phone numbers
      prisma.contact.findMany({
        where: {
          deletedAt: null,
          phoneNumber: { not: null },
        },
        select: { phoneNumber: true },
        distinct: ['phoneNumber'],
      }),
      
      // Contact groups (primary contacts with their secondaries)
      this.getContactGroups(),
    ]);

    return {
      totalContacts,
      primaryContacts,
      secondaryContacts,
      uniqueEmails: uniqueEmails.length,
      uniquePhones: uniquePhones.length,
      contactGroups: contactGroups.length,
      avgContactsPerGroup: contactGroups.length > 0 ? (totalContacts / contactGroups.length).toFixed(2) : 0,
    };
  }

  /**
   * Get contact hierarchy showing primary-secondary relationships
   */
  async getContactHierarchy() {
    const primaryContacts = await prisma.contact.findMany({
      where: {
        deletedAt: null,
        linkPrecedence: 'primary',
      },
      orderBy: { createdAt: 'asc' },
    });

    const hierarchy = await Promise.all(
      primaryContacts.map(async (primary) => {
        const secondaryContacts = await prisma.contact.findMany({
          where: {
            deletedAt: null,
            linkedId: primary.id,
          },
          orderBy: { createdAt: 'asc' },
        });

        const emails = [primary.email, ...secondaryContacts.map(c => c.email)]
          .filter((email, index, arr) => email && arr.indexOf(email) === index);

        const phoneNumbers = [primary.phoneNumber, ...secondaryContacts.map(c => c.phoneNumber)]
          .filter((phone, index, arr) => phone && arr.indexOf(phone) === index);

        return {
          primaryContact: primary,
          secondaryContacts,
          consolidatedData: {
            emails,
            phoneNumbers,
            totalContacts: 1 + secondaryContacts.length,
          },
        };
      })
    );

    return hierarchy;
  }

  /**
   * Get contact groups (internal helper)
   */
  private async getContactGroups() {
    const primaryContacts = await prisma.contact.findMany({
      where: {
        deletedAt: null,
        linkPrecedence: 'primary',
      },
    });

    return primaryContacts;
  }
}
