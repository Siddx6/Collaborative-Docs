import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ActiveUser } from '../types';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  activeUsers: ActiveUser[];
  joinDocument: (documentId: string, token: string) => void;
  leaveDocument: () => void;
  sendChanges: (delta: any) => void;
  onDocumentChange: (callback: (delta: any, userId: string) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const documentChangeCallbackRef = useRef<((delta: any, userId: string) => void) | null>(null);
  const currentDocumentIdRef = useRef<string | null>(null); // Track current document to prevent duplicate joins

  useEffect(() => {
    // Create socket connection once
    const newSocket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'], // Add fallback transports
      withCredentials: true, // Important for CORS
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setConnected(false);
      setActiveUsers([]);
    });

    newSocket.on('user-joined', (user: ActiveUser) => {
      console.log('👤 User joined:', user.username);
      setActiveUsers((prev) => {
        // Avoid duplicates
        if (prev.find((u) => u.socketId === user.socketId)) {
          return prev;
        }
        return [...prev, user];
      });
    });

    newSocket.on('user-left', (socketId: string) => {
      console.log('👋 User left:', socketId);
      setActiveUsers((prev) => prev.filter((u) => u.socketId !== socketId));
    });

    newSocket.on('active-users', (users: ActiveUser[]) => {
      console.log('👥 Active users:', users.length);
      setActiveUsers(users);
    });

    newSocket.on('document-change', (delta: any, userId: string) => {
      if (documentChangeCallbackRef.current) {
        documentChangeCallbackRef.current(delta, userId);
      }
    });

    newSocket.on('error', (message: string) => {
      console.error('Socket error:', message);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up socket connection');
      newSocket.close();
    };
  }, []); // Empty dependency array - only run once!

  // Use useCallback to create stable function references
  const joinDocument = useCallback((documentId: string, token: string) => {
    if (!socket) {
      console.warn('⚠️ Socket not initialized');
      return;
    }

    // Prevent joining the same document twice
    if (currentDocumentIdRef.current === documentId) {
      console.log('ℹ️ Already in document:', documentId);
      return;
    }

    if (!socket.connected) {
      console.log('🔌 Connecting socket...');
      socket.connect();
    }

    console.log('📄 Joining document:', documentId);
    currentDocumentIdRef.current = documentId;
    socket.emit('join-document', { documentId, token });
  }, [socket]);

  const leaveDocument = useCallback(() => {
    if (!socket) return;

    console.log('🚪 Leaving document:', currentDocumentIdRef.current);
    socket.emit('leave-document');
    currentDocumentIdRef.current = null;
    setActiveUsers([]);
  }, [socket]);

  const sendChanges = useCallback((delta: any) => {
    if (!socket || !socket.connected) {
      console.warn('⚠️ Socket not connected, cannot send changes');
      return;
    }
    socket.emit('send-changes', delta);
  }, [socket]);

  const onDocumentChange = useCallback((callback: (delta: any, userId: string) => void) => {
    documentChangeCallbackRef.current = callback;
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        activeUsers,
        joinDocument,
        leaveDocument,
        sendChanges,
        onDocumentChange,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};