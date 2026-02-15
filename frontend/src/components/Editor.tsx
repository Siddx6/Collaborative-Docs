import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/client';
import { Document } from '../types';
import { ArrowLeft, Users, Link as LinkIcon, Save } from 'lucide-react';
import '../styles/Editor.css';

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['bold', 'italic', 'underline'],
  [{ color: [] }, { background: [] }],
  [{ script: 'sub' }, { script: 'super' }],
  [{ align: [] }],
  ['image', 'blockquote', 'code-block'],
  ['clean'],
];

export const Editor = () => {
  console.log('=== EDITOR COMPONENT RENDERING ===');
  
  const { shareableLink } = useParams<{ shareableLink: string }>();
  console.log('ShareableLink:', shareableLink);
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const { joinDocument, leaveDocument, sendChanges, onDocumentChange, activeUsers, connected } =
    useSocket();

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const quillRef = useRef<Quill | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const hasJoinedRef = useRef(false);

  // Load document
  useEffect(() => {
    const loadDocument = async () => {
      if (!shareableLink) return;

      try {
        const response = await api.get(`/documents/link/${shareableLink}`);
        setDocument(response.data.document);
      } catch (error) {
        console.error('Failed to load document:', error);
        alert('Document not found');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [shareableLink, navigate]);

  // Initialize Quill - with strict guard
  useEffect(() => {
    // Guard: Don't init if already exists or no container or no document
    if (quillRef.current || !editorRef.current || !document) return;

    // Additional guard: Check if Quill already attached to this element
  if (editorRef.current.classList.contains('ql-container')) {
    console.log('Quill already initialized on this element, skipping...');
    return;
  }

    console.log('Initializing Quill editor...');

    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      modules: {
        toolbar: TOOLBAR_OPTIONS,
      },
      placeholder: 'Start typing...',
    });

    // Set initial content
    if (document.content && document.content.ops) {
      quill.setContents(document.content);
    }

    // Enable and focus
    quill.enable(true);
    quillRef.current = quill;

    // Focus after short delay
    setTimeout(() => {
      if (quillRef.current) {
        quillRef.current.focus();
        quillRef.current.setSelection(0, 0);
        console.log('Editor ready and focused');
      }
    }, 300);

    // Cleanup function
    return () => {
      console.log('Cleaning up Quill editor');
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, [document]); // Only run when document changes

  // Join document room
  useEffect(() => {
    if (!document || !token || hasJoinedRef.current) return;

    console.log('Joining document:', document.id);
    joinDocument(document.id, token);
    hasJoinedRef.current = true;

    return () => {
      console.log('Leaving document');
      leaveDocument();
      hasJoinedRef.current = false;
    };
  }, [document?.id, token]);

  // Handle local changes
  useEffect(() => {
    if (!quillRef.current) return;

    const quill = quillRef.current;

    const handleChange = (_delta: any, _oldDelta: any, source: string) => {
      if (source !== 'user') return;
      sendChanges(quill.getContents());
    };

    quill.on('text-change', handleChange);

    return () => {
      quill.off('text-change', handleChange);
    };
  }, [sendChanges]);

  // Handle remote changes
  useEffect(() => {
    const handleRemoteChange = (delta: any, userId: string) => {
      if (!quillRef.current || userId === user?.id) return;
      quillRef.current.setContents(delta, 'silent');
    };

    onDocumentChange(handleRemoteChange);
  }, [onDocumentChange, user?.id]);

  const handleSave = async () => {
    if (!quillRef.current || !document) return;

    setSaving(true);
    try {
      await api.put(`/documents/${document.id}`, {
        content: quillRef.current.getContents(),
      });
      alert('Document saved!');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return <div className="loading-screen">Loading document...</div>;
  }

  if (!document) {
    return null;
  }

  return (
    <div className="editor-container">
      <header className="editor-header">
        <div className="header-left">
          <button onClick={() => navigate('/dashboard')} className="btn-back">
            <ArrowLeft size={20} />
          </button>
          <h1 className="document-title">{document.title}</h1>
        </div>

        <div className="header-center">
          <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
            <div className="status-dot" />
            {connected ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        <div className="header-right">
          <div className="active-users">
            <Users size={18} />
            <span>{activeUsers.length} online</span>
          </div>
          <button onClick={copyLink} className="btn-secondary" title="Copy shareable link">
            <LinkIcon size={18} />
            Share
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            <Save size={18} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      <div className="editor-wrapper">
        <div ref={editorRef} className="editor-target" />
      </div>

      {activeUsers.length > 0 && (
        <div className="collaborators-panel">
          <h3>Active Collaborators</h3>
          <ul className="collaborators-list">
            {activeUsers.map((u) => (
              <li key={u.socketId} className="collaborator-item">
                <div className="collaborator-avatar">
                  {u.username.charAt(0).toUpperCase()}
                </div>
                <div className="collaborator-info">
                  <div className="collaborator-name">{u.username}</div>
                  <div className="collaborator-status">
                    {u.userId === user?.id ? '(You)' : 'Editing'}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};