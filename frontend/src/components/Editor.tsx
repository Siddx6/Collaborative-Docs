import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/client';
import { Document } from '../types';
import { ArrowLeft, Users, Link as LinkIcon, Save, LogIn } from 'lucide-react';
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
  const [requiresAuth, setRequiresAuth] = useState(false);
  const quillRef = useRef<Quill | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Use refs to store functions so they don't cause re-renders
  const sendChangesRef = useRef(sendChanges);
  const onDocumentChangeRef = useRef(onDocumentChange);
  
  // Update refs when functions change
  useEffect(() => {
    sendChangesRef.current = sendChanges;
  }, [sendChanges]);
  
  useEffect(() => {
    onDocumentChangeRef.current = onDocumentChange;
  }, [onDocumentChange]);

  // Load document
  useEffect(() => {
    const loadDocument = async () => {
      if (!shareableLink) return;

      try {
        const response = await api.get(`/documents/link/${shareableLink}`);
        setDocument(response.data.document);
        setRequiresAuth(response.data.document.requiresAuth);
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

  // Initialize Quill
  useEffect(() => {
    if (quillRef.current || !editorRef.current || !document) return;

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
      placeholder: requiresAuth ? 'Please log in to edit...' : 'Start typing...',
    });

    if (document.content && document.content.ops) {
      quill.setContents(document.content);
    }

    if (requiresAuth) {
      quill.enable(false);
    } else {
      quill.enable(true);
      setTimeout(() => {
        if (quillRef.current) {
          quillRef.current.focus();
          quillRef.current.setSelection(0, 0);
          console.log('Editor ready and focused');
        }
      }, 300);
    }

    quillRef.current = quill;

    return () => {
      console.log('Cleaning up Quill editor');
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, [document, requiresAuth]);

  // Join document room
  useEffect(() => {
    if (!document || !token || requiresAuth) {
      console.log('Skipping join: document=', !!document, 'token=', !!token, 'requiresAuth=', requiresAuth);
      return;
    }

    console.log('Joining document:', document.id);
    joinDocument(document.id, token);

    return () => {
      console.log('Leaving document');
      leaveDocument();
    };
  }, [document?.id, token, requiresAuth]);

  // Handle local changes - FIXED: No dependencies that change
  useEffect(() => {
    if (!quillRef.current || requiresAuth) {
      console.log('❌ Cannot setup text-change: quill=', !!quillRef.current, 'requiresAuth=', requiresAuth);
      return;
    }

    const quill = quillRef.current;
    console.log('✅ Setting up text-change handler');

    const handleChange = (_delta: any, _oldDelta: any, source: string) => {
      console.log('📝 Text changed! Source:', source);
      if (source !== 'user') {
        console.log('⏭️ Skipping non-user change');
        return;
      }
      
      const contents = quill.getContents();
      console.log('📤 Sending changes via socket');
      sendChangesRef.current(contents); // Use ref instead of direct function
    };

    quill.on('text-change', handleChange);

    return () => {
      console.log('🧹 Removing text-change handler');
      quill.off('text-change', handleChange);
    };
  }, [requiresAuth]); // Only depend on requiresAuth, nothing else!

  // Handle remote changes - FIXED: Setup once
  useEffect(() => {
    if (requiresAuth) {
      console.log('❌ Skipping document-change handler: requiresAuth=true');
      return;
    }

    console.log('✅ Setting up document-change handler for user:', user?.id);

    const handleRemoteChange = (delta: any, userId: string) => {
      console.log('📥 RECEIVED CHANGE from:', userId);
      
      if (!quillRef.current) {
        console.log('❌ No quill ref');
        return;
      }
      
      if (userId === user?.id) {
        console.log('⏭️ Skipping own change');
        return;
      }
      
      console.log('✅ Applying change to editor');
      quillRef.current.setContents(delta, 'silent');
    };

    onDocumentChangeRef.current(handleRemoteChange); // Use ref
  }, [requiresAuth, user?.id]); // Don't include onDocumentChange

  const handleSave = async () => {
    if (!quillRef.current || !document || requiresAuth) return;

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

  const handleLogin = () => {
    localStorage.setItem('redirectAfterLogin', window.location.pathname);
    navigate('/login');
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
          {requiresAuth ? (
            <div className="auth-banner">
              <LogIn size={18} />
              <span>Viewing only - Log in to edit</span>
            </div>
          ) : (
            <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
              <div className="status-dot" />
              {connected ? 'Connected' : 'Disconnected'}
            </div>
          )}
        </div>

        <div className="header-right">
          {requiresAuth ? (
            <button onClick={handleLogin} className="btn-primary">
              <LogIn size={18} />
              Log In to Edit
            </button>
          ) : (
            <>
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
            </>
          )}
        </div>
      </header>

      <div className="editor-wrapper">
        <div ref={editorRef} className="editor-target" />
      </div>

      {!requiresAuth && activeUsers.length > 0 && (
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