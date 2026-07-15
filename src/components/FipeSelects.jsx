import React, { useState, useEffect } from 'react';
import { useFipe } from '../hooks/useFipe';

export default function FipeSelects({ formData, setFormData, hideAnoAndPreco = false, fieldSuffix = '', isOptional = false }) {
  const isTruck = ['3/4', 'Caminhão', 'Cavalo', 'Furgão', 'Van'].includes(formData.tipoVeiculo);
  const { 
    marcas, modelos, anos, 
    fetchModelos, fetchAnos, fetchPreco,
    loadingMarcas, loadingModelos, loadingAnos, error 
  } = useFipe(isTruck ? 'trucks' : 'cars');

  const [useFallback, setUseFallback] = useState(false);
  const [selectedMarcaCode, setSelectedMarcaCode] = useState('');
  const [selectedModeloCode, setSelectedModeloCode] = useState('');
  const [selectedAnoCode, setSelectedAnoCode] = useState('');

  const marcaKey = 'marca' + fieldSuffix;
  const modeloKey = 'modelo' + fieldSuffix;
  const anoKey = 'ano' + fieldSuffix;
  const precoKey = 'precoFipe' + fieldSuffix;

  useEffect(() => {
    if (!formData[marcaKey]) {
      setSelectedMarcaCode('');
      setSelectedModeloCode('');
      setSelectedAnoCode('');
    }
  }, [formData[marcaKey]]);
  const handleMarcaChange = (e) => {
    const code = e.target.value;
    const marca = marcas.find(m => String(m.codigo) === String(code));
    setSelectedMarcaCode(code);
    setSelectedModeloCode('');
    setSelectedAnoCode('');
    setFormData(prev => ({ 
      ...prev, 
      [marcaKey]: marca ? marca.nome : '', 
      [`${marcaKey}Code`]: code,
      [modeloKey]: '', 
      [`${modeloKey}Code`]: '',
      [anoKey]: '', 
      [precoKey]: '' 
    }));
    fetchModelos(code);
  };

  const handleModeloChange = (e) => {
    const code = e.target.value;
    const modelo = modelos.find(m => String(m.codigo) === String(code));
    setSelectedModeloCode(code);
    setSelectedAnoCode('');
    setFormData(prev => ({ 
      ...prev, 
      [modeloKey]: modelo ? modelo.nome : '', 
      [`${modeloKey}Code`]: code,
      [anoKey]: '', 
      [precoKey]: '' 
    }));
    fetchAnos(selectedMarcaCode, code);
  };

  const handleAnoChange = async (e) => {
    const code = e.target.value;
    const anoObj = anos.find(a => String(a.codigo) === String(code));
    setSelectedAnoCode(code);
    
    // Extract year from something like "2015 Gasolina"
    const parts = anoObj ? anoObj.nome.split(' ') : [];
    const anoStr = parts[0] || '';
    const fuelStr = parts.slice(1).join(' ') || '';
    const combustivelKey = 'combustivel' + fieldSuffix;
    const anoModeloKey = 'anoModelo' + fieldSuffix;
    
    setFormData(prev => ({ 
      ...prev, 
      [anoKey]: anoStr, 
      [anoModeloKey]: anoStr, // Usar o mesmo ano para o anoModelo
      [combustivelKey]: fuelStr,
      [precoKey]: 'Buscando...' 
    }));
    
    const data = await fetchPreco(selectedMarcaCode, selectedModeloCode, code);
    if (data && data.Valor) {
      setFormData(prev => ({ ...prev, [precoKey]: data.Valor }));
    } else {
      setFormData(prev => ({ ...prev, [precoKey]: '' }));
    }
  };

  const handleChangeText = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (useFallback) {
    return (
      <div style={{ display: 'flex', gap: '16px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Marca {!isOptional && <span style={{color: 'red'}}>*</span>}</label>
          <input type="text" name={marcaKey} value={formData[marcaKey] || ''} onChange={handleChangeText} className="form-control" placeholder="Ex: Volkswagen, Chevrolet..." required={!isOptional} />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Modelo {!isOptional && <span style={{color: 'red'}}>*</span>}</label>
          <input type="text" name={modeloKey} value={formData[modeloKey] || ''} onChange={handleChangeText} className="form-control" placeholder="Ex: Polo, Onix..." required={!isOptional} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Linha 1: Marca | Modelo */}
      <div style={{ display: 'flex', gap: '16px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Marca {!isOptional && <span style={{color: 'red'}}>*</span>}</label>
          <select value={selectedMarcaCode} onChange={handleMarcaChange} className="form-control" required={!isOptional} disabled={loadingMarcas}>
            <option value="">{loadingMarcas ? 'Carregando...' : 'Selecione...'}</option>
            {marcas.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
          </select>
        </div>
        
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Modelo {!isOptional && <span style={{color: 'red'}}>*</span>}</label>
          <select value={selectedModeloCode} onChange={handleModeloChange} className="form-control" required={!isOptional} disabled={!selectedMarcaCode || loadingModelos}>
            <option value="">{loadingModelos ? 'Carregando...' : 'Selecione a marca primeiro'}</option>
            {modelos.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
          </select>
        </div>
      </div>

      {/* Linha 2: Ano de Fabricação | Preço FIPE */}
      {!hideAnoAndPreco && (
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Ano de Fabricação {!isOptional && <span style={{color: 'red'}}>*</span>}</label>
            <select value={selectedAnoCode} onChange={handleAnoChange} className="form-control" required={!isOptional} disabled={!selectedModeloCode || loadingAnos}>
              <option value="">{loadingAnos ? 'Carregando...' : 'Selecione o modelo primeiro'}</option>
              {anos.map(a => <option key={a.codigo} value={a.codigo}>{a.nome}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Preço FIPE</label>
            <input type="text" className="form-control" value={formData[precoKey] || ''} disabled style={{ backgroundColor: '#e9ecef', color: '#495057' }} />
          </div>
        </div>
      )}
    </div>
  );
}
