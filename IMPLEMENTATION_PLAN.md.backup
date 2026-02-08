# Summit Portal - Implementation Plan (AEM EDS + Adobe I/O Runtime)

## Overview

This plan implements the Summit Customer Portal using:
- **Frontend**: AEM Edge Delivery Services (using author-kit patterns)
- **Backend**: Adobe I/O Runtime (serverless actions)
- **Database**: PostgreSQL (via Prisma)
- **Storage**: Azure Blob Storage (documents)
- **Development Approach**: Content-Driven Development (CDD)

**Timeline**: 8 weeks to Summit launch
**Scale**: ~2,000 companies, ~3,000 users

---

## Development Methodology

### AEM Skills Available

We have installed 7 AEM development skills to guide the implementation:

1. **Using Content Driven Development** - Orchestrates all development work
2. **Building Blocks** - Guide for creating/modifying blocks
3. **Modeling Content** - Design author-friendly content models
4. **Using the Block Collection and Block Party** - Find reference implementations
5. **Code Review** - Validate code quality before PRs
6. **Testing Blocks** - Comprehensive testing guidance
7. **Searching AEM Documentation** - Query aem.live docs

### Content-Driven Development (CDD) Process

**MANDATORY** for all block development:

```
Phase 1: Content Discovery and Modeling
  ├─ Determine if test content exists
  ├─ Design content model (invoke Modeling Content skill)
  └─ Create test content (CMS or local HTML)

Phase 2: Implementation
  ├─ Find similar blocks (Block Collection skill)
  ├─ Implement JavaScript decoration
  └─ Add CSS styling

Phase 3: Validation
  ├─ Test with real content
  ├─ Run quality checks (linting)
  └─ Prepare for PR
```

**KEY RULE**: Never start coding without test content.

---

## Project Structure Analysis

### Current State ✅

```
summit-portal/
├── IMPLEMENTATION_SPEC.md     # Complete technical spec
├── AGENTS.md                  # Skills documentation
├── .skills/                   # 7 AEM development skills
│
├── Frontend (AEM EDS)
│   ├── fstab.yaml            # Content source config (needs Google Drive URL)
│   ├── head.html, header.html, footer.html
│   ├── blocks/
│   │   └── login-button/     # Sample block
│   ├── scripts/
│   │   ├── scripts.js        # Main initialization (✅ implemented)
│   │   ├── auth/             # Auth modules (✅ implemented)
│   │   ├── tracking/         # Activity tracking (✅ implemented)
│   │   └── api/              # API client (✅ implemented)
│   └── styles/               # CSS (✅ basic styles)
│
└── Backend (Adobe I/O Runtime)
    ├── lib/
    │   ├── db.js             # ✅ Database connection
    │   ├── jwt.js            # ✅ JWT handling
    │   └── middleware.js     # ✅ Auth middleware
    ├── actions/
    │   ├── auth/callback.js  # ⚠️ Needs completion
    │   ├── activities/track.js # ✅ Activity tracking
    │   └── mcp/push-activity.js # ✅ MCP integration
    └── prisma/schema.prisma  # ✅ Database schema
```

### Missing from Author-Kit Best Practices

1. **aem.js** - Core EDS library (blocks, loadCSS, etc.)
2. **delayed.js** - Lazy-loaded scripts pattern
3. **package.json** - Dependencies and linting config
4. **helix-query.yaml** - Content indexing for search
5. **lib-franklin.js** - EDS utility functions

---

## Phase-by-Phase Implementation Plan

### Phase 0: Foundation Setup (Week 1, Days 1-2)

**Priority**: Establish proper EDS foundation

#### Task 0.1: Add Author-Kit Essential Files
- [ ] Create `package.json` with dependencies
  ```json
  {
    "devDependencies": {
      "@babel/core": "^7.24.0",
      "@babel/eslint-parser": "^7.24.0",
      "eslint": "^8.57.0",
      "eslint-config-airbnb-base": "^15.0.0",
      "eslint-plugin-import": "^2.29.1",
      "stylelint": "^16.2.1",
      "stylelint-config-standard": "^36.0.0"
    },
    "scripts": {
      "lint:js": "eslint .",
      "lint:css": "stylelint 'blocks/**/*.css' 'styles/*.css'",
      "lint": "npm run lint:js && npm run lint:css",
      "lint:fix": "npm run lint:js -- --fix && npm run lint:css -- --fix"
    }
  }
  ```
- [ ] Add `.eslintrc.json` and `.stylelintrc.json`
- [ ] Add `scripts/aem.js` - core EDS library
- [ ] Add `scripts/delayed.js` - lazy loading pattern
- [ ] Add `scripts/lib-franklin.js` - utility functions
- [ ] Update `scripts/scripts.js` to use EDS patterns

#### Task 0.2: Configure Content Source
- [ ] Set up Google Drive or SharePoint folder
- [ ] Update `fstab.yaml` with actual content URL
- [ ] Create initial content structure in CMS

#### Task 0.3: Initialize Backend Infrastructure
- [ ] Provision Azure PostgreSQL database
- [ ] Run Prisma migrations: `cd io-runtime-actions && npx prisma migrate dev`
- [ ] Set up Azure Blob Storage container
- [ ] Configure Adobe I/O Runtime namespaces (staging/production)
- [ ] Add all environment variables to I/O Runtime

### Phase 1: Authentication & User Data (Week 1, Days 3-5)

**Priority**: Enable end-to-end login flow

#### Task 1.1: Complete Adobe IMS Authentication
- [ ] Finish [actions/auth/callback.js](io-runtime-actions/actions/auth/callback.js)
  - Complete IMS token exchange
  - Create/update user in database
  - Detect employee status (imsOrgId === ADOBE_ORG_ID)
  - Generate JWT session token
  - Track login activity
- [ ] Create [actions/auth/refresh.js](io-runtime-actions/actions/auth/refresh.js)
- [ ] Create [actions/auth/logout.js](io-runtime-actions/actions/auth/logout.js)
- [ ] Test full auth flow: login → portal → refresh → logout

#### Task 1.2: Build User Management APIs
- [ ] Create [actions/users/me.js](io-runtime-actions/actions/users/me.js) - GET user profile
- [ ] Create [actions/users/update-role.js](io-runtime-actions/actions/users/update-role.js) - PATCH role switch
- [ ] Test APIs with Postman/curl

#### Task 1.3: Import Registration Data
- [ ] Build CLI script: `io-runtime-actions/scripts/import-registration.js`
  - Parse CSV/Excel registration file
  - Extract unique email domains → create companies
  - Map registration fields to user roles (configure mapping)
  - Bulk insert users with companyId
- [ ] Run import with test data
- [ ] Validate: ~2000 companies, ~3000 users created

#### Task 1.4: Create Basic Pages
- [ ] Create `pages/index.md` in Google Drive/SharePoint
  - Landing page with login-button block
- [ ] Create `pages/portal/index.md`
  - Main portal layout
  - Test with authenticated user
- [ ] Test route guard: unauthenticated users → redirect to login

### Phase 2: Role-Based Content & Documents (Week 2-3)

**Priority**: Deliver personalized content value

#### Task 2.1: Role Switcher Block

**Follow CDD Process:**

1. **Content Discovery**
   - New block, skip to content modeling

2. **Content Modeling** (Invoke Modeling Content skill)
   - Design structure:
     ```
     | Role Switcher |
     | Executive |
     | Technical |
     | Practitioner |
     ```

3. **Create Test Content**
   - Create `pages/test/role-switcher.md` in CMS
   - Add role-switcher block with all three roles

4. **Implementation** (Invoke Building Blocks skill)
   - Create [blocks/role-switcher/](blocks/role-switcher/)
   - Dropdown shows current role
   - On change: call `PATCH /users/me/role`
   - Update session, refresh page

5. **Validation**
   - Test role switching
   - Verify activity tracking
   - Run linting

#### Task 2.2: Production Agent Content Block

**Follow CDD Process:**

1. **Content Modeling**
   - Block accepts: role, industry, companyName
   - Returns personalized content from Production Agent

2. **Create Test Content**
   - Create `pages/test/content-block.md`
   - Add content-block with various parameters

3. **Implementation**
   - Create [blocks/content-block/](blocks/content-block/)
   - Call Production Agent API with context
   - Render markdown response as HTML
   - Handle loading states & errors

4. **Integration**
   - Add lib/production-agent.js in io-runtime-actions
   - Create [actions/content/generate.js](io-runtime-actions/actions/content/generate.js) if needed
   - Or call directly from frontend (if API key can be exposed)

#### Task 2.3: Document Card Block

**Follow CDD Process:**

1. **Content Modeling**
   ```
   | Document Card |
   | Document Title | https://example.com/doc.pdf |
   | Brief description of the document |
   | PDF |
   | Executive, Technical |
   ```

2. **Create Test Content**
   - Create sample documents in Azure Blob
   - Create `pages/test/document-card.md`

3. **Implementation**
   - Create [blocks/document-card/](blocks/document-card/)
   - Display: icon, title, description, file type, size
   - Click: track document_view → download
   - Mobile-first responsive design

#### Task 2.4: Document List Block

**Follow CDD Process:**

1. **Content Modeling**
   - Auto-populated block (no content in CMS)
   - Configured via data attributes

2. **Create Test Content**
   - Create `pages/portal/documents.md`
   - Add document-list block

3. **Implementation**
   - Create [blocks/document-list/](blocks/document-list/)
   - Fetch from `GET /companies/:id/documents?role={currentRole}`
   - Render grid of document-card blocks
   - Filter by current role
   - Handle empty state

#### Task 2.5: Document APIs (Read)
- [ ] Create [actions/companies/get-documents.js](io-runtime-actions/actions/companies/get-documents.js)
  - Filter by `visibleToRoles` array
  - Return document metadata + Azure Blob URLs
- [ ] Test with existing companies

#### Task 2.6: Integrate Portal Header
- [ ] Update [header.html](header.html)
  - Logo
  - User name (from session)
  - Company name
  - Role switcher block
  - Logout button
- [ ] Add dynamic data from session

### Phase 3: Activity Tracking (Week 4)

**Priority**: User engagement visibility

#### Task 3.1: Activity Feed Block

**Follow CDD Process:**

1. **Content Modeling**
   - Auto-populated, no CMS content

2. **Create Test Content**
   - Create `pages/portal/activity.md`
   - Add activity-feed block

3. **Implementation**
   - Create [blocks/activity-feed/](blocks/activity-feed/)
   - Fetch from `GET /users/me/activities`
   - Display chronological list with icons
   - Pagination (load more)
   - Format timestamps relative (e.g., "2 hours ago")

#### Task 3.2: Activity API
- [ ] Create [actions/users/get-activities.js](io-runtime-actions/actions/users/get-activities.js)
  - Query user's activities with pagination
  - Order by timestamp DESC
  - Support type filtering

#### Task 3.3: Enhanced Tracking
- [ ] Update [scripts/tracking/tracker.js](scripts/tracking/tracker.js)
  - Auto-track page_view on navigation
  - Track document_view with duration
  - Track link_click with metadata
- [ ] Test offline queue resilience

### Phase 4: Employee Tools (Week 5)

**Priority**: Enable account teams to manage portals

#### Task 4.1: Company Search Block

**Follow CDD Process:**

1. **Content Modeling**
   - Search input with autocomplete

2. **Create Test Content**
   - Create `pages/employee/index.md`
   - Add company-search block

3. **Implementation**
   - Create [blocks/company-search/](blocks/company-search/)
   - Debounced search input
   - Call `GET /companies/search?q={query}`
   - Autocomplete dropdown
   - Navigate to company detail on select

#### Task 4.2: Company Detail Block

**Follow CDD Process:**

1. **Content Modeling**
   - Tabbed interface: Overview, Users, Activities, Documents, Notes

2. **Create Test Content**
   - Create `pages/employee/company.md`
   - Add company-detail block

3. **Implementation**
   - Create [blocks/company-detail/](blocks/company-detail/)
   - Tabs for different views
   - Load data dynamically per tab
   - Display engagement stats

#### Task 4.3: Activity Table Block (Employee)

**Follow CDD Process:**

1. **Implementation**
   - Create [blocks/activity-table/](blocks/activity-table/)
   - Sortable columns
   - Filter by type, user
   - Pagination
   - Export CSV option

#### Task 4.4: Document Uploader Block

**Follow CDD Process:**

1. **Implementation**
   - Create [blocks/document-uploader/](blocks/document-uploader/)
   - Drag-drop interface
   - Multi-file upload
   - Select visible roles (checkboxes)
   - Progress indicator
   - Call `POST /companies/:id/documents`

#### Task 4.5: Note Editor Block

**Follow CDD Process:**

1. **Implementation**
   - Create [blocks/note-editor/](blocks/note-editor/)
   - Rich text editor (simple markdown)
   - CRUD operations
   - Timestamp display
   - Who created/updated

#### Task 4.6: Invitation Form Block

**Follow CDD Process:**

1. **Implementation**
   - Create [blocks/invite-form/](blocks/invite-form/)
   - Email input with validation
   - Call `POST /users/invite`
   - Success/error messaging
   - List pending invitations

#### Task 4.7: Company Management APIs
- [ ] Create [actions/companies/search.js](io-runtime-actions/actions/companies/search.js)
- [ ] Create [actions/companies/get.js](io-runtime-actions/actions/companies/get.js)
- [ ] Create [actions/companies/get-users.js](io-runtime-actions/actions/companies/get-users.js)
- [ ] Create [actions/companies/get-activities.js](io-runtime-actions/actions/companies/get-activities.js)

#### Task 4.8: Document Upload APIs
- [ ] Create [actions/companies/upload-document.js](io-runtime-actions/actions/companies/upload-document.js)
  - Parse multipart/form-data
  - Upload to Azure Blob Storage
  - Create document record
  - Track document_uploaded activity
- [ ] Create [actions/companies/delete-document.js](io-runtime-actions/actions/companies/delete-document.js)
  - Delete from Azure Blob
  - Delete database record

#### Task 4.9: Notes APIs
- [ ] Create [actions/companies/notes/get.js](io-runtime-actions/actions/companies/notes/get.js)
- [ ] Create [actions/companies/notes/create.js](io-runtime-actions/actions/companies/notes/create.js)
- [ ] Create [actions/companies/notes/update.js](io-runtime-actions/actions/companies/notes/update.js)
- [ ] Create [actions/companies/notes/delete.js](io-runtime-actions/actions/companies/notes/delete.js)

#### Task 4.10: Invitation API
- [ ] Create [actions/users/invite.js](io-runtime-actions/actions/users/invite.js)
  - Create invitation record
  - Send email via email service
  - Handle invitation acceptance flow

### Phase 5: MCP Integration (Week 6)

**Priority**: Badge scanning at Summit event

#### Task 5.1: MCP Document Endpoint
- [ ] Create [actions/mcp/push-document.js](io-runtime-actions/actions/mcp/push-document.js)
  - Similar to upload-document
  - Lookup company by domain
  - Authenticate via API key

#### Task 5.2: Rate Limiting
- [ ] Complete [lib/rate-limit.js](io-runtime-actions/lib/rate-limit.js)
  - Implement token bucket algorithm
  - 100 req/min, 10k req/day per API key
  - Store state in database (ApiKey table)
  - Return 429 with Retry-After header

#### Task 5.3: API Key Management
- [ ] Create CLI tool: `io-runtime-actions/scripts/manage-api-keys.js`
  - Generate API keys
  - Hash and store in database
  - Set permissions & rate limits
  - Revoke keys

#### Task 5.4: Test MCP Integration
- [ ] Create test script to simulate badge scanner
- [ ] Push badge_scan activities
- [ ] Verify they appear in activity feed within 30s
- [ ] Test rate limiting

### Phase 6: Polish & Mobile (Week 7, Days 1-3)

**Priority**: Production-ready UX

#### Task 6.1: Mobile Responsiveness
- [ ] Review all blocks on mobile viewports (375px, 768px)
- [ ] Test touch interactions
- [ ] Optimize images for mobile
- [ ] Test on real devices (iOS, Android)

#### Task 6.2: Performance Optimization
- [ ] Implement lazy loading for activity feed
- [ ] Add loading skeletons for dynamic content
- [ ] Optimize images (WebP, srcset)
- [ ] Enable caching headers for static assets
- [ ] Add service worker for offline support

#### Task 6.3: Accessibility
- [ ] Run Lighthouse accessibility audits
- [ ] Fix ARIA labels and roles
- [ ] Test keyboard navigation
- [ ] Test with screen readers

#### Task 6.4: Error Handling
- [ ] Add user-friendly error messages
- [ ] Implement retry logic for failed API calls
- [ ] Add error boundary for React-like error handling
- [ ] Test network failure scenarios

### Phase 7: Testing & Quality (Week 7, Days 4-5)

**Priority**: Confidence in deployment

#### Task 7.1: Unit Tests
- [ ] Write tests for auth utilities
- [ ] Write tests for tracking utilities
- [ ] Write tests for API client
- [ ] Test coverage > 80% for utilities

#### Task 7.2: API Integration Tests
- [ ] Auth flow tests (login, refresh, logout)
- [ ] CRUD operation tests for all endpoints
- [ ] MCP endpoint tests
- [ ] Error handling tests

#### Task 7.3: E2E Tests
- [ ] User journey: login → view content → track activity
- [ ] Employee journey: search company → upload document
- [ ] MCP journey: push badge scan → verify in feed

#### Task 7.4: Code Review
- [ ] Use **Code Review** skill on all blocks
- [ ] Fix linting issues
- [ ] Ensure accessibility standards met
- [ ] Performance validation (PageSpeed Insights)

### Phase 8: Launch Prep (Week 8)

**Priority**: Production deployment

#### Task 8.1: Final Data Import
- [ ] Get final registration CSV from event team
- [ ] Confirm role mapping rules
- [ ] Run import script
- [ ] Validate all companies and users created
- [ ] Spot check 10-20 companies for correctness

#### Task 8.2: GDPR Compliance
- [ ] Implement cookie consent banner
- [ ] Add privacy policy link
- [ ] Ensure EU data residency (if required)
- [ ] Add data deletion mechanism

#### Task 8.3: Monitoring & Logging
- [ ] Set up error tracking (Sentry or similar)
- [ ] Configure usage analytics
- [ ] Set up alerts for API errors
- [ ] Dashboard for employee usage

#### Task 8.4: Production Deployment
- [ ] Deploy frontend to aem.live production
- [ ] Deploy I/O Runtime actions to production namespace
- [ ] Run smoke tests
- [ ] Load test: simulate 3000 concurrent users
- [ ] Monitor for 24 hours

#### Task 8.5: Documentation
- [ ] Update README with setup instructions
- [ ] Document API endpoints for MCP integration
- [ ] Create runbook for common issues
- [ ] Training materials for Adobe employees

---

## Critical Dependencies Checklist

### External Services
- [ ] Adobe IMS credentials (client ID/secret)
- [ ] Adobe IMS Org ID for employee detection
- [ ] PostgreSQL database provisioned
- [ ] Azure Blob Storage account created
- [ ] Production Agent API access
- [ ] Email service credentials (SendGrid, etc.)
- [ ] Google Drive or SharePoint content source

### Data Requirements
- [ ] Registration CSV with attendee list
- [ ] Role mapping configuration defined
- [ ] Company email domain list validated
- [ ] Test company accounts for development

### Infrastructure
- [ ] Adobe I/O Runtime staging namespace
- [ ] Adobe I/O Runtime production namespace
- [ ] AEM EDS project created (aem.live)
- [ ] CI/CD pipeline for actions deployment

---

## Risk Mitigation

### High-Risk Items

1. **Adobe IMS OAuth Flow**
   - **Risk**: Auth failure = complete blocker
   - **Mitigation**: Test early in Week 1, have Adobe IMS support on standby

2. **Production Agent Integration**
   - **Risk**: External dependency, may have rate limits or availability issues
   - **Mitigation**: Build mock fallback, cache responses aggressively

3. **Registration Data Quality**
   - **Risk**: Bad email domains = orphaned users
   - **Mitigation**: Validate early with sample data, build admin tools to reassign users

4. **Scale Testing**
   - **Risk**: 3000 concurrent users, 2000 companies
   - **Mitigation**: Load test in Week 7, tune database connection pools, enable I/O Runtime autoscaling

5. **Mobile Experience**
   - **Risk**: Attendees primarily on phones, poor mobile UX = failure
   - **Mitigation**: Mobile-first design from Day 1, test on real devices continuously

---

## Development Commands

### Frontend (AEM EDS)

```bash
# Start local dev server
aem up

# Start with local HTML content (for testing)
aem up --html-folder drafts

# Linting
npm run lint
npm run lint:fix
```

### Backend (Adobe I/O Runtime)

```bash
cd io-runtime-actions

# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Deploy actions
aio app deploy

# Run import script
node scripts/import-registration.js path/to/registration.csv

# Manage API keys
node scripts/manage-api-keys.js create "Badge Scanner System"
node scripts/manage-api-keys.js list
node scripts/manage-api-keys.js revoke <key-id>
```

### Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run specific test file
npm test -- auth.test.js
```

---

## Next Steps

1. **Immediate**: Complete Phase 0 (Foundation Setup)
   - Add author-kit essential files
   - Configure content source
   - Initialize backend infrastructure

2. **Week 1 Focus**: Get authentication working end-to-end
   - Complete auth actions
   - Import test data
   - Validate login flow

3. **Week 2-3 Focus**: Build core user experience
   - Role switcher
   - Content blocks
   - Document viewing

**Remember**: Use the Content-Driven Development (CDD) process for ALL block development. The skills are there to guide you through the proper workflow.

---

## Success Criteria

By launch day:
- ✅ All 3000 users can log in with Adobe ID
- ✅ Users see personalized content based on role
- ✅ Users can switch roles and see content update
- ✅ Documents are accessible and downloads tracked
- ✅ Activity feed shows badge scans and interactions
- ✅ Employees can search companies and view engagement
- ✅ Employees can upload documents and add notes
- ✅ MCP badge scans appear in feeds within 30 seconds
- ✅ System handles 3000 concurrent users
- ✅ Mobile experience is excellent
- ✅ PageSpeed Insights score > 90
