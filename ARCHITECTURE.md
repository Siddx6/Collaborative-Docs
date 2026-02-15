# System Architecture

## Overview

This document details the architecture of the Collaborative Document Editor, explaining design decisions, data flow, and system components.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │   React    │  │  Socket.io │  │   Quill Editor       │  │
│  │   Router   │  │   Client   │  │   (Rich Text)        │  │
│  └────────────┘  └────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Server Layer                          │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │  Express   │  │  Socket.io │  │   JWT Auth           │  │
│  │   Server   │  │   Server   │  │   Middleware         │  │
│  └────────────┘  └────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Mongoose ODM
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
│                       MongoDB                                │
│    ┌──────────────┐         ┌─────────────────────┐        │
│    │    Users     │         │     Documents       │        │
│    │  Collection  │         │     Collection      │        │
│    └──────────────┘         └─────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### Frontend Architecture

#### 1. Component Hierarchy
```
App
├── AuthProvider (Context)
│   └── SocketProvider (Context)
│       └── BrowserRouter
│           ├── Login
│           ├── Register
│           ├── Dashboard (Protected)
│           └── Editor (Protected)
```

#### 2. State Management

**Authentication State (AuthContext)**
- User information
- JWT token
- Login/logout methods
- Registration method

**Socket State (SocketContext)**
- WebSocket connection
- Active users list
- Document room management
- Real-time event handlers

**Local State (Component-level)**
- Form inputs
- Loading states
- Error messages
- Document content

#### 3. Data Flow

**Authentication Flow:**
```
User Input → Login/Register Component
          → AuthContext.login/register()
          → API Call (POST /api/auth/...)
          → Receive JWT token
          → Store in localStorage
          → Update AuthContext state
          → Redirect to Dashboard
```

**Document Loading Flow:**
```
User navigates to /document/:link
          → Editor Component mounts
          → Fetch document (GET /api/documents/link/:link)
          → Load content into Quill
          → Join Socket.io room
          → Emit 'join-document'
          → Receive 'active-users'
          → Enable editor
```

**Real-time Collaboration Flow:**
```
User types in Editor
          → Quill 'text-change' event
          → Extract delta/content
          → Emit 'send-changes' via Socket
          → Server receives in document room
          → Broadcast to other users
          → Other users receive 'document-change'
          → Update their Quill instance
          → Save to database
```

### Backend Architecture

#### 1. Layered Architecture

```
┌─────────────────────────────────────────┐
│         Routes Layer                    │
│  (HTTP endpoint definitions)            │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      Middleware Layer                   │
│  (Auth, Validation, Error Handling)     │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      Controllers Layer                  │
│  (Business logic)                       │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Models Layer                    │
│  (Data schemas and methods)             │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│        Database                         │
│  (MongoDB)                              │
└─────────────────────────────────────────┘
```

#### 2. Socket.io Architecture

**Room-Based Communication:**
```
Document Room: doc-id-123
├── User 1 (socketId: abc)
├── User 2 (socketId: def)
└── User 3 (socketId: ghi)

Events:
- join-document → User joins room
- send-changes → Broadcast to room
- leave-document → User leaves room
- disconnect → Auto-cleanup
```

**Event Flow:**
```
Client A                Server              Client B
   │                      │                    │
   ├─join-document────────>│                   │
   │                      │─────active-users───>
   │                      │                    │
   │◄────active-users─────┤                    │
   │                      │                    │
   ├─send-changes─────────>│                   │
   │                      │──document-change──>│
   │                      │                    │
   │                      │<──send-changes─────┤
   │<──document-change────┤                    │
```

### Database Schema

#### User Collection
```javascript
{
  _id: ObjectId,
  username: String (unique, indexed),
  email: String (unique, indexed),
  password: String (bcrypt hashed),
  createdAt: Date,
  updatedAt: Date
}
```

#### Document Collection
```javascript
{
  _id: ObjectId,
  title: String,
  content: Mixed (Quill Delta format),
  owner: ObjectId (ref: 'User', indexed),
  shareableLink: String (unique, indexed),
  collaborators: [ObjectId] (ref: 'User'),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `owner + createdAt` (compound, for user's documents query)
- `shareableLink` (unique, for fast document lookup)

## Security Architecture

### Authentication & Authorization

**JWT Flow:**
```
1. User logs in
2. Server validates credentials
3. Server generates JWT with:
   - userId
   - email
   - expiration (7 days)
4. Client stores in localStorage
5. Client includes in Authorization header
6. Server validates on each request
```

**Protected Routes:**
- All `/api/documents/*` endpoints require valid JWT
- WebSocket connection validates JWT on join-document

### Data Protection

**Password Security:**
- Bcrypt hashing with 10 salt rounds
- Passwords never returned in API responses
- Select: false on password field in schema

**CORS Configuration:**
- Whitelist only frontend origin
- Credentials enabled for cookies (future)

**Input Validation:**
- Mongoose schema validation
- Express-validator on API endpoints
- Client-side form validation

## Scalability Considerations

### Current Limitations

1. **Single Server**: All WebSocket connections to one server
2. **In-Memory Rooms**: Room data lost on server restart
3. **Full Document Sync**: Sends entire document on change
4. **No Conflict Resolution**: Last write wins

### Scaling Solutions

#### Horizontal Scaling (Multiple Servers)
```
                Load Balancer
                     │
         ┌───────────┼───────────┐
         │           │           │
    Server 1    Server 2    Server 3
         │           │           │
         └───────────┼───────────┘
                     │
              Redis Adapter
                     │
              Shared State
```

**Implementation:**
- Use Redis adapter for Socket.io
- Sticky sessions for WebSocket connections
- Shared session store (Redis)
- Centralized room management

#### Database Scaling
```
MongoDB Replica Set
├── Primary (Read/Write)
├── Secondary (Read)
└── Secondary (Read)

Read preference: secondary
Write concern: majority
```

#### Operational Transformation (OT)
- Implement conflict resolution algorithm
- Send only deltas instead of full content
- Handle concurrent edits correctly

#### Caching Strategy
```
Redis Cache
├── User sessions
├── Frequently accessed documents
├── Active room states
└── Document metadata
```

## Performance Optimizations

### Frontend Optimizations

1. **Code Splitting**
   - Route-based splitting
   - Lazy loading of components

2. **Debouncing**
   - Save operations
   - Search inputs
   - Resize handlers

3. **Memoization**
   - React.memo for expensive components
   - useMemo for complex calculations

4. **Virtual Scrolling**
   - For large document lists
   - For long documents

### Backend Optimizations

1. **Database Queries**
   - Proper indexing
   - Projection (select only needed fields)
   - Pagination for lists

2. **Connection Pooling**
   - MongoDB connection pool
   - Reuse HTTP clients

3. **Compression**
   - Gzip/Brotli compression
   - Minimize payload size

4. **Caching**
   - ETag headers
   - Cache-Control headers
   - Redis caching layer

## Monitoring & Logging

### Recommended Tools

**Application Monitoring:**
- New Relic / DataDog
- Application performance metrics
- Error tracking

**Logging:**
- Winston / Pino (structured logging)
- Log aggregation (ELK stack)
- Log levels (error, warn, info, debug)

**Infrastructure:**
- Server metrics (CPU, Memory, Disk)
- MongoDB metrics
- WebSocket connection metrics

### Key Metrics to Track

1. **Performance**
   - API response times
   - WebSocket latency
   - Database query times

2. **Reliability**
   - Error rates
   - Uptime
   - Failed requests

3. **Usage**
   - Active users
   - Documents created
   - Concurrent connections

## Deployment Architecture

### Production Setup

```
┌──────────────────────────────────────────┐
│         CDN (CloudFlare)                 │
│    (Static assets, images)               │
└──────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────┐
│    Frontend (Vercel/Netlify)             │
│         React SPA                        │
└──────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────┐
│    API Gateway / Load Balancer           │
│         (SSL Termination)                │
└──────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────┐
│    Backend Servers (Railway/Render)      │
│    Express + Socket.io                   │
└──────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────┐
│    Database (MongoDB Atlas)              │
│    Replica Set                           │
└──────────────────────────────────────────┘
```

### Environment Separation

- **Development**: Local machine
- **Staging**: Test environment (mirrors production)
- **Production**: Live environment

### CI/CD Pipeline

```
GitHub Push
    │
    ▼
Run Tests (GitHub Actions)
    │
    ├─> Pass ──> Deploy to Staging
    │                    │
    │                    ▼
    │            Manual Approval
    │                    │
    │                    ▼
    │            Deploy to Production
    │
    └─> Fail ──> Notify Developer
```

## Future Enhancements

1. **Conflict Resolution**: Operational Transformation or CRIT
2. **Version History**: Document versioning and rollback
3. **Permissions**: Fine-grained access control
4. **Comments**: Inline comments and discussions
5. **Export**: PDF, DOCX, Markdown export
6. **Templates**: Document templates
7. **Offline Mode**: Service workers for offline editing
8. **Mobile App**: React Native implementation
9. **Video/Audio**: WebRTC for voice/video chat
10. **Analytics**: Usage analytics and insights

---

This architecture is designed to be:
- ✅ Scalable
- ✅ Maintainable
- ✅ Secure
- ✅ Performant
- ✅ Developer-friendly