const fs = require('fs');
const file = 'c:/Users/delma/OneDrive/Área de Trabalho/delmar-vendeseucarro/src/pages/Ads.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Change button color to red
const btnTarget = `<button className="btn btn-outline" style={{ width: '350px', height: '100px', fontSize: '1.2rem', fontWeight: '600' }} onClick={handlePedidosClick}>Ver Pedidos</button>`;
const btnReplace = `<button className="btn" style={{ width: '350px', height: '100px', fontSize: '1.2rem', fontWeight: '600', backgroundColor: '#d32f2f', color: '#fff', border: 'none' }} onClick={handlePedidosClick}>Ver Pedidos</button>`;
content = content.replace(btnTarget, btnReplace);

// 2. Add Negociação to Modal
const ipvaTarget = `                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>IPVA Pago</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{selectedCar.ipva_pago ? 'Sim' : (selectedCar.ipva_pago === false ? 'Não' : '--')}</div>
                  </div>`;
const ipvaReplace = `                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>IPVA Pago</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{selectedCar.ipva_pago ? 'Sim' : (selectedCar.ipva_pago === false ? 'Não' : '--')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Negociação</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--primary-color)' }}>{selectedCar.negociacao || '--'}</div>
                  </div>`;
content = content.replace(ipvaTarget, ipvaReplace);

// 3. Add Negociação to Card
const cardAnoTarget = `                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '8px' }}>
                              Ano: {car.ano}/{car.anoModelo} • {car.cambio || '--'} • {car.combustivel || '--'}
                            </div>`;
const cardAnoReplace = `                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '8px' }}>
                              Ano: {car.ano}/{car.anoModelo} • {car.cambio || '--'} • {car.combustivel || '--'} <br />
                              <span style={{display: 'inline-block', marginTop: '4px', fontWeight: '600', color: 'var(--primary-color)'}}>Negociação: {car.negociacao || '--'}</span>
                            </div>`;
content = content.replace(cardAnoTarget, cardAnoReplace);

fs.writeFileSync(file, content);
console.log('Ads.jsx negociacao and button updated');
