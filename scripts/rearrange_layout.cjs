const fs = require('fs');
const file = 'c:/Users/delma/OneDrive/Área de Trabalho/delmar-vendeseucarro/src/pages/SellCar.jsx';
let content = fs.readFileSync(file, 'utf8');

const newFormLayout = `
          <div style={{ display: 'flex', gap: '16px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Marca <span style={{color: 'red'}}>*</span></label>
              <select name="marca" value={selectedMarcaCode} onChange={handleMarcaChange} className="form-control" required>
                <option value="">Selecione...</option>
                {fipeMarcas.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Modelo</label>
              <select name="modelo" value={selectedModeloCode} onChange={handleModeloChange} className="form-control" required disabled={!selectedMarcaCode}>
                <option value="">Selecione...</option>
                {fipeModelos.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Ano de Fabricação <span style={{color: 'red'}}>*</span></label>
              <select name="ano" value={selectedAnoCode} onChange={handleAnoChange} className="form-control" required disabled={!selectedModeloCode}>
                <option value=""></option>
                {fipeAnos.map(a => <option key={a.codigo} value={a.codigo}>{a.nome}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Câmbio <span style={{color: 'red'}}>*</span></label>
              <select name="cambio" value={formData.cambio} onChange={handleChange} className="form-control" required>
                <option value="">Selecione...</option>
                <option value="Manual">Manual</option>
                <option value="Automático">Automático</option>
                <option value="Dualogic">Dualogic</option>
                <option value="Hidramático">Hidramático</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Tração <span style={{color: 'red'}}>*</span></label>
              <select name="tracao" value={formData.tracao} onChange={handleChange} className="form-control" required>
                <option value="">Selecione...</option>
                <option value="4x2">4x2</option>
                <option value="4x4">4x4</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Tipo de Negociação <span style={{color: 'red'}}>*</span></label>
              <select name="negociacao" value={formData.negociacao} onChange={handleChange} className="form-control" required>
                <option value="">Selecione...</option>
                {negociacoesList.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label" style={{ color: 'red', fontWeight: 'bold' }}>Preço FIPE</label>
              {formData.precoFipe ? (
                <div style={{ display: 'inline-block', backgroundColor: '#ffe5e5', color: 'red', fontWeight: 'bold', padding: '10px 12px', borderRadius: '4px', width: '100%', fontSize: '1.1rem' }}>
                  <span>R$ {Number(formData.precoFipe).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
              ) : (!formData.marca || !formData.modelo || !formData.ano) ? (
                <div style={{ color: '#666', fontSize: '0.9rem', backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', fontStyle: 'italic' }}>
                  <span>Preencha as 3 informações (Marca, Modelo e Ano) para ver o FIPE.</span>
                </div>
              ) : (
                <div style={{ color: '#d32f2f', fontSize: '0.9rem', backgroundColor: '#ffe5e5', padding: '10px', borderRadius: '4px' }}>
                  FIPE indisponível para este ano/modelo.
                </div>
              )}
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Preço Pedido (R$) <span style={{color: 'red'}}>*</span></label>
              <input type="text" name="precoPedido" value={formData.precoPedido} onChange={handleCurrencyChange} onBlur={handleCurrencyBlur} className="form-control" placeholder="Ex: 50.000,00" required />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">No momento o KM é: <span style={{color: 'red'}}>*</span></label>
              <input type="text" name="km" value={formData.km} onChange={handleIntChange} className="form-control" placeholder="Ex: 60.000" required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Cidade (MS) <span style={{color: 'red'}}>*</span></label>
              <select name="cidade" value={formData.cidade} onChange={handleChange} className="form-control" required>
                <option value="">Selecione...</option>
                {cidadesMS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Importar Imagens (até 6 fotos 1:1)</label>
`;

const startIndex = content.indexOf('<div style={{ display: \'flex\', gap: \'16px\' }}>');
const endIndex = content.indexOf('<div className="form-group">\n            <label className="form-label">Importar Imagens');

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newFormLayout.trim() + content.substring(endIndex + 115);
  fs.writeFileSync(file, content);
  console.log('Script concluded successfully');
} else {
  console.log('Could not find start or end index');
}
