# FlashCash N5 - Server Setup Guide

This server provides data synchronization capabilities for the FlashCash N5 application.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- npm or yarn package manager

## Quick Start

### 1. Setup PostgreSQL Database

Create a new PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE flashcash_db;

# Exit psql
\q
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cd server
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/flashcash_db
JWT_SECRET=your-secret-key-change-this-in-production
PORT=3001
```

**Important:** Change `JWT_SECRET` to a strong random string in production!

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Server

**Development mode (with auto-restart):**

```bash
npm run dev
```

**Production mode:**

```bash
npm run build
npm start
```

The server will:
1. Automatically run database migrations on startup
2. Create the `users` and `user_data` tables
3. Start listening on `http://localhost:3001`

### 5. Verify Server is Running

Open your browser or use curl:

```bash
curl http://localhost:3001/health
```

You should see: `{"status":"ok","timestamp":"2026-05-14T..."}`

## API Endpoints

### Authentication

**Register a new user:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

**Login:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}
```

Returns:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "testuser",
    "createdAt": "2026-05-14T..."
  }
}
```

**Verify token:**
```http
GET /api/auth/verify
Authorization: Bearer <token>
```

### Data Synchronization

**Check sync status:**
```http
GET /api/sync/status
Authorization: Bearer <token>
```

Returns:
```json
{
  "success": true,
  "hasData": true,
  "lastSyncAt": "2026-05-14T..."
}
```

**Upload data to server:**
```http
POST /api/sync/upload
Authorization: Bearer <token>
Content-Type: application/json

{
  "data": {
    "flashcash-lessons": {...},
    "flashcash-progress": {...},
    "flashcash-settings": {...},
    "flashcash-notebooks": {...},
    "flashcash-curriculums": {...},
    "flashcash-grammar-collections": {...},
    "flashcash-grammar-progress": {...}
  }
}
```

**Download data from server:**
```http
GET /api/sync/data
Authorization: Bearer <token>
```

Returns:
```json
{
  "success": true,
  "data": {
    "flashcash-lessons": {...},
    "flashcash-progress": {...},
    ...
  },
  "timestamp": "2026-05-14T..."
}
```

## Database Schema

### users table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| username | VARCHAR(50) | Unique username |
| password_hash | VARCHAR(255) | Bcrypt hashed password |
| created_at | TIMESTAMP | Account creation time |
| last_sync_at | TIMESTAMP | Last data sync time |

### user_data table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users.id |
| data_key | VARCHAR(100) | localStorage key name |
| data_value | JSONB | JSON data value |
| updated_at | TIMESTAMP | Last update time |

Unique constraint: `(user_id, data_key)`

## Troubleshooting

### Database Connection Error

**Error:** `Error: connect ECONNREFUSED`

**Solution:** Make sure PostgreSQL is running:

```bash
# Windows
net start postgresql-x64-14

# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

### Migration Error

**Error:** `ERROR: relation "users" already exists`

**Solution:** This is normal if tables already exist. The migrations use `IF NOT EXISTS` and will skip existing tables.

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solution:** Change the PORT in `.env` or kill the process using port 3001:

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3001 | xargs kill
```

## Client Configuration

In the Next.js app root directory, create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

For production, change to your production server URL:

```env
NEXT_PUBLIC_API_URL=https://api.flashcash.com
```

## Security Notes

1. **JWT Secret:** Use a strong random string (32+ characters) in production
2. **HTTPS:** Always use HTTPS in production (configure with reverse proxy like nginx)
3. **CORS:** Update `CLIENT_URL` in server.ts for production domain
4. **Database:** Use SSL for PostgreSQL connection in production
5. **Password Policy:** Enforce minimum 6 characters (consider increasing for production)

## Production Deployment

### Option 1: VPS/Cloud Server

1. Install Node.js and PostgreSQL on server
2. Clone repository
3. Set production environment variables
4. Run `npm install && npm run build`
5. Use PM2 or systemd to keep server running:

```bash
npm install -g pm2
pm2 start dist/server.js --name flashcash-server
pm2 save
pm2 startup
```

### Option 2: Docker

Create `Dockerfile` in server directory:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

Build and run:

```bash
docker build -t flashcash-server .
docker run -p 3001:3001 --env-file .env flashcash-server
```

## Development

**File Structure:**

```
server/
├── src/
│   ├── server.ts          # Main Express app
│   ├── db.ts              # Database connection pool
│   ├── routes/
│   │   ├── auth.ts        # Authentication endpoints
│   │   └── sync.ts        # Sync endpoints
│   └── middleware/
│       └── auth.ts        # JWT verification middleware
├── migrations/
│   └── 001_init.sql       # Database schema
├── package.json
├── tsconfig.json
└── .env
```

**Adding New Endpoints:**

1. Create route file in `src/routes/`
2. Import and use in `src/server.ts`
3. Add authentication middleware if needed

## License

This project is private and not licensed for public use.
