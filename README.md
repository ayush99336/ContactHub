# ContactHub - Identity Reconciliation Service

A comprehensive Node.js backend service with interactive frontend GUI that identifies and links customer contacts across multiple interactions. This service helps track customers who use different email addresses and phone numbers for different interactions.

## 🌐 Interactive Frontend GUI

**Access the Web Interface:** `http://localhost:3000`

The application includes a modern, responsive web interface that provides:

- **Real-time API Testing**: Interactive form to test contact identification
- **Database Viewer**: Browse all contacts and their relationships
- **Statistics Dashboard**: View contact analytics and metrics
- **Hierarchy Visualization**: Explore primary-secondary contact relationships
- **SQL Schema Reference**: Complete database schema documentation

## 📋 Features

- **Identity Reconciliation**: Links contacts with shared email addresses or phone numbers
- **Primary/Secondary Contact Management**: Maintains hierarchical contact relationships
- **Contact Merging**: Automatically merges separate contact groups when connections are discovered
- **Interactive Web GUI**: Modern frontend for testing and data visualization
- **RESTful API**: Clean JSON-based API for easy integration
- **PostgreSQL Database**: Reliable data persistence with Prisma ORM
- **Docker Support**: Containerized development environment

## 🛠 Tech Stack

- **Backend**: Node.js with TypeScript
- **Framework**: Express.js
- **Frontend**: Vanilla JavaScript with modern CSS
- **Database**: PostgreSQL (Dockerized)
- **ORM**: Prisma
- **Development**: ts-node-dev for hot reloading

## 📖 API Endpoints

### POST /identify
Identifies and reconciles contact information.

### GET /health
Health check endpoint.

### GET /contacts
Returns all contacts in the database.

### GET /stats
Provides contact statistics and analytics.

### GET /hierarchy
Returns contact relationships in hierarchical structure.

## 🏗 Project Structure

```
src/
├── controllers/
│   └── contactController.ts    # Request handlers
├── services/
│   └── contactService.ts       # Business logic
├── lib/
│   └── prisma.ts              # Database client
├── routes/
│   └── index.ts               # API routes
├── types/
│   └── index.ts               # TypeScript types
└── server.ts                  # Application entry point

public/
├── index.html                 # Frontend GUI
├── styles.css                 # Styling
└── app.js                     # Frontend JavaScript

prisma/
└── schema.prisma              # Database schema

docker-compose.yml             # PostgreSQL container
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd contacthub
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start PostgreSQL database:**
   ```bash
   docker-compose up -d
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Generate Prisma client and push schema:**
   ```bash
   npm run db:generate
   npm run db:push
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build the TypeScript code
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)

## 📝 Environment Variables

Create a `.env` file with the following variables:

```env
DATABASE_URL="postgresql://contacthub:password@localhost:5432/contacthub_db"
PORT=3000
NODE_ENV=development
```

## 🌐 Using the Frontend GUI

Access the interactive web interface at `http://localhost:3000` after starting the server. The GUI provides:

- **Identity Reconciliation**: Submit email/phone combinations through an intuitive form
- **Real-time Results**: View consolidated contact information instantly
- **Database Viewer**: Browse all contacts and their relationships
- **Statistics Dashboard**: Monitor system usage and contact metrics
- **Visual Hierarchy**: See primary-secondary contact relationships

### Example Usage Flow

1. **Navigate to the GUI**: Open `http://localhost:3000` in your browser
2. **Submit Contact Info**: Enter email and/or phone number in the form
3. **View Results**: See the consolidated contact information displayed
4. **Explore Database**: Use the database viewer to see all stored contacts
5. **Check Stats**: View system statistics and contact metrics

## 🗃 Database Schema

```sql
model Contact {
  id             Int      @id @default(autoincrement())
  phoneNumber    String?
  email          String?
  linkedId       Int?
  linkPrecedence String   // "primary" | "secondary"
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  deletedAt      DateTime?
}
```

## 🔄 Business Logic

1. **New Contact**: Creates primary contact when no existing matches found
2. **Existing Match**: Returns consolidated contact information
3. **Partial Match**: Creates secondary contact with new information
4. **Primary Merge**: Converts older primary to secondary when separate primary contacts are linked

## 🐳 Docker Commands

```bash
# Start PostgreSQL
docker-compose up -d

# Stop PostgreSQL
docker-compose down

# View logs
docker-compose logs -f

# Reset database (remove volume)
docker-compose down -v
```

## 📊 Monitoring

- **Health Check**: `GET /health`
- **Database GUI**: `npm run db:studio` (opens Prisma Studio)
- **Logs**: Console logging with timestamps

## 🚀 Deployment

The application is deployed and accessible at: `[YOUR_DEPLOYED_URL]`

For deployment, ensure:
1. Set production environment variables
2. Use a managed PostgreSQL instance
3. Set `NODE_ENV=production`
4. Configure CORS for your domain

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

Built with ❤️ by Ayush
![alt text](image.png)