import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { Document } from '../types';
import { FileText, Plus, LogOut, Copy, Trash2, ExternalLink, Edit2 } from 'lucide-react';
import '../styles/Dashboard.css';

export const Dashboard = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await api.get('/documents');
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async () => {
    setCreating(true);
    try {
      const response = await api.post('/documents', {
        title: 'Untitled Document',
      });
      const newDoc = response.data.document;
      navigate(`/document/${newDoc.shareableLink}`);
    } catch (error) {
      console.error('Failed to create document:', error);
      alert('Failed to create document');
    } finally {
      setCreating(false);
    }
  };

  const copyLink = (shareableLink: string) => {
    const link = `${window.location.origin}/document/${shareableLink}`;
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };

  const deleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await api.delete(`/documents/${id}`);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete document');
    }
  };

  const openRenameModal = (doc: Document) => {
  console.log('Document object:', doc); // Add this line
  console.log('Document ID:', doc.id); // Add this line
    setCurrentDocument(doc);
    setNewTitle(doc.title);
    setRenameModalOpen(true);
  };

  const closeRenameModal = () => {
    setRenameModalOpen(false);
    setCurrentDocument(null);
    setNewTitle('');
  };

  const saveDocumentName = async () => {
    if (!currentDocument || !newTitle.trim()) return;

    try {
      await api.put(`/documents/${currentDocument.id}`, {
        title: newTitle.trim(),
      });
      
      // Update the document in the list
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === currentDocument.id ? { ...doc, title: newTitle.trim() } : doc
        )
      );
      
      closeRenameModal();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to rename document');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <FileText size={32} className="header-icon" />
            <h1>My Documents</h1>
          </div>
          <div className="header-right">
            <span className="user-name">👤 {user?.username}</span>
            <button onClick={handleLogout} className="btn-secondary">
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="create-section">
          <button onClick={createDocument} disabled={creating} className="btn-create">
            <Plus size={20} />
            {creating ? 'Creating...' : 'New Document'}
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <FileText size={64} className="empty-icon" />
            <h2>No documents yet</h2>
            <p>Create your first document to get started</p>
          </div>
        ) : (
          <div className="documents-grid">
            {documents.map((doc) => (
              <div key={doc.id} className="document-card">
                <div className="document-header">
                  <h3>{doc.title}</h3>
                  <div className="document-actions">
                    <button
                      onClick={() => openRenameModal(doc)}
                      className="icon-btn"
                      title="Rename document"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => navigate(`/document/${doc.shareableLink}`)}
                      className="icon-btn"
                      title="Open document"
                    >
                      <ExternalLink size={18} />
                    </button>
                    <button
                      onClick={() => copyLink(doc.shareableLink)}
                      className="icon-btn"
                      title="Copy link"
                    >
                      <Copy size={18} />
                    </button>
                    {typeof doc.owner === 'object' && doc.owner.id === user?.id && (
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="icon-btn danger"
                        title="Delete document"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="document-meta">
                  <span>Updated {new Date(doc.updatedAt).toLocaleDateString()}</span>
                  {typeof doc.owner === 'object' && (
                    <span className="owner">by {doc.owner.username}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {renameModalOpen && (
        <div className="rename-modal active" onClick={closeRenameModal}>
          <div className="rename-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Rename Document</h3>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveDocumentName();
                if (e.key === 'Escape') closeRenameModal();
              }}
              placeholder="Enter new name"
              autoFocus
            />
            <div className="rename-modal-buttons">
              <button onClick={closeRenameModal} className="cancel-btn">
                Cancel
              </button>
              <button onClick={saveDocumentName} className="save-btn">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};