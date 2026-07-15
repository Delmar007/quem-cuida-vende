import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Institutional() {
  const { page } = useParams();
  const navigate = useNavigate();
  const [contentList, setContentList] = useState([]);
  const [showCategorias, setShowCategorias] = useState(false);
  const [showNegociacao, setShowNegociacao] = useState(false);
  const [session, setSession] = useState(null);
  
  // Testimonial States
  const [userTestimonials, setUserTestimonials] = useState([]);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [testimonialText, setTestimonialText] = useState('');
  const [testimonialImage, setTestimonialImage] = useState(null);
  const [testimonialPreview, setTestimonialPreview] = useState(null);
  const [testimonialLoading, setTestimonialLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const titles = {
    'quem-somos': 'Quem Somos',
    'nossos-clientes': 'Nossos Clientes',
    'nossa-oficina': 'Nossa Oficina',
    'testemunhos': 'Testemunhos'
  };

  useEffect(() => {
    const fetchInstitucional = async () => {
      try {
        const { data, error } = await supabase
          .from('institucional')
          .select('*')
          .eq('page', page);
          
        if (error) {
          console.error("Erro ao carregar os dados", error);
          return;
        }

        if (data && data.length > 0) {
          setContentList(data);
        } else {
          setContentList([]);
        }

        if (page === 'testemunhos') {
          const { data: userT, error: errT } = await supabase
            .from('user_testimonials')
            .select('*')
            .eq('status', 'approved')
            .order('created_at', { ascending: false });
          if (userT) setUserTestimonials(userT);
        } else {
          setUserTestimonials([]);
        }
      } catch (e) {
        console.error("Exceção ao buscar dados", e);
      }
    };

    fetchInstitucional();
  }, [page]);

  return (
    <div style={{ backgroundColor: 'var(--background)', backgroundImage: "url('/cabeçalho_colmeia.png.png')", backgroundSize: 'cover', backgroundAttachment: 'fixed', minHeight: '100vh' }}>
      {/* Header com Logo de 940px e Seta de Voltar */}
      <header style={{ width: '100%', maxWidth: '940px', margin: '0 auto', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}
          title="Voltar"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <Link to="/anuncios" style={{ width: '100%' }}>
          <img src="/logo_larga.png" alt="Logo do Site" style={{ width: '100%', maxWidth: '940px', height: 'auto', display: 'block' }} />
        </Link>
      </header>

      {/* Conteúdo Dinâmico com max-width 940px */}
      <main style={{ maxWidth: '940px', margin: '60px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: '40px' }}>
          {page === 'testemunhos' && (
            <button 
              onClick={() => {
                if (!session) { alert('Você precisa estar logado para criar um testemunho. Faça login na página inicial.'); return; }
                setShowTestimonialModal(true);
              }}
              style={{ position: 'absolute', right: 0, padding: '8px 16px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
              Criar um testemunho +
            </button>
          )}
          <h1 style={{ fontSize: '3.5rem', fontWeight: '700', margin: 0, textAlign: 'center', color: '#fff', fontFamily: 'Porsche, sans-serif' }}>
            {titles[page] || 'Página Institucional'}
          </h1>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {contentList.length > 0 ? (
            contentList.map((card, index) => (
              <div 
                key={card.id || index} 
                className="institutional-card"
                style={{ 
                  display: 'flex', 
                  flexDirection: page === 'nossos-clientes' ? 'row' : 'column', 
                  backgroundColor: '#fff', 
                  borderRadius: 'var(--radius-lg)', 
                  boxShadow: 'var(--shadow-md)', 
                  overflow: 'hidden',
                  width: '100%',
                  height: page === 'nossos-clientes' ? '600px' : 'auto'
                }}
              >
                {/* Foto */}
                <div style={{ 
                  position: 'relative',
                  width: page === 'nossos-clientes' ? '50%' : '100%', 
                  height: page === 'nossos-clientes' ? '100%' : 'auto',
                  maxHeight: page === 'nossos-clientes' ? 'none' : '940px', 
                  backgroundColor: '#f0f0f0' 
                }}>
                  {card.image ? (
                    <img 
                      src={card.image} 
                      alt={card.title || "Imagem"} 
                      style={{ 
                        width: '100%', 
                        height: page === 'nossos-clientes' ? '100%' : 'auto', 
                        maxHeight: page === 'nossos-clientes' ? 'none' : '940px', 
                        objectFit: 'cover', 
                        display: 'block' 
                      }} 
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>Sem Imagem</div>
                  )}
                  <h2 style={{ 
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    right: '10px',
                    margin: 0,
                    textAlign: 'center',
                    fontSize: 'clamp(1rem, 3vw, 1.8rem)', 
                    fontWeight: '900', 
                    textTransform: 'uppercase', 
                    color: '#000', 
                    WebkitTextStroke: '1.5px #fff',
                    textShadow: '0 2px 6px rgba(0,0,0,0.5)',
                    fontFamily: 'Porsche, sans-serif',
                    zIndex: 10,
                    lineHeight: '1',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {card.title || titles[page]}
                  </h2>
                </div>

                {/* Textos */}
                <div style={{ 
                  width: page === 'nossos-clientes' ? '50%' : '100%', 
                  padding: page === 'nossos-clientes' ? '64px 32px 32px 32px' : '32px', 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  overflowY: page === 'nossos-clientes' ? 'auto' : 'visible'
                }}>
                  <div 
                    style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}
                    dangerouslySetInnerHTML={{ __html: card.text_content }}
                  />
                </div>
              </div>
            ))
          ) : (
            page !== 'testemunhos' && (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px' }}>
                Ainda não há cartões cadastrados nesta página. Acesse o painel Admin para preencher.
              </p>
            )
          )}

          {/* Testemunhos de Usuários Aprovados */}
          {page === 'testemunhos' && userTestimonials.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginTop: '40px' }}>
              {userTestimonials.map(t => (
                <div key={t.id} style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {t.image && (
                    <div style={{ height: '200px', backgroundColor: '#f0f0f0' }}>
                      <img src={t.image} alt="Testemunho" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: '24px', flex: 1 }}>"{t.text}"</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                      {t.user_photo ? (
                        <img src={t.user_photo} alt={t.user_name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                          {t.user_name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{t.user_name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#999' }}>{new Date(t.created_at).toLocaleDateString('pt-BR')}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal de Criação de Testemunho */}
      {showTestimonialModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '600px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '32px', position: 'relative' }}>
            <button 
              onClick={() => {
                setShowTestimonialModal(false);
                setTestimonialText('');
                setTestimonialImage(null);
                setTestimonialPreview(null);
              }}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}
            >
              ✕
            </button>
            <h2 style={{ marginBottom: '24px', fontSize: '1.5rem', fontWeight: 'bold' }}>Seu Testemunho</h2>
            <p style={{ marginBottom: '16px', fontSize: '0.9rem', color: '#666' }}>Escreva sobre a sua experiência. Ele passará por aprovação antes de aparecer no site.</p>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!session) { alert('Faça login primeiro.'); return; }
              if (testimonialText.length > 600) { alert('O texto deve ter no máximo 600 caracteres.'); return; }
              setTestimonialLoading(true);

              try {
                let imageUrl = null;
                if (testimonialImage) {
                  const fileName = `${Date.now()}_${testimonialImage.name}`;
                  const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('carros')
                    .upload(fileName, testimonialImage);
                  if (uploadError) throw uploadError;
                  
                  const { data: { publicUrl } } = supabase.storage
                    .from('carros')
                    .getPublicUrl(fileName);
                  imageUrl = publicUrl;
                }

                const { error } = await supabase.from('user_testimonials').insert([{
                  user_id: session.user.id,
                  user_name: session.user.user_metadata?.full_name || 'Usuário',
                  user_photo: session.user.user_metadata?.avatar_url || '',
                  text: testimonialText,
                  image: imageUrl,
                  status: 'pending'
                }]);

                if (error) throw error;
                
                alert('Seu testemunho foi enviado para aprovação! Obrigado!');
                setShowTestimonialModal(false);
                setTestimonialText('');
                setTestimonialImage(null);
                setTestimonialPreview(null);
              } catch (err) {
                console.error(err);
                alert('Ocorreu um erro ao enviar seu testemunho. Tente novamente.');
              } finally {
                setTestimonialLoading(false);
              }
            }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Adicionar Foto (Opcional)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {testimonialPreview ? (
                    <img src={testimonialPreview} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                  ) : (
                    <div style={{ width: '100px', height: '100px', backgroundColor: '#f0f0f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>Sem Imagem</div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setTestimonialImage(file);
                      setTestimonialPreview(URL.createObjectURL(file));
                    }
                  }} />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Relato <span style={{color:'red'}}>*</span></label>
                <textarea 
                  required
                  rows="5"
                  maxLength="600"
                  value={testimonialText}
                  onChange={e => setTestimonialText(e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '4px', resize: 'vertical' }}
                  placeholder="Conte-nos como foi sua experiência..."
                ></textarea>
                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: testimonialText.length >= 600 ? 'red' : '#666', marginTop: '4px' }}>
                  {testimonialText.length}/600 caracteres
                </div>
              </div>

              <button 
                type="submit" 
                disabled={testimonialLoading}
                style={{ width: '100%', padding: '14px', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '1.1rem', cursor: testimonialLoading ? 'not-allowed' : 'pointer', opacity: testimonialLoading ? 0.7 : 1 }}
              >
                {testimonialLoading ? 'Enviando...' : 'Enviar Testemunho'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
