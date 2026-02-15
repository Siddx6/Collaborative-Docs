import { Request } from 'express';
import { Document, Types } from 'mongoose';

// User interfaces
export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Document interfaces
export interface IDocument extends Document {
  _id: Types.ObjectId;
  title: string;
  content: any; // Quill Delta format
  owner: Types.ObjectId;
  shareableLink: string;
  collaborators: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// Extended Request with user
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

// Socket user data
export interface SocketUser {
  userId: string;
  username: string;
  email: string;
  socketId: string;
}

// Document room data
export interface DocumentRoom {
  documentId: string;
  users: Map<string, SocketUser>; // socketId -> SocketUser
}

// Socket events
export interface ServerToClientEvents {
  'document-change': (delta: any, userId: string) => void;
  'user-joined': (user: SocketUser) => void;
  'user-left': (socketId: string) => void;
  'active-users': (users: SocketUser[]) => void;
  'error': (message: string) => void;
}

export interface ClientToServerEvents {
  'join-document': (data: { documentId: string; token: string }) => void;
  'send-changes': (delta: any) => void;
  'leave-document': () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId?: string;
  username?: string;
  email?: string;
  currentDocumentId?: string;
}