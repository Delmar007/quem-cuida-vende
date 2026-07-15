const fs = require('fs');
const file = 'c:/Users/delma/OneDrive/Área de Trabalho/delmar-vendeseucarro/src/pages/Ads.jsx';
let content = fs.readFileSync(file, 'utf8');

const startIdx = content.indexOf('{selectedCar && (');
const endIdx = content.lastIndexOf(')}');

if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
  console.log('Index not found');
  process.exit(1);
}

const newModal = `{selectedCar && (
          <div 
            onClick={() => setSelectedCar(null)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          >
              <div 
                onClick={e => e.stopPropagation()}
                style={{ width: '100%', maxWidth: '900px', height: '80vh', maxHeight: '600px', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', position: 'relative', flexDirection: 'row' }}
              >
                {/* Fechar Modal */}
                <button 
                  onClick={() => setSelectedCar(null)}
                  style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', color: '#fff', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}
                >
                  ✕
                </button>
    
                {/* ESQUERDA: CARROSSEL DE IMAGENS */}
                <div style={{ width: '55%', height: '100%', backgroundColor: '#000', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {(() => {
                  const gallery = selectedCar.imagens && selectedCar.imagens.length > 0 ? selectedCar.imagens : (selectedCar.imagem ? [selectedCar.imagem] : []);
                  
                  if (gallery.length === 0) {
                    return <div style={{ color: '#666' }}>Sem foto</div>;
                  }
  
                  return (
                    <>
                      <img src={gallery[currentImageIndex]} alt="Carro" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      
                      {gallery.length > 1 && (
                        <>
                          <button 
                            onClick={() => setCurrentImageIndex(prev => prev === 0 ? gallery.length - 1 : prev - 1)}
                            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            &lt;
                          </button>
                          <button 
                            onClick={() => setCurrentImageIndex(prev => prev === gallery.length - 1 ? 0 : prev + 1)}
                            style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            &gt;
                          </button>
                          <div style={{ position: 'absolute', bottom: '16px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            {gallery.map((_, idx) => (
                              <div key={idx} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: idx === currentImageIndex ? 'var(--primary-color)' : 'rgba(255,255,255,0.5)' }}></div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
  
              {/* DIREITA: DADOS DO CARRO */}
              <div style={{ width: '45%', padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>{selectedCar.marca}</div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', lineHeight: '1.1', margin: '4px 0 8px 0', color: 'var(--text-primary)' }}>{selectedCar.modelo}</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>{selectedCar.versao}</div>
  
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px', backgroundColor: 'var(--surface)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ano Fab/Mod</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{selectedCar.ano}/{selectedCar.anoModelo}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Câmbio</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{selectedCar.cambio || '--'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Combustível</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{selectedCar.combustivel || '--'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Placa</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>Final --</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Tração</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{selectedCar.tracao || '--'}</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1', marginTop: '4px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Valor FIPE</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '500', textDecoration: 'line-through' }}>R$ {selectedCar.fipe?.toLocaleString('pt-BR')}</div>
                  </div>
                </div>
  
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Preço Delmar:</div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary-color)', lineHeight: '1' }}>R$ {selectedCar.venda?.toLocaleString('pt-BR')}</div>
                </div>
  
                <a 
                  href={\`https://wa.me/55\${selectedCar.proprietarioTelefone?.replace(/\\D/g, '')}?text=Olá!%20Tenho%20interesse%20no%20\${selectedCar.marca}%20\${selectedCar.modelo}%20\${selectedCar.ano}\`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px', fontSize: '0.95rem', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: 'auto', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #16a34a', borderRadius: 'var(--radius-sm)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  Chamar no WhatsApp
                </a>
              </div>
            </div>
          </div>
        `;

const newContent = content.substring(0, startIdx) + newModal + content.substring(endIdx);
fs.writeFileSync(file, newContent);
console.log('Update successful');
