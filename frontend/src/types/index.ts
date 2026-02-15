export interface User {
  id: string;
  username: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export interface Document {
  id: string;
  title: string;
  content: any; // Quill Delta
  shareableLink: string;
  owner: User | string;
  isOwner?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveUser {
  userId: string;
  username: string;
  email: string;
  socketId: string;
}