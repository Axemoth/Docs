export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Document {
  id: string;
  title: string;
  content: string; // Stores the rich-text HTML content of the document
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Share {
  id: string;
  documentId: string;
  userId: string;
  accessLevel: 'read' | 'write';
}
