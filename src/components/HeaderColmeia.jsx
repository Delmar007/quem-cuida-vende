import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { supabase } from '../lib/supabase';

export default function HeaderColmeia({ 
  selectedCategoria, 
  setSelectedCategoria, 
  session, 
  headerRef,
  uiTexts
}) {
  const navigate = useNavigate();
  
  // Estado local para ler os créditos
  const [creditDays, setCreditDays] = useState(0);

  useEffect(() => {
    const fetchCredits = async () => {
      // 1. Tenta carregar os créditos da sessão logada no banco de dados
      const cpf = sessionStorage.getItem('delmar_client_cpf');
      if (cpf) {
        const { data, error } = await supabase.from('client_credits').select('creditos_dias').eq('cpf', cpf).single();
        if (data && !error) {
          setCreditDays(data.creditos_dias || 0);
          return;
        }
      }
      
      // 2. Se não estiver logado, checa o localStorage como fallback temporário
      try {
        const stored = localStorage.getItem('delmar_creditos');
        if (stored) {
          setCreditDays(parseInt(stored, 10));
        }
      } catch (e) {}
    };

    fetchCredits();
  }, []);

  return (
    <>
      {/* TOP BAR: Logo and Categories */}
      <div style={{ width: '100%', backgroundColor: '#7A1734', backgroundImage: 'url("/fundo-colmeia-vinho.png")', backgroundSize: 'contain', backgroundRepeat: 'repeat', backgroundPosition: 'center', display: 'flex', justifyContent: 'center', borderBottom: '2px solid rgba(255,255,255,0.1)', boxSizing: 'border-box' }}>
        <div style={{ width: '100%', maxWidth: '940px', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4px', paddingLeft: '20px', paddingRight: '20px', boxSizing: 'border-box' }}>
          
          {/* Logo */}
          <Link to="/anuncios" style={{ width: '100%', display: 'flex', justifyContent: 'center', textDecoration: 'none', marginBottom: '8px' }}>
            <div style={{ textAlign: 'center', transition: 'transform 0.3s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
              <h1 style={{ fontFamily: "'Midstar', sans-serif", fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', margin: 0, fontWeight: 'normal', letterSpacing: '1px', display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '0.3em' }}>
                <span style={{ color: '#ffffff', fontSize: '1.1em' }}>Quem</span>
                <span style={{ color: '#FFE485', fontSize: '1.3em' }}>Cuida</span>
                <span style={{ color: '#ffffff', fontSize: '1.1em' }}>Vende</span>
              </h1>
            </div>
          </Link>

          {/* Categorias */}
          <div className="categories-scroll-mobile" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 10px' }}>
            {['Veículos', 'Imóveis', 'Smartphones', 'Vestuário', 'Outros'].map(cat => {
              const isSelected = (selectedCategoria === cat) || (!selectedCategoria && cat === 'Veículos');
              return (
                <div key={cat} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  
                  {/* Botão Dourado Flutuante ou Contador de Créditos acima de Outros */}
                  {cat === 'Outros' && (
                    <div style={{
                      position: 'absolute',
                      bottom: '43px', // Descendo 5px conforme solicitado
                      zIndex: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '86px' // Ajustado para o novo tamanho do botão
                    }}>
                      {creditDays > 0 ? (
                        <div 
                          className="font-american" 
                          style={{
                            color: '#FFE485', // Dourado 20% mais claro
                            textAlign: 'center',
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                            lineHeight: '1.1',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                          }}
                        >
                          <span style={{ fontSize: '16px', letterSpacing: '1px' }}>CRÉDITOS</span>
                          <span style={{ fontSize: '32px', margin: '-2px 0' }}>{creditDays}</span>
                          <span style={{ fontSize: '12px', letterSpacing: '1px' }}>DIAS RESTANTES</span>
                        </div>
                      ) : (
                        <Link to="/comprar-anuncios" className="shimmer-gold-button" style={{ display: 'block', width: '86px' }}>
                          <img 
                            src="/botao-anuncio-marrom.png" 
                            alt="Promoção 10 Anúncios" 
                            style={{
                              width: '100%',
                              height: 'auto',
                              filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))'
                            }}
                          />
                        </Link>
                      )}
                    </div>
                  )}

                  <div 
                    className="font-ethnocentric" 
                    onClick={() => setSelectedCategoria ? setSelectedCategoria(cat === 'Veículos' ? null : cat) : null}
                    style={{ 
                      fontSize: '20px', 
                      color: isSelected ? '#F7D046' : '#fff', 
                      cursor: 'pointer', 
                      transition: 'all 0.2s',
                      borderBottom: isSelected ? '2px solid #F7D046' : '2px solid transparent',
                      paddingBottom: '4px'
                    }}
                    onMouseOver={e => { if (!isSelected) e.currentTarget.style.color = 'var(--primary-color)'; }} 
                    onMouseOut={e => { if (!isSelected) e.currentTarget.style.color = '#fff'; }}
                  >
                    {cat}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Menu Topo (Faixa Preta) */}
      <nav ref={headerRef} className="sticky-mobile-header" style={{ width: '100%', display: 'flex', justifyContent: 'center', backgroundColor: '#000', borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 2000, margin: 0 }}>
        <div className="scroll-menu-mobile" style={{ width: '100%', maxWidth: '940px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '600', fontSize: '0.95rem', padding: '10px 20px', boxSizing: 'border-box' }}>
          <button onClick={() => { if (!session) { alert('Complete seu cadastro (faça login com o Google na página inicial) antes de prosseguir.'); return; } navigate('/comprar?fast=true'); }} style={{ color: '#e0e0e0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: '600', transition: 'color 0.2s', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#e0e0e0'}>
            <span>{uiTexts?.buyTitle || 'Comprar'}</span>
            <span style={{ color: '#ef4444', fontSize: '11px', fontStyle: 'italic', marginTop: '2px', lineHeight: '1' }}>{uiTexts?.buySub || ''}</span>
          </button>
          <button onClick={() => { if (!session) { alert('Complete seu cadastro (faça login com o Google na página inicial) antes de prosseguir.'); return; } navigate('/vender?fast=true'); }} style={{ color: '#e0e0e0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: '600', transition: 'color 0.2s', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#e0e0e0'}>
            <span>{uiTexts?.sellTitle || 'Vender'}</span>
            <span style={{ color: '#ef4444', fontSize: '11px', fontStyle: 'italic', marginTop: '2px', lineHeight: '1' }}>{uiTexts?.sellSub || ''}</span>
          </button>
          <button onClick={() => { navigate('/lojistas'); }} style={{ color: '#e0e0e0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: '600', transition: 'color 0.2s', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#e0e0e0'}>
            <span>{uiTexts?.shopTitle || 'Lojista Profissional'}</span>
            <span style={{ color: '#ef4444', fontSize: '11px', fontStyle: 'italic', marginTop: '2px', lineHeight: '1' }}>{uiTexts?.shopSub || ''}</span>
          </button>

          <button onClick={() => { if (!session) { alert('Faça login com o Google na página inicial para se cadastrar.'); return; } navigate('/cadastro'); }} style={{ color: '#e0e0e0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: '600', transition: 'color 0.2s', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#e0e0e0'}>
            <span>Cadastro</span>
            <span style={{ color: '#ef4444', fontSize: '11px', fontStyle: 'italic', marginTop: '2px', lineHeight: '1' }}>pessoa física</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => { navigate('/lojista-cadastro'); }} style={{ color: '#e0e0e0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: '600', transition: 'color 0.2s', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '8px' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#e0e0e0'}>
              <span>Cadastro</span>
              <span style={{ color: '#ef4444', fontSize: '11px', fontStyle: 'italic', marginTop: '2px', lineHeight: '1' }}>pessoa jurídica</span>
            </button>

            <Link to="/perfil" title="Meu Perfil" style={{ display: 'flex', alignItems: 'center' }}>
              {session && session.user?.user_metadata?.avatar_url ? (
                <img src={session.user.user_metadata.avatar_url} alt="Perfil" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #fff' }} />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              )}
            </Link>
            <a href="https://www.google.com" title="Sair do site" style={{ color: '#fff', transition: 'transform 0.2s', display: 'flex', alignItems: 'center' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            </a>
            <Link to="/admin" title="Cadastrar Veículos Admin" style={{ color: '#fff', transition: 'transform 0.2s', display: 'flex', alignItems: 'center' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
