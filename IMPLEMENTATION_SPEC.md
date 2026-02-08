# Summit Customer Portal - Implementation Specification v2

## Project Overview

Build a personalized customer portal for Adobe Summit using AEM.now (Edge Delivery Services). The portal provides company-specific content, activity tracking, and employee tools for customer engagement.

**Timeline:** 8 weeks to Summit launch
**Scale:** ~2,000 companies, ~3,000 users
**Platform:** Pure AEM.now (Edge Delivery Services) + Adobe I/O Runtime for APIs

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     AEM.now (Edge Delivery Services)                    │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────────┐ │
│  │  Portal Pages  │  │    Blocks      │  │   Content (Google Drive/   │ │
│  │  (HTML/JS)     │  │   (Custom JS)  │  │   SharePoint)              │ │
│  └───────┬────────┘  └───────┬────────┘  └────────────┬───────────────┘ │
└──────────┼───────────────────┼─────────────────────────┼────────────────┘
           │                   │                         │
           ▼                   ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Adobe I/O Runtime (Serverless APIs)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Auth    │  │ Company  │  │ Activity │  │ Document │  │   MCP    │  │
│  │  Action  │  │  Action  │  │  Action  │  │  Action  │  │  Action  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
           │                   │                         │
           ▼                   ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Data Layer                                    │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────────┐ │
│  │  PostgreSQL    │  │  Azure Blob    │  │   Production Agent         │ │
│  │  (Users, etc.) │  │  (Documents)   │  │   (Content Personalization)│ │
│  └────────────────┘  └────────────────┘  └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
           ▲                   ▲
           │                   │
┌─────────────────────────────────────────────────────────────────────────┐
│                        MCP Integration Layer                            │
│  ┌────────────────────────┐  ┌────────────────────────────────────────┐ │
│  │  Badge Scanner Events  │  │  External Systems (docs, events)       │ │
│  └────────────────────────┘  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models

### User

```typescript
interface User {
  id: string;                    // Internal UUID
  imsId: string;                 // Adobe IMS user ID
  imsOrgId: string;              // Adobe IMS Org ID (used to identify employees)
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string;              // From registration data
  country: string;               // From registration data
  region: string;                // From registration data
  companyId: string;             // Foreign key to Company
  role: UserRole;                // Mapped from registration field (TBD)
  selectedRole: UserRole | null; // User override for viewing different content
  isEmployee: boolean;           // Computed: true if imsOrgId === ADOBE_IMS_ORG_ID
  createdAt: Date;
  lastLoginAt: Date | null;
}

type UserRole = 'executive' | 'technical' | 'practitioner';

// Employee detection logic:
// const ADOBE_IMS_ORG_ID = 'adobe-org-id-here';
// user.isEmployee = user.imsOrgId === ADOBE_IMS_ORG_ID;
```

### Company

```typescript
interface Company {
  id: string;
  name: string;
  domain: string;                // Single email domain for auto-matching
  industry: string;
  portalSlug: string;            // URL-friendly identifier
  createdAt: Date;
  updatedAt: Date;
}
```

### Activity

```typescript
interface Activity {
  id: string;
  userId: string | null;         // Nullable for system-generated activities
  companyId: string;
  type: ActivityType;
  metadata: Record<string, any>; // Type-specific data
  timestamp: Date;
  source: 'portal' | 'mcp' | 'system'; // Where the activity originated
}

type ActivityType =
  | 'login'
  | 'logout'
  | 'page_view'
  | 'document_view'
  | 'document_download'
  | 'link_click'
  | 'role_switch'
  | 'badge_scan'
  | 'booth_visit'
  | 'document_uploaded'     // Employee action
  | 'note_added';           // Employee action

// Metadata examples:
interface BadgeScanMetadata {
  boothId: string;
  boothName: string;
  scannedAt: string;        // ISO date string
}

interface DocumentViewMetadata {
  documentId: string;
  documentTitle: string;
  durationMs: number;
}

interface LinkClickMetadata {
  url: string;
  elementId: string;
  elementText: string;
  pageUrl: string;
}

interface RoleSwitchMetadata {
  fromRole: UserRole;
  toRole: UserRole;
}
```

### Document

```typescript
interface Document {
  id: string;
  companyId: string;
  title: string;
  description: string | null;
  fileUrl: string;               // Azure Blob Storage URL
  fileType: string;              // 'pdf', 'pptx', etc.
  fileSizeBytes: number;
  uploadedById: string;          // Employee user ID
  uploadedAt: Date;
  visibleToRoles: UserRole[];    // Which roles can see this
}
```

### Note

```typescript
interface Note {
  id: string;
  companyId: string;
  content: string;
  createdById: string;           // Employee user ID
  createdAt: Date;
  updatedAt: Date;
}
```

### Invitation

```typescript
interface Invitation {
  id: string;
  companyId: string;
  invitedEmail: string;
  invitedById: string;           // User ID who invited
  status: 'pending' | 'accepted' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}
```

### Registration Data Import

```typescript
// Format of the registration file you'll upload
interface RegistrationRecord {
  email: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  orgRole: string;               // Field to map to UserRole (TBD)
  country: string;
  region: string;
  companyName: string;
  // ... additional fields
}

// Mapping configuration (to be defined)
interface RoleMappingConfig {
  sourceField: string;           // e.g., 'orgRole' or 'jobTitle'
  mappings: {
    pattern: string;             // Regex or exact match
    role: UserRole;
  }[];
  defaultRole: UserRole;
}
```

---

## API Specifications (Adobe I/O Runtime Actions)

### Base URL

```
https://runtime.adobe.io/api/v1/web/summit-portal/
```

### Common Response Formats

```typescript
// Success response
interface ApiResponse<T> {
  success: true;
  data: T;
}

// Error response
interface ApiError {
  success: false;
  error: {
    code: string;           // e.g., 'AUTH_REQUIRED', 'NOT_FOUND', 'FORBIDDEN'
    message: string;
    details?: Record<string, any>;
  };
}

// HTTP Status Codes:
// 200 - Success
// 201 - Created
// 400 - Bad Request (validation error)
// 401 - Unauthorized (no/invalid token)
// 403 - Forbidden (valid token, no permission)
// 404 - Not Found
// 429 - Rate Limited
// 500 - Internal Server Error
```

### Authentication

#### POST /auth/callback

Handles IMS OAuth callback, creates/updates user, returns session.

```typescript
// Request
POST /auth/callback
Content-Type: application/json
{
  "imsAuthCode": string,        // Authorization code from IMS
  "redirectUri": string
}

// Response 200
{
  "success": true,
  "data": {
    "user": User,
    "company": Company,
    "sessionToken": string,     // JWT, 24h expiry
    "expiresAt": string         // ISO date
  }
}

// Response 401 (invalid auth code)
{
  "success": false,
  "error": {
    "code": "INVALID_AUTH_CODE",
    "message": "The authorization code is invalid or expired"
  }
}
```

#### POST /auth/refresh

Refresh session token before expiry.

```typescript
// Request
POST /auth/refresh
Authorization: Bearer <sessionToken>

// Response 200
{
  "success": true,
  "data": {
    "sessionToken": string,
    "expiresAt": string
  }
}
```

#### POST /auth/logout

Invalidate session and track logout activity.

```typescript
// Request
POST /auth/logout
Authorization: Bearer <sessionToken>

// Response 200
{
  "success": true,
  "data": {
    "loggedOut": true
  }
}
```

### Auth Middleware

All protected endpoints require:

```typescript
// Request header
Authorization: Bearer <sessionToken>

// Middleware validates:
// 1. Token exists and is valid JWT
// 2. Token not expired
// 3. User exists in database
// 4. For employee endpoints: user.isEmployee === true

// On failure, returns:
{
  "success": false,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Valid authentication required"
  }
}
```

### User API

#### GET /users/me

```typescript
// Request
GET /users/me
Authorization: Bearer <sessionToken>

// Response 200
{
  "success": true,
  "data": {
    "user": User,
    "company": Company
  }
}
```

#### PATCH /users/me/role

Switch viewing role (any user).

```typescript
// Request
PATCH /users/me/role
Authorization: Bearer <sessionToken>
Content-Type: application/json
{
  "selectedRole": UserRole       // 'executive' | 'technical' | 'practitioner'
}

// Response 200
{
  "success": true,
  "data": {
    "user": User                 // Updated user with new selectedRole
  }
}
```

#### POST /users/invite

Invite colleague to company portal.

```typescript
// Request
POST /users/invite
Authorization: Bearer <sessionToken>
Content-Type: application/json
{
  "email": string
}

// Response 201
{
  "success": true,
  "data": {
    "invitation": Invitation
  }
}

// Response 400 (already invited)
{
  "success": false,
  "error": {
    "code": "ALREADY_INVITED",
    "message": "This email has already been invited"
  }
}
```

### Company API

#### GET /companies/:companyId

```typescript
// Request
GET /companies/:companyId
Authorization: Bearer <sessionToken>

// Response 200
{
  "success": true,
  "data": {
    "company": Company,
    "userCount": number,
    "stats": {                   // Only for employees
      "totalLogins": number,
      "activeUsers": number,     // Logged in last 7 days
      "documentsViewed": number
    }
  }
}
```

#### GET /companies/:companyId/users

Employee only.

```typescript
// Request
GET /companies/:companyId/users
Authorization: Bearer <sessionToken>

// Response 200
{
  "success": true,
  "data": {
    "users": User[]
  }
}

// Response 403 (not employee)
{
  "success": false,
  "error": {
    "code": "EMPLOYEE_REQUIRED",
    "message": "This action requires employee access"
  }
}
```

#### GET /companies/search

Employee only.

```typescript
// Request
GET /companies/search?q={query}&limit={limit}&offset={offset}
Authorization: Bearer <sessionToken>

// Query params
q: string            // Search query (matches name)
limit?: number       // Default 20, max 100
offset?: number      // Default 0

// Response 200
{
  "success": true,
  "data": {
    "companies": Company[],
    "total": number,
    "limit": number,
    "offset": number
  }
}
```

### Documents API

#### GET /companies/:companyId/documents

```typescript
// Request
GET /companies/:companyId/documents?role={role}
Authorization: Bearer <sessionToken>

// Query params
role?: UserRole      // Filter by role visibility (defaults to user's current role)

// Response 200
{
  "success": true,
  "data": {
    "documents": Document[]
  }
}
```

#### POST /companies/:companyId/documents

Employee only.

```typescript
// Request
POST /companies/:companyId/documents
Authorization: Bearer <sessionToken>
Content-Type: multipart/form-data

file: File
title: string
description?: string
visibleToRoles: string          // JSON array: '["executive","technical"]'

// Response 201
{
  "success": true,
  "data": {
    "document": Document
  }
}
```

#### DELETE /companies/:companyId/documents/:documentId

Employee only.

```typescript
// Request
DELETE /companies/:companyId/documents/:documentId
Authorization: Bearer <sessionToken>

// Response 200
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

### Activities API

#### GET /users/me/activities

User's own activity feed.

```typescript
// Request
GET /users/me/activities?limit={limit}&offset={offset}&type={type}
Authorization: Bearer <sessionToken>

// Query params
limit?: number       // Default 50, max 200
offset?: number      // Default 0
type?: ActivityType  // Filter by activity type

// Response 200
{
  "success": true,
  "data": {
    "activities": Activity[],
    "total": number,
    "limit": number,
    "offset": number
  }
}
```

#### GET /companies/:companyId/activities

Employee only - company's aggregated activities.

```typescript
// Request
GET /companies/:companyId/activities?limit={limit}&offset={offset}&type={type}&userId={userId}
Authorization: Bearer <sessionToken>

// Query params
limit?: number       // Default 50, max 200
offset?: number      // Default 0
type?: ActivityType  // Filter by activity type
userId?: string      // Filter by specific user

// Response 200
{
  "success": true,
  "data": {
    "activities": Activity[],
    "total": number,
    "limit": number,
    "offset": number
  }
}
```

#### POST /activities

Track user action (called from frontend).

```typescript
// Request
POST /activities
Authorization: Bearer <sessionToken>
Content-Type: application/json
{
  "type": ActivityType,
  "metadata": Record<string, any>
}

// Response 201
{
  "success": true,
  "data": {
    "activity": Activity
  }
}
```

### Notes API (Employee only)

#### GET /companies/:companyId/notes

```typescript
// Request
GET /companies/:companyId/notes
Authorization: Bearer <sessionToken>

// Response 200
{
  "success": true,
  "data": {
    "notes": Note[]
  }
}
```

#### POST /companies/:companyId/notes

```typescript
// Request
POST /companies/:companyId/notes
Authorization: Bearer <sessionToken>
Content-Type: application/json
{
  "content": string
}

// Response 201
{
  "success": true,
  "data": {
    "note": Note
  }
}
```

#### PUT /companies/:companyId/notes/:noteId

```typescript
// Request
PUT /companies/:companyId/notes/:noteId
Authorization: Bearer <sessionToken>
Content-Type: application/json
{
  "content": string
}

// Response 200
{
  "success": true,
  "data": {
    "note": Note
  }
}
```

#### DELETE /companies/:companyId/notes/:noteId

```typescript
// Request
DELETE /companies/:companyId/notes/:noteId
Authorization: Bearer <sessionToken>

// Response 200
{
  "success": true,
  "data": {
    "deleted": true
  }
}
```

### MCP Endpoints

External systems push data via MCP. Requires API key authentication.

**Rate Limits:**
- 100 requests per minute per API key
- 10,000 requests per day per API key

#### POST /mcp/activities

```typescript
// Request
POST /mcp/activities
X-MCP-API-Key: string
Content-Type: application/json
{
  "userId"?: string,            // Optional - can match by email instead
  "userEmail"?: string,         // Used if userId not provided
  "companyId"?: string,         // Optional - can match by domain instead
  "companyDomain"?: string,     // Used if companyId not provided
  "type": ActivityType,
  "metadata": Record<string, any>,
  "timestamp"?: string          // ISO date, defaults to now
}

// Response 201
{
  "success": true,
  "data": {
    "activity": Activity
  }
}

// Response 401 (invalid API key)
{
  "success": false,
  "error": {
    "code": "INVALID_API_KEY",
    "message": "The API key is invalid or revoked"
  }
}

// Response 429 (rate limited)
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "details": {
      "retryAfter": 60
    }
  }
}
```

#### POST /mcp/documents

```typescript
// Request
POST /mcp/documents
X-MCP-API-Key: string
Content-Type: multipart/form-data

companyId?: string
companyDomain?: string
file: File
title: string
description?: string
visibleToRoles: string          // JSON array

// Response 201
{
  "success": true,
  "data": {
    "document": Document
  }
}
```

---

## File Structure (AEM.now / Edge Delivery Services)

```
summit-portal/
├── README.md
├── fstab.yaml                    # Content source config (Google Drive/SharePoint)
├── head.html                     # Global head includes
├── header.html                   # Global header
├── footer.html                   # Global footer
├── 404.html
│
├── scripts/
│   ├── aem.js                    # AEM.now core library
│   ├── scripts.js                # Global scripts
│   ├── delayed.js                # Lazy-loaded scripts
│   │
│   ├── auth/
│   │   ├── ims.js                # Adobe IMS integration
│   │   ├── session.js            # Session management
│   │   └── guard.js              # Route protection
│   │
│   ├── api/
│   │   └── client.js             # API client for I/O Runtime actions
│   │
│   ├── tracking/
│   │   ├── tracker.js            # Click/view tracking
│   │   └── queue.js              # Offline activity queue
│   │
│   └── utils/
│       ├── storage.js            # LocalStorage helpers
│       └── format.js             # Date/text formatting
│
├── styles/
│   ├── styles.css                # Global styles
│   ├── fonts.css                 # Font definitions
│   └── variables.css             # CSS custom properties
│
├── blocks/
│   ├── portal-header/
│   │   ├── portal-header.js      # Logo, user info, role switcher
│   │   └── portal-header.css
│   │
│   ├── role-switcher/
│   │   ├── role-switcher.js      # Dropdown to change viewing role
│   │   └── role-switcher.css
│   │
│   ├── content-block/
│   │   ├── content-block.js      # Production Agent personalized content
│   │   └── content-block.css
│   │
│   ├── activity-feed/
│   │   ├── activity-feed.js      # User's activity diary
│   │   └── activity-feed.css
│   │
│   ├── document-list/
│   │   ├── document-list.js      # Document cards grid
│   │   └── document-list.css
│   │
│   ├── document-card/
│   │   ├── document-card.js      # Single document preview
│   │   └── document-card.css
│   │
│   ├── invite-form/
│   │   ├── invite-form.js        # Email invite form
│   │   └── invite-form.css
│   │
│   ├── login-button/
│   │   ├── login-button.js       # Adobe ID login trigger
│   │   └── login-button.css
│   │
│   ├── employee-dashboard/
│   │   ├── employee-dashboard.js # Employee main view
│   │   └── employee-dashboard.css
│   │
│   ├── company-search/
│   │   ├── company-search.js     # Search with autocomplete
│   │   └── company-search.css
│   │
│   ├── company-detail/
│   │   ├── company-detail.js     # Full company view
│   │   └── company-detail.css
│   │
│   ├── activity-table/
│   │   ├── activity-table.js     # Sortable/filterable table
│   │   └── activity-table.css
│   │
│   ├── document-uploader/
│   │   ├── document-uploader.js  # Drag-drop upload
│   │   └── document-uploader.css
│   │
│   └── note-editor/
│       ├── note-editor.js        # Rich text notes
│       └── note-editor.css
│
├── pages/                        # Content managed in Google Drive/SharePoint
│   ├── index                     # Landing page
│   ├── portal/
│   │   ├── index                 # Main portal
│   │   ├── activity              # Activity feed page
│   │   ├── documents             # Documents page
│   │   └── invite                # Invite page
│   └── employee/
│       ├── index                 # Employee dashboard
│       └── company/              # Company detail pages
│
└── tools/
    └── sidekick/
        └── config.json           # Sidekick configuration
```

### Adobe I/O Runtime Actions

```
io-runtime-actions/
├── package.json
├── .env.example
│
├── lib/
│   ├── db.js                     # PostgreSQL connection (Prisma)
│   ├── ims.js                    # IMS token validation
│   ├── storage.js                # Azure Blob Storage
│   ├── jwt.js                    # Session token handling
│   ├── middleware.js             # Auth middleware
│   └── rate-limit.js             # Rate limiting for MCP
│
├── actions/
│   ├── auth/
│   │   ├── callback.js
│   │   ├── refresh.js
│   │   └── logout.js
│   │
│   ├── users/
│   │   ├── me.js
│   │   ├── update-role.js
│   │   └── invite.js
│   │
│   ├── companies/
│   │   ├── get.js
│   │   ├── get-users.js
│   │   ├── search.js
│   │   ├── get-documents.js
│   │   ├── upload-document.js
│   │   ├── delete-document.js
│   │   ├── get-activities.js
│   │   ├── get-notes.js
│   │   ├── create-note.js
│   │   ├── update-note.js
│   │   └── delete-note.js
│   │
│   ├── activities/
│   │   ├── track.js
│   │   └── get-mine.js
│   │
│   └── mcp/
│       ├── push-activity.js
│       └── push-document.js
│
├── prisma/
│   └── schema.prisma
│
└── tests/
    ├── actions/
    └── lib/
```

---

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String    @id @default(uuid())
  imsId           String    @unique
  imsOrgId        String                          // For employee detection
  email           String    @unique
  firstName       String
  lastName        String
  jobTitle        String?
  country         String?
  region          String?
  role            String                          // 'executive' | 'technical' | 'practitioner'
  selectedRole    String?
  companyId       String
  company         Company   @relation(fields: [companyId], references: [id])
  activities      Activity[]
  documents       Document[] @relation("UploadedDocuments")
  notes           Note[]
  invitationsSent Invitation[] @relation("InvitationsSent")
  createdAt       DateTime  @default(now())
  lastLoginAt     DateTime?

  @@index([imsOrgId])
  @@index([companyId])
}

model Company {
  id          String    @id @default(uuid())
  name        String
  domain      String    @unique
  industry    String
  portalSlug  String    @unique
  users       User[]
  activities  Activity[]
  documents   Document[]
  notes       Note[]
  invitations Invitation[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Activity {
  id        String   @id @default(uuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  companyId String
  company   Company  @relation(fields: [companyId], references: [id])
  type      String
  metadata  Json
  source    String   @default("portal")           // 'portal' | 'mcp' | 'system'
  timestamp DateTime @default(now())

  @@index([companyId, timestamp(sort: Desc)])
  @@index([userId, timestamp(sort: Desc)])
  @@index([type])
}

model Document {
  id             String   @id @default(uuid())
  companyId      String
  company        Company  @relation(fields: [companyId], references: [id])
  title          String
  description    String?
  fileUrl        String
  fileType       String
  fileSizeBytes  Int
  visibleToRoles String[]
  uploadedById   String
  uploadedBy     User     @relation("UploadedDocuments", fields: [uploadedById], references: [id])
  uploadedAt     DateTime @default(now())

  @@index([companyId])
}

model Note {
  id          String   @id @default(uuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])
  content     String
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([companyId])
}

model Invitation {
  id           String   @id @default(uuid())
  companyId    String
  company      Company  @relation(fields: [companyId], references: [id])
  invitedEmail String
  invitedById  String
  invitedBy    User     @relation("InvitationsSent", fields: [invitedById], references: [id])
  status       String   @default("pending")
  createdAt    DateTime @default(now())
  expiresAt    DateTime

  @@unique([companyId, invitedEmail])
  @@index([status])
}

model ApiKey {
  id          String   @id @default(uuid())
  key         String   @unique                    // Hashed API key
  name        String                              // Descriptive name
  permissions String[]                            // ['mcp:activities', 'mcp:documents']
  rateLimit   Int      @default(100)              // Requests per minute
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  lastUsedAt  DateTime?

  @@index([key])
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique                      // Hashed session token
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([token])
  @@index([expiresAt])
}
```

---

## Implementation Tasks

### Phase 1: Core Infrastructure (Week 1-2)

- [ ] **Task 1.1**: Initialize AEM.now project
  - Create project from EDS template
  - Configure fstab.yaml for content source
  - Set up local development environment
  - Deploy to EDS staging

- [ ] **Task 1.2**: Set up Adobe I/O Runtime
  - Create I/O Runtime project
  - Configure deployment pipeline
  - Set up staging/production namespaces

- [ ] **Task 1.3**: Set up PostgreSQL database
  - Provision database (Azure PostgreSQL recommended)
  - Initialize Prisma schema
  - Run migrations
  - Set up connection pooling

- [ ] **Task 1.4**: Implement Adobe IMS authentication
  - Configure IMS client credentials
  - Build `/auth/callback` action
  - Build `/auth/refresh` action
  - Build `/auth/logout` action
  - Create `scripts/auth/ims.js` for frontend
  - Create `scripts/auth/session.js` for session management
  - Build `login-button` block

- [ ] **Task 1.5**: Build auth middleware
  - JWT token validation
  - Employee detection via IMS Org ID
  - Session expiry handling

- [ ] **Task 1.6**: Import registration data
  - Build import script for registration CSV/Excel
  - Create companies from unique domains
  - Create users with role mapping (placeholder until field selected)

- [ ] **Task 1.7**: Create basic portal page structure
  - Landing page with login
  - Portal layout with header
  - Protected route guard (`scripts/auth/guard.js`)

### Phase 2: Content & Personalization (Week 3-4)

- [ ] **Task 2.1**: Integrate Production Agent
  - Build API client for Production Agent
  - Create `content-block` block
  - Define content block types and contexts

- [ ] **Task 2.2**: Implement role switching
  - Build `role-switcher` block
  - Implement `PATCH /users/me/role` action
  - Persist selected role in session
  - Track role_switch activity

- [ ] **Task 2.3**: Build document management (read)
  - Create `document-card` block
  - Create `document-list` block
  - Implement `GET /companies/:id/documents` action
  - Add role-based document filtering

- [ ] **Task 2.4**: Build document upload (employee)
  - Set up Azure Blob Storage
  - Build `document-uploader` block
  - Implement `POST /companies/:id/documents` action
  - Implement `DELETE /companies/:id/documents/:id` action

### Phase 3: Activity Tracking (Week 5-6)

- [ ] **Task 3.1**: Implement click tracking
  - Build `scripts/tracking/tracker.js`
  - Build `scripts/tracking/queue.js` for offline resilience
  - Create `POST /activities` action
  - Auto-track: page_view, document_view, link_click

- [ ] **Task 3.2**: Build user activity feed
  - Create `activity-feed` block
  - Implement `GET /users/me/activities` action
  - Add activity type icons and formatting
  - Implement pagination

- [ ] **Task 3.3**: Implement MCP integration
  - Create `POST /mcp/activities` action
  - Create `POST /mcp/documents` action
  - Build rate limiting middleware
  - Add API key management
  - Build company/user lookup by domain/email

- [ ] **Task 3.4**: Build employee activity view
  - Create `activity-table` block with sorting/filtering
  - Implement `GET /companies/:id/activities` action

### Phase 4: Employee Dashboard & Invitations (Week 7)

- [ ] **Task 4.1**: Build company search
  - Create `company-search` block with autocomplete
  - Implement `GET /companies/search` action

- [ ] **Task 4.2**: Build company detail view
  - Create `company-detail` block with tabs
  - Show users, activities, documents, notes
  - Add engagement stats

- [ ] **Task 4.3**: Implement notes feature
  - Create `note-editor` block
  - Implement notes CRUD actions

- [ ] **Task 4.4**: Build invitation system
  - Create `invite-form` block
  - Implement `POST /users/invite` action
  - Integrate with email service
  - Handle invitation acceptance flow

- [ ] **Task 4.5**: Build employee dashboard
  - Create `employee-dashboard` block
  - Company list with engagement metrics
  - Quick actions

### Phase 5: Testing & Polish (Week 8)

- [ ] **Task 5.1**: Write API integration tests
  - Auth flow tests
  - CRUD operation tests
  - MCP endpoint tests
  - Error handling tests

- [ ] **Task 5.2**: Write block unit tests
  - Component rendering tests
  - User interaction tests

- [ ] **Task 5.3**: E2E tests for critical flows
  - Login → view portal → track activity
  - Employee: search company → upload document
  - MCP: push badge scan → verify in feed

- [ ] **Task 5.4**: Mobile responsiveness QA
  - Test all blocks on mobile viewports
  - Touch interaction testing

- [ ] **Task 5.5**: GDPR compliance
  - Cookie consent implementation
  - Privacy policy integration
  - Data residency configuration (EU PostgreSQL if needed)

- [ ] **Task 5.6**: Performance optimization
  - Lazy loading for documents and activity feed
  - API response caching
  - Image optimization

- [ ] **Task 5.7**: Seed production data
  - Final registration data import
  - Role mapping configuration
  - Create all company portals

---

## Environment Variables

### AEM.now (EDS)

```javascript
// scripts/config.js
export default {
  API_BASE_URL: 'https://runtime.adobe.io/api/v1/web/summit-portal',
  IMS_CLIENT_ID: 'your-ims-client-id',
  IMS_SCOPE: 'openid,AdobeID,read_organizations',
  IMS_AUTH_URL: 'https://ims-na1.adobelogin.com/ims/authorize/v2',
  ADOBE_ORG_ID: 'adobe-ims-org-id',  // For employee detection
};
```

### Adobe I/O Runtime

```bash
# .env

# Database
DATABASE_URL="postgresql://user:password@host:5432/summit_portal"

# Adobe IMS
IMS_CLIENT_ID="your-client-id"
IMS_CLIENT_SECRET="your-client-secret"
IMS_TOKEN_URL="https://ims-na1.adobelogin.com/ims/token/v3"
ADOBE_ORG_ID="adobe-ims-org-id"

# Production Agent
PRODUCTION_AGENT_API_URL="https://experience.adobe.com/api/production-agent"
PRODUCTION_AGENT_API_KEY="your-api-key"

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING="..."
AZURE_STORAGE_CONTAINER="summit-portal-documents"

# Session
JWT_SECRET="your-jwt-secret"
SESSION_EXPIRY_HOURS=24

# MCP
MCP_RATE_LIMIT_PER_MINUTE=100
MCP_RATE_LIMIT_PER_DAY=10000
```

---

## Acceptance Criteria

### Authentication
- [ ] Users can log in with Adobe ID
- [ ] Users are automatically associated with their company based on email domain
- [ ] Users see their detected role on first login
- [ ] Session persists across page refreshes (24h expiry)
- [ ] Users can log out and session is invalidated
- [ ] Adobe employees (matching IMS Org ID) get employee access

### Portal
- [ ] Portal displays personalized content based on role
- [ ] Users can switch roles and see content change immediately
- [ ] Role switch is tracked as activity
- [ ] Documents are filtered by user's current role
- [ ] Portal is fully functional on mobile devices (responsive)

### Activity Tracking
- [ ] All clicks on links/documents are tracked with metadata
- [ ] Badge scans (via MCP) appear in user's activity feed within 30 seconds
- [ ] Activity feed shows chronological list with icons by type
- [ ] Activity feed supports pagination (load more)
- [ ] Offline activities are queued and synced when online
- [ ] Employees can see all activity for a company with filters

### Documents
- [ ] Employees can upload PDFs and other file types
- [ ] Employees can set which roles can view each document
- [ ] Users can view and download documents
- [ ] Document views and downloads are tracked
- [ ] Employees can delete documents they uploaded

### Invitations
- [ ] Users can invite colleagues by email
- [ ] Invitees receive email with portal link
- [ ] Invitees can join company portal after Adobe ID auth
- [ ] Duplicate invitations are prevented

### Employee Dashboard
- [ ] Employees can search companies by name (autocomplete)
- [ ] Employees can view all users in a company
- [ ] Employees can see aggregated engagement stats
- [ ] Employees can add/edit/delete notes on company portals

### MCP Integration
- [ ] External systems can push activities via API
- [ ] External systems can push documents via API
- [ ] Invalid API keys are rejected with 401
- [ ] Rate limiting enforced (100/min, 10k/day)
- [ ] Activities/documents are correctly associated with companies/users

### Error Handling
- [ ] All API errors return consistent format with code and message
- [ ] Frontend gracefully handles API errors with user-friendly messages
- [ ] Network failures are handled with retry logic

---

## User Stories with Acceptance Criteria

### US-001: Login with Adobe ID

**As a** Summit attendee
**I want to** log in with my Adobe ID
**So that** I can access my company's personalized portal without creating a new account

**Acceptance Criteria:**
- Given I am on the landing page
- When I click "Log in with Adobe ID"
- Then I am redirected to Adobe IMS login
- And after successful authentication, I am redirected to my company's portal
- And I see my name and company in the header
- And my detected role is displayed

### US-002: View Personalized Content

**As a** Summit attendee
**I want to** see personalized content based on my role
**So that** I receive relevant insights without information overload

**Acceptance Criteria:**
- Given I am logged in as an "executive" role
- When I view the portal
- Then I see content blocks tailored for executives
- And the content references my company name and industry
- And I do not see technical implementation details meant for practitioners

### US-003: Switch Role View

**As a** Summit attendee
**I want to** switch my role view
**So that** I can explore how different personas would experience the content

**Acceptance Criteria:**
- Given I am logged in with role "executive"
- When I click the role switcher dropdown
- Then I see options: Executive, Technical, Practitioner
- When I select "Technical"
- Then the content blocks refresh with technical content
- And a "role_switch" activity is recorded
- And my selected role persists on page refresh

### US-004: View Activity Tracker

**As a** Summit attendee
**I want to** see my activity tracker
**So that** I can remember what I explored during Summit

**Acceptance Criteria:**
- Given I have badge scans and document views
- When I navigate to the Activity page
- Then I see a chronological feed of my activities
- And each activity shows an icon, description, and timestamp
- And badge scans show booth name and time
- And I can load more activities (pagination)

### US-005: Access Documents

**As a** Summit attendee
**I want to** access uploaded documents and reports
**So that** I can follow up on discussions with my Adobe account team

**Acceptance Criteria:**
- Given my company has documents uploaded
- When I navigate to Documents page
- Then I see only documents visible to my current role
- When I click a document
- Then I can view/download it
- And a "document_view" or "document_download" activity is recorded

### US-006: Invite Colleagues

**As a** Summit attendee
**I want to** invite colleagues to my company's portal
**So that** my team can access the same resources

**Acceptance Criteria:**
- Given I am logged in
- When I navigate to Invite page
- And enter a colleague's email
- And click Send Invitation
- Then the invitation is created with "pending" status
- And an email is sent to the colleague
- When the colleague clicks the link and logs in
- Then they are added to my company's portal

### US-007: Search Companies (Employee)

**As an** Adobe employee
**I want to** search for a company and view their portal
**So that** I can prepare for customer meetings

**Acceptance Criteria:**
- Given I am logged in as an Adobe employee
- When I navigate to Employee Dashboard
- And type a company name in the search box
- Then I see matching companies with autocomplete
- When I select a company
- Then I see the company detail view with users, activities, documents, notes

### US-008: Upload Documents (Employee)

**As an** Adobe employee
**I want to** upload documents to a company's portal
**So that** customers have access to relevant collaterals

**Acceptance Criteria:**
- Given I am viewing a company's detail page
- When I drag-drop a PDF onto the upload area
- And enter a title and select visible roles
- And click Upload
- Then the document is uploaded to storage
- And appears in the company's document list
- And a "document_uploaded" activity is recorded

### US-009: View Company Activity (Employee)

**As an** Adobe employee
**I want to** see a company's activity feed
**So that** I can understand their engagement level

**Acceptance Criteria:**
- Given I am viewing a company's detail page
- When I click the Activities tab
- Then I see all activities for that company's users
- And I can filter by activity type
- And I can filter by specific user
- And I see aggregated stats (total logins, active users, docs viewed)

### US-010: Push Badge Scan (MCP)

**As an** external badge scanning system
**I want to** push badge scan events via MCP
**So that** customer interactions are automatically logged

**Acceptance Criteria:**
- Given I have a valid MCP API key
- When I POST to /mcp/activities with badge_scan type
- And include userEmail and booth metadata
- Then an activity is created for the matched user
- And the activity appears in the user's feed within 30 seconds
- If the API key is invalid, I receive a 401 error
- If I exceed rate limits, I receive a 429 error

---

## Notes for Implementation

1. **Pure AEM.now**: All frontend code lives in EDS blocks/scripts. No React/Next.js. Use vanilla JavaScript modules.

2. **Adobe I/O Runtime**: All API logic runs as serverless actions. Stateless. Use Prisma for database access.

3. **Employee Detection**: Compare `user.imsOrgId === ADOBE_ORG_ID` constant. Set during auth callback.

4. **Role Mapping**: Import script should accept configuration for which registration field maps to role. Placeholder until you decide.

5. **Mobile-first**: Design blocks mobile-first. Summit attendees will primarily access on phones.

6. **Offline Resilience**: Queue activities in localStorage if offline, sync when connection returns via `scripts/tracking/queue.js`.

7. **Performance**: Target < 2s initial load, < 500ms for interactions. Use optimistic UI updates.

8. **GDPR**: Store EU user data in EU region if required. Implement cookie consent before tracking.
