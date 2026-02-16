📝 Real-Time Collaborative Document Editor

A full-stack real-time collaborative document system where multiple authenticated users can edit the same document simultaneously with live synchronization and presence tracking.

Built using React, TypeScript, Node.js, Socket.IO, and MongoDB.
Deployed with Vercel (frontend) and Render (backend).

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=flat&logo=socket.io&badgeColor=010101)

🚀 Live Demo

Frontend: https://collaborative-docs-two.vercel.app

Backend API: https://collaborative-docs-6yyb.onrender.com

🧠 System Overview

This project implements a room-based real-time collaboration architecture:

Users authenticate using JWT

Tokens are verified inside Socket.IO events

Each document maps to a dedicated WebSocket room

Edits are broadcast only to users in the same room

Active users are tracked per document session

Changes persist to MongoDB with auto-save logic

The system supports concurrent multi-user editing and handles reconnections without crashing on refresh.

✨ Core Features
🔄 Real-Time Collaboration

Multiple users edit the same document simultaneously

Instant synchronization using WebSocket rooms

Efficient change propagation scoped per document

🔐 Secure Authentication

JWT-based authentication

bcrypt password hashing

Protected REST endpoints

Token validation inside socket events

👥 Presence Tracking

Displays active users in a document

Join/leave events broadcast in real time

🔗 Shareable Links

Unique document links

Login required before editing

Owner-based access validation

💾 Auto Save

Changes persist to MongoDB

Document state restored on refresh

📝 Rich Text Editing

Powered by Quill.js

Supports formatting, lists, colors, images

Uses Delta format for content structure

🏗️ Architecture
Frontend

React + TypeScript

Vite

Socket.IO Client

Quill.js

React Router

Backend

Node.js + Express

TypeScript

Socket.IO

MongoDB + Mongoose

JWT Authentication

Real-Time Flow

User logs in → receives JWT

User opens document → joins document-specific socket room

Edits emit send-changes event

Server broadcasts document-change to room members

Changes are persisted to MongoDB

Active users list updates dynamically

📚 API Endpoints
Method	Endpoint	Description
POST	/api/auth/register	Register new user
POST	/api/auth/login	Login user
GET	/api/auth/me	Get current user
POST	/api/documents	Create document
GET	/api/documents	Get user documents
GET	/api/documents/link/:link	Get document by link
PUT	/api/documents/:id	Update document
DELETE	/api/documents/:id	Delete document


📦 Installation
Prerequisites

Node.js 18+

MongoDB 6+

Setup
# Clone repository
git clone https://github.com/yourusername/collaborative-docs.git
cd collaborative-docs

Backend
cd backend
npm install
cp .env.example .env
# Add MongoDB URI and JWT secret
npm run dev

Frontend
cd frontend
npm install
npm run dev
