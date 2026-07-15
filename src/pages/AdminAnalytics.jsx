import React from 'react';

export default function AdminAnalytics() {
  const handleOpenAnalytics = () => {
    window.open('https://analytics.google.com/', '_blank');
  };

  return (
    <div style={{ padding: '40px 20px', backgroundColor: '#fff', borderRadius: '8px', minHeight: '80vh', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>Estatísticas de Tráfego</h2>
        
        <p style={{ fontSize: '16px', color: '#475569', marginBottom: '32px', lineHeight: '1.6' }}>
          O rastreamento do Google Analytics já está configurado no seu site. 
          Para ver os gráficos de acessos em tempo real, visitas mensais e de onde seus clientes estão vindo, acesse o painel oficial do Google.
        </p>

        <button 
          onClick={handleOpenAnalytics}
          style={{ 
            padding: '16px 32px', 
            backgroundColor: '#2563eb', 
            color: '#fff', 
            borderRadius: '8px', 
            border: 'none', 
            cursor: 'pointer', 
            fontWeight: 'bold', 
            fontSize: '18px',
            transition: 'all 0.2s',
            boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#1d4ed8';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
          </svg>
          Abrir Google Analytics
        </button>
        
        <p style={{ marginTop: '20px', fontSize: '13px', color: '#94a3b8' }}>
          * O link abrirá em uma nova aba com segurança.
        </p>
      </div>
    </div>
  );
}
