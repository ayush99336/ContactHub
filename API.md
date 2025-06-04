# API Documentation - ContactHub Identity Reconciliation

## Base URL
```
http://localhost:3000
```

## Authentication
No authentication required for this version.

## 🌐 Frontend GUI

**Access the Web Interface:** Open `http://localhost:3000` in your browser

The interactive frontend provides an intuitive way to test all API functionality without command-line tools:

- **Identity Reconciliation Form**: Submit email/phone combinations
- **Real-time API Testing**: See immediate responses
- **Database Viewer**: Browse all contacts and relationships
- **Statistics Dashboard**: View contact analytics
- **Visual Results**: Formatted display of consolidated contact information

## Endpoints

### 1. Health Check
Check if the service is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2023-04-01T00:00:00.000Z",
  "service": "ContactHub Identity Reconciliation"
}
```

### 2. Identify Contact
Main endpoint for identity reconciliation.

**Endpoint:** `POST /identify`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}
```

**Validation Rules:**
- At least one of `email` or `phoneNumber` must be provided
- Both can be provided
- Either can be `null`

**Response:**
```json
{
  "contact": {
    "primaryContatctId": "number",
    "emails": ["string[]"],
    "phoneNumbers": ["string[]"],
    "secondaryContactIds": ["number[]"]
  }
}
```

### 3. Get All Contacts
Retrieve all contacts in the database.

**Endpoint:** `GET /contacts`

**Response:**
```json
[
  {
    "id": "number",
    "email": "string",
    "phoneNumber": "string",
    "linkedId": "number",
    "linkPrecedence": "primary|secondary",
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

### 4. Get Statistics
View contact statistics and analytics.

**Endpoint:** `GET /stats`

**Response:**
```json
{
  "totalContacts": "number",
  "primaryContacts": "number",
  "secondaryContacts": "number",
  "uniqueEmails": "number",
  "uniquePhoneNumbers": "number"
}
```

### 5. Get Contact Hierarchy
Returns contact relationships in hierarchical structure.

**Endpoint:** `GET /hierarchy`

**Response:**
```json
[
  {
    "primaryContact": {
      "id": "number",
      "email": "string",
      "phoneNumber": "string"
    },
    "secondaryContacts": [
      {
        "id": "number",
        "email": "string",
        "phoneNumber": "string"
      }
    ]
  }
]
```

## Example Usage Scenarios

### Scenario 1: New Customer
When a new customer provides contact information:
- Submit via frontend form or POST `/identify`
- System creates primary contact
- Returns consolidated contact information

### Scenario 2: Adding Secondary Contact
When same customer uses different contact information:
- Submit new email/phone combination
- System creates secondary contact linked to primary
- Returns updated consolidated information

### Scenario 3: Querying Existing Contact
When looking up existing customer:
- Submit any known email or phone number
- System returns complete contact profile
- Shows all associated emails and phone numbers

### Scenario 4: Merging Primary Contacts
When two separate customers are discovered to be the same person:
- Submit contact info that links two primary contacts
- System automatically merges contact groups
- Older primary becomes secondary to newer primary

## Error Responses

### 400 Bad Request
When required data is missing:

```json
{
  "error": "At least one of email or phoneNumber must be provided"
}
```

### 404 Not Found
When endpoint doesn't exist:

```json
{
  "error": "Route not found",
  "path": "/invalid-endpoint"
}
```

### 500 Internal Server Error
When something goes wrong on the server:

```json
{
  "error": "Internal server error",
  "message": "Error details (in development mode only)"
}
```

## Business Logic

### Contact Linking Rules
1. **Primary Contact**: The first contact created, or the oldest contact when merging
2. **Secondary Contact**: Any contact that shares email or phone with existing contacts
3. **Merging**: When two primary contacts are linked, the older one remains primary

### Data Consolidation
- All unique emails from linked contacts are returned
- All unique phone numbers from linked contacts are returned
- Primary contact's data appears first in arrays
- Secondary contact IDs are ordered by creation time

### Database Schema
```sql
CREATE TABLE contacts (
  id             SERIAL PRIMARY KEY,
  phoneNumber    VARCHAR,
  email          VARCHAR,
  linkedId       INTEGER REFERENCES contacts(id),
  linkPrecedence VARCHAR NOT NULL, -- 'primary' or 'secondary'
  createdAt      TIMESTAMP DEFAULT NOW(),
  updatedAt      TIMESTAMP DEFAULT NOW(),
  deletedAt      TIMESTAMP
);
```

## Rate Limiting
Currently no rate limiting is implemented. For production, consider implementing rate limiting based on your requirements.

## Monitoring
- Health check endpoint: `/health`
- Logs are written to console with timestamps
- Database queries are logged in development mode
