const fs = require('fs');
const file = 'c:/Users/delma/OneDrive/Área de Trabalho/delmar-vendeseucarro/src/pages/Ads.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetHTML = `<div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Placa</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>Final --</div>
                  </div>`;
const newHTML = `<div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>IPVA Pago</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{selectedCar.ipva_pago ? 'Sim' : (selectedCar.ipva_pago === false ? 'Não' : '--')}</div>
                  </div>`;

content = content.replace(targetHTML, newHTML);
fs.writeFileSync(file, content);
console.log('Ads.jsx placa replaced with IPVA');
