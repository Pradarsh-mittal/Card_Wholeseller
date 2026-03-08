import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const { exchangeSession, isAdmin, isPending } = useAuth();
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use ref to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = window.location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (sessionIdMatch) {
        const sessionId = sessionIdMatch[1];
        
        try {
          const user = await exchangeSession(sessionId);
          
          // Clear the hash from URL
          window.history.replaceState(null, '', window.location.pathname);
          
          // Redirect based on user role and status
          if (user.role === 'admin') {
            navigate('/admin', { replace: true, state: { user } });
          } else if (user.status === 'pending') {
            navigate('/pending-approval', { replace: true, state: { user } });
          } else {
            navigate('/dashboard', { replace: true, state: { user } });
          }
        } catch (error) {
          console.error('Auth callback error:', error);
          navigate('/login', { replace: true });
        }
      } else {
        navigate('/login', { replace: true });
      }
    };

    processAuth();
  }, [exchangeSession, navigate, isAdmin, isPending]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-brand-blue mx-auto" />
        <p className="mt-4 text-slate-600">Signing you in...</p>
      </div>
    </div>
  );
}
