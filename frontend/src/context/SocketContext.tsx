import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
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

  useEffect(() => {
    // Create socket connection once
    const newSocket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
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
      newSocket.close();
    };
  }, []); // Empty dependency array - only run once!

  const joinDocument = (documentId: string, token: string) => {
    if (socket && !socket.connected) {
      socket.connect();
    }
    socket?.emit('join-document', { documentId, token });
  };

  const leaveDocument = () => {
    socket?.emit('leave-document');
    setActiveUsers([]);
  };

  const sendChanges = (delta: any) => {
    socket?.emit('send-changes', delta);
  };

  const onDocumentChange = (callback: (delta: any, userId: string) => void) => {
    documentChangeCallbackRef.current = callback;
  };

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