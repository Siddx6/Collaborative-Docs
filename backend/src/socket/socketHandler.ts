import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from '../utils/jwt';
import { Document } from '../models/Document';
import { User } from '../models/User';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  SocketUser,
  DocumentRoom,
} from '../types';

// Store active document rooms
const documentRooms = new Map<string, DocumentRoom>();

export const initializeSocket = (httpServer: HTTPServer): SocketIOServer => {
  const io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Handle document join
    socket.on('join-document', async ({ documentId, token }) => {
      try {
        // Verify token
        const decoded = verifyToken(token);
        
        // Get user details
        const user = await User.findById(decoded.userId);
        if (!user) {
          socket.emit('error', 'User not found');
          return;
        }

        // Verify document access
        const document = await Document.findById(documentId);
        if (!document) {
          socket.emit('error', 'Document not found');
          return;
        }

        // Store user data in socket
        socket.data.userId = decoded.userId;
        socket.data.username = user.username;
        socket.data.email = user.email;
        socket.data.currentDocumentId = documentId;

        // Join the document room
        socket.join(documentId);

        // Initialize room if it doesn't exist
        if (!documentRooms.has(documentId)) {
          documentRooms.set(documentId, {
            documentId,
            users: new Map(),
          });
        }

        const room = documentRooms.get(documentId)!;
        const socketUser: SocketUser = {
          userId: decoded.userId,
          username: user.username,
          email: user.email,
          socketId: socket.id,
        };

        room.users.set(socket.id, socketUser);

        // Notify others that user joined
        socket.to(documentId).emit('user-joined', socketUser);

        // Send active users to the newly joined user
        const activeUsers = Array.from(room.users.values());
        socket.emit('active-users', activeUsers);

        console.log(`👤 User ${user.username} joined document ${documentId}`);
      } catch (error) {
        console.error('Join document error:', error);
        socket.emit('error', 'Failed to join document');
      }
    });

    // Handle document changes
    socket.on('send-changes', async (delta) => {
      try {
        const { currentDocumentId, userId } = socket.data;

        if (!currentDocumentId) {
          socket.emit('error', 'Not in a document room');
          return;
        }

        // Broadcast changes to all other users in the room
        socket.to(currentDocumentId).emit('document-change', delta, userId!);

        // Save to database (debounced in practice, but for simplicity we save directly)
        const document = await Document.findById(currentDocumentId);
        if (document) {
          // In a production app, you'd apply the delta to the existing content
          // For simplicity, we're assuming the client sends the full content
          document.content = delta;
          document.markModified('content');
          await document.save();
        }
      } catch (error) {
        console.error('Send changes error:', error);
        socket.emit('error', 'Failed to send changes');
      }
    });

    // Handle leaving document
    socket.on('leave-document', () => {
      handleUserLeave(socket);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
      handleUserLeave(socket);
    });
  });

  return io;
};

// Helper function to handle user leaving
const handleUserLeave = (socket: Socket) => {
  const { currentDocumentId } = socket.data;

  if (currentDocumentId) {
    const room = documentRooms.get(currentDocumentId);
    if (room) {
      room.users.delete(socket.id);

      // Notify others
      socket.to(currentDocumentId).emit('user-left', socket.id);

      // Clean up empty rooms
      if (room.users.size === 0) {
        documentRooms.delete(currentDocumentId);
        console.log(`🧹 Cleaned up empty room: ${currentDocumentId}`);
      }
    }

    socket.leave(currentDocumentId);
    socket.data.currentDocumentId = undefined;
  }
};