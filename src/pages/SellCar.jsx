import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { maskCurrency, maskInt, applyCurrencyBlur, unmask, maskCPF, validateCPF } from '../utils/masks';
import StateCitySelect from '../components/StateCitySelect';
import FipeSelects from '../components/FipeSelects';
import DynamicBanner from '../components/DynamicBanner';

const anos = Array.from({ length: 2026 - 1970 + 1 }, (_, i) => 2026 - i);
const negociacoesList = ['Venda a vista', 'Troca por veículo de menor valor', 'Troca por veículo de maior valor', 'Troca por imóvel', 'Fazer Proposta a Vista'];
const timesFutebol = [
  "ABC", "América-MG", "Athletico-PR", "Atlético-GO", "Atlético-MG", "Avaí", "Bahia", "Botafogo", "Botafogo-SP", "Bragantino", 
  "Brasil de Pelotas", "Ceará", "Chapecoense", "Corinthians", "Coritiba", "CRB", "Criciúma", "Cruzeiro", "CSA", "Cuiabá", 
  "Ferroviária", "Figueirense", "Flamengo", "Fluminense", "Fortaleza", "Goiás", "Grêmio", "Guarani", "Internacional", "Ituano", 
  "Juventude", "Londrina", "Mirassol", "Náutico", "Novorizontino", "Operário-PR", "Palmeiras", "Paraná", "Paysandu", "Ponte Preta", 
  "Remo", "Sampaio Corrêa", "Santos", "São Paulo", "Sport", "Tombense", "Vasco", "Vila Nova", "Vitória", "Volta Redonda"
];
const hobbies = [
  "Acampamento", "Artesanato", "Artes marciais", "Astrologia", "Automobilismo", "Balé", "Basquete", "Boliche", "Bordado", "Caminhada", 
  "Canto", "Capoeira", "Carpintaria", "Cerâmica", "Ciclismo", "Colecionismo", "Corrida", "Costura", "Culinária", "Dança", 
  "Desenho", "Design", "Escrita", "Esportes radicais", "Faça você mesmo", "Fotografia", "Futebol", "Games", "Ginástica", "Golfe", 
  "História", "Jardinagem", "Jogos de tabuleiro", "Leitura", "Maquiagem", "Marcenaria", "Meditação", "Moda", "Modelismo", "Motociclismo", 
  "Musculação", "Música", "Natação", "Origami", "Pescaria", "Pintura", "Poesia", "Programação", "Quebra-cabeças", "Robótica", 
  "RPG", "Skate", "Surfe", "Teatro", "Tênis", "Tricô", "Viagens", "Vôlei", "Xadrez", "Yoga"
];
const cidadesMS = [
  "Água Clara", "Alcinópolis", "Amambai", "Anastácio", "Anaurilândia", "Angélica", "Antônio João", 
  "Aparecida do Taboado", "Aquidauana", "Aral Moreira", "Bandeirantes", "Bataguassu", "Batayporã", 
  "Bela Vista", "Bodoquena", "Bonito", "Brasilândia", "Caarapó", "Camapuã", "Campo Grande", "Caracol", 
  "Cassilândia", "Chapadão do Sul", "Corguinho", "Coronel Sapucaia", "Corumbá", "Costa Rica", "Coxim", 
  "Deodápolis", "Dois Irmãos do Buriti", "Douradina", "Dourados", "Eldorado", "Fátima do Sul", "Figueirão", 
  "Glória de Dourados", "Guia Lopes da Laguna", "Iguatemi", "Inocência", "Itaporã", "Itaquiraí", "Ivinhema", 
  "Japorã", "Jaraguari", "Jardim", "Jateí", "Juti", "Ladário", "Laguna Carapã", "Maracaju", "Miranda", 
  "Mundo Novo", "Naviraí", "Nioaque", "Nova Alvorada do Sul", "Nova Andradina", "Novo Horizonte do Sul", 
  "Paraíso das Águas", "Paranaíba", "Paranhos", "Pedro Gomes", "Ponta Porã", "Porto Murtinho", 
  "Ribas do Rio Pardo", "Rio Brilhante", "Rio Negro", "Rio Verde de Mato Grosso", "Rochedo", 
  "Santa Rita do Pardo", "São Gabriel do Oeste", "Selvíria", "Sete Quedas", "Sidrolândia", "Sonora", 
  "Tacuru", "Taquarussu", "Terenos", "Três Lagoas", "Vicentina"
].sort((a, b) => a.localeCompare(b, 'pt-BR'));

const loadImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const blurImagePlates = async (file, boxes) => {
  if (!boxes || boxes.length === 0) return file;
  
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  
  ctx.drawImage(img, 0, 0);
  
  boxes.forEach(box => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; // Tarja preta sólida para máxima privacidade
    ctx.fillRect(box.xmin, box.ymin, box.xmax - box.xmin, box.ymax - box.ymin);
  });
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const newFile = new File([blob], file.name, { type: file.type });
      resolve(newFile);
    }, file.type, 0.9);
  });
};

const detectAndBlur = async (file) => {
  try {
    const formData = new FormData();
    formData.append('upload', file);
    // Para funcionar corretamente, o supabase precisa do form-data cru sem ser convertido a string
    const { data: funcData, error } = await supabase.functions.invoke('super-service', {
      body: formData,
    });
    
    if (error) {
       console.error("Erro na Edge Function plate-recognizer", error);
       alert("Erro na nuvem (Supabase): " + (error.message || JSON.stringify(error)));
       return file; 
    }
    
    if (funcData && funcData.results && funcData.results.length > 0) {
       const boxes = funcData.results.map(r => r.box);
       return await blurImagePlates(file, boxes);
    }
    
    // Se a API não achar nenhuma placa na imagem, avisa também no log, mas não impede o fluxo
    console.log("Nenhuma placa detectada pela IA nesta imagem.");
    return file;
  } catch(e) {
    console.error("Erro detectAndBlur:", e);
    alert("Falha de conexão com a IA: " + e.message);
    return file; 
  }
};

export default function SellCar() {
  const [images, setImages] = useState(Array(6).fill(null));
  const [usePlateMasker, setUsePlateMasker] = useState(true);
  const [session, setSession] = useState(null);

  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const fastMode = searchParams.get('fast') === 'true';
  const navigate = useNavigate();

  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFamiliares, setShowFamiliares] = useState(false);
  
  const [bannerLayout, setBannerLayout] = useState(1);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    whatsapp: '',
    email: '',
    dataNascimento: '',
    estadoCivil: 'solteiro',
    conjugeNome: '',
    conjugeDataNascimento: '',
    conjugeWhatsapp: '',
    filhosCount: '0',
    filhos: [],
    sexo: 'Masculino',
    time: '',
    hobby: '',
    marca: '',
    modelo: '',
    ano: '',
    anoModelo: '',
    tipoVeiculo: '',
    cambio: '',
    tracao: '',
    combustivel: '',
    km: '',
    precoFipe: '',
    precoPedido: '',
    ipvaPago: 'sim',
    cidade: '',
    estado: '',
    negociacao: '',
    detalhes: '',
    faleSobre: ''
  });

  const detalhesRef = React.useRef(null);
  const faleSobreRef = React.useRef(null);

  useEffect(() => {
    if (editId) {
      const loadCar = async () => {
        const { data, error } = await supabase.from('cars').select('*').eq('id', editId).single();
        if (!error && data) {
          const car = data;
          const carImagens = typeof car.imagens === 'string' ? JSON.parse(car.imagens) : car.imagens;
          let parsedDetalhes = '';
          let parsedFaleSobre = '';
          try {
            const detObj = JSON.parse(car.detalhes || '{}');
            parsedDetalhes = detObj.consertos !== undefined ? detObj.consertos : (car.detalhes || '');
            parsedFaleSobre = detObj.faleSobre || '';
            if (detObj.bannerLayout) setBannerLayout(parseInt(detObj.bannerLayout, 10));
          } catch(e) {
            parsedDetalhes = car.detalhes || '';
          }

          setFormData({
            nome: car.proprietarioNome || '',
            cpf: car.cpf || '',
            whatsapp: car.proprietarioTelefone || '',
            email: car.proprietarioEmail || '',
            dataNascimento: car.dataNascimento || '',
            estadoCivil: car.estadoCivil || 'solteiro',
            conjugeNome: car.conjuge?.nome || '',
            conjugeDataNascimento: car.conjuge?.dataNascimento || '',
            conjugeWhatsapp: car.conjuge?.whatsapp || '',
            filhosCount: car.filhos?.length?.toString() || '0',
            filhos: car.filhos || [],
            sexo: car.sexo || 'Masculino',
            time: car.time || '',
            hobby: car.hobby || '',
            tipoVeiculo: car.tipoVeiculo || '',
            marca: car.marca || '',
            modelo: car.modelo || '',
            ano: car.ano?.toString() || '',
            anoModelo: car.anoModelo?.toString() || '',
            km: car.km ? car.km.toString() : '',
            cidade: car.cidade || '',
            negociacao: car.negociacao || 'Venda',
            cambio: car.cambio || 'Automático',
            tracao: car.tracao || '4x2',
            precoPedido: car.venda ? car.venda.toString() : '',
            ipvaPago: car.ipva_pago ? 'sim' : 'nao',
            detalhes: parsedDetalhes,
            faleSobre: parsedFaleSobre,
          });
          if (carImagens && carImagens.length > 0) {
            const newImages = Array(6).fill(null);
            for (let i = 0; i < 6; i++) {
              if (carImagens[i]) {
                newImages[i] = { preview: carImagens[i] };
              }
            }
            setImages(newImages);
          }
        }
      };
      loadCar();
    }
  }, [editId]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session && !editId) {
        let savedData = {};
        try {
          const email = session.user.email;
          const { data: pastCars } = await supabase.from('cars').select('*').eq('proprietarioEmail', email).order('dataCadastro', { ascending: false }).limit(1);
          
          if (pastCars && pastCars.length > 0) {
            const car = pastCars[0];
            savedData = {
               cpf: car.cpf || '',
               whatsapp: car.proprietarioTelefone || '',
               dataNascimento: car.dataNascimento || '',
               estadoCivil: car.estadoCivil || 'solteiro',
               conjugeNome: car.conjuge?.nome || '',
               conjugeDataNascimento: car.conjuge?.dataNascimento || '',
               conjugeWhatsapp: car.conjuge?.whatsapp || '',
               filhosCount: car.filhos?.length?.toString() || '0',
               filhos: car.filhos || [],
               sexo: car.sexo || 'Masculino',
               time: car.time || '',
               hobby: car.hobby || '',
               cidade: car.cidade || 'Campo Grande'
            };
          } else {
            const { data: pastReqs } = await supabase.from('requests').select('*').eq('clienteEmail', email).order('dataPedido', { ascending: false }).limit(1);
            if (pastReqs && pastReqs.length > 0) {
              const req = pastReqs[0];
              savedData = {
                 cpf: req.cpf || '',
                 whatsapp: req.clienteTelefone || '',
                 dataNascimento: req.dataNascimento || '',
                 estadoCivil: req.estadoCivil || 'solteiro',
                 conjugeNome: req.conjuge?.nome || '',
                 conjugeDataNascimento: req.conjuge?.dataNascimento || '',
                 conjugeWhatsapp: req.conjuge?.whatsapp || '',
                 filhosCount: req.filhos?.length?.toString() || '0',
                 filhos: req.filhos || [],
                 sexo: req.sexo || 'Masculino',
                 time: req.time || '',
                 hobby: req.hobby || '',
                 cidade: req.cidade || 'Campo Grande'
              };
            }
          }
        } catch(e) {
          console.error("Erro ao buscar dados prévios:", e);
        }

        setFormData(prev => ({
          ...prev,
          nome: session.user.user_metadata.full_name || prev.nome,
          email: session.user.email || prev.email,
          ...savedData
        }));
      }
    });
  }, [editId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'cpf') {
      setFormData(prev => ({ ...prev, [name]: maskCPF(value) }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCurrencyChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: maskCurrency(value) }));
  };

  const handleIntChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: maskInt(value) }));
  };

  const handleCurrencyBlur = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: applyCurrencyBlur(value) }));
  };

  const handleFilhosCountChange = (e) => {
    const count = parseInt(e.target.value) || 0;
    setFormData(prev => {
      const newFilhos = [...prev.filhos];
      while (newFilhos.length < count) newFilhos.push({ nome: '', dataNascimento: '', whatsapp: '' });
      while (newFilhos.length > count) newFilhos.pop();
      return { ...prev, filhosCount: String(count), filhos: newFilhos };
    });
  };

  const handleMultiImageUpload = (e) => {
    e.preventDefault();
    let files;
    if (e.target.files) files = Array.from(e.target.files);
    else if (e.dataTransfer?.files) files = Array.from(e.dataTransfer.files);
    else return;
    
    if (files.length === 0) return;
    
    const newImages = [...images];
    let fileIndex = 0;
    
    for (let i = 0; i < 6 && fileIndex < files.length; i++) {
      if (!newImages[i]) {
        const file = files[fileIndex];
        const preview = URL.createObjectURL(file);
        newImages[i] = { file, preview };
        fileIndex++;
      }
    }
    setImages(newImages);
  };

  const setAsCover = (index, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (index === 0 || !images[index]) return;
    const newImages = [...images];
    const temp = newImages[0];
    newImages[0] = newImages[index];
    newImages[index] = temp;
    setImages(newImages);
  };

  const removeImage = (index, e) => {
    e.preventDefault();
    e.stopPropagation();
    const newImages = [...images];
    newImages[index] = null;
    setImages(newImages);
  };

  const [showErrorAlert, setShowErrorAlert] = useState(false);

  const handleInvalid = (e) => {
    e.preventDefault();
    setShowErrorAlert(true);
    if (e.target) {
      e.target.focus();
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!session) {
      alert("Atenção: só acessa o site após fazer o login do Google. Caso queira vender ou fazer pedido, faça o cadastro/login primeiro.");
      return;
    }
    if (!fastMode && !validateCPF(formData.cpf)) {
      alert("Por favor, digite um CPF válido.");
      return;
    }
    setLoading(true);

    try {
      const uploadedImageUrls = [];
      
      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        if (item && item.file) {
          let file = item.file;
          if (usePlateMasker) {
            setLoading(`Borrando placas... (${i+1}/${images.filter(x => x && x.file).length})`);
            file = await detectAndBlur(item.file);
          }
          
          setLoading(`Enviando foto ${i+1}...`);
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { data, error } = await supabase.storage
            .from('carros')
            .upload(filePath, file);

          if (error) {
            console.error('Erro no upload da imagem:', error);
            throw error;
          }

          const { data: publicUrlData } = supabase.storage
            .from('carros')
            .getPublicUrl(filePath);

          uploadedImageUrls.push(publicUrlData.publicUrl);
        } else if (item && item.preview) {
          uploadedImageUrls.push(item.preview);
        }
      }

      const finalImages = uploadedImageUrls;

        const combinedDetalhes = JSON.stringify({
          consertos: formData.detalhes,
          faleSobre: formData.faleSobre,
          bannerLayout: bannerLayout
        });

        const newCar = {
          id: editId || Date.now().toString(),
          cpf: formData.cpf || '000.000.000-00',
          dataNascimento: formData.dataNascimento,
          estadoCivil: formData.estadoCivil,
          conjuge: (formData.estadoCivil === 'casado' || formData.estadoCivil === 'namorando') ? {
            nome: formData.conjugeNome,
            dataNascimento: formData.conjugeDataNascimento,
            whatsapp: formData.conjugeWhatsapp
          } : null,
          filhos: parseInt(formData.filhosCount) > 0 ? formData.filhos : [],
          sexo: formData.sexo,
          time: formData.time,
          hobby: formData.hobby,
          marca: formData.marca,
          modelo: formData.modelo,
          ano: Number(formData.ano),
          anoModelo: Number(formData.anoModelo),
          km: formData.km ? unmask(formData.km) : 0,
          fipe: formData.precoFipe ? unmask(formData.precoFipe) : 0,
          venda: formData.precoPedido ? unmask(formData.precoPedido) : 0,
          ipva_pago: formData.ipvaPago === 'sim',
          imagem: finalImages.length > 0 ? finalImages[0] : '',
          imagens: finalImages,
          proprietarioNome: formData.nome,
          proprietarioEmail: formData.email,
          proprietarioTelefone: formData.whatsapp,
          cidade: formData.cidade,
          estado: formData.estado,
          negociacao: formData.negociacao,
          tipoVeiculo: formData.tipoVeiculo,
          combustivel: formData.combustivel,
          cambio: formData.cambio,
          tracao: formData.tracao,
          detalhes: combinedDetalhes,
          status: 'pendente',
          dataCadastro: new Date().toISOString()
        };

      if (editId) {
        const { error } = await supabase.from('cars').update(newCar).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cars').insert([newCar]);
        if (error) throw error;
      }

      setSuccess(true);
    } catch (error) {
      console.error('Erro ao enviar cadastro:', error);
      alert('Ocorreu um erro ao enviar suas imagens. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="main-content flex-center" style={{ position: 'relative', backgroundColor: '#000', backgroundImage: 'url("/cabeçalho_colmeia.png.png")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', minHeight: '100vh', padding: '40px 20px' }}>
        <div className="box-centered" style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--success)', marginBottom: '16px' }}>Veículo Enviado para Análise!</h2>
          <p style={{ fontSize: '1.2rem' }}>Obrigado, <strong>{formData.nome}</strong>!</p>
          <p style={{ marginTop: '16px', marginBottom: '32px', color: '#666' }}>O seu anúncio foi recebido e está aguardando a aprovação da nossa equipe de moderação. Assim que for aprovado, ele ficará visível para todos no site!</p>
          <Link to="/anuncios" style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: 'var(--primary-color)', color: 'white', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
            Ir para a Vitrine
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content flex-center" style={{ position: 'relative', backgroundColor: '#000', backgroundImage: 'url("/cabeçalho_colmeia.png.png")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', minHeight: '100vh', padding: '40px 20px' }}>
      <div className="box-centered" style={{ position: 'relative', maxWidth: '940px', width: '100%' }}>
        <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: '24px', left: '24px', display: 'flex', alignItems: 'center', color: '#666', textDecoration: 'none', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontFamily: 'inherit', zIndex: 10 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Voltar
        </button>
        <h2 className="page-title" style={{ color: 'red' }}>{editId ? 'Editar seu carro:' : 'Cadastre seu carro:'}</h2>
        {!session && !editId && (
          <Link to="/" className="mobile-only" style={{ alignItems: 'center', color: '#1976D2', textDecoration: 'none', fontWeight: '600', marginBottom: '20px', fontSize: '0.9rem', backgroundColor: '#e3f2fd', padding: '8px 12px', borderRadius: '6px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Volte e logue no Google
          </Link>
        )}
        <form onSubmit={handleSubmit} onInvalid={handleInvalid}>
          { !fastMode && (
            <>
              <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                Nome Completo <span style={{color: 'red', marginLeft: '4px'}}>*</span>
                <span style={{marginLeft: 'auto', fontSize: '0.85rem', color: '#666', fontWeight: 'normal'}}>
                  Use a tecla <span style={{border: '1px solid #ccc', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f5f5f5', fontWeight: 'bold', margin: '0 4px'}}>TAB</span> para avançar
                </span>
              </label>
              <input type="text" name="nome" value={formData.nome} onChange={handleChange} className="form-control" required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">CPF <span style={{color: 'red', marginLeft: '4px'}}>*</span></label>
              <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} className="form-control" required placeholder="Apenas números" />
            </div>
          </div>

            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">WhatsApp <span style={{color: 'red'}}>*</span></label>
                <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="form-control" required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">E-mail <span style={{color: 'red'}}>*</span></label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-control" required />
              </div>
            </div>

            <p style={{color: 'red', fontSize: '1.2rem', fontWeight: '600', marginTop: '16px', marginBottom: '8px', textAlign: 'center'}}>Cadastro aniversariantes</p>

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
                    <option value="divorciado">Divorciado(a)</option>
                    <option value="viuvo">Viúvo(a)</option>
                  </select>
                </div>

                {(formData.estadoCivil === 'casado' || formData.estadoCivil === 'namorando') && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontWeight: '600', marginBottom: '8px' }}>Dados do Cônjuge/Namorado(a)</p>
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
                        <input type="text" name="conjugeWhatsapp" value={formData.conjugeWhatsapp} onChange={handleChange} className="form-control" />
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

                {parseInt(formData.filhosCount) > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontWeight: '600', marginBottom: '8px' }}>Dados dos Filhos</p>
                    {formData.filhos.map((filho, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <div className="form-group" style={{ flex: '1 1 200px', marginBottom: '0' }}>
                          <label className="form-label">Nome Completo</label>
                          <input type="text" value={filho.nome} onChange={(e) => {
                            const newFilhos = [...formData.filhos];
                            newFilhos[idx].nome = e.target.value;
                            setFormData({...formData, filhos: newFilhos});
                          }} className="form-control" />
                        </div>
                        <div className="form-group" style={{ flex: '1 1 150px', marginBottom: '0' }}>
                          <label className="form-label">Data de Nascimento</label>
                          <input type="date" value={filho.dataNascimento} onChange={(e) => {
                            const newFilhos = [...formData.filhos];
                            newFilhos[idx].dataNascimento = e.target.value;
                            setFormData({...formData, filhos: newFilhos});
                          }} className="form-control" />
                        </div>
                        <div className="form-group" style={{ flex: '1 1 150px', marginBottom: '0' }}>
                          <label className="form-label">WhatsApp</label>
                          <input type="text" value={filho.whatsapp} onChange={(e) => {
                            const newFilhos = [...formData.filhos];
                            newFilhos[idx].whatsapp = e.target.value;
                            setFormData({...formData, filhos: newFilhos});
                          }} className="form-control" />
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
                <select name="sexo" value={formData.sexo} onChange={handleChange} className="form-control" required>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
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
            
            <hr style={{ margin: '32px 0', borderColor: '#eee' }} />
            </>
          )}

          <div className="form-group">
            <label className="form-label">Tipo de Veículo <span style={{color: 'red'}}>*</span></label>
            <select name="tipoVeiculo" value={formData.tipoVeiculo} onChange={handleChange} className="form-control" required>
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

          <FipeSelects formData={formData} setFormData={setFormData} />

          {/* Ano Modelo e Combustível agora são preenchidos automaticamente pelo FipeSelects */}

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Câmbio <span style={{color: 'red'}}>*</span></label>
              <select name="cambio" value={formData.cambio} onChange={handleChange} className="form-control" required>
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
              <select name="tracao" value={formData.tracao} onChange={handleChange} className="form-control" required>
                <option value="4x2">4x2</option>
                <option value="4x4">4x4</option>
                <option value="6x2">6x2</option>
                <option value="6x4">6x4</option>
                <option value="AWD">AWD</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Preço Pedido (R$)</label>
              <input type="text" name="precoPedido" value={formData.precoPedido} onChange={handleCurrencyChange} onBlur={handleCurrencyBlur} className="form-control" placeholder="Ex: 50.000,00" />
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
              <label className="form-label">No momento o KM é: <span style={{color: 'red'}}>*</span></label>
              <input type="text" name="km" value={formData.km} onChange={handleIntChange} className="form-control" placeholder="Ex: 60.000" required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">IPVA Pago? <span style={{color: 'red'}}>*</span></label>
              <select name="ipvaPago" value={formData.ipvaPago} onChange={handleChange} className="form-control" required>
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <StateCitySelect formData={formData} setFormData={setFormData} />
          </div>

          <div className="form-group" style={{ backgroundColor: '#dc2626', color: '#fff', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: 'bold' }}>Atenção:</h4>
            <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Escolha um bom local para fotografar.</li>
              <li>Faça a foto com o sol <strong>atrás da câmera</strong> fotográfica (smartphone).</li>
              <li>Não coloque informações pessoais, apenas do veículo.</li>
            </ol>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <span>Importar Imagens (até 6 fotos)</span>
              <label 
                className="btn btn-outline" 
                style={{ cursor: 'pointer', padding: '6px 16px', fontSize: '0.9rem', marginBottom: 0, fontWeight: 'bold' }}
              >
                Selecionar Várias Fotos
                <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleMultiImageUpload} />
              </label>
            </label>
            
            <div 
              style={{ padding: '20px', border: '2px dashed #ccc', borderRadius: '8px', backgroundColor: '#fafafa', marginBottom: '16px', textAlign: 'center', color: '#666' }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleMultiImageUpload(e); }}
            >
              Arraste e solte várias fotos aqui ou clique no botão acima.
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <input 
                type="checkbox" 
                id="plateMaskToggle"
                checked={usePlateMasker} 
                onChange={(e) => setUsePlateMasker(e.target.checked)} 
                style={{ width: '18px', height: '18px', accentColor: 'red', cursor: 'pointer' }} 
              />
              <label htmlFor="plateMaskToggle" style={{ fontSize: '0.95rem', fontWeight: '600', color: '#333', cursor: 'pointer', margin: 0 }}>
                Inibir placa automaticamente (Aplicar tarja preta)
              </label>
            </div>

            <div className="image-upload-grid">
              {images.map((img, i) => (
                <div 
                  key={i} 
                  style={{ 
                    aspectRatio: '1', 
                    border: '1px dashed var(--border)', 
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: img ? '#f0fdf4' : 'var(--surface)',
                    color: img ? 'var(--success)' : 'var(--text-secondary)',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  {img ? (
                    <>
                      <img src={img.preview} style={{width: '100%', height: '100%', objectFit: 'cover'}} alt={`Upload ${i}`} />
                      
                      <div style={{ position: 'absolute', top: '5px', right: '5px', display: 'flex', gap: '4px' }}>
                        {i > 0 && (
                          <button 
                            type="button"
                            onClick={(e) => setAsCover(i, e)}
                            style={{ backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                            title="Tornar imagem principal"
                          >
                            Capa
                          </button>
                        )}
                        <button 
                          type="button"
                          onClick={(e) => removeImage(i, e)}
                          style={{ backgroundColor: 'red', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
                          title="Remover imagem"
                        >
                          X
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <img src={`/car_placeholder_${i+1}.png`} style={{width: '100%', height: '100%', objectFit: 'cover', opacity: 1}} alt={`Guia Foto ${i+1}`} />
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 'calc(1.1rem + 10px)', color: '#000', textShadow: '2px 2px 4px #fff, -2px -2px 4px #fff, 2px -2px 4px #fff, -2px 2px 4px #fff' }}>+ Foto {i+1}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{color: 'red', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
              <span>Adicione o que precisa ser feito ou consertado no veículo</span>
              <span style={{fontSize: '0.85rem', fontWeight: 'normal', color: '#666', marginTop: '4px'}}>(isso não aparecerá no anúncio)</span>
            </label>
            <textarea 
              ref={detalhesRef}
              name="detalhes"
              value={formData.detalhes}
              onChange={handleChange}
              className="form-control" 
              maxLength="600" 
              placeholder="Ex: trocar pneus, pintar parachoque dianteiro"
              style={{ height: '400px', overflow: 'hidden', resize: 'none' }}
            ></textarea>
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#666' }}>{formData.detalhes.length}/600</div>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label" style={{ fontWeight: 'bold' }}>
              Fale sobre o seu carro:
              <span style={{display: 'block', fontSize: '0.85rem', fontWeight: 'normal', color: '#666', marginTop: '4px'}}>(Essa informação aparecerá no card do anúncio)</span>
            </label>
            <textarea 
              ref={faleSobreRef}
              name="faleSobre"
              value={formData.faleSobre}
              onChange={handleChange}
              className="form-control" 
              maxLength="600" 
              placeholder="Ex: Único dono, revisado na concessionária, excelente estado..."
              style={{ height: '400px', overflow: 'hidden', resize: 'none' }}
            ></textarea>
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#666' }}>{formData.faleSobre.length}/600</div>
          </div>

          <div className="form-group" style={{ marginTop: '24px', padding: '16px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fdfdfd' }}>
            <h4 style={{ margin: '0 0 16px 0', color: '#1e3a8a' }}>Escolha o modelo de banner que combine com o seu carro</h4>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '16px' }}>Temos 6 opções de design para destacar o seu veículo na vitrine principal. A Opção 1 já está selecionada abaixo.</p>
            
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {[1, 2, 3, 4, 5, 6].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setBannerLayout(num)}
                  style={{
                    flex: 1,
                    minWidth: '60px',
                    padding: '10px 0',
                    border: bannerLayout === num ? '2px solid #ef4444' : '1px solid #ccc',
                    backgroundColor: bannerLayout === num ? '#fee2e2' : '#fff',
                    color: bannerLayout === num ? '#ef4444' : '#333',
                    fontWeight: 'bold',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Opção {num}
                </button>
              ))}
            </div>
            
            <div style={{ pointerEvents: 'none' }}>
              <DynamicBanner previewOverride={{
                layout: bannerLayout,
                car: {
                  marca: formData.marca || 'Marca',
                  modelo: formData.modelo || 'Modelo',
                  ano: formData.ano || '2024',
                  km: formData.km || '0',
                  imagens: images.filter(img => img !== null).length > 0 
                    ? images.filter(img => img !== null).map(img => img.preview)
                    : ['/car_placeholder_1.png', '/car_placeholder_2.png', '/car_placeholder_3.png', '/car_placeholder_4.png', '/car_placeholder_5.png', '/car_placeholder_6.png']
                }
              }} />
            </div>
          </div>

          {showErrorAlert && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #ef4444', color: '#b91c1c', padding: '16px', borderRadius: '8px', marginTop: '16px', marginBottom: '16px', fontWeight: 'bold', textAlign: 'center' }}>
              ❌ Atenção: Faltam campos obrigatórios! Por favor, role a página para cima e preencha todos os campos marcados com * (asterisco vermelho).
            </div>
          )}
          <button type="submit" onClick={() => setShowErrorAlert(false)} className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} disabled={loading}>
            {loading ? (typeof loading === 'string' ? loading : 'Processando...') : (editId ? 'Salvar Alterações' : 'Cadastrar Automóvel')}
          </button>
        </form>
      </div>
    </div>
  );
}