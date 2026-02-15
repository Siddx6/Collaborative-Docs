# 📝 Collaborative Document Editor

A production-ready, real-time collaborative document editing application built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.io for WebSocket communication.

## 🌟 Features

### Core Functionality
- **Real-time Collaboration**: Multiple users can edit documents simultaneously with instant synchronization
- **JWT Authentication**: Secure user authentication and authorization
- **Rich Text Editing**: Powered by Quill.js with full formatting capabilities
- **Document Management**: Create, read, update, and delete documents
- **Shareable Links**: Generate unique links for each document
- **Active Users**: See who's currently editing the document
- **Auto-save**: Document changes are automatically saved to the database
- **Protected Routes**: Only authenticated users can access documents

### Technical Highlights
- **TypeScript**: Full type safety on both frontend and backend
- **WebSocket Rooms**: Efficient room-based architecture for document collaboration
- **Delta Updates**: Optimized change propagation (full document updates in this version)
- **Modular Architecture**: Clean separation of concerns with MVC pattern
- **Error Handling**: Comprehensive error handling and validation
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🏗️ Architecture

### Backend Structure
```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # MongoDB connection
│   ├── controllers/
│   │   ├── authController.ts    # Authentication logic
│   │   └── documentController.ts # Document CRUD operations
│   ├── middleware/
│   │   ├── auth.ts              # JWT verification
│   │   └── errorHandler.ts      # Global error handling
│   ├── models/
│   │   ├── User.ts              # User schema
│   │   └── Document.ts          # Document schema
│   ├── routes/
│   │   ├── authRoutes.ts        # Auth endpoints
│   │   └── documentRoutes.ts    # Document endpoints
│   ├── socket/
│   │   └── socketHandler.ts     # WebSocket logic
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── utils/
│   │   └── jwt.ts               # JWT utilities
│   └── server.ts                # Application entry point
├── package.json
└── tsconfig.json
```

### Frontend Structure
```
frontend/
├── src/
│   ├── api/
│   │   └── client.ts            # Axios instance with interceptors
│   ├── components/
│   │   ├── Login.tsx            # Login page
│   │   ├── Register.tsx         # Registration page
│   │   ├── Dashboard.tsx        # Document list
│   │   ├── Editor.tsx           # Collaborative editor
│   │   └── ProtectedRoute.tsx   # Route guard
│   ├── context/
│   │   ├── AuthContext.tsx      # Authentication state
│   │   └── SocketContext.tsx    # WebSocket connection
│   ├── styles/
│   │   ├── global.css           # Global styles
│   │   ├── Auth.css             # Auth pages styles
│   │   ├── Dashboard.css        # Dashboard styles
│   │   └── Editor.css           # Editor styles
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── App.tsx                  # Root component
│   └── main.tsx                 # Application entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd collaborative-docs
```

2. **Backend Setup**
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Start the backend
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install

# Create .env file
cp .env.example .env
# Edit .env if needed (defaults should work)

# Start the frontend
npm run dev
```

4. **MongoDB Setup**
Make sure MongoDB is running on your system:
```bash
# Linux/macOS
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in backend/.env
```

### Environment Variables

**Backend (.env)**
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/collaborative-docs
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## 📚 API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "johnie",
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "message": "User registered successfully",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "username": "johnie",
    "email": "john@example.com"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: Same as register
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>

Response:
{
  "user": {
    "id": "user-id",
    "username": "johnie",
    "email": "john@example.com"
  }
}
```

### Document Endpoints

#### Create Document
```http
POST /api/documents
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My Document"
}

Response:
{
  "message": "Document created successfully",
  "document": {
    "id": "doc-id",
    "title": "My Document",
    "shareableLink": "abc123xyz",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Get User Documents
```http
GET /api/documents
Authorization: Bearer <token>

Response:
{
  "documents": [...]
}
```

#### Get Document by Link
```http
GET /api/documents/link/:shareableLink
Authorization: Bearer <token>

Response:
{
  "document": {
    "id": "doc-id",
    "title": "Document Title",
    "content": { "ops": [...] },
    "shareableLink": "abc123xyz",
    "owner": {...},
    "isOwner": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### Update Document
```http
PUT /api/documents/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "content": { "ops": [...] }
}
```

#### Delete Document
```http
DELETE /api/documents/:id
Authorization: Bearer <token>
```

### WebSocket Events

#### Client → Server

**join-document**
```typescript
socket.emit('join-document', {
  documentId: 'doc-id',
  token: 'jwt-token'
});
```

**send-changes**
```typescript
socket.emit('send-changes', deltaObject);
```

**leave-document**
```typescript
socket.emit('leave-document');
```

#### Server → Client

**document-change**
```typescript
socket.on('document-change', (delta, userId) => {
  // Apply changes to editor
});
```

**user-joined**
```typescript
socket.on('user-joined', (user) => {
  // Update active users list
});
```

**user-left**
```typescript
socket.on('user-left', (socketId) => {
  // Remove user from active users
});
```

**active-users**
```typescript
socket.on('active-users', (users) => {
  // Display all active users
});
```

**error**
```typescript
socket.on('error', (message) => {
  // Handle error
});
```

## 🎨 Design Decisions

### Why Quill.js?
- **Delta Format**: Efficient change tracking and synchronization
- **Rich Features**: Comprehensive text formatting out of the box
- **Extensible**: Easy to customize and extend
- **Battle-tested**: Used by many production applications

### Why Socket.io?
- **Room Support**: Built-in support for document rooms
- **Fallback Options**: Automatically falls back to polling if WebSocket fails
- **TypeScript Support**: Excellent TypeScript integration
- **Reconnection**: Automatic reconnection handling

### Authentication Strategy
- **JWT**: Stateless authentication, perfect for distributed systems
- **localStorage**: Client-side token storage for persistence
- **HTTP-only cookies**: Consider for production (more secure)

### Database Design
- **MongoDB**: Flexible schema for document content (Quill Delta)
- **Indexed Fields**: Optimized queries for shareableLink and owner
- **Embedded vs Referenced**: Owner and collaborators are referenced for normalization

## 🔒 Security Considerations

### Current Implementation
- JWT authentication on all protected routes
- Password hashing with bcrypt
- CORS configuration
- Input validation on API endpoints

### Production Recommendations
1. **Use HTTPS**: Always use TLS/SSL in production
2. **HTTP-only Cookies**: Store JWT in HTTP-only cookies instead of localStorage
3. **Rate Limiting**: Implement rate limiting on authentication endpoints
4. **CSRF Protection**: Add CSRF tokens for state-changing operations
5. **Environment Secrets**: Use proper secret management (AWS Secrets Manager, etc.)
6. **Content Security Policy**: Implement CSP headers
7. **Sanitize Input**: Add additional input sanitization for document content
8. **WebSocket Authentication**: Validate JWT on every socket event (currently only on join)

## 🚢 Deployment

### Backend Deployment (Example: Railway/Render)
1. Push code to Git repository
2. Connect repository to deployment platform
3. Set environment variables
4. Configure MongoDB connection (MongoDB Atlas recommended)
5. Deploy!

### Frontend Deployment (Example: Vercel/Netlify)
1. Push code to Git repository
2. Connect repository to deployment platform
3. Set build command: `npm run build`
4. Set output directory: `dist`
5. Configure environment variables
6. Deploy!

### Docker Deployment
```dockerfile
# Backend Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["node", "dist/server.js"]
```

## 📈 Performance Optimizations

### Implemented
- Connection pooling for MongoDB
- Efficient WebSocket room management
- Client-side debouncing for API calls
- Lazy loading of document content

### Future Improvements
1. **Operational Transformation**: Implement OT algorithm for conflict resolution
2. **Delta Synchronization**: Send only changes instead of full content
3. **Redis for Scaling**: Use Redis for WebSocket room management across instances
4. **CDN**: Serve static assets from CDN
5. **Code Splitting**: Implement route-based code splitting
6. **Service Workers**: Add offline support with service workers
7. **Database Indexing**: Add compound indexes for complex queries
8. **Caching**: Implement Redis caching for frequently accessed documents

## 🧪 Testing

### Recommended Testing Strategy
```bash
# Backend
- Unit tests: Jest + Supertest
- Integration tests: MongoDB Memory Server
- E2E tests: Cypress

# Frontend
- Unit tests: Vitest + React Testing Library
- Integration tests: MSW for API mocking
- E2E tests: Playwright
```

## 🤝 Contributing

This is a portfolio/learning project. Feel free to fork and modify for your own use!

## 📝 License

MIT License - feel free to use this project for learning or portfolio purposes.

## 🎓 Learning Resources

- [Socket.io Documentation](https://socket.io/docs/)
- [Quill.js Documentation](https://quilljs.com/docs/)
- [MongoDB Best Practices](https://www.mongodb.com/docs/manual/administration/production-notes/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## 🏆 Resume Highlights

When showcasing this project on your resume:

**Key Achievements:**
- Built a production-ready real-time collaborative editor with WebSocket technology
- Implemented JWT-based authentication and role-based access control
- Designed scalable backend architecture with modular MVC pattern
- Achieved type-safe development with TypeScript on both frontend and backend
- Integrated third-party libraries (Quill.js, Socket.io) for enhanced functionality
- Implemented responsive UI with modern CSS and React best practices

**Technologies:**
- **Frontend**: React, TypeScript, Socket.io-client, Quill.js, React Router
- **Backend**: Node.js, Express, TypeScript, Socket.io, JWT
- **Database**: MongoDB, Mongoose
- **Tools**: Vite, Git, npm

---

Built with ❤️ for learning and portfolio purposes