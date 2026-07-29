import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const HOBBIES = [
  "Acrobacia", "Airsoft", "Alpinismo", "Artesanato", "Astrologia", "Automobilismo", "Ballet", 
  "Barbeiro (Estilo)", "Basquete", "Bordado", "Caligrafia", "Cerâmica", "Cervejaria Artesanal", 
  "Churrasco", "Ciclismo de Montanha", "Colecionismo de Carros", "Confeitaria", "Costura", 
  "Criação de Jogos", "Crochê", "Cuidados com a pele", "Culturismo", "Dança Contemporânea", 
  "Decoração de interiores", "Desenho de Moda", "Design de Joias", "DIY (Faça você mesmo)", 
  "Eletrônica", "Esportes de Contato", "Fotografia Artística", "Futebol", "Futebol Americano", 
  "Games (E-sports)", "Ginástica Rítmica", "Golfe", "Informática/Programação", "Jardinagem", 
  "Leituras de Romances", "Levantamento de Peso", "Macramê", "Maquiagem", "Marcenaria", 
  "Mecânica Automotiva", "Meditação", "Moda", "Motociclismo", "Pesca", "Pilates", 
  "Pintura de Miniaturas", "Pintura em Aquarela", "Poker", "Robótica", "Rugby", 
  "Scrapbooking", "Skate", "Sobrevivencialismo", "Tiro Esportivo", "Tricô", "Yoga", "Zumba"
];

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function Cadastro() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [cidades, setCidades] = useState([]);

  // Estados para Verificação de Identidade
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [cnhFile, setCnhFile] = useState(null);
  const [cnhPreview, setCnhPreview] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    documento: '',
    data_nascimento: '',
    hobby: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: 'MS' // Iniciando com MS
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        nome: prev.nome || session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
        email: prev.email || session.user.email || ''
      }));
    }
  }, [session]);

  // Fetch cidades quando o estado muda
  useEffect(() => {
    const uf = formData.estado.toUpperCase();
    if (ESTADOS.includes(uf)) {
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
        .then(res => res.json())
        .then(data => {
          // A API do IBGE já retorna em ordem quase alfabética, mas garantimos a ordenação
          const nomesCidades = data.map(c => c.nome).sort((a, b) => a.localeCompare(b));
          setCidades(nomesCidades);
        })
        .catch(err => console.error('Erro ao buscar cidades:', err));
    } else {
      setCidades([]); // Limpa se for um estado digitado manualmente que não tem na API
    }
  }, [formData.estado]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            rua: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  // Funções da Câmera
  const startCamera = async () => {
    if (!navigator.mediaDevices) {
      console.error("mediaDevices não disponível");
      alert("Seu navegador bloqueou o acesso à câmera por falta de conexão segura (HTTPS) ou porque o recurso não é suportado.");
      return;
    }
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setMediaStream(stream);
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      alert("Não foi possível acessar a câmera. Verifique as permissões do seu navegador.");
      setIsCameraOpen(false);
    }
  };

  useEffect(() => {
    if (isCameraOpen && videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [isCameraOpen, mediaStream]);

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPhotoDataUrl(dataUrl);
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setPhotoDataUrl(null);
    startCamera();
  };

  const handleCnhUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCnhFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCnhPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Limpar stream da câmera ao desmontar
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream]);

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Cadastro atualizado com sucesso!');
    navigate('/anuncios');
  };

  return (
    <div style={{ position: 'relative', backgroundColor: '#050505', backgroundImage: 'url("/parede.png")', backgroundSize: '100% 50%', backgroundRepeat: 'repeat-y', backgroundPosition: 'top', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: '800px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            Voltar
          </button>
        </div>

        <div style={{ backgroundColor: 'var(--surface)', padding: '40px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ margin: '0 0 15px 0', fontSize: '2rem', color: 'var(--text-primary)' }}>Seu Cadastro</h1>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', margin: '0 auto', maxWidth: '480px' }}>
              {session?.user?.user_metadata?.avatar_url ? (
                <img src={session.user.user_metadata.avatar_url} alt="Perfil" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--border)' }} />
              ) : (
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid var(--border)' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
              )}
              <p style={{ 
                color: 'var(--text-secondary)', 
                margin: 0, 
                fontSize: '1.2rem', 
                maxWidth: '350px',
                lineHeight: '1.4',
                textAlign: 'left'
              }}>
                Mantenha seus dados atualizados para negociar com segurança na plataforma
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Dados Pessoais */}
            <div>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '20px' }}>Dados Pessoais</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Nome Completo *</label>
                  <input required name="nome" value={formData.nome} onChange={handleChange} readOnly={!!session?.user} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: session?.user ? '#f9f9f9' : '#fff', color: session?.user ? '#666' : 'var(--text-primary)', cursor: session?.user ? 'not-allowed' : 'text' }} placeholder="Ex: João da Silva" />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Email *</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} readOnly={!!session?.user} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: session?.user ? '#f9f9f9' : '#fff', color: session?.user ? '#666' : 'var(--text-primary)', cursor: session?.user ? 'not-allowed' : 'text' }} placeholder="seuemail@exemplo.com" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Telefone / WhatsApp *</label>
                  <input required name="telefone" value={formData.telefone} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: '#fff', color: 'var(--text-primary)' }} placeholder="(00) 00000-0000" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>CPF *</label>
                  <input required name="documento" value={formData.documento} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: '#fff', color: 'var(--text-primary)' }} placeholder="000.000.000-00" maxLength="14" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Data de Nascimento *</label>
                  <input required type="date" name="data_nascimento" value={formData.data_nascimento} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: '#fff', color: 'var(--text-primary)' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Hobby / Interesse</label>
                  <input name="hobby" list="hobbies_list" value={formData.hobby} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: '#fff', color: 'var(--text-primary)' }} placeholder="Selecione ou digite um hobby" />
                  <datalist id="hobbies_list">
                    {HOBBIES.map(h => <option key={h} value={h} />)}
                  </datalist>
                </div>
              </div>
            </div>

            {/* Verificação de Identidade */}
            <div>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '20px', marginTop: '10px' }}>Verificação de Identidade</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                
                {/* Lado Esquerdo: Foto do Rosto */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>Tire uma foto do seu rosto</h3>
                  <div style={{ 
                    position: 'relative', 
                    width: '200px', 
                    height: '250px', 
                    backgroundColor: '#111', 
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {photoDataUrl ? (
                      <img src={photoDataUrl} alt="Rosto Capturado" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : isCameraOpen ? (
                      <>
                        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                        {/* Overlay Oval */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 70%)' }}></div>
                        <div style={{ position: 'absolute', top: '10%', bottom: '10%', left: '20%', right: '20%', border: '2px dashed rgba(255,255,255,0.5)', borderRadius: '50%', pointerEvents: 'none' }}></div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '10px' }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                        <p style={{ margin: 0, fontSize: '0.85rem' }}>Câmera Desligada</p>
                      </div>
                    )}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                  </div>

                  {photoDataUrl ? (
                    <button type="button" onClick={retakePhoto} style={{ padding: '8px 16px', backgroundColor: '#fff', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '20px', cursor: 'pointer', fontSize: '0.9rem', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f0f0f0'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#fff'}>
                      Refazer Foto
                    </button>
                  ) : isCameraOpen ? (
                    <button type="button" onClick={takePhoto} style={{ padding: '10px 24px', backgroundColor: '#E53935', border: 'none', color: '#fff', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', transition: 'transform 0.1s' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                      Capturar Foto
                    </button>
                  ) : (
                    <button type="button" onClick={startCamera} style={{ padding: '10px 24px', backgroundColor: 'var(--primary-color)', border: 'none', color: '#fff', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      Ligar Câmera
                    </button>
                  )}
                </div>

                {/* Lado Direito: CNH */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>Importe um print da sua CNH</h3>
                  <div style={{ 
                    position: 'relative', 
                    width: '100%', 
                    maxWidth: '300px',
                    height: '200px', 
                    backgroundColor: '#fff', 
                    borderRadius: 'var(--radius-md)',
                    border: '2px dashed var(--border)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }} onClick={() => document.getElementById('cnh-upload').click()}>
                    {cnhPreview ? (
                      <img src={cnhPreview} alt="Preview CNH" style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#111' }} />
                    ) : (
                      <>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1" style={{ marginBottom: '10px' }}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#888', textAlign: 'center', padding: '0 10px' }}>Clique aqui para selecionar o arquivo da sua CNH</p>
                      </>
                    )}
                    <input id="cnh-upload" type="file" accept="image/*" onChange={handleCnhUpload} style={{ display: 'none' }} />
                  </div>
                  {cnhPreview && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setCnhPreview(null); setCnhFile(null); }} style={{ padding: '8px 16px', backgroundColor: '#fff', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '20px', cursor: 'pointer', fontSize: '0.9rem', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f0f0f0'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#fff'}>
                      Remover CNH
                    </button>
                  )}
                </div>

              </div>
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.95rem', fontStyle: 'italic', marginTop: '25px' }}>
                <span style={{ color: '#E53935', fontWeight: 'bold' }}>Segurança:</span> Nosso sistema fará a comparação do seu rosto com a imagem da CNH.
              </p>
            </div>

            {/* Endereço */}
            <div>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '20px', marginTop: '10px' }}>Endereço</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>CEP *</label>
                  <input required name="cep" value={formData.cep} onChange={handleChange} onBlur={handleCepBlur} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: '#fff', color: 'var(--text-primary)' }} placeholder="00000-000" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: 'span 2' }}>
                  <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Rua / Logradouro *</label>
                  <input required name="rua" value={formData.rua} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: '#fff', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Número *</label>
                  <input required name="numero" value={formData.numero} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: '#fff', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Complemento</label>
                  <input name="complemento" value={formData.complemento} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: '#fff', color: 'var(--text-primary)' }} placeholder="Apto, Sala, Casa" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Bairro *</label>
                  <input required name="bairro" value={formData.bairro} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: '#fff', color: 'var(--text-primary)' }} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Estado *</label>
                  <select required name="estado" value={formData.estado} onChange={handleChange} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: '#fff', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', appearance: 'none' }}>
                    <option value="" disabled style={{ color: '#000' }}>Selecione um Estado</option>
                    {ESTADOS.map(uf => <option key={uf} value={uf} style={{ color: '#000' }}>{uf}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Cidade *</label>
                  <select required name="cidade" value={formData.cidade} onChange={handleChange} disabled={!formData.estado || cidades.length === 0} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: '#fff', color: 'var(--text-primary)', outline: 'none', cursor: (!formData.estado || cidades.length === 0) ? 'not-allowed' : 'pointer', appearance: 'none', opacity: (!formData.estado || cidades.length === 0) ? 0.5 : 1 }}>
                    <option value="" disabled style={{ color: '#000' }}>{(!formData.estado || cidades.length === 0) ? 'Aguardando Estado...' : 'Selecione uma Cidade'}</option>
                    {cidades.map(c => <option key={c} value={c} style={{ color: '#000' }}>{c}</option>)}
                  </select>
                </div>

              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="submit" style={{ padding: '14px 40px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#621028'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'var(--primary-color)'}>
                Salvar Cadastro
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
