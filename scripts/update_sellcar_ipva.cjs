const fs = require('fs');
const file = 'c:/Users/delma/OneDrive/Área de Trabalho/delmar-vendeseucarro/src/pages/SellCar.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /precoFipe: '',\n\s*precoPedido: '',/g,
  "precoFipe: '',\n      precoPedido: '',\n      ipvaPago: 'sim',"
);

content = content.replace(
  /venda: formData\.precoPedido \? unmask\(formData\.precoPedido\) : 0,/g,
  "venda: formData.precoPedido ? unmask(formData.precoPedido) : 0,\n          ipva_pago: formData.ipvaPago === 'sim',"
);

const targetHTML = `<input type="text" name="precoPedido" value={formData.precoPedido} onChange={handleCurrencyChange} onBlur={handleCurrencyBlur} className="form-control" placeholder="Ex: 50.000,00" required />
              </div>
            </div>`;
const newHTML = `<input type="text" name="precoPedido" value={formData.precoPedido} onChange={handleCurrencyChange} onBlur={handleCurrencyBlur} className="form-control" placeholder="Ex: 50.000,00" required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">IPVA Pago? <span style={{color: 'red'}}>*</span></label>
              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="ipvaPago" value="sim" checked={formData.ipvaPago === 'sim'} onChange={handleChange} /> Sim
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="ipvaPago" value="nao" checked={formData.ipvaPago === 'nao'} onChange={handleChange} /> Não
                </label>
              </div>
            </div>`;
content = content.replace(targetHTML, newHTML);

fs.writeFileSync(file, content);
console.log('SellCar.jsx ipva pago inserted');
