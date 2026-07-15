import React from 'react';
import FipeSelects from './FipeSelects';
import StateCitySelect from './StateCitySelect';
import { maskCurrency, maskInt, applyCurrencyBlur } from '../utils/masks';

export default function TradeInForm({ data, setData, images, setImages }) {

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleCurrencyChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: maskCurrency(value) }));
  };

  const handleIntChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: maskInt(value) }));
  };

  const handleCurrencyBlur = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: applyCurrencyBlur(value) }));
  };

  const handleImageUpload = (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    const newImages = [...images];
    newImages[index] = { file, preview };
    setImages(newImages);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
      <div className="form-group">
        <label className="form-label">Tipo de Veículo <span style={{color: 'red'}}>*</span></label>
        <select name="tipoVeiculo" value={data.tipoVeiculo} onChange={handleChange} className="form-control" required>
          <option value="">Selecione...</option>
          <option value="3/4">3/4</option>
          <option value="Caminhão">Caminhão</option>
          <option value="Cavalo">Cavalo</option>
          <option value="Conversível">Conversível</option>
          <option value="Crossover">Crossover</option>
          <option value="Elétrico">Elétrico</option>
          <option value="Furgão">Furgão</option>
          <option value="Hatchback">Hatchback</option>
          <option value="Híbrido">Híbrido</option>
          <option value="SW">SW</option>
          <option value="Pick-UP">Pick-UP</option>
          <option value="Sedã">Sedã</option>
          <option value="Sport">Sport</option>
          <option value="SUV">SUV</option>
          <option value="Van">Van</option>
        </select>
      </div>

      <FipeSelects formData={data} setFormData={setData} />

      <div className="form-row">
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Câmbio <span style={{color: 'red'}}>*</span></label>
          <select name="cambio" value={data.cambio} onChange={handleChange} className="form-control" required>
            <option value="">Selecione...</option>
            <option value="Manual">Manual</option>
            <option value="Automático">Automático</option>
            <option value="Dualogic">Dualogic</option>
            <option value="Hidramático">Hidramático</option>
            <option value="6x2">6x2</option>
            <option value="6x4">6x4</option>
          </select>
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Tração <span style={{color: 'red'}}>*</span></label>
          <select name="tracao" value={data.tracao} onChange={handleChange} className="form-control" required>
            <option value="">Selecione...</option>
            <option value="4x2">4x2</option>
            <option value="4x4">4x4</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Valor Avaliado / Pedido (R$)</label>
          <input type="text" name="precoPedido" value={data.precoPedido} onChange={handleCurrencyChange} onBlur={handleCurrencyBlur} className="form-control" placeholder="0,00" />
        </div>
      </div>

      <div className="form-row">
        <StateCitySelect formData={data} setFormData={setData} />
      </div>

      <div className="form-row">
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Quilometragem (KM) <span style={{color: 'red'}}>*</span></label>
          <input type="text" name="km" value={data.km} onChange={handleIntChange} className="form-control" placeholder="Ex: 50.000" required />
        </div>
      </div>

      <div className="form-group" style={{ marginTop: '24px' }}>
        <label className="form-label" style={{ fontWeight: 'bold' }}>
          Fotos do veículo de troca:
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
          {images.map((img, i) => (
            <label 
              key={i} 
              style={{ 
                aspectRatio: '1', 
                border: '1px dashed var(--border)', 
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                backgroundColor: img ? '#f0fdf4' : 'var(--surface)',
                color: img ? 'var(--success)' : 'var(--text-secondary)',
                overflow: 'hidden'
              }}
            >
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageUpload(i, e)} />
              {img ? (
                <img src={img.preview} style={{width: '100%', height: '100%', objectFit: 'cover'}} alt={`Upload ${i}`} />
              ) : (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <img src={`/car_placeholder_${i+1}.png`} style={{width: '100%', height: '100%', objectFit: 'cover', opacity: 1}} alt={`Guia Foto ${i+1}`} />
                  <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 'calc(1.1rem + 10px)', color: '#000', textShadow: '2px 2px 4px #fff, -2px -2px 4px #fff, 2px -2px 4px #fff, -2px 2px 4px #fff' }}>+ Foto {i+1}</span>
                </div>
              )}
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" style={{color: 'red', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
          <span>Adicione o que precisa ser feito ou consertado no veículo</span>
          <span style={{fontSize: '0.85rem', fontWeight: 'normal', color: '#666', marginTop: '4px'}}>(isso não aparecerá no anúncio)</span>
        </label>
        <textarea 
          name="detalhes"
          value={data.detalhes}
          onChange={handleChange}
          className="form-control" 
          maxLength="600" 
          rows="3" 
          placeholder="Ex: trocar pneus, pintar parachoque dianteiro"
        ></textarea>
        <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#666' }}>{data.detalhes?.length || 0}/600</div>
      </div>

      <div className="form-group" style={{ marginTop: '16px' }}>
        <label className="form-label" style={{ fontWeight: 'bold' }}>
          Fale sobre o seu carro:
          <span style={{display: 'block', fontSize: '0.85rem', fontWeight: 'normal', color: '#666', marginTop: '4px'}}>(Essa informação aparecerá no card do anúncio)</span>
        </label>
        <textarea 
          name="faleSobre"
          value={data.faleSobre}
          onChange={handleChange}
          className="form-control" 
          maxLength="600" 
          rows="3" 
          placeholder="Ex: Carro de único dono, revisões na concessionária..."
        ></textarea>
        <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#666' }}>{data.faleSobre?.length || 0}/600</div>
      </div>
    </div>
  );
}
