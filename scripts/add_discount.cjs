const fs = require('fs');
const file = 'c:/Users/delma/OneDrive/Área de Trabalho/delmar-vendeseucarro/src/pages/Ads.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add discount badge to Car Card
const cardTarget = `<div style={{ width: '100%', height: '200px', backgroundColor: '#f0f0f0', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>`;
const cardReplace = `<div style={{ width: '100%', height: '200px', backgroundColor: '#f0f0f0', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', position: 'relative' }}>
                          {discount > 0 && <div style={{position: 'absolute', top: 10, right: 10, background: 'var(--primary-color)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold'}}>-{discount}% FIPE</div>}`;
content = content.replace(cardTarget, cardReplace);

// 1.5 The image tag in card is rendered conditionally, let's just make sure there's a relative container. The above works if no image, but with image:
const imgTarget = `<img src={car.imagem} alt={car.modelo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />`;
const imgReplace = `<div style={{position: 'relative', width: '100%', height: '100%'}}>
                              <img src={car.imagem} alt={car.modelo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              {discount > 0 && <div style={{position: 'absolute', top: 10, right: 10, background: 'var(--primary-color)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold'}}>-{discount}% FIPE</div>}
                            </div>`;
content = content.replace(imgTarget, imgReplace);


// 2. Add discount to Modal (caixa grande)
const modalTarget = `<div style={{ fontSize: '0.9rem', fontWeight: '500', textDecoration: 'line-through' }}>R$ {selectedCar.fipe?.toLocaleString('pt-BR')}</div>`;
const modalReplace = `<div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                        <span style={{ textDecoration: 'line-through' }}>R$ {selectedCar.fipe?.toLocaleString('pt-BR')}</span>
                        {selectedCar.fipe && selectedCar.venda && selectedCar.fipe > selectedCar.venda && (
                          <span style={{ color: 'green', marginLeft: '8px', fontWeight: 'bold' }}>
                            (-{Math.round(((selectedCar.fipe - selectedCar.venda) / selectedCar.fipe) * 100)}%)
                          </span>
                        )}
                      </div>`;
content = content.replace(modalTarget, modalReplace);

fs.writeFileSync(file, content);
console.log('Ads.jsx discount added to cards and modal');
