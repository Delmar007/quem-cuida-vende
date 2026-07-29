import React from 'react';
import { Link } from 'react-router-dom';

export default function ContatoRecebido() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      fontFamily: 'Inter, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '20px',
        padding: '50px 40px',
        textAlign: 'center',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Ícone de sucesso */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: '#22c55e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 25px',
          fontSize: '2.5rem'
        }}>
          ✓
        </div>

        <h1 style={{ fontSize: '1.8rem', color: '#111', marginBottom: '15px', fontWeight: 700 }}>
          Mensagem Recebida!
        </h1>

        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: '1.7', marginBottom: '30px' }}>
          Obrigado pelo seu contato! Recebemos sua mensagem e entraremos em contato
          em breve pelo WhatsApp ou e-mail informado.
        </p>

        <div style={{
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px',
          textAlign: 'left'
        }}>
          <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem' }}>
            ⏱️ <strong>Tempo de resposta:</strong> Em até 24 horas úteis<br /><br />
            📱 <strong>WhatsApp:</strong> Fique de olho nas mensagens<br /><br />
            📧 <strong>E-mail:</strong> Verifique também a caixa de spam
          </p>
        </div>

        <Link
          to="/"
          style={{
            display: 'inline-block',
            backgroundColor: '#0f172a',
            color: '#fff',
            padding: '14px 35px',
            borderRadius: '10px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            transition: 'background 0.2s'
          }}
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
