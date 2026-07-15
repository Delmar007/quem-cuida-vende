const fs = require('fs');
const files = ['src/pages/BuyCar.jsx', 'src/pages/SellCar.jsx'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('const [showFamiliares')) {
    content = content.replace(/const \[loading, setLoading\] = useState\(false\);/, 
`const [loading, setLoading] = useState(false);
  const [showFamiliares, setShowFamiliares] = useState(false);`);
  }

  const startMarker = `<p style={{color: 'red', fontSize: '1.2rem', fontWeight: '600', marginTop: '16px', marginBottom: '8px', textAlign: 'center'}}>Cadastro aniversariantes</p>`;
  const endMarker = `</>
          )}

          <p style={{color: 'red', fontSize: '1.2rem', fontWeight: '600', marginBottom: '16px', textAlign: 'center'`;

  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);

  if (startIndex !== -1 && endIndex !== -1) {
    const newLayout = `<p style={{color: 'red', fontSize: '1.2rem', fontWeight: '600', marginTop: '16px', marginBottom: '8px', textAlign: 'center'}}>Cadastro aniversariantes</p>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Data de Nascimento do usuário <span style={{color: 'red'}}>*</span></label>
            <input type="date" name="dataNascimento" value={formData.dataNascimento} onChange={handleChange} className="form-control" required />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <button 
              type="button" 
              onClick={() => setShowFamiliares(!showFamiliares)} 
              style={{ backgroundColor: '#1e3a8a', color: 'white', padding: '10px 20px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Cadastrar Familiares
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', justifyContent: 'center' }}>
            <p style={{color: 'red', fontSize: '0.9rem', marginBottom: '0', fontWeight: '500', maxWidth: '400px'}}>Adicione a data do aniversário e concorra a prêmios. A data dos familiares não é obrigatória, porém dá a chance do aniversariante do mês a concorrer a prêmios mensais.</p>
            <img src="/premios.png" alt="Prêmios" style={{ height: '100px', objectFit: 'contain' }} />
          </div>

          {showFamiliares && (
            <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: '16px', backgroundColor: '#f9fafb' }}>
              <div className="form-group">
                <label className="form-label">Estado Civil</label>
                <select name="estadoCivil" value={formData.estadoCivil} onChange={handleChange} className="form-control">
                  <option value="solteiro">Solteiro</option>
                  <option value="namorando">Namorando</option>
                  <option value="casado">Casado</option>
                </select>
              </div>

              {(formData.estadoCivil === 'casado' || formData.estadoCivil === 'namorando') && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontWeight: '600', marginBottom: '8px' }}>Dados do Cônjuge</p>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: '1 1 200px', marginBottom: '0' }}>
                      <label className="form-label">Nome Completo</label>
                      <input type="text" name="conjugeNome" value={formData.conjugeNome} onChange={handleChange} className="form-control" />
                    </div>
                    <div className="form-group" style={{ flex: '1 1 150px', marginBottom: '0' }}>
                      <label className="form-label">Data de Nascimento</label>
                      <input type="date" name="conjugeDataNascimento" value={formData.conjugeDataNascimento} onChange={handleChange} className="form-control" />
                    </div>
                    <div className="form-group" style={{ flex: '1 1 150px', marginBottom: '0' }}>
                      <label className="form-label">WhatsApp</label>
                      <input type="tel" name="conjugeWhatsapp" value={formData.conjugeWhatsapp} onChange={handleChange} className="form-control" />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <div className="form-group" style={{ flex: '1 1 120px', marginBottom: 0 }}>
                  <label className="form-label">Possui filhos?</label>
                  <select name="filhosCount" value={formData.filhosCount} onChange={handleFilhosCountChange} className="form-control">
                    {Array.from({length: 11}, (_, i) => (
                      <option key={i} value={i}>{i}</option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.filhos.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontWeight: '600', marginBottom: '8px' }}>Dados dos Filhos</p>
                  {formData.filhos.map((filho, i) => (
                    <div key={i} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <div className="form-group" style={{ flex: '1 1 200px', marginBottom: '0' }}>
                        <label className="form-label">Nome Completo</label>
                        <input type="text" value={filho.nome} onChange={(e) => handleFilhoChange(i, 'nome', e.target.value)} className="form-control" />
                      </div>
                      <div className="form-group" style={{ flex: '1 1 150px', marginBottom: '0' }}>
                        <label className="form-label">Data de Nascimento</label>
                        <input type="date" value={filho.dataNascimento} onChange={(e) => handleFilhoChange(i, 'dataNascimento', e.target.value)} className="form-control" />
                      </div>
                      <div className="form-group" style={{ flex: '1 1 150px', marginBottom: '0' }}>
                        <label className="form-label">WhatsApp</label>
                        <input type="tel" value={filho.whatsapp} onChange={(e) => handleFilhoChange(i, 'whatsapp', e.target.value)} className="form-control" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div className="form-group" style={{ flex: '1 1 120px', marginBottom: 0 }}>
              <label className="form-label">Sexo</label>
              <select name="sexo" value={formData.sexo} onChange={handleChange} className="form-control">
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
              <label className="form-label">Hobby preferido</label>
              <select name="hobby" value={formData.hobby} onChange={handleChange} className="form-control">
                <option value="">Selecione...</option>
                {hobbies.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: '1 1 150px', marginBottom: 0 }}>
              <label className="form-label">Time do coração</label>
              <select name="time" value={formData.time} onChange={handleChange} className="form-control">
                <option value="">Selecione...</option>
                {timesFutebol.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
`;
    
    content = content.substring(0, startIndex) + newLayout + content.substring(endIndex);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully updated', file);
  } else {
    console.log('Markers not found in', file);
  }
}
