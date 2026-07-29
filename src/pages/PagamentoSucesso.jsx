import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderColmeia from '../components/HeaderColmeia';
import { supabase } from '../lib/supabase';

export default function PagamentoSucesso() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const confirmPayment = async () => {
      const cpf = sessionStorage.getItem('delmar_client_cpf');
      if (cpf) {
        // Pega os créditos atuais se existirem, ou apenas seta 300 se for novo
        const { data, error } = await supabase.from('client_credits').select('creditos_dias').eq('cpf', cpf).single();
        let novosCreditos = 300;
        if (data) {
          novosCreditos += data.creditos_dias || 0;
        }

        // Atualiza ou insere na tabela client_credits
        await supabase.from('client_credits').upsert({
          cpf: cpf,
          creditos_dias: novosCreditos,
          updated_at: new Date().toISOString()
        });
      }
      
      // Mantém no localStorage como fallback opcional para carregamento mais rápido do header
      localStorage.setItem('delmar_creditos', '300');
      
      // Simula o tempo de processamento visual
      setTimeout(() => {
        setIsProcessing(false);
      }, 1500);
    };

    confirmPayment();
  }, []);

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <HeaderColmeia 
        selectedCategoria="Outros"
        session={session}
      />
      
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div className="premium-card" style={{ maxWidth: '600px', width: '100%', padding: '40px', textAlign: 'center', backgroundColor: '#fff', border: '2px solid #22c55e' }}>
          
          {isProcessing ? (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <svg className="spin-y-animation" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', animation: 'spin 1s linear infinite' }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                <style>{`
                  @keyframes spin { 100% { transform: rotate(360deg); } }
                `}</style>
              </div>
              <h2 style={{ color: '#22c55e', fontSize: '1.8rem', marginBottom: '16px' }}>Processando seu pagamento...</h2>
              <p style={{ color: '#666' }}>Aguarde só um momento enquanto liberamos seus créditos.</p>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h2 style={{ color: '#22c55e', fontSize: '2rem', marginBottom: '16px', fontWeight: 'bold' }}>Pagamento Aprovado!</h2>
              
              <div style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #bbf7d0' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#166534' }}>Seus créditos foram liberados</h3>
                <p style={{ margin: '10px 0 0 0', color: '#15803d', fontSize: '1.1rem', fontWeight: 'bold' }}>Você agora possui 300 DIAS para anunciar!</p>
              </div>

              <p style={{ marginBottom: '30px', color: '#4b5563' }}>
                Olhe no cabeçalho acima! Você já pode ver o seu contador de créditos ativado.
              </p>

              <button 
                onClick={() => navigate('/anuncios')}
                className="btn btn-primary"
                style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: 'bold', backgroundColor: 'var(--primary-color)' }}
              >
                Voltar para os Anúncios
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
