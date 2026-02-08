# Summit Portal API - Cloudflare Workers

Backend API for the Summit Customer Portal, built with Cloudflare Workers for global edge performance.

## Architecture

- **Runtime**: Cloudflare Workers (serverless at the edge)
- **Database**: PostgreSQL (via Prisma with connection pooling)
- **Storage**: Cloudflare R2 (documents)
- **Rate Limiting**: Durable Objects
- **Language**: TypeScript

## Project Structure

```
workers/
├── src/
│   ├── index.ts              # Main worker entry point & router
│   ├── lib/                  # Shared utilities
│   │   ├── db.ts             # Database connection (Prisma)
│   │   ├── ims.ts            # Adobe IMS token validation
│   │   ├── storage.ts        # Cloudflare R2 operations
│   │   ├── jwt.ts            # Session token handling
│   │   ├── middleware.ts     # Auth middleware
│   │   ├── cors.ts           # CORS handling
│   │   └── rate-limit.ts     # Rate limiting (Durable Objects)
│   ├── routes/               # API route handlers
│   │   ├── auth.ts           # Authentication endpoints
│   │   ├── users.ts          # User management
│   │   ├── companies.ts      # Company management
│   │   ├── documents.ts      # Document operations
│   │   ├── activities.ts     # Activity tracking
│   │   ├── notes.ts          # Notes CRUD
│   │   └── mcp.ts            # MCP integration
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   └── utils/
│       ├── response.ts       # Response helpers
│       └── validation.ts     # Request validation
├── prisma/
│   └── schema.prisma         # Database schema
├── tests/                    # Test files
├── wrangler.toml             # Cloudflare Workers config
├── tsconfig.json             # TypeScript config
└── package.json
```

## Setup

### Prerequisites

- Node.js >= 18.0.0
- Cloudflare account
- PostgreSQL database (Neon, Supabase, or PlanetScale recommended)

### Installation

```bash
# Install dependencies
npm install

# Set up local environment variables
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your actual values

# Run database migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate
```

### Development

```bash
# Start local development server
npm run dev

# Access at http://localhost:8787
```

### Configuration

#### Cloudflare Dashboard Setup

1. **Create R2 Bucket**
   - Go to Cloudflare Dashboard > R2
   - Create bucket: `summit-portal-documents`
   - Note the Account ID

2. **Set Secrets** (production)
   ```bash
   wrangler secret put DATABASE_URL
   wrangler secret put IMS_CLIENT_SECRET
   wrangler secret put JWT_SECRET
   wrangler secret put R2_ACCESS_KEY_ID
   wrangler secret put R2_SECRET_ACCESS_KEY
   wrangler secret put PRODUCTION_AGENT_API_KEY
   ```

3. **Configure Custom Domain** (optional)
   - Update `wrangler.toml` with your domain
   - Add DNS records in Cloudflare

#### Database Configuration

For Cloudflare Workers, use a serverless-compatible PostgreSQL:

**Neon** (recommended):
```bash
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/summit_portal?sslmode=require"
```

**Supabase**:
```bash
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
```

**PlanetScale** (MySQL):
- Requires Prisma schema updates for MySQL compatibility

## Deployment

### Deploy to Development

```bash
npm run deploy
# or
wrangler deploy
```

### Deploy to Staging

```bash
npm run deploy:staging
```

### Deploy to Production

```bash
npm run deploy:production
```

### View Logs

```bash
npm run tail
# or
wrangler tail
```

## API Endpoints

Base URL: `https://api.summit-portal.workers.dev`

### Authentication
- `POST /auth/callback` - Handle IMS OAuth callback
- `POST /auth/refresh` - Refresh session token
- `POST /auth/logout` - Invalidate session

### Users
- `GET /users/me` - Get current user profile
- `PATCH /users/me/role` - Switch viewing role
- `POST /users/invite` - Invite colleague

### Companies
- `GET /companies/:id` - Get company details
- `GET /companies/:id/users` - List company users (employee only)
- `GET /companies/search` - Search companies (employee only)

### Documents
- `GET /companies/:id/documents` - List documents
- `POST /companies/:id/documents` - Upload document (employee only)
- `DELETE /companies/:id/documents/:docId` - Delete document (employee only)

### Activities
- `GET /users/me/activities` - User's activity feed
- `GET /companies/:id/activities` - Company activities (employee only)
- `POST /activities` - Track activity

### Notes (Employee Only)
- `GET /companies/:id/notes` - List notes
- `POST /companies/:id/notes` - Create note
- `PUT /companies/:id/notes/:noteId` - Update note
- `DELETE /companies/:id/notes/:noteId` - Delete note

### MCP Integration
- `POST /mcp/activities` - Push external activity
- `POST /mcp/documents` - Push external document

## Environment Variables

See `.dev.vars.example` for the complete list of required environment variables.

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch
```

## Prisma Commands

```bash
# Open Prisma Studio
npm run prisma:studio

# Create migration
npm run prisma:migrate

# Deploy migrations (production)
npm run prisma:migrate:deploy

# Generate Prisma client
npm run prisma:generate
```

## Scripts

Utility scripts are located in `scripts/`:

- `import-registration.js` - Import attendee registration data
- `manage-api-keys.js` - Manage MCP API keys

```bash
# Import registration data
node scripts/import-registration.js path/to/registration.csv

# Create API key
node scripts/manage-api-keys.js create "Badge Scanner System"

# List API keys
node scripts/manage-api-keys.js list

# Revoke API key
node scripts/manage-api-keys.js revoke <key-id>
```

## Performance

Cloudflare Workers run at the edge, providing:
- < 50ms cold starts
- Global distribution (300+ locations)
- Automatic scaling
- Built-in DDoS protection

## Troubleshooting

### Database Connection Issues

If you see connection errors:
1. Ensure DATABASE_URL uses connection pooling
2. For Prisma, consider using Prisma Accelerate
3. Check firewall rules allow Cloudflare IPs

### R2 Upload Failures

1. Verify R2 bucket name matches `wrangler.toml`
2. Check R2 credentials are set correctly
3. Ensure bucket permissions allow PUT operations

### Rate Limiting

Durable Objects are used for rate limiting. If issues occur:
1. Check Durable Objects binding in `wrangler.toml`
2. Verify migration has been applied
3. Review rate limit thresholds in environment variables

## Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Durable Objects](https://developers.cloudflare.com/workers/runtime-apis/durable-objects/)
- [Prisma with Cloudflare Workers](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-cloudflare-workers)
