# Summit Customer Portal

A personalized customer portal for Adobe Summit built on AEM.now (Edge Delivery Services).

## Project Structure

```
summit-portal/
├── IMPLEMENTATION_SPEC.md      # Full technical spec - START HERE
├── blocks/                     # AEM.now custom blocks (frontend components)
├── scripts/                    # Frontend JavaScript modules
├── styles/                     # Global CSS
├── pages/                      # Content pages (managed in Google Drive/SharePoint)
└── io-runtime-actions/         # Adobe I/O Runtime serverless APIs
```

## For Claude Code

**Start here:**

```
Read IMPLEMENTATION_SPEC.md and create an implementation plan. Start with Phase 1: Core Infrastructure.
```

**Implementation order:**

1. Phase 1: Core Infrastructure (auth, database, basic pages)
2. Phase 2: Content & Personalization (Production Agent, role switching, documents)
3. Phase 3: Activity Tracking (click tracking, MCP integration)
4. Phase 4: Employee Dashboard & Invitations
5. Phase 5: Testing & Polish

## Quick Start (Local Development)

### AEM.now (Frontend)

```bash
# Install AEM CLI
npm install -g @adobe/aem-cli

# Start local dev server
aem up
```

### I/O Runtime (APIs)

```bash
cd io-runtime-actions

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
npx prisma migrate dev

# Deploy to staging
aio app deploy
```

## Key Files

| File | Purpose |
|------|---------|
| `IMPLEMENTATION_SPEC.md` | Complete technical specification |
| `fstab.yaml` | Content source configuration |
| `scripts/auth/ims.js` | Adobe IMS authentication |
| `scripts/api/client.js` | API client for I/O Runtime |
| `io-runtime-actions/prisma/schema.prisma` | Database schema |

## Environment Variables

See `io-runtime-actions/.env.example` for required variables.

## Architecture

- **Frontend**: Pure AEM.now (Edge Delivery Services) - vanilla JS blocks
- **Backend**: Adobe I/O Runtime serverless actions
- **Database**: PostgreSQL with Prisma ORM
- **Storage**: Azure Blob Storage for documents
- **Auth**: Adobe IMS with JWT sessions
