import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LojistaPro() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleAssinar = (plano) => {
    const mensagem = encodeURIComponent(`Olá, Delmar! Tenho interesse em assinar o ${plano} para lojistas profissionais na plataforma VendeSeuCarro.`);
    window.open(`https://wa.me/5567991694802?text=${mensagem}`, '_blank');
  };

  return (
    <div className="main-content flex-center" style={{ position: 'relative', backgroundColor: '#000', backgroundImage: 'url("/cabeçalho_colmeia.png.png")', backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '100vh', padding: '60px 20px' }}>
      
      <div style={{ maxWidth: '1600px', width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '800', color: '#fff', marginBottom: '10px' }}>
          Potencialize as Vendas da sua Loja
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#e0e0e0', marginBottom: '60px', maxWidth: '800px', margin: '0 auto 60px auto' }}>
          Exponha seu estoque na plataforma mais tecnológica da região e feche negócio direto com os clientes. 
          Escolha o plano que melhor atende à sua garagem.
        </p>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          
          {/* PLANO ALUMINIUM */}
          <div style={{ flex: '1 1 250px', maxWidth: '320px', backgroundColor: '#1a1a1a', border: '1px solid #848789', borderRadius: '16px', padding: '40px 30px', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'transform 0.3s, box-shadow 0.3s', cursor: 'default' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(132,135,137,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', color: '#848789', fontWeight: '700', marginBottom: '5px' }}>Plano Alumínio</h2>
              <div style={{ fontSize: '2.5rem', color: '#fff', fontWeight: '800' }}>R$ 200<span style={{ fontSize: '1rem', color: '#999', fontWeight: '500' }}>/mês</span></div>
            </div>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '15px', color: '#ccc', textAlign: 'left', flex: 1 }}>
              <li style={{ display: 'flex', gap: '10px' }}><span style={{ color: '#848789' }}>✓</span> <strong>5 veículos</strong> no estoque.</li>
              <li style={{ display: 'flex', gap: '10px' }}><span style={{ color: '#848789' }}>✓</span> <strong>Rotatividade livre:</strong> Pode trocar o veículo!</li>
              <li style={{ display: 'flex', gap: '10px' }}><span style={{ color: '#848789' }}>✓</span> Exposição na plataforma.</li>
              <li style={{ display: 'flex', gap: '10px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #333' }}><span style={{ color: '#848789' }}>✓</span> Anúncios duram 30 dias.</li>
              <li style={{ display: 'flex', gap: '10px' }}><span style={{ color: '#848789' }}>✓</span> <strong>Cliente fala direto com lojista via WhatsApp.</strong></li>
              <li style={{ display: 'flex', gap: '10px' }}><span style={{ color: '#848789' }}>✓</span> <strong>Dinheiro rende:</strong> Até 1 ano para usar!</li>
            </ul>

            <button onClick={() => navigate('/lojistas/cadastro?plano=Aluminio')} style={{ padding: '15px', width: '100%', borderRadius: '8px', border: 'none', backgroundColor: '#848789', color: '#fff', fontSize: '1.1rem', fontWeight: '700', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#5a5c5e'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#848789'}>
              Assinar Alumínio
            </button>
          </div>

          {/* PLANO BRONZE */}
          <div style={{ flex: '1 1 300px', maxWidth: '380px', backgroundColor: '#1a1a1a', border: '1px solid #CD7F32', borderRadius: '16px', padding: '40px 30px', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'transform 0.3s, box-shadow 0.3s', cursor: 'default' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(205,127,50,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', color: '#CD7F32', fontWeight: '700', marginBottom: '5px' }}>Plano Bronze</h2>
              <div style={{ fontSize: '2.5rem', color: '#fff', fontWeight: '800' }}>R$ 350<span style={{ fontSize: '1rem', color: '#999', fontWeight: '500' }}>/mês</span></div>
            </div>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '15px', color: '#ccc', textAlign: 'left', flex: 1 }}>
              <li style={{ display: 'flex', gap: '10px' }}><span style={{ color: '#CD7F32' }}>✓</span> <strong>10 veículos</strong> no estoque.</li>
              <li style={{ display: 'flex', gap: '10px' }}><span style={{ color: '#CD7F32' }}>✓</span> <strong>Rotatividade livre:</strong> Pode trocar o veículo!</li>
              <li style={{ display: 'flex', gap: '10px' }}><span style={{ color: '#CD7F32' }}>✓</span> Direito a uso do banner por 30 dias.</li>
              <li style={{ display: 'flex', gap: '10px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #333' }}><span style={{ color: '#CD7F32' }}>✓</span> Anúncios duram 30 dias.</li>
              <li style={{ display: 'flex', gap: '10px' }}><span style={{ color: '#CD7F32' }}>✓</span> <strong>Cliente fala direto com lojista via WhatsApp.</strong></li>
              <li style={{ display: 'flex', gap: '10px' }}><span style={{ color: '#CD7F32' }}>✓</span> <strong>Dinheiro rende:</strong> Até 1 ano para usar!</li>
            </ul>

            <button onClick={() => navigate('/lojistas/cadastro?plano=Bronze')} style={{ padding: '15px', width: '100%', borderRadius: '8px', border: 'none', backgroundColor: '#CD7F32', color: '#fff', fontSize: '1.1rem', fontWeight: '700', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#a0522d'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#CD7F32'}>
              Assinar Bronze
            </button>
          </div>

          {/* PLANO PRATA */}
          <div style={{ flex: '1 1 300px', maxWidth: '380px', backgroundColor: '#222', border: '2px solid #C0C0C0', borderRadius: '16px', padding: '40px 30px', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'transform 0.3s, box-shadow 0.3s', cursor: 'default', transform: 'scale(1.05)' }} onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05) translateY(-10px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(192,192,192,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ backgroundColor: '#C0C0C0', color: '#000', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', alignSelf: 'center', marginBottom: '-10px', textTransform: 'uppercase' }}>Mais Escolhido</div>
            <div>
              <h2 style={{ fontSize: '1.8rem', color: '#C0C0C0', fontWeight: '700', marginBottom: '5px' }}>Plano Prata</h2>
              <div style={{ fontSize: '2.5rem', color: '#fff', fontWeight: '800' }}>R$ 500<span style={{ fontSize: '1rem', color: '#999', fontWeight: '500' }}>/mês</span></div>
            </div>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '15px', color: '#ccc', textAlign: 'left', flex: 1 }}>
              <li style={{ display: 'flex', gap: '10px' }}><span style={{ color: '#C0C0C0' }}>✓</span> <strong>20 veículos</strong> no estoque.</li>
              <li style={{ display: 'flex', gap: '10px' }}><span style={{ color: '#C0C0C0' }}>✓</span> <strong>Rotatividade livre:</strong> Pode trocar o veículo!</li>
              <li style={{ display: 'flex', gap: '10px' }}><span style={{ color: '#C0C0C0' }}>✓</span> Direito a uso do banner da plataforma.</li>
              <li style={{ display: 'flex', gap: '10px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #333' }}><span style={{ color: '#C0C0C0' }}>✓</span> Anúncios duram 30 dias.</li>
              <li style={{ display: 'flex', gap: '10px' }}><span style={{ color: '#C0C0C0' }}>✓</span> <strong>Cliente fala direto com lojista via WhatsApp.</strong></li>
              <li style={{ display: 'flex', gap: '10px' }}><span style={{ color: '#C0C0C0' }}>✓</span> <strong>Dinheiro rende:</strong> Até 1 ano para usar!</li>
            </ul>

            <button onClick={() => navigate('/lojistas/cadastro?plano=Prata')} style={{ padding: '15px', width: '100%', borderRadius: '8px', border: 'none', backgroundColor: '#C0C0C0', color: '#000', fontSize: '1.1rem', fontWeight: '700', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#a9a9a9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#C0C0C0'}>
              Assinar Prata
            </button>
          </div>

          {/* PLANO OURO */}
          <div style={{ flex: '1 1 300px', maxWidth: '380px', backgroundColor: '#1a1a1a', border: '1px solid #FFD700', borderRadius: '16px', padding: '40px 30px', display: 'flex', flexDirection: 'column', gap: '20px', transition: 'transform 0.3s, box-shadow 0.3s', cursor: 'default' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(255,215,0,0.3)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ backgroundColor: '#FFD700', color: '#000', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', alignSelf: 'center', marginBottom: '-10px', textTransform: 'uppercase' }}>Melhor Custo por Anúncio</div>
            <div>
              <h2 style={{ fontSize: '1.8rem', color: '#FFD700', fontWeight: '700', marginBottom: '5px' }}>Plano Ouro</h2>
              <div style={{ fontSize: '2.5rem', color: '#fff', fontWeight: '800' }}>R$ 600<span style={{ fontSize: '1rem', color: '#999', fontWeight: '500' }}>/mês</span></div>
            </div>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '15px', color: '#ccc', textAlign: 'left', flex: 1 }}>
              <li style={{ display: 'flex', gap: '10px' }}><span style={{ color: '#FFD700' }}>✓</span> <strong>30 veículos</strong> no estoque.</li>
              <li style={{ display: 'flex', gap: '10px' }}><span style={{ color: '#FFD700' }}>✓</span> <strong>Rotatividade livre:</strong> Pode trocar o veículo!</li>
              <li style={{ display: 'flex', gap: '10px' }}><span style={{ color: '#FFD700' }}>✓</span> Direito a uso do banner principal.</li>
              <li style={{ display: 'flex', gap: '10px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #333' }}><span style={{ color: '#FFD700' }}>✓</span> Anúncios duram 30 dias.</li>
              <li style={{ display: 'flex', gap: '10px' }}><span style={{ color: '#FFD700' }}>✓</span> <strong>Cliente fala direto com lojista via WhatsApp.</strong></li>
              <li style={{ display: 'flex', gap: '10px' }}><span style={{ color: '#FFD700' }}>✓</span> <strong>Dinheiro rende:</strong> Até 1 ano para usar!</li>
            </ul>

            <button onClick={() => navigate('/lojistas/cadastro?plano=Ouro')} style={{ padding: '15px', width: '100%', borderRadius: '8px', border: 'none', backgroundColor: '#FFD700', color: '#000', fontSize: '1.1rem', fontWeight: '700', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#daa520'} onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFD700'}>
              Assinar Ouro
            </button>
          </div>

        </div>
        
        <div style={{ marginTop: '50px' }}>
          <button onClick={() => navigate('/anuncios')} className="btn btn-outline" style={{ color: '#fff', borderColor: '#fff' }}>
            Voltar para a Loja
          </button>
        </div>
      </div>
    </div>
  );
}
