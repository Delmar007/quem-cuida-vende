import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Substitua esses links pelos links reais gerados no aplicativo do Mercado Pago
const LINKS_MERCADO_PAGO = {
  'Aluminio': 'https://mpago.la/33LGfXW', // Link provisório/primeiro link
  'Bronze': 'https://mpago.la/1Vhnpkd',
  'Prata': 'https://mpago.la/26WGXQ5',
  'Ouro': 'https://mpago.la/2Uo8ivw'
};

const THEME_COLORS = {
  'Aluminio': { primary: '#848789', bg: '#1a1a1a', text: '#fff' },
  'Bronze': { primary: '#CD7F32', bg: '#1a1a1a', text: '#fff' },
  'Prata': { primary: '#C0C0C0', bg: '#222', text: '#000' },
  'Ouro': { primary: '#FFD700', bg: '#1a1a1a', text: '#000' }
};

export default function LojistaPagamento() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const navigate = useNavigate();
  
  const [lojista, setLojista] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) {
      loadData();
    } else {
      navigate('/lojistas');
    }
  }, [id]);

  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('lojistas_pro')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      setLojista(data);
    } catch (err) {
      console.error(err);
      alert('Cadastro não encontrado.');
      navigate('/lojistas');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    if (!lojista) return;
    let msg = `*CADASTRO LOJISTA - AGUARDANDO PAGAMENTO*\n\n`;
    msg += `Olá Delmar, fiz meu cadastro e estou indo realizar o pagamento do plano.\n\n`;
    msg += `*Plano Escolhido:* ${lojista.plano}\n`;
    msg += `*Loja:* ${lojista.nome_loja}\n`;
    msg += `*CNPJ:* ${lojista.cnpj}\n`;
    msg += `*Responsável:* ${lojista.nome_proprietario}\n\n`;
    msg += `*Link do meu plano:* ${LINKS_MERCADO_PAGO[lojista.plano]}\n`;
    
    const encodedMsg = encodeURIComponent(msg);
    window.open(`https://wa.me/5567991694802?text=${encodedMsg}`, '_blank');
  };

  const handlePay = () => {
    if (!lojista) return;
    const link = LINKS_MERCADO_PAGO[lojista.plano];
    if (link && !link.includes('SEU_LINK')) {
      if (window.fbq) {
        window.fbq('track', 'InitiateCheckout', {
          content_name: 'Pagamento ' + lojista.plano,
          content_category: 'Lojista'
        });
      }
      window.location.href = link;
    } else {
      alert('Link de pagamento do Mercado Pago não configurado. Por favor, contate o suporte via WhatsApp.');
      handleWhatsApp();
    }
  };

  if (loading) {
    return (
      <div className="main-content flex-center" style={{ backgroundColor: '#000', minHeight: '100vh' }}>
        <h2 style={{ color: '#fff' }}>Carregando dados...</h2>
      </div>
    );
  }

  if (!lojista) return null;

  const currentTheme = THEME_COLORS[lojista.plano] || THEME_COLORS['Ouro'];

  return (
    <div className="main-content flex-center" style={{ backgroundColor: '#000', backgroundImage: 'url("/cabeçalho_colmeia.png.png")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', minHeight: '100vh', padding: '60px 20px' }}>
      <div style={{ maxWidth: '600px', width: '100%', backgroundColor: currentTheme.bg, border: `2px solid ${currentTheme.primary}`, borderRadius: '16px', padding: '40px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
        
        <h1 style={{ color: currentTheme.primary, fontSize: '2.2rem', marginBottom: '10px' }}>Quase lá, {lojista.nome_proprietario}!</h1>
        <p style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '30px' }}>Seu cadastro para a loja <strong>{lojista.nome_loja}</strong> foi salvo com sucesso.</p>

        <div style={{ backgroundColor: '#000', padding: '20px', borderRadius: '12px', border: '1px solid #333', marginBottom: '30px' }}>
          <p style={{ color: '#888', margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Plano Selecionado</p>
          <h2 style={{ color: currentTheme.primary, margin: '10px 0', fontSize: '2rem' }}>{lojista.plano}</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button 
            onClick={handlePay}
            style={{ 
              width: '100%', 
              padding: '20px', 
              backgroundColor: '#009EE3', // Mercado Pago Blue
              color: '#fff', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '1.2rem', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'transform 0.2s',
              boxShadow: '0 4px 12px rgba(0, 158, 227, 0.4)'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
            Pagar com Mercado Pago
          </button>

          <button 
            onClick={handleWhatsApp}
            style={{ 
              width: '100%', 
              padding: '15px', 
              backgroundColor: 'transparent',
              color: '#ccc', 
              border: '1px solid #444', 
              borderRadius: '8px', 
              fontSize: '1rem', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = '#222'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12.031 0C5.385 0 .003 5.381.003 12.029c0 2.124.553 4.195 1.606 6.02L0 24l6.108-1.603a11.96 11.96 0 0 0 5.922 1.564h.005c6.645 0 12.025-5.382 12.025-12.029 0-3.218-1.254-6.246-3.533-8.525A11.996 11.996 0 0 0 12.031 0zm0 20.046h-.004a9.998 9.998 0 0 1-5.093-1.396l-.365-.216-3.785.993 1.01-3.692-.238-.378A10.02 10.02 0 0 1 2.007 12.03c.002-5.516 4.492-10.003 10.007-10.003 2.673 0 5.185 1.042 7.075 2.934a10.012 10.012 0 0 1 2.93 7.081c-.004 5.517-4.493 10.004-10.004 10.004zm5.138-7.391c-.282-.141-1.666-.822-1.925-.916-.258-.094-.447-.141-.635.141-.188.282-.728.916-.893 1.104-.165.188-.33.212-.612.071-.282-.141-1.189-.438-2.266-1.398-.838-.747-1.403-1.67-1.568-1.952-.165-.282-.018-.435.123-.576.127-.127.282-.329.423-.494.141-.165.188-.282.282-.471.094-.188.047-.353-.024-.494-.071-.141-.635-1.529-.87-2.094-.229-.55-.462-.476-.635-.484-.165-.008-.353-.008-.541-.008a1.046 1.046 0 0 0-.753.353c-.258.282-.988.965-.988 2.353s1.012 2.73 1.153 2.918c.141.188 1.988 3.035 4.812 4.254.672.29 1.197.463 1.606.592.674.215 1.288.184 1.773.111.541-.08 1.666-.682 1.901-1.341.235-.659.235-1.224.165-1.341-.071-.118-.259-.188-.541-.329z"/></svg>
            Avisar suporte via WhatsApp
          </button>
        </div>

        <p style={{ marginTop: '30px', fontSize: '0.85rem', color: '#666' }}>
          O pagamento é processado de forma 100% segura pelo Mercado Pago.<br/>
          Aceitamos Pix, Cartão de Crédito e Débito.
        </p>

      </div>
    </div>
  );
}
