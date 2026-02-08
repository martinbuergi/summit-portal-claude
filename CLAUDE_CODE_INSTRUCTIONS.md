# Instructions for Claude Code

This project scaffold is ready for Claude Code to complete the implementation.

## How to Use

1. Read `IMPLEMENTATION_SPEC.md` first - it contains the complete technical specification
2. Follow the phased implementation plan in the spec
3. Use the existing scaffolding as a starting point

## Project Structure Summary

```
summit-portal/
├── IMPLEMENTATION_SPEC.md      # ← START HERE - Full technical spec
├── CLAUDE_CODE_INSTRUCTIONS.md # This file
├── README.md                   # Project readme
│
├── blocks/                     # AEM.now blocks (frontend components)
│   └── login-button/           # Sample block - use as template
│
├── scripts/                    # Frontend JavaScript
│   ├── scripts.js              # Main entry point
│   ├── auth/                   # Auth modules (implemented)
│   ├── tracking/               # Activity tracking (implemented)
│   └── api/                    # API client (implemented)
│
├── styles/                     # CSS (implemented)
│
└── io-runtime-actions/         # Backend API
    ├── lib/                    # Shared utilities (partially implemented)
    ├── actions/                # API endpoints (auth/callback implemented)
    └── prisma/                 # Database schema (implemented)
```

## What's Already Implemented

### Frontend (scripts/)
- ✅ `scripts.js` - Main initialization, block loading
- ✅ `auth/ims.js` - Adobe IMS OAuth flow
- ✅ `auth/session.js` - Session management
- ✅ `auth/guard.js` - Route protection
- ✅ `tracking/tracker.js` - Click/activity tracking
- ✅ `tracking/queue.js` - Offline activity queue
- ✅ `api/client.js` - API client

### Backend (io-runtime-actions/)
- ✅ `lib/db.js` - Database connection
- ✅ `lib/jwt.js` - JWT token handling
- ✅ `lib/middleware.js` - Auth middleware
- ✅ `actions/auth/callback.js` - IMS callback (needs completion)
- ✅ `actions/activities/track.js` - Activity tracking
- ✅ `actions/mcp/push-activity.js` - MCP activity push
- ✅ `prisma/schema.prisma` - Database schema

### Blocks (sample)
- ✅ `login-button/` - Sample block to use as template

## What Needs to Be Built

### Phase 1: Core Infrastructure
- [ ] Complete IMS token exchange in auth/callback.js
- [ ] Build auth/refresh.js and auth/logout.js actions
- [ ] Create user import script for registration data
- [ ] Build portal page structure in pages/

### Phase 2: Content & Personalization
- [ ] Build content-block block (Production Agent integration)
- [ ] Build role-switcher block
- [ ] Build document-card and document-list blocks
- [ ] Build document-uploader block
- [ ] Create companies/, users/ API actions

### Phase 3: Activity Tracking
- [ ] Build activity-feed block
- [ ] Complete MCP document push endpoint
- [ ] Add rate limiting to MCP endpoints

### Phase 4: Employee Dashboard
- [ ] Build employee-dashboard block
- [ ] Build company-search block
- [ ] Build company-detail block
- [ ] Build activity-table block
- [ ] Build note-editor block
- [ ] Build invite-form block

### Phase 5: Testing
- [ ] Write API tests
- [ ] Write component tests
- [ ] Write E2E tests

## Block Template

Use this pattern for new blocks:

```javascript
// blocks/my-block/my-block.js
export default function decorate(block) {
  // block is the DOM element
  // Add your logic here
}
```

```css
/* blocks/my-block/my-block.css */
.my-block {
  /* styles */
}
```

## API Action Template

Use this pattern for new actions:

```javascript
// actions/resource/action.js
import { getDb } from '../../lib/db.js';
import { authenticate, successResponse, errorResponse } from '../../lib/middleware.js';

export async function main(params) {
  try {
    const auth = await authenticate(params, params.__ow_headers || {});
    if (!auth.authenticated) {
      return errorResponse(auth.error.code, auth.error.message, 401);
    }

    const db = getDb();
    // Your logic here

    return successResponse({ data }, 200);
  } catch (error) {
    console.error('Action error:', error);
    return errorResponse('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}
```

## Key Constants

Update these in `scripts/scripts.js`:
- `API_BASE_URL` - Your I/O Runtime URL
- `IMS_CLIENT_ID` - Your IMS client ID
- `ADOBE_ORG_ID` - Adobe's IMS Org ID for employee detection

## Commands

```bash
# Frontend (AEM.now)
aem up                    # Start local dev server

# Backend (I/O Runtime)
cd io-runtime-actions
npm install
npx prisma migrate dev    # Run database migrations
aio app deploy            # Deploy actions
```

## Questions?

Refer to `IMPLEMENTATION_SPEC.md` for:
- Complete API specifications
- Data model definitions
- User stories with acceptance criteria
- Detailed implementation tasks
