import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [session, setSession] = useState(null);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account'
        }
      }
    });
    if (error) console.error('Error logging in:', error.message);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error logging out:', error.message);
  };

  return (
    <div className="main-content flex-center" style={{ position: 'relative', backgroundColor: '#000', backgroundImage: 'url("/cabeçalho_colmeia.png.png")', backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '100vh' }}>
      
      {/* Logo sozinha no centro superior */}
      <img src="/logo_grande.png.png" alt="Logo Principal" className="spin-y-animation" style={{ position: 'absolute', top: '40px', left: '50%', height: '180px', zIndex: 10 }} />

      <div className="box-centered" style={{ textAlign: 'center', boxShadow: 'none', border: 'none', maxWidth: '940px', width: '100%', backgroundColor: 'transparent', marginTop: '100px' }}>
        <img src="/logo_larga.png" alt="Equipe Personal Car" style={{ width: '100%', maxWidth: '940px', marginBottom: '40px' }} />
        
        {session ? (
          <div style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {session.user.user_metadata.avatar_url && (
              <img 
                src={session.user.user_metadata.avatar_url} 
                alt="Avatar" 
                style={{ width: '120px', height: '120px', borderRadius: '50%', marginBottom: '10px' }} 
              />
            )}
            <p style={{ fontWeight: '600', marginBottom: '10px', color: '#fff', fontSize: '1.2rem' }}>Olá, {session.user.user_metadata.full_name || session.user.email}!</p>
          </div>
        ) : (
          <div style={{ marginBottom: '40px' }}>
            <button 
              onClick={signInWithGoogle} 
              className="btn btn-outline" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '10px', 
                fontSize: '1rem', 
                fontWeight: '600',
                padding: '12px 24px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                backgroundColor: '#fff',
                color: '#333'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.238-2.651-.669-3.917z" />
                <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.238-2.651-.669-3.917z" />
              </svg>
              Continuar com o Google
            </button>
          </div>
        )}

        <div className="flex-center" style={{ flexDirection: 'row', gap: '50px' }}>
          <Link 
            to="/comprar" 
            className="btn btn-huge" 
            style={{ fontFamily: "'911', sans-serif", width: '250px', height: '80px', backgroundColor: '#ff0000', color: '#ffffff', border: 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,0,0,0.3)'; setShowMessage(true); }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; setShowMessage(false); }}
            onClick={(e) => {
              if (!session) {
                e.preventDefault();
                alert('Atenção: só acessa o site após fazer o login do Google. Faça o cadastro (login) para poder vender ou fazer pedido.');
              }
            }}
          >
            Comprar um carro
          </Link>
          <Link 
            to="/vender" 
            className="btn btn-huge" 
            style={{ fontFamily: "'911', sans-serif", width: '250px', height: '80px', backgroundColor: '#ff0000', color: '#ffffff', border: 'none', transition: 'transform 0.2s, box-shadow 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(255,0,0,0.3)'; setShowMessage(true); }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.04)'; setShowMessage(false); }}
            onClick={(e) => {
              if (!session) {
                e.preventDefault();
                alert('Atenção: só acessa o site após fazer o login do Google. Faça o cadastro (login) para poder vender ou fazer pedido.');
              }
            }}
          >
            Vender um carro
          </Link>
        </div>

        <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
          <a 
            href="#" 
            onClick={async (e) => {
              e.preventDefault();
              await signOut();
              window.location.href = "https://www.google.com";
            }}
            style={{ color: '#ef4444', textDecoration: 'none', fontWeight: '700', fontSize: '1.1rem' }}
          >
            Sair do Site
          </a>
          <Link 
            to="/anuncios" 
            style={{ color: '#fff', textDecoration: 'none', fontWeight: '700', fontSize: '1.1rem', padding: '8px 16px', border: '1px solid #fff', borderRadius: '4px' }}
            onClick={(e) => {
              if (!session) {
                e.preventDefault();
                alert('Atenção: só acessa o site após fazer o login do Google.');
              }
            }}
          >
            Acessar o Site
          </Link>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <Link to="/admin" style={{ color: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ccc'} onMouseLeave={e => e.currentTarget.style.color = '#fff'}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Acesso Restrito
          </Link>
          <Link to="/admin-franqueado" style={{ color: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ccc'} onMouseLeave={e => e.currentTarget.style.color = '#fff'}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Acesso Franqueado
          </Link>
        </div>

        <div style={{ marginTop: '50px', height: '30px' }}>
          {(!session && showMessage) && (
            <p style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '600' }}>
              Antes de fazer o cadastro completo logue com o Google.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
