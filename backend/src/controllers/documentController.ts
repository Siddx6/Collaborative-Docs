import { Response } from 'express';
import { Document } from '../models/Document';
import { AuthRequest } from '../types';
import { Types } from 'mongoose';

export const createDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { title } = req.body;

    const document = await Document.create({
      title: title || 'Untitled Document',
      owner: new Types.ObjectId(req.user.userId),
      content: { ops: [] },
      collaborators: [],
    });

    res.status(201).json({
      message: 'Document created successfully',
      document: {
        id: document._id,
        title: document.title,
        shareableLink: document.shareableLink,
        createdAt: document.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Create document error:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
};

export const getUserDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const documents = await Document.find({
      $or: [
        { owner: new Types.ObjectId(req.user.userId) },
        { collaborators: new Types.ObjectId(req.user.userId) },
      ],
    })
      .sort({ updatedAt: -1 })
      .select('title shareableLink owner createdAt updatedAt')
      .populate('owner', 'username email');

    // Map documents to include id field
    const documentsWithId = documents.map(doc => ({
      id: doc._id,
      title: doc.title,
      shareableLink: doc.shareableLink,
      owner: doc.owner,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    res.status(200).json({ documents: documentsWithId });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

export const getDocumentByLink = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { shareableLink } = req.params;

    const document = await Document.findOne({ shareableLink })
      .populate('owner', 'username email')
      .populate('collaborators', 'username email');

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Add user to collaborators if not already there and not the owner
    const userId = new Types.ObjectId(req.user.userId);
    const isOwner = document.owner._id.equals(userId);
    const isCollaborator = document.collaborators.some((c: any) => c._id.equals(userId));

    if (!isOwner && !isCollaborator) {
      document.collaborators.push(userId);
      await document.save();
    }

    res.status(200).json({
      document: {
        id: document._id,
        title: document.title,
        content: document.content,
        shareableLink: document.shareableLink,
        owner: document.owner,
        isOwner,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};

export const updateDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { title, content } = req.body;

    const document = await Document.findById(id);

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Check if user has access
    const userId = new Types.ObjectId(req.user.userId);
    const hasAccess =
      document.owner.equals(userId) ||
      document.collaborators.some((c) => c.equals(userId));

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    if (title !== undefined) document.title = title;
    if (content !== undefined) document.content = content;

    await document.save();

    res.status(200).json({
      message: 'Document updated successfully',
      document: {
        id: document._id,
        title: document.title,
        updatedAt: document.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const document = await Document.findById(id);

    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    // Only owner can delete
    if (!document.owner.equals(new Types.ObjectId(req.user.userId))) {
      res.status(403).json({ error: 'Only the owner can delete this document' });
      return;
    }

    await document.deleteOne();

    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
};