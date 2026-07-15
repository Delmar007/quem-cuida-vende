import React, { useState, useEffect } from 'react';

export default function StateCitySelect({ formData, setFormData, fieldStateName = 'estado', fieldCityName = 'cidade', required = true, selectStyle = {}, labelStyle = {} }) {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
      .then(res => res.json())
      .then(data => setStates(data))
      .catch(console.error);
  }, []);

const capitals = {
  'AC': 'Rio Branco', 'AL': 'Maceió', 'AP': 'Macapá', 'AM': 'Manaus', 'BA': 'Salvador', 'CE': 'Fortaleza', 'DF': 'Brasília', 'ES': 'Vitória', 'GO': 'Goiânia', 'MA': 'São Luís', 'MT': 'Cuiabá', 'MS': 'Campo Grande', 'MG': 'Belo Horizonte', 'PA': 'Belém', 'PB': 'João Pessoa', 'PR': 'Curitiba', 'PE': 'Recife', 'PI': 'Teresina', 'RJ': 'Rio de Janeiro', 'RN': 'Natal', 'RS': 'Porto Alegre', 'RO': 'Porto Velho', 'RR': 'Boa Vista', 'SC': 'Florianópolis', 'SP': 'São Paulo', 'SE': 'Aracaju', 'TO': 'Palmas'
};

  useEffect(() => {
    if (formData[fieldStateName]) {
      // Find the UF acronym (sigla)
      const selectedState = states.find(s => s.sigla === formData[fieldStateName] || s.nome === formData[fieldStateName]);
      const uf = selectedState ? selectedState.sigla : formData[fieldStateName];
      
      if (uf && uf.length === 2) {
         fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
           .then(res => res.json())
           .then(data => {
             const capitalName = capitals[uf];
             if (capitalName) {
               const capitalIndex = data.findIndex(c => c.nome === capitalName);
               if (capitalIndex !== -1) {
                 const capitalObj = data.splice(capitalIndex, 1)[0];
                 data.unshift(capitalObj);
               }
             }
             setCities(data);
           })
           .catch(console.error);
      }
    } else {
      setCities([]);
    }
  }, [formData[fieldStateName], states]);

  const handleStateChange = (e) => {
    setFormData(prev => ({ ...prev, [fieldStateName]: e.target.value, [fieldCityName]: '' }));
  };

  const handleCityChange = (e) => {
    setFormData(prev => ({ ...prev, [fieldCityName]: e.target.value }));
  };

  return (
    <>
      <div className="form-group" style={{ flex: 1 }}>
        <label className="form-label" style={labelStyle}>Estado {required && <span style={{color: 'red'}}>*</span>}</label>
        <select name={fieldStateName} value={formData[fieldStateName] || ''} onChange={handleStateChange} className="form-control" required={required} style={selectStyle}>
          <option value="">Selecione...</option>
          {states.map(s => <option key={s.id} value={s.sigla}>{s.nome}</option>)}
        </select>
      </div>
      <div className="form-group" style={{ flex: 1 }}>
        <label className="form-label" style={labelStyle}>Cidade {required && <span style={{color: 'red'}}>*</span>}</label>
        <select name={fieldCityName} value={formData[fieldCityName] || ''} onChange={handleCityChange} className="form-control" required={required} disabled={!formData[fieldStateName] || cities.length === 0} style={selectStyle}>
          <option value="">Selecione...</option>
          {cities.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
        </select>
      </div>
    </>
  );
}
