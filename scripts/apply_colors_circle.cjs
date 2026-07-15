const fs = require('fs');
const file = 'c:/Users/delma/OneDrive/Área de Trabalho/delmar-vendeseucarro/src/pages/Ads.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `<div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>FIPE: R$ {car.fipe?.toLocaleString('pt-BR')}</div>`,
  `<div style={{ fontSize: '0.9rem', color: 'green', fontWeight: '600' }}>FIPE: R$ {car.fipe?.toLocaleString('pt-BR')}</div>`
);

content = content.replace(
  `<div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--primary-color)' }}>R$ {car.venda?.toLocaleString('pt-BR')}</div>`,
  `<div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'red' }}>R$ {car.venda?.toLocaleString('pt-BR')}</div>`
);

content = content.replace(
  `<div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary-color)', lineHeight: '1' }}>R$ {selectedCar.venda?.toLocaleString('pt-BR')}</div>`,
  `<div style={{ fontSize: '2rem', fontWeight: '800', color: 'red', lineHeight: '1' }}>R$ {selectedCar.venda?.toLocaleString('pt-BR')}</div>`
);

content = content.replace(
  `<span style={{ textDecoration: 'line-through' }}>R$ {selectedCar.fipe?.toLocaleString('pt-BR')}</span>`,
  `<span style={{ textDecoration: 'line-through', color: 'green', fontWeight: '600' }}>R$ {selectedCar.fipe?.toLocaleString('pt-BR')}</span>`
);

const endOfLeft = `                    );
                  })()}
                </div>
    
              {/* DIREITA: DADOS DO CARRO */}`;

const newEndOfLeft = `                    );
                  })()}

                  {selectedCar.fipe && selectedCar.venda && selectedCar.fipe > selectedCar.venda && (
                    <div style={{
                      position: 'absolute',
                      bottom: '16px',
                      right: '16px',
                      width: '60px',
                      height: '60px',
                      backgroundColor: 'var(--yellow-discount)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      boxShadow: 'var(--shadow-sm)',
                      fontWeight: 'bold',
                      fontSize: '1.2rem',
                      zIndex: 10
                    }}>
                      -{Math.round(((selectedCar.fipe - selectedCar.venda) / selectedCar.fipe) * 100)}%
                    </div>
                  )}

                </div>
    
              {/* DIREITA: DADOS DO CARRO */}`;

content = content.replace(endOfLeft, newEndOfLeft);

fs.writeFileSync(file, content);
console.log('Ads.jsx colors and yellow circle updated');
