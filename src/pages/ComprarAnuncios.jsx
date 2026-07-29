import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderColmeia from '../components/HeaderColmeia';
import { maskCPF, validateCPF } from '../utils/masks';

export default function ComprarAnuncios() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [clickedPay, setClickedPay] = useState(false);
  
  // Novo controle de CPF
  const [cpf, setCpf] = useState('');
  const [cpfConfirmed, setCpfConfirmed] = useState(false);

  useEffect(() => {
    // Se o usuário já logou antes, pega o CPF da sessão automaticamente
    const savedCpf = sessionStorage.getItem('delmar_client_cpf');
    if (savedCpf) {
      setCpf(savedCpf);
      setCpfConfirmed(true);
    }
  }, []);

  const handleConfirmCpf = (e) => {
    e.preventDefault();
    if (validateCPF(cpf)) {
      sessionStorage.setItem('delmar_client_cpf', cpf);
      setCpfConfirmed(true);
    } else {
      alert("Por favor, digite um CPF válido.");
    }
  };

  const handleSimulateSuccess = () => {
    navigate('/pagamento-sucesso');
  };

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <HeaderColmeia 
        selectedCategoria="Outros"
        session={session}
      />
      
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div className="premium-card" style={{ maxWidth: '600px', width: '100%', padding: '40px', textAlign: 'center', backgroundColor: '#fff', border: '2px solid var(--primary-color)' }}>
          <h2 style={{ fontFamily: "'AmericanCaptain', sans-serif", letterSpacing: '2px', color: 'var(--primary-color)', fontSize: '3.5rem', marginBottom: '16px', fontWeight: 'normal' }}>
            Pacote Premium <span style={{ fontSize: '1.2em' }}>300</span> Dias
          </h2>
          
          <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '2px solid var(--primary-color)' }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>10 Anúncios Livres</h3>
            <p style={{ margin: '10px 0 0 0', color: '#718096', fontSize: '1.1rem' }}>
              Venda em qualquer categoria com validade de 30 dias para cada (Total de <span style={{ fontFamily: "'AmericanCaptain', sans-serif", fontSize: '1.2em', verticalAlign: 'baseline' }}>300</span> dias), com direito a reaproveitamento de espaço de anuncio, com validade de até um ano.
            </p>
          </div>

          <div style={{ fontSize: '3rem', fontWeight: '900', color: '#1a202c', marginBottom: '30px' }}>
            <span style={{ fontSize: '1.5rem', verticalAlign: 'middle', marginRight: '8px' }}>R$</span>
            10,00
          </div>

          {!cpfConfirmed ? (
            <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <p style={{ color: '#4a5568', marginBottom: '16px', fontWeight: '600' }}>Para liberar sua compra, informe seu CPF:</p>
              <form onSubmit={handleConfirmCpf} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input 
                  type="text" 
                  value={cpf} 
                  onChange={(e) => setCpf(maskCPF(e.target.value))}
                  placeholder="Ex: 000.000.000-00"
                  className="form-control"
                  style={{ textAlign: 'center', fontSize: '1.2rem' }}
                  required
                />
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--primary-color)', color: '#fff', padding: '12px', fontWeight: 'bold' }}>
                  Confirmar CPF e Comprar
                </button>
              </form>
            </div>
          ) : (
            <>
              <a 
                href="https://mpago.la/2NgKpZo" 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => setClickedPay(true)}
                style={{
                  display: 'inline-block',
                  backgroundColor: '#009EE3',
                  color: '#fff',
                  padding: '16px 32px',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  width: '100%',
                  marginBottom: '20px',
                  boxShadow: '0 4px 6px rgba(0, 158, 227, 0.3)',
                  transition: 'transform 0.2s, background-color 0.2s'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.backgroundColor = '#008bca';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.backgroundColor = '#009EE3';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Pagar com Mercado Pago
              </a>

              {clickedPay && (
                <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  <p style={{ color: '#0369a1', marginBottom: '16px', fontWeight: '500' }}>Já realizou o pagamento na aba que se abriu?</p>
                  <button 
                    onClick={handleSimulateSuccess}
                    className="btn btn-primary"
                    style={{ backgroundColor: '#22c55e', border: 'none', padding: '12px 24px', width: '100%', fontWeight: 'bold' }}
                  >
                    Confirmar Pagamento (Modo Teste)
                  </button>
                </div>
              )}
            </>
          )}

          <p style={{ marginTop: '20px', color: '#a0aec0', fontSize: '0.9rem' }}>
            Pagamento 100% seguro processado pelo Mercado Pago. Seus créditos serão vinculados ao CPF informado.
          </p>
        </div>
      </main>
    </div>
  );
}
