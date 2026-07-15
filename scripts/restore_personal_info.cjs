const fs = require('fs');
const file = 'c:/Users/delma/OneDrive/Área de Trabalho/delmar-vendeseucarro/src/pages/SellCar.jsx';
let content = fs.readFileSync(file, 'utf8');

const personalInfoBlock = `
            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">WhatsApp <span style={{color: 'red'}}>*</span></label>
                <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="form-control" required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">E-mail <span style={{color: 'red'}}>*</span></label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-control" required />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Data de Nascimento <span style={{color: 'red'}}>*</span></label>
                <input type="date" name="dataNascimento" value={formData.dataNascimento} onChange={handleChange} className="form-control" required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Sexo <span style={{color: 'red'}}>*</span></label>
                <select name="sexo" value={formData.sexo} onChange={handleChange} className="form-control" required>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Estado Civil <span style={{color: 'red'}}>*</span></label>
              <select name="estadoCivil" value={formData.estadoCivil} onChange={handleChange} className="form-control" required>
                <option value="solteiro">Solteiro(a)</option>
                <option value="casado">Casado(a)</option>
                <option value="namorando">Namorando</option>
                <option value="divorciado">Divorciado(a)</option>
                <option value="viuvo">Viúvo(a)</option>
              </select>
            </div>

            {(formData.estadoCivil === 'casado' || formData.estadoCivil === 'namorando') && (
              <div style={{ padding: '16px', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '16px' }}>
                <h4 style={{ marginBottom: '12px', marginTop: 0 }}>Dados do Cônjuge/Namorado(a)</h4>
                <div className="form-group">
                  <label className="form-label">Nome do Cônjuge <span style={{color: 'red'}}>*</span></label>
                  <input type="text" name="conjugeNome" value={formData.conjugeNome} onChange={handleChange} className="form-control" required />
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Data de Nascimento <span style={{color: 'red'}}>*</span></label>
                    <input type="date" name="conjugeDataNascimento" value={formData.conjugeDataNascimento} onChange={handleChange} className="form-control" required />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">WhatsApp <span style={{color: 'red'}}>*</span></label>
                    <input type="text" name="conjugeWhatsapp" value={formData.conjugeWhatsapp} onChange={handleChange} className="form-control" required />
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Quantos filhos você tem? <span style={{color: 'red'}}>*</span></label>
              <select name="filhosCount" value={formData.filhosCount} onChange={handleFilhosCountChange} className="form-control" required>
                <option value="0">Nenhum</option>
                {[1, 2, 3, 4, 5, 6].map(num => <option key={num} value={num}>{num}</option>)}
              </select>
            </div>

            {parseInt(formData.filhosCount) > 0 && (
              <div style={{ padding: '16px', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '16px' }}>
                <h4 style={{ marginBottom: '12px', marginTop: 0 }}>Dados dos Filhos</h4>
                {formData.filhos.map((filho, idx) => (
                  <div key={idx} style={{ marginBottom: idx < formData.filhos.length - 1 ? '16px' : '0', paddingBottom: idx < formData.filhos.length - 1 ? '16px' : '0', borderBottom: idx < formData.filhos.length - 1 ? '1px solid #ccc' : 'none' }}>
                    <h5 style={{ marginTop: 0 }}>Filho(a) {idx + 1}</h5>
                    <div className="form-group">
                      <label className="form-label">Nome <span style={{color: 'red'}}>*</span></label>
                      <input type="text" value={filho.nome} onChange={(e) => {
                        const newFilhos = [...formData.filhos];
                        newFilhos[idx].nome = e.target.value;
                        setFormData({...formData, filhos: newFilhos});
                      }} className="form-control" required />
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Data de Nascimento <span style={{color: 'red'}}>*</span></label>
                        <input type="date" value={filho.dataNascimento} onChange={(e) => {
                          const newFilhos = [...formData.filhos];
                          newFilhos[idx].dataNascimento = e.target.value;
                          setFormData({...formData, filhos: newFilhos});
                        }} className="form-control" required />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">WhatsApp</label>
                        <input type="text" value={filho.whatsapp} onChange={(e) => {
                          const newFilhos = [...formData.filhos];
                          newFilhos[idx].whatsapp = e.target.value;
                          setFormData({...formData, filhos: newFilhos});
                        }} className="form-control" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <hr style={{ margin: '32px 0', borderColor: '#eee' }} />
            <h3 style={{ marginBottom: '16px', color: 'var(--primary-color)' }}>Dados do Veículo</h3>
`;

const regex = /(<div className="form-group">\s*<label className="form-label">Nome Completo.*?<\/div>)/s;
const match = content.match(regex);

if (match) {
  content = content.replace(regex, match[1] + '\n' + personalInfoBlock);
  fs.writeFileSync(file, content);
  console.log('Script concluded successfully');
} else {
  console.log('Regex did not match');
}
