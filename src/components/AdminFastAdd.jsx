import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import DynamicBanner from './DynamicBanner';
import html2canvas from 'html2canvas';
import { detectAndBlur } from '../utils/plateMasker';

export default function AdminFastAdd({ setActiveTab, initialData, onSuccess }) {
  const [parceiroNome, setParceiroNome] = useState('');
  const [parceiroWhatsapp, setParceiroWhatsapp] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [lojistas, setLojistas] = useState([]);
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [textoOriginal, setTextoOriginal] = useState('');
  const [imageTransform, setImageTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [usePlateMasker, setUsePlateMasker] = useState(false);

  const handleExport = async (num) => {
    const node = document.getElementById(`export-node-${num}`);
    if (!node) return;
    try {
      setLoading(true);
      const canvas = await html2canvas(node, { 
        useCORS: true, 
        scale: 1080 / node.getBoundingClientRect().width,
        backgroundColor: '#000'
      });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.download = `social_banner_${formData.modelo || 'carro'}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      alert('Erro ao exportar imagem.');
    } finally {
      setLoading(false);
    }
  };
  
  const [formData, setFormData] = useState({
    tipoVeiculo: '', marca: '', modelo: '', ano: '', km: '', ipva_pago: 'sim', fipe: '', venda: '', margem: '', estado: 'SC', detalhes: '', bannerLayout: 1, cambio: '', combustivel: '', tracao: ''
  });

  React.useEffect(() => {
    if (initialData) {
      let consertos = '';
      let parc = null;
      let txtOrg = '';
      try {
        const detObj = typeof initialData.detalhes === 'string' ? JSON.parse(initialData.detalhes) : (initialData.detalhes || {});
        consertos = detObj.consertos !== undefined ? detObj.consertos : (initialData.detalhes || '');
        parc = detObj.parceiro || null;
        txtOrg = detObj.texto_original_whatsapp || '';
      } catch(e) {
        consertos = initialData.detalhes || '';
      }
      
      setFormData({
        tipoVeiculo: initialData.tipoVeiculo || 'Premium',
        marca: initialData.marca || '',
        modelo: initialData.modelo || '',
        ano: initialData.ano || '',
        km: initialData.km || '',
        ipva_pago: initialData.ipva_pago ? 'sim' : 'não',
        fipe: initialData.fipe || '',
        venda: initialData.venda || '',
        margem: '',
        estado: initialData.cidade || 'SC',
        detalhes: consertos,
        bannerLayout: 1,
        cambio: initialData.cambio || '',
        combustivel: initialData.combustivel || '',
        tracao: initialData.tracao || ''
      });
      
      if (parc) {
        setParceiroNome(parc.nome || '');
        setParceiroWhatsapp(parc.whatsapp || '');
      }
      if (txtOrg) setTextoOriginal(txtOrg);
      
      let imgs = [];
      if (Array.isArray(initialData.imagens)) imgs = initialData.imagens;
      else if (typeof initialData.imagens === 'string') {
        try { imgs = JSON.parse(initialData.imagens); } catch(e){}
      }
      if (imgs.length > 0) {
        setImages(imgs);
        setImageFiles(new Array(imgs.length).fill(null));
      }
    }
  }, [initialData]);

  React.useEffect(() => {
    const fetchParceiros = async () => {
      try {
        let localParceiros = [];
        const storedP = localStorage.getItem('delmar_parceiros');
        if (storedP) {
          localParceiros = JSON.parse(storedP);
        }

        const { data, error } = await supabase.from('cars').select('detalhes');
        if (!error && data) {
          const dbParceirosMap = new Map();
          
          localParceiros.forEach(p => dbParceirosMap.set(p.nome.toLowerCase(), p));

          data.forEach(car => {
            if (car.detalhes) {
              try {
                const detObj = typeof car.detalhes === 'string' ? JSON.parse(car.detalhes) : car.detalhes;
                if (detObj.parceiro && detObj.parceiro.nome) {
                  dbParceirosMap.set(detObj.parceiro.nome.toLowerCase(), detObj.parceiro);
                }
              } catch (e) {}
            }
          });

          const combinedParceiros = Array.from(dbParceirosMap.values()).sort((a, b) => a.nome.localeCompare(b.nome));
          setLojistas(combinedParceiros);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchParceiros();
  }, []);

  const parseMoney = (str) => {
    if (!str) return 0;
    let clean = str.replace(/\./g, '').replace(',', '.');
    const match = clean.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const parseText = () => {
    if(!rawText) return;
    const lines = rawText.split('\n').filter(l => l.trim() !== '');
    if(lines.length < 2) return;

    const marcaModelo = lines[0].split(' ');
    const marca = marcaModelo[0];
    const modelo = marcaModelo.slice(1).join(' ');

    const ano = lines[1].replace(/\D/g, '');
    const km = lines[2].replace(/\D/g, '');

    const detalhesArr = [];
    let ipva = 'não';
    let fipe = '';
    let venda = '';
    let estado = '';
    let margem = '';
    let cambio = '';
    let combustivel = '';
    let tracao = '';

    const formatMoney = (val) => {
      if (!val) return '';
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    for(let i = 3; i < lines.length; i++) {
      const line = lines[i];
      const upperLine = line.toUpperCase();
      
      if(upperLine.includes('IPVA') && upperLine.includes('PAGO')) {
        ipva = 'sim';
      } else if(upperLine.includes('FIPE')) {
        fipe = formatMoney(parseMoney(upperLine));
      } else if(upperLine.includes('VALOR')) {
        venda = formatMoney(parseMoney(upperLine));
      } else if(upperLine.includes('✔️')) {
        // Ignorar linha
      } else if(line.includes('📍')) {
        estado = line.replace('📍', '').trim();
      } else if(upperLine.startsWith('CÂMBIO') || upperLine.startsWith('CAMBIO')) {
        cambio = line.split(/:(.+)/)[1]?.trim() || line.replace(/câmbio|cambio|-/ig, '').trim();
      } else if(upperLine.startsWith('COMBUSTÍVEL') || upperLine.startsWith('COMBUSTIVEL')) {
        combustivel = line.split(/:(.+)/)[1]?.trim() || line.replace(/combustível|combustivel|-/ig, '').trim();
      } else if(upperLine.startsWith('TRAÇÃO') || upperLine.startsWith('TRACAO')) {
        tracao = line.split(/:(.+)/)[1]?.trim() || line.replace(/tração|tracao|-/ig, '').trim();
      } else if(upperLine.startsWith('FALE SOBRE') || upperLine.startsWith('DETALHES')) {
        const val = line.split(/:(.+)/)[1]?.trim() || line.replace(/fale sobre|detalhes|-/ig, '').trim();
        if (val) detalhesArr.push(val);
      } else {
        detalhesArr.push(line);
      }
    }

    setFormData({
      ...formData,
      marca,
      modelo,
      ano,
      km,
      ipva_pago: ipva,
      fipe: fipe || '',
      venda: venda || '',
      margem: margem || '',
      estado: estado || formData.estado,
      cambio: cambio || formData.cambio,
      combustivel: combustivel || formData.combustivel,
      tracao: tracao || formData.tracao,
      detalhes: detalhesArr.join('\n')
    });
    setParsed(true);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImages([...images, ...newPreviews]);
    setImageFiles([...imageFiles, ...files]);
  };

  const moveImage = (index, direction) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === images.length - 1) return;

    const newImages = [...images];
    const newFiles = [...imageFiles];
    
    const tempImg = newImages[index];
    newImages[index] = newImages[index + direction];
    newImages[index + direction] = tempImg;

    const tempFile = newFiles[index];
    newFiles[index] = newFiles[index + direction];
    newFiles[index + direction] = tempFile;

    setImages(newImages);
    setImageFiles(newFiles);
  };

  const removeImage = (index) => {
    const newImages = [...images];
    const newFiles = [...imageFiles];
    newImages.splice(index, 1);
    newFiles.splice(index, 1);
    setImages(newImages);
    setImageFiles(newFiles);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // 1. Upload Images
      const uploadedUrls = [];
      for (let i = 0; i < images.length; i++) {
        let file = imageFiles[i];
        
        if (!file && typeof images[i] === 'string' && images[i].startsWith('http')) {
          uploadedUrls.push(images[i]);
          continue;
        }
        
        if (!file) continue;

        if (usePlateMasker) {
          setLoading(`Borrando placas... (${i+1}/${images.length})`);
          file = await detectAndBlur(file);
        }
        setLoading(`Enviando foto ${i+1}...`);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('carros').upload(fileName, file);
        if (uploadError) throw uploadError;
        
        const { data: publicData } = supabase.storage.from('carros').getPublicUrl(fileName);
        uploadedUrls.push(publicData.publicUrl);
      }

      if (uploadedUrls.length === 0) {
        alert("Adicione pelo menos 1 imagem!");
        setLoading(false);
        return;
      }

      // 2. Insert or Update Database
      const carRecord = {
        proprietarioNome: parceiroNome || 'Anúncio Rápido',
        proprietarioEmail: 'admin@vendeseucarro.com.br',
        tipoVeiculo: formData.tipoVeiculo || 'Premium',
        marca: formData.marca,
        modelo: formData.modelo,
        ano: parseInt(formData.ano) || new Date().getFullYear(),
        km: parseInt(formData.km) || 0,
        fipe: parseMoney(formData.fipe ? formData.fipe.toString() : ''),
        venda: parseMoney(formData.venda ? formData.venda.toString() : '') + parseMoney(formData.margem ? formData.margem.toString() : ''),
        ipva_pago: formData.ipva_pago === 'sim',
        cidade: formData.estado,
        detalhes: JSON.stringify({ 
          texto: formData.detalhes, 
          bannerLayout: formData.bannerLayout,
          parceiro: { nome: parceiroNome, whatsapp: parceiroWhatsapp },
          valorRepasse: parseMoney(formData.venda ? formData.venda.toString() : ''),
          margem: parseMoney(formData.margem ? formData.margem.toString() : ''),
          estado: formData.estado,
          cambio: formData.cambio || (formData.detalhes.toLowerCase().includes('auto') ? 'Automático' : 'Manual'),
          combustivel: formData.combustivel || '',
          tracao: formData.tracao || '',
          videoUrl: videoUrl,
          imageTransform: imageTransform,
          texto_original_whatsapp: textoOriginal
        }),
        imagem: uploadedUrls[0],
        imagens: uploadedUrls,
        status: 'aprovado'
      };

      if (initialData && initialData.id) {
        // UPDATE
        const { error } = await supabase.from('cars').update(carRecord).eq('id', initialData.id);
        if (error) throw error;
        alert('Anúncio revisado e aprovado com sucesso!');
        if (onSuccess) onSuccess();
      } else {
        // INSERT
        carRecord.id = Date.now().toString();
        carRecord.dataCadastro = new Date().toISOString();
        const { error } = await supabase.from('cars').insert([carRecord]);
        if (error) throw error;
        alert('Anúncio Rápido publicado com sucesso!');
        
        if (setActiveTab) {
          setActiveTab('veiculos');
          setTimeout(() => window.scrollTo(0, 0), 0);
        }
      }
      
      // Reset form
      setRawText('');
      setParsed(false);
      setImages([]);
      setImageFiles([]);
      setParceiroNome('');
      setParceiroWhatsapp('');
      setVideoUrl('');
      setFormData({ tipoVeiculo: '', marca: '', modelo: '', ano: '', km: '', ipva_pago: 'sim', fipe: '', venda: '', margem: '', estado: 'SC', detalhes: '', bannerLayout: 1, cambio: '', combustivel: '', tracao: '' });
      setImageTransform({ scale: 1, x: 0, y: 0 });
      
    } catch (err) {
      console.error(err);
      alert('Erro ao publicar anúncio: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const previewCar = {
    marca: formData.marca,
    modelo: formData.modelo,
    ano: formData.ano,
    km: formData.km,
    venda: parseMoney(formData.venda ? formData.venda.toString() : '') + parseMoney(formData.margem ? formData.margem.toString() : ''),
    fipe: parseMoney(formData.fipe ? formData.fipe.toString() : ''),
    ipva_pago: formData.ipva_pago === 'sim',
    estado: formData.estado,
    cambio: formData.cambio || ((formData.detalhes || '').toLowerCase().includes('auto') ? 'Automático' : 'Manual'),
    combustivel: formData.combustivel || ((formData.detalhes || '').toLowerCase().includes('flex') ? 'Flex' : ((formData.detalhes || '').toLowerCase().includes('diesel') ? 'Diesel' : 'Gasolina')),
    tracao: formData.tracao || '',
    imagem: images.length > 0 ? images[0] : null,
    imagens: images,
    detalhes: JSON.stringify({
      combustivel: formData.combustivel || ((formData.detalhes || '').toLowerCase().includes('flex') ? 'Flex' : ((formData.detalhes || '').toLowerCase().includes('diesel') ? 'Diesel' : 'Gasolina')),
      cambio: formData.cambio || ((formData.detalhes || '').toLowerCase().includes('auto') ? 'Automático' : 'Manual'),
      tracao: formData.tracao || '',
      texto: formData.detalhes || '',
      imageTransform: imageTransform
    })
  };

  return (
    <div style={{ maxWidth: '940px', margin: '0 auto', backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid #f1f1f1', paddingBottom: '15px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>Cadastrar Anúncio Rápido</h2>
      </div>
      
      {!parsed ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Cadastro de Parceiros (Loja / Vendedor)</label>
            <select 
              value={parceiroNome} 
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'Outro') {
                  setParceiroNome('');
                  setParceiroWhatsapp('');
                } else {
                  const p = lojistas.find(x => x.nome === val);
                  setParceiroNome(val);
                  setParceiroWhatsapp(p ? p.whatsapp || '' : '');
                }
              }}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff' }}
            >
              <option value="">-- Selecione o Parceiro --</option>
              {lojistas.map((loj, idx) => (
                <option key={idx} value={loj.nome}>
                  {loj.nome} {loj.whatsapp ? `(${loj.whatsapp})` : ''}
                </option>
              ))}
              <option value="Outro">Outro (Digitar Manualmente)</option>
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Cole as informações do veículo (Texto do WhatsApp)</label>
            <textarea 
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="BMW 320i M Sport 2.0 Turbo Flex&#10;2025&#10;9.000km&#10;Garantia de fábrica&#10;Teto solar&#10;..."
              style={{ width: '100%', minHeight: '150px', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Original Text Display */}
          <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#334155' }}>Texto Original Colado:</h3>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.85rem', color: '#475569', maxHeight: '300px', overflowY: 'auto' }}>
              {rawText}
            </pre>
          </div>

          {/* Edit Form */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ gridColumn: '1 / -1', margin: '0 0 10px 0' }}>Revise os Dados</h3>
            
            <div>
              <label style={{fontWeight: 'bold', fontSize: '0.8rem'}}>Nome do Parceiro:</label>
              <input type="text" value={parceiroNome} onChange={e => setParceiroNome(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{fontWeight: 'bold', fontSize: '0.8rem'}}>WhatsApp do Parceiro:</label>
              <input type="text" value={parceiroWhatsapp} onChange={e => setParceiroWhatsapp(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>

            <div style={{ gridColumn: '1 / -1', marginBottom: '10px' }}>
              <label style={{fontWeight: 'bold', fontSize: '0.8rem'}}>Tipo de Veículo (Categoria):</label>
              <select 
                value={formData.tipoVeiculo} 
                onChange={(e) => setFormData({...formData, tipoVeiculo: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}
              >
                <option value="">Selecione...</option>
                <option value="Antigos">Antigos</option>
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

            <div>
              <label style={{fontWeight: 'bold', fontSize: '0.8rem'}}>Câmbio:</label>
              <select 
                value={formData.cambio} 
                onChange={(e) => setFormData({...formData, cambio: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}
              >
                <option value="">Selecione...</option>
                <option value="Manual">Manual</option>
                <option value="Automático">Automático</option>
                <option value="CVT">CVT</option>
                <option value="Automatizado">Automatizado</option>
              </select>
            </div>
            
            <div>
              <label style={{fontWeight: 'bold', fontSize: '0.8rem'}}>Combustível:</label>
              <select 
                value={formData.combustivel} 
                onChange={(e) => setFormData({...formData, combustivel: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}
              >
                <option value="">Selecione...</option>
                <option value="Flex">Flex</option>
                <option value="Gasolina">Gasolina</option>
                <option value="Diesel">Diesel</option>
                <option value="Híbrido">Híbrido</option>
                <option value="Elétrico">Elétrico</option>
                <option value="Etanol">Etanol</option>
                <option value="GNV">GNV</option>
              </select>
            </div>

            <div>
              <label style={{fontWeight: 'bold', fontSize: '0.8rem'}}>Tração:</label>
              <select 
                value={formData.tracao} 
                onChange={(e) => setFormData({...formData, tracao: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}
              >
                <option value="">Selecione...</option>
                <option value="4x2">4x2</option>
                <option value="4x4">4x4</option>
                <option value="AWD">AWD</option>
                <option value="Integral">Integral</option>
              </select>
            </div>

            <div>
              <label style={{fontWeight: 'bold', fontSize: '0.8rem'}}>Marca:</label>
              <input type="text" value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{fontWeight: 'bold', fontSize: '0.8rem'}}>Modelo:</label>
              <input type="text" value={formData.modelo} onChange={e => setFormData({...formData, modelo: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{fontWeight: 'bold', fontSize: '0.8rem'}}>Ano:</label>
              <input type="text" value={formData.ano} onChange={e => setFormData({...formData, ano: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{fontWeight: 'bold', fontSize: '0.8rem'}}>KM:</label>
              <input type="text" value={formData.km} onChange={e => setFormData({...formData, km: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{fontWeight: 'bold', fontSize: '0.8rem'}}>FIPE (R$):</label>
              <input type="text" value={formData.fipe} onChange={e => setFormData({...formData, fipe: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{fontWeight: 'bold', fontSize: '0.8rem'}}>Venda Lojista/Base (R$):</label>
              <input type="text" value={formData.venda} onChange={e => setFormData({...formData, venda: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{fontWeight: 'bold', fontSize: '0.8rem', color: '#16a34a'}}>Margem (R$ - Só Admin):</label>
              <input type="text" value={formData.margem} onChange={e => setFormData({...formData, margem: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f0fdf4' }} />
            </div>
            <div>
              <label style={{fontWeight: 'bold', fontSize: '0.8rem', color: '#007BFF'}}>Venda do Site (Calculado):</label>
              <input type="text" disabled value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseMoney(formData.venda ? formData.venda.toString() : '') + parseMoney(formData.margem ? formData.margem.toString() : ''))} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#e9ecef', fontWeight: 'bold' }} />
            </div>
            <div>
              <label style={{fontWeight: 'bold', fontSize: '0.8rem'}}>Local / Estado:</label>
              <input type="text" value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
            <div>
              <label style={{fontWeight: 'bold', fontSize: '0.8rem'}}>IPVA Pago:</label>
              <select value={formData.ipva_pago} onChange={e => setFormData({...formData, ipva_pago: e.target.value})} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
                <option value="sim">Sim</option>
                <option value="não">Não</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{fontWeight: 'bold', fontSize: '0.8rem'}}>Detalhes Adicionais (Opcionais e Observações):</label>
              <textarea value={formData.detalhes} onChange={e => setFormData({...formData, detalhes: e.target.value})} style={{ width: '100%', height: '120px', padding: '8px', border: '1px solid #ccc', fontFamily: 'monospace', borderRadius: '4px' }} />
            </div>
            <div style={{ gridColumn: '1 / -1', marginBottom: '10px' }}>
              <label style={{fontWeight: 'bold', fontSize: '0.8rem'}}>URL do Vídeo (Instagram, Facebook, YouTube):</label>
              <input type="text" placeholder="Cole o link do vídeo aqui..." value={videoUrl} onChange={e => setVideoUrl(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
            </div>
          </div>

          {/* Image Uploader */}
          <div style={{ backgroundColor: '#f0f4f8', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Imagens do Veículo (Selecione todas)</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <input 
                type="checkbox" 
                id="fastPlateMaskToggle"
                checked={usePlateMasker} 
                onChange={(e) => setUsePlateMasker(e.target.checked)} 
                style={{ width: '18px', height: '18px', accentColor: 'red', cursor: 'pointer' }} 
              />
              <label htmlFor="fastPlateMaskToggle" style={{ fontSize: '0.95rem', fontWeight: '600', color: '#333', cursor: 'pointer', margin: 0 }}>
                Inibir placa automaticamente (Aplicar tarja preta)
              </label>
            </div>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleImageUpload}
              style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#fff', border: '1px solid #ccc', width: '100%', borderRadius: '4px' }}
            />
            
            {images.length > 0 && (
              <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', padding: '10px 0' }}>
                {images.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', flexShrink: 0, width: '150px' }}>
                    {idx === 0 && <span style={{ position: 'absolute', top: 5, left: 5, background: '#28a745', color: '#fff', padding: '2px 8px', fontSize: '10px', borderRadius: '4px', zIndex: 2 }}>Capa</span>}
                    <img src={img} alt={`Preview ${idx}`} style={{ width: '150px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: idx === 0 ? '3px solid #28a745' : '1px solid #ddd' }} />
                    <button onClick={() => removeImage(idx)} style={{ position: 'absolute', top: 5, right: 5, background: 'red', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✕</button>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                      <button type="button" onClick={() => moveImage(idx, -1)} disabled={idx === 0} style={{ padding: '5px 10px', cursor: idx === 0 ? 'not-allowed' : 'pointer', border: '1px solid #ccc', background: '#fff', borderRadius: '4px' }}>◀</button>
                      <button type="button" onClick={() => moveImage(idx, 1)} disabled={idx === images.length - 1} style={{ padding: '5px 10px', cursor: idx === images.length - 1 ? 'not-allowed' : 'pointer', border: '1px solid #ccc', background: '#fff', borderRadius: '4px' }}>▶</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Banner Layout Selection */}
          <div style={{ backgroundColor: '#fffbe6', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>Escolha o Layout do Banner (Clique no layout desejado)</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', alignItems: 'center' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <div key={num} style={{ width: '100%', maxWidth: num === 8 ? '500px' : '940px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div 
                    onClick={() => setFormData({...formData, bannerLayout: num})}
                    style={{
                      cursor: 'pointer',
                      width: '100%',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: formData.bannerLayout === num ? '6px solid #28a745' : '4px solid transparent',
                      position: 'relative',
                      transform: formData.bannerLayout === num ? 'scale(1.02)' : 'scale(1)',
                      transition: 'all 0.2s',
                      boxShadow: formData.bannerLayout === num ? '0 15px 30px rgba(40,167,69,0.3)' : '0 4px 10px rgba(0,0,0,0.1)'
                    }}
                  >
                    {formData.bannerLayout === num && (
                      <div style={{ position: 'absolute', top: 20, right: 20, backgroundColor: '#28a745', color: '#fff', padding: '8px 20px', borderRadius: '30px', fontWeight: 'bold', zIndex: 50, fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                        ✓ Selecionado
                      </div>
                    )}
                    <div id={`export-node-${num}`} style={{ width: '100%', position: 'relative' }}>
                      <DynamicBanner previewOverride={{ layout: num, car: previewCar }} />
                    </div>
                  </div>

                  {num === 8 && formData.bannerLayout === 8 && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); handleExport(num); }} style={{ padding: '12px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', marginTop: '10px' }}>
                      {loading ? 'Exportando...' : '⬇️ Exportar Imagem (1080x1080)'}
                    </button>
                  )}

                  {images.length > 0 && formData.bannerLayout === num && (
                    <div style={{ backgroundColor: '#e2e8f0', padding: '15px', borderRadius: '8px', marginTop: '5px' }}>
                      <h4 style={{ margin: '0 0 10px 0' }}>Ajuste da Foto de Capa (Movimentação e Zoom)</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Zoom: {imageTransform.scale.toFixed(2)}x</label>
                          <input type="range" min="0.1" max="3" step="0.01" value={imageTransform.scale} onChange={e => setImageTransform({...imageTransform, scale: parseFloat(e.target.value)})} style={{ width: '100%' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Horizontal (X): {imageTransform.x}%</label>
                          <input type="range" min="-100" max="100" step="1" value={imageTransform.x} onChange={e => setImageTransform({...imageTransform, x: parseInt(e.target.value)})} style={{ width: '100%' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Vertical (Y): {imageTransform.y}%</label>
                          <input type="range" min="-100" max="100" step="1" value={imageTransform.y} onChange={e => setImageTransform({...imageTransform, y: parseInt(e.target.value)})} style={{ width: '100%' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '15px' }}>
            <button 
              onClick={() => setParsed(false)}
              style={{ padding: '15px 25px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer', flex: 1 }}
            >
              Voltar / Colar outro texto
            </button>
            <button
            onClick={handleSave}
            disabled={loading}
            className="btn btn-primary"
            style={{ flex: 1, padding: '16px', fontSize: '1.1rem', backgroundColor: '#22c55e', borderColor: '#22c55e' }}
          >
            {loading ? 'Salvando...' : (initialData ? '✅ Salvar e Aprovar Anúncio' : '🚀 Publicar Anúncio Rápido')}
          </button>
          </div>

        </div>
      )}
    </div>
  );
}
