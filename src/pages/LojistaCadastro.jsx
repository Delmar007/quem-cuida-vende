import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import StateCitySelect from '../components/StateCitySelect';
import { supabase } from '../lib/supabase';

export default function LojistaCadastro() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [plano, setPlano] = useState(searchParams.get('plano') || 'Ouro');
  
  const [formData, setFormData] = useState({
    nomeLoja: '',
    cnpj: '',
    nomeProprietario: '',
    estado: '',
    cidade: '',
    cep: '',
    endereco: '',
    telefones: ['']
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const themeColors = {
    'Aluminio': { primary: '#848789', bg: '#1a1a1a', text: '#fff' },
    'Bronze': { primary: '#CD7F32', bg: '#1a1a1a', text: '#fff' },
    'Prata': { primary: '#C0C0C0', bg: '#222', text: '#000' },
    'Ouro': { primary: '#FFD700', bg: '#1a1a1a', text: '#000' }
  };

  const LINKS_MERCADO_PAGO = {
    'Aluminio': 'https://mpago.la/33LGfXW',
    'Bronze': 'https://mpago.la/1Vhnpkd',
    'Prata': 'https://mpago.la/26WGXQ5',
    'Ouro': 'https://mpago.la/2Uo8ivw'
  };

  const planVantagens = {
    'Aluminio': [
      '5 espaços para veículos no estoque.',
      'Direito a uso do banner principal.',
      'Rotatividade livre: Ocupe o mesmo espaço com outro veículo se vender o atual.',
      'Cliente fala direto com o lojista via WhatsApp.',
      'Seus créditos rendem por até 1 ano.'
    ],
    'Bronze': [
      '10 espaços para veículos no estoque.',
      'Direito a uso do banner principal por 30 dias.',
      'Rotatividade livre: Ocupe o mesmo espaço com outro veículo se vender o atual.',
      'Cliente fala direto com o lojista via WhatsApp.',
      'Seus créditos rendem por até 1 ano.'
    ],
    'Prata': [
      '20 espaços para veículos no estoque.',
      'Direito a uso do banner principal.',
      'Rotatividade livre: Ocupe o mesmo espaço com outro veículo se vender o atual.',
      'Cliente fala direto com o lojista via WhatsApp.',
      'Seus créditos rendem por até 1 ano.'
    ],
    'Ouro': [
      '30 espaços para veículos no estoque.',
      'Melhor custo por anúncio!',
      'Direito a uso do banner principal.',
      'Rotatividade livre: Ocupe o mesmo espaço com outro veículo se vender o atual.',
      'Cliente fala direto com o lojista via WhatsApp.',
      'Seus créditos rendem por até 1 ano.'
    ]
  };

  const currentTheme = themeColors[plano] || themeColors['Ouro'];

  const handlePhoneChange = (index, value) => {
    const newTelefones = [...formData.telefones];
    newTelefones[index] = value;
    setFormData({ ...formData, telefones: newTelefones });
  };

  const addPhone = () => {
    if (formData.telefones.length < 10) {
      setFormData({ ...formData, telefones: [...formData.telefones, ''] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('lojistas_pro')
        .insert([{
          plano,
          nome_loja: formData.nomeLoja,
          cnpj: formData.cnpj,
          nome_proprietario: formData.nomeProprietario,
          estado: formData.estado,
          cidade: formData.cidade,
          cep: formData.cep,
          endereco: formData.endereco,
          telefones: formData.telefones
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      // Fire Meta Pixel Lead Event
      if (window.fbq) {
        window.fbq('track', 'Lead', {
          content_name: 'Cadastro Lojista',
          content_category: plano
        });
      }

      // Redirect to payment page passing the newly generated record ID
      navigate(`/lojistas/pagamento?id=${data.id}`);
      
    } catch (err) {
      console.error('Erro ao salvar lojista:', err);
      alert('Houve um erro ao processar o seu cadastro. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="main-content flex-center" style={{ backgroundColor: '#000', backgroundImage: 'url("/cabeçalho_colmeia.png.png")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', minHeight: '100vh', padding: '60px 20px' }}>
      <div style={{ maxWidth: '940px', width: '100%' }}>
        
        {/* Header and Plan Selector */}
        <div style={{ backgroundColor: currentTheme.bg, border: `2px solid ${currentTheme.primary}`, borderRadius: '16px', padding: '30px', marginBottom: '30px', transition: 'all 0.3s' }}>
          <h1 style={{ color: currentTheme.primary, fontSize: '2.5rem', marginBottom: '30px', textAlign: 'center' }}>
            Cadastro Lojista Profissional
          </h1>
          
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'stretch' }}>
            
            {/* Box Esquerda */}
            <div style={{ flex: '1 1 300px', backgroundColor: '#000', padding: '20px', borderRadius: '12px', border: '1px solid #333', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <label style={{ color: '#ccc', display: 'block', marginBottom: '15px', fontSize: '1.2rem', textAlign: 'center' }}>Qual plano deseja assinar?</label>
              <select 
                value={plano}
                onChange={(e) => setPlano(e.target.value)}
                style={{ padding: '15px', fontSize: '1.2rem', borderRadius: '8px', border: `2px solid ${currentTheme.primary}`, backgroundColor: '#222', color: '#fff', width: '100%', maxWidth: '300px', cursor: 'pointer', outline: 'none' }}
              >
                <option value="Aluminio">Plano Alumínio - R$ 200/mês</option>
                <option value="Bronze">Plano Bronze - R$ 350/mês</option>
                <option value="Prata">Plano Prata - R$ 500/mês</option>
                <option value="Ouro">Plano Ouro - R$ 600/mês</option>
              </select>
            </div>

            {/* Box Direita */}
            <div style={{ flex: '2 1 300px', backgroundColor: '#000', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
              <h3 style={{ color: currentTheme.primary, marginBottom: '15px', fontSize: '1.2rem', borderBottom: `1px solid ${currentTheme.primary}40`, paddingBottom: '10px' }}>
                Vantagens do Plano {plano}
              </h3>
              <ul style={{ color: '#fff', fontSize: '1.05rem', margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {planVantagens[plano].map((vantagem, idx) => (
                  <li key={idx}>
                    {vantagem.includes('Melhor custo') ? <strong style={{color: currentTheme.primary}}>{vantagem}</strong> : vantagem}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* Form */}
        <div style={{ backgroundColor: '#111', padding: '40px', borderRadius: '16px', border: '1px solid #333' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px' }}>
                <label className="form-label" style={{ color: '#e0e0e0' }}>Nome da Loja <span style={{color: 'red'}}>*</span></label>
                <input type="text" required className="form-control" value={formData.nomeLoja} onChange={e => setFormData({...formData, nomeLoja: e.target.value})} style={{ backgroundColor: '#222', color: '#fff', border: '1px solid #444', padding: '15px', borderRadius: '8px' }} />
              </div>
              <div style={{ flex: '1 1 300px' }}>
                <label className="form-label" style={{ color: '#e0e0e0' }}>CNPJ <span style={{color: 'red'}}>*</span></label>
                <input type="text" required className="form-control" value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} style={{ backgroundColor: '#222', color: '#fff', border: '1px solid #444', padding: '15px', borderRadius: '8px' }} />
              </div>
            </div>

            <div>
              <label className="form-label" style={{ color: '#e0e0e0' }}>Nome do Proprietário / Responsável <span style={{color: 'red'}}>*</span></label>
              <input type="text" required className="form-control" value={formData.nomeProprietario} onChange={e => setFormData({...formData, nomeProprietario: e.target.value})} style={{ backgroundColor: '#222', color: '#fff', border: '1px solid #444', padding: '15px', borderRadius: '8px' }} />
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <StateCitySelect 
                formData={formData} 
                setFormData={setFormData} 
                selectStyle={{ backgroundColor: '#222', color: '#fff', border: '1px solid #444', padding: '15px', borderRadius: '8px' }}
                labelStyle={{ color: '#e0e0e0' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 150px', maxWidth: '200px' }}>
                <label className="form-label" style={{ color: '#e0e0e0' }}>CEP</label>
                <input type="text" className="form-control" value={formData.cep} onChange={e => setFormData({...formData, cep: e.target.value})} style={{ backgroundColor: '#222', color: '#fff', border: '1px solid #444', padding: '15px', borderRadius: '8px' }} />
              </div>
              <div style={{ flex: '1 1 300px' }}>
                <label className="form-label" style={{ color: '#e0e0e0' }}>Endereço Completo</label>
                <input type="text" className="form-control" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} style={{ backgroundColor: '#222', color: '#fff', border: '1px solid #444', padding: '15px', borderRadius: '8px' }} />
              </div>
            </div>

            {/* Dynamic Phones */}
            <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', border: '1px solid #333' }}>
              <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '1.2rem' }}>Telefones de Contato da Loja</h3>
              
              {formData.telefones.map((tel, index) => (
                <div key={index} style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label" style={{ color: '#ccc', fontSize: '0.9rem' }}>Telefone {index + 1} {index === 0 && <span style={{color: 'red'}}>*</span>}</label>
                    <input 
                      type="text" 
                      required={index === 0}
                      value={tel} 
                      onChange={(e) => handlePhoneChange(index, e.target.value)}
                      className="form-control" 
                      placeholder="(DD) 9XXXX-XXXX"
                      style={{ backgroundColor: '#222', color: '#fff', border: '1px solid #444', padding: '15px', borderRadius: '8px' }} 
                    />
                  </div>
                </div>
              ))}

              {formData.telefones.length < 10 && (
                <button 
                  type="button" 
                  onClick={addPhone}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}
                >
                  <span style={{ fontSize: '1.2rem' }}>+</span> Adicionar outro telefone
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '20px', marginTop: '30px' }}>
              <button type="button" onClick={() => navigate('/lojistas')} className="btn btn-outline" style={{ flex: 1, padding: '20px', color: '#fff', borderColor: '#444' }} disabled={loading}>
                Voltar
              </button>
              <button type="submit" disabled={loading} style={{ flex: 2, padding: '20px', backgroundColor: currentTheme.primary, color: currentTheme.text, border: 'none', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? '0.7' : '1', transition: 'opacity 0.2s' }} onMouseEnter={e => {if(!loading) e.currentTarget.style.opacity = '0.9'}} onMouseLeave={e => {if(!loading) e.currentTarget.style.opacity = '1'}}>
                {loading ? 'Processando...' : 'Ir para Pagamento'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
