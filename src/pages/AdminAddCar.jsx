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

export default function AdminAddCar({ setActiveTab, isFranqueado }) {
  const [images, setImages] = useState(Array(6).fill(null));
  const [session, setSession] = useState(null);
  const [fornecedores, setFornecedores] = useState([]);
  const [parceiros, setParceiros] = useState([]);
  const [showParceirosDropdown, setShowParceirosDropdown] = useState(false);
  const [propOwnerOpen, setPropOwnerOpen] = useState(true);

  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const fastMode = searchParams.get('fast') === 'true';
  const navigate = useNavigate();

  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usePlateMasker, setUsePlateMasker] = useState(true);
  
  const [bannerLayout, setBannerLayout] = useState(1);
  const [formData, setFormData] = useState({
    parceiroNome: '',
    parceiroWhatsapp: '',
    parceiroEstado: 'SP',
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

  useEffect(() => {
    if (isFranqueado) {
      setFormData(prev => ({
        ...prev,
        nome: 'Delmar de Oliveira',
        cpf: '000.000.000-00',
        whatsapp: '67991694802',
        email: 'contato@vendeseucarro.com.br',
        cidade: 'Campo Grande',
        estado: 'MS'
      }));
    }
  }, [isFranqueado]);
  
  useEffect(() => {
    const loadLocalDataAndDB = async () => {
      try {
        let localFornecedores = [];
        let localParceiros = [];
        
        const storedF = localStorage.getItem('delmar_fornecedores');
        if (storedF) {
          localFornecedores = JSON.parse(storedF) || [];
          setFornecedores(localFornecedores);
        }
        
        const storedP = localStorage.getItem('delmar_parceiros');
        if (storedP) {
          localParceiros = JSON.parse(storedP) || [];
          setParceiros(localParceiros);
        }

        // Recuperar parceiros salvos nos carros no banco de dados
        const { data, error } = await supabase.from('cars').select('detalhes');
        if (!error && data) {
          const dbParceirosMap = new Map();
          
          // Adiciona os locais primeiro
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
          setParceiros(combinedParceiros);
          localStorage.setItem('delmar_parceiros', JSON.stringify(combinedParceiros));
        }
      } catch (e) {
        console.error("Erro ao carregar dados locais ou do DB", e);
      }
    };
    
    loadLocalDataAndDB();
  }, []);

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
    setFormData(prev => {
      let newState = { ...prev, [name]: value };
      
      if (name === 'nome') {
        const match = (fornecedores || []).find(f => f.nome.toLowerCase() === value.toLowerCase());
        if (match) {
          newState.whatsapp = match.whatsapp;
        }
      }
      if (name === 'parceiroWhatsapp') {
        const digits = value.replace(/\D/g, '');
        if (digits.length >= 2) {
          const ddd = digits.substring(0, 2);
          const dddToState = {
            '11': 'SP', '12': 'SP', '13': 'SP', '14': 'SP', '15': 'SP', '16': 'SP', '17': 'SP', '18': 'SP', '19': 'SP',
            '21': 'RJ', '22': 'RJ', '24': 'RJ', '27': 'ES', '28': 'ES',
            '31': 'MG', '32': 'MG', '33': 'MG', '34': 'MG', '35': 'MG', '37': 'MG', '38': 'MG',
            '41': 'PR', '42': 'PR', '43': 'PR', '44': 'PR', '45': 'PR', '46': 'PR',
            '47': 'SC', '48': 'SC', '49': 'SC', '51': 'RS', '53': 'RS', '54': 'RS', '55': 'RS',
            '61': 'DF', '62': 'GO', '64': 'GO', '63': 'TO',
            '65': 'MT', '66': 'MT', '67': 'MS',
            '68': 'AC', '69': 'RO',
            '71': 'BA', '73': 'BA', '74': 'BA', '75': 'BA', '77': 'BA',
            '79': 'SE', '81': 'PE', '87': 'PE', '82': 'AL',
            '83': 'PB', '84': 'RN', '85': 'CE', '88': 'CE',
            '86': 'PI', '89': 'PI',
            '91': 'PA', '93': 'PA', '94': 'PA',
            '92': 'AM', '97': 'AM', '95': 'RR', '96': 'AP',
            '98': 'MA', '99': 'MA'
          };
          if (dddToState[ddd]) {
            newState.parceiroEstado = dddToState[ddd];
          }
        }
      }
      return newState;
    });
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
    const count = parseInt(e.target.value);
    const newFilhos = [...formData.filhos];
    if (count > newFilhos.length) {
      for (let i = newFilhos.length; i < count; i++) {
        newFilhos.push({ nome: '', dataNascimento: '', whatsapp: '' });
      }
    } else {
      newFilhos.splice(count);
    }
    setFormData({ ...formData, filhosCount: e.target.value, filhos: newFilhos });
  };

  const handlePasteInfo = (e) => {
    const text = e.target.value;
    const newFormData = { ...formData };
    
    // Ano: match 20xx or 19xx
    const anoMatch = text.match(/\b(19\d{2}|20\d{2})\b/);
    if (anoMatch) {
      newFormData.ano = anoMatch[1];
      newFormData.anoModelo = anoMatch[1];
    }
    
    // KM: match number followed by KM
    const kmMatch = text.match(/\b([\d\.,]+)\s*km\b/i);
    if (kmMatch) {
      newFormData.km = kmMatch[1].replace(/[^\d]/g, '');
    }
    
    // IPVA: ipva 26 pago
    if (/ipva.*pago/i.test(text)) {
      newFormData.ipvaPago = 'sim';
    }
    
    // FIPE: fipe rs 379.129,00
    const fipeMatch = text.match(/fipe[^\d]*([\d\.,]+)/i);
    if (fipeMatch) {
      newFormData.precoFipe = fipeMatch[1].replace(/[^\d,]/g, ''); // keep only numbers and comma
    }
    
    // Preco: PRECISO DE PROPOSTA
    if (/preciso de proposta/i.test(text)) {
      newFormData.precoPedido = '';
    }
    
    // Local: 📍Conosco na NF
    const localMatch = text.match(/📍(.*?)($|\n)/);
    if (localMatch) {
      newFormData.cidade = localMatch[1].trim();
    }
    
    // Extração inteligente de Marca e Modelo pela primeira linha
    const marcasCarros = ['Acura', 'Agrale', 'Alfa Romeo', 'Audi', 'BMW', 'BYD', 'Caoa Chery', 'Chevrolet', 'Chrysler', 'Citroën', 'Dodge', 'Effa', 'Ferrari', 'Fiat', 'Ford', 'GWM', 'Honda', 'Hyundai', 'JAC', 'Jaguar', 'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Lifan', 'Maserati', 'McLaren', 'Mercedes-Benz', 'Mini', 'Mitsubishi', 'Nissan', 'Peugeot', 'Porsche', 'Ram', 'Renault', 'Rolls-Royce', 'Subaru', 'Suzuki', 'Toyota', 'Troller', 'Volkswagen', 'Volvo'];
    const lines = text.split('\n');
    let foundBrand = false;

    // Tenta achar a marca e modelo nas 3 primeiras linhas
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const upperLine = line.toUpperCase();
      const firstLineBrandMatch = marcasCarros.find(marca => upperLine.startsWith(marca.toUpperCase()));
      
      if (firstLineBrandMatch) {
        newFormData.marca = firstLineBrandMatch;
        foundBrand = true;
        // O modelo é o que sobra na linha após a marca
        const regex = new RegExp(`^${firstLineBrandMatch}\\s+(.*)`, 'i');
        const modelMatch = line.match(regex);
        if (modelMatch && modelMatch[1]) {
           let extractedModel = modelMatch[1].replace(/\b(19\d{2}|20\d{2})\b.*/, '').trim(); // Remove ano pra frente
           extractedModel = extractedModel.replace(/R\$.*/i, '').trim(); // Remove preço se houver
           newFormData.modelo = extractedModel;
        }
        break; // Achou na linha, pode parar
      }
    }

    if (!foundBrand) {
      // Fallback: procura em todo o texto se não achou no início das linhas
      const upperText = text.toUpperCase();
      const brandMatch = marcasCarros.find(marca => upperText.includes(marca.toUpperCase()));
      if (brandMatch) {
        newFormData.marca = brandMatch;
      }
    }

    newFormData.faleSobre = text; // Just store the full pasted text in "Fale sobre" to not lose anything
    setFormData(newFormData);
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

  const handleSaveParceiro = () => {
    if (!formData.parceiroNome) {
      alert('Por favor, informe o nome do parceiro.');
      return;
    }
    const newParceiro = {
      nome: formData.parceiroNome,
      whatsapp: formData.parceiroWhatsapp || '',
      estado: formData.parceiroEstado || 'SP'
    };
    
    let updatedParceiros = [...parceiros];
    const existingIndex = updatedParceiros.findIndex(p => p.nome.toLowerCase() === newParceiro.nome.toLowerCase());
    if (existingIndex >= 0) {
      updatedParceiros[existingIndex] = newParceiro;
    } else {
      updatedParceiros.push(newParceiro);
    }
    
    updatedParceiros.sort((a, b) => a.nome.localeCompare(b.nome));
    
    setParceiros(updatedParceiros);
    localStorage.setItem('delmar_parceiros', JSON.stringify(updatedParceiros));
    
    setFormData(prev => ({ ...prev, nome: newParceiro.nome, whatsapp: newParceiro.whatsapp, parceiroNome: '', parceiroWhatsapp: '', parceiroEstado: 'SP' }));
    alert('Parceiro salvo com sucesso!');
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
    // CPF validation removed for admin

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
          bannerLayout: bannerLayout,
          postedBy: isFranqueado ? 'franqueado' : 'admin',
          parceiro: formData.parceiroNome ? {
            nome: formData.parceiroNome,
            whatsapp: formData.parceiroWhatsapp,
            estado: formData.parceiroEstado
          } : null
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

      if (formData.nome) {
        const existingIndex = (fornecedores || []).findIndex(f => f.nome.toLowerCase() === formData.nome.toLowerCase());
        let newFornecedores = [...(fornecedores || [])];
        if (existingIndex >= 0) {
          if (formData.whatsapp) newFornecedores[existingIndex].whatsapp = formData.whatsapp;
        } else {
          newFornecedores.push({ nome: formData.nome, whatsapp: formData.whatsapp || '' });
        }
        localStorage.setItem('delmar_fornecedores', JSON.stringify(newFornecedores));
        setFornecedores(newFornecedores);
      }

      if (formData.parceiroNome) {
        const pIndex = (parceiros || []).findIndex(p => p.nome.toLowerCase() === formData.parceiroNome.toLowerCase());
        let newParceiros = [...(parceiros || [])];
        if (pIndex >= 0) {
          if (formData.parceiroWhatsapp) newParceiros[pIndex].whatsapp = formData.parceiroWhatsapp;
          if (formData.parceiroEstado) newParceiros[pIndex].estado = formData.parceiroEstado;
        } else {
          newParceiros.push({ nome: formData.parceiroNome, whatsapp: formData.parceiroWhatsapp || '', estado: formData.parceiroEstado || 'SP' });
        }
        localStorage.setItem('delmar_parceiros', JSON.stringify(newParceiros));
        setParceiros(newParceiros);
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
      <div className="main-content">
      <div className="box-centered">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>Painel Admin: Cadastrar Anúncio</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Anúncio adicionado com sucesso!</p>
        </div>
        <p style={{ marginTop: '16px', marginBottom: '32px', color: '#666' }}>O anúncio foi cadastrado. Agora você pode vê-lo na vitrine de anúncios ou moderar se necessário.</p>
          {setActiveTab ? (
            <button 
              onClick={() => {
                setActiveTab('moderacao');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
              style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: 'var(--primary-color)', color: 'white', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
            >
              Ir para Moderação
            </button>
          ) : (
            <Link to="/admin" style={{ display: 'inline-block', padding: '12px 24px', backgroundColor: 'var(--primary-color)', color: 'white', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
              Voltar ao Painel
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="main-content flex-center" style={{ padding: 0 }}>
      <div className="box-centered" style={{ position: 'relative', maxWidth: '940px', width: '100%' }}>
        <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: '24px', left: '24px', display: 'flex', alignItems: 'center', color: '#666', textDecoration: 'none', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontFamily: 'inherit', zIndex: 10 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Voltar
        </button>
        <h2 className="page-title" style={{ color: 'red' }}>{editId ? 'Editar Anúncio:' : 'Adicionar Novo Anúncio (Admin):'}</h2>
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
              {!isFranqueado && (
              <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #bae6fd' }}>
                <h3 style={{ marginTop: 0, color: '#0369a1', fontSize: '1.1rem', marginBottom: '16px' }}>Cadastrar Parceiro</h3>
                <div className="form-row" style={{ position: 'relative' }}>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">Nome do Parceiro</label>
                    <input 
                      type="text" 
                      name="parceiroNome" 
                      value={formData.parceiroNome} 
                      onChange={handleChange} 
                      className="form-control" 
                      autoComplete="off" 
                      placeholder="Ex: João da Silva"
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">WhatsApp</label>
                    <input type="text" name="parceiroWhatsapp" value={formData.parceiroWhatsapp} onChange={handleChange} className="form-control" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Estado (UF)</label>
                    <select name="parceiroEstado" value={formData.parceiroEstado} onChange={handleChange} className="form-control">
                      <option value="AC">AC</option><option value="AL">AL</option><option value="AP">AP</option>
                      <option value="AM">AM</option><option value="BA">BA</option><option value="CE">CE</option>
                      <option value="DF">DF</option><option value="ES">ES</option><option value="GO">GO</option>
                      <option value="MA">MA</option><option value="MT">MT</option><option value="MS">MS</option>
                      <option value="MG">MG</option><option value="PA">PA</option><option value="PB">PB</option>
                      <option value="PR">PR</option><option value="PE">PE</option><option value="PI">PI</option>
                      <option value="RJ">RJ</option><option value="RN">RN</option><option value="RS">RS</option>
                      <option value="RO">RO</option><option value="RR">RR</option><option value="SC">SC</option>
                      <option value="SP">SP</option><option value="SE">SE</option><option value="TO">TO</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: '16px', textAlign: 'right' }}>
                  <button type="button" onClick={handleSaveParceiro} style={{ backgroundColor: '#0369a1', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Salvar Parceiro</button>
                </div>
              </div>
              )}

              <div className="form-row">
                <div className="form-group" style={{ flex: 2, position: 'relative' }}>
                  <label className="form-label">Nome do Parceiro</label>
                  <select
                    name="nome"
                    value={formData.nome}
                    onChange={(e) => {
                      const val = e.target.value;
                      const p = (parceiros || []).find(x => x.nome === val) || (val === 'Delmar Oliveira' ? { nome: 'Delmar Oliveira', whatsapp: '' } : null);
                      if (p) {
                        setFormData(prev => ({ ...prev, nome: p.nome, whatsapp: p.whatsapp }));
                      } else {
                        setFormData(prev => ({ ...prev, nome: val, whatsapp: '' }));
                      }
                    }}
                    className="form-control"
                    disabled={isFranqueado}
                  >
                    <option value="">Selecione um parceiro...</option>
                    <option value="Delmar Oliveira">Delmar Oliveira</option>
                    {(parceiros || []).filter(p => p.nome !== 'Delmar Oliveira').map((p, idx) => (
                      <option key={idx} value={p.nome}>{p.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">WhatsApp</label>
                  <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="form-control" disabled={isFranqueado} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Colar informações do veículo (Preenchimento automático)</label>
                <textarea 
                  className="form-control" 
                  placeholder="Cole aqui as informações do veículo para preenchimento automático..."
                  maxLength="1000"
                  onChange={handlePasteInfo}
                  style={{ height: '300px', overflow: 'hidden', resize: 'none' }}
                ></textarea>
                <small style={{ color: '#666' }}>As informações coladas aqui preencherão os campos abaixo automaticamente. O que não for identificado será ignorado.</small>
              </div>

            <hr style={{ margin: '32px 0', borderColor: '#eee' }} />
            </>
          )}

          <div className="form-group">
            <label className="form-label">Tipo de Veículo</label>
            <select name="tipoVeiculo" value={formData.tipoVeiculo} onChange={handleChange} className="form-control">
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

          <FipeSelects formData={formData} setFormData={setFormData} isOptional={true} />

          {/* Ano Modelo e Combustível agora são preenchidos automaticamente pelo FipeSelects */}

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Câmbio</label>
              <select name="cambio" value={formData.cambio} onChange={handleChange} className="form-control">
                <option value="">Selecione...</option>
                <option value="Manual">Manual</option>
                <option value="Automático">Automático</option>
                <option value="Dualogic">Dualogic</option>
                <option value="Hidramático">Hidramático</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Tração</label>
              <select name="tracao" value={formData.tracao} onChange={handleChange} className="form-control">
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
              <label className="form-label">Tipo de Negociação</label>
              <select name="negociacao" value={formData.negociacao} onChange={handleChange} className="form-control">
                <option value="">Selecione...</option>
                {negociacoesList.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">No momento o KM é:</label>
              <input type="text" name="km" value={formData.km} onChange={handleIntChange} className="form-control" placeholder="Ex: 60.000" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">IPVA Pago?</label>
              <select name="ipvaPago" value={formData.ipvaPago} onChange={handleChange} className="form-control">
                <option value="sim">Sim</option>
                <option value="nao">Não</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <StateCitySelect formData={formData} setFormData={setFormData} />
          </div>

          {/* Toggle Informações do Proprietário (Hide if Franqueado) */}
          {!isFranqueado && (
            <div className="form-section">
              <h3 
                style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid var(--border)', fontSize: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setPropOwnerOpen(!propOwnerOpen)}
              >
                Informações do Proprietário
                <span style={{ fontSize: '0.9rem', color: 'var(--primary-color)' }}>
                  {propOwnerOpen ? '▲ Ocultar' : '▼ Expandir'}
                </span>
              </h3>
              
              {propOwnerOpen && (
                <>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Nome Completo do Proprietário*</label>
                      <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Ex: João da Silva" className="form-control" required />
                    </div>
                    <div className="form-group">
                      <label>CPF do Proprietário</label>
                      <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" className="form-control" />
                    </div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>WhatsApp do Proprietário*</label>
                      <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleChange} placeholder="(00) 00000-0000" className="form-control" required />
                    </div>
                    <div className="form-group">
                      <label>E-mail do Proprietário</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="exemplo@email.com" className="form-control" />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

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
              style={{ padding: '20px', border: '2px dashed #ccc', borderRadius: '8px', backgroundColor: '#fafafa', marginBottom: '16px', textAlign: 'center' }}
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
                      {i === 0 && (
                        <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', backgroundColor: 'rgba(220, 38, 38, 0.9)', color: '#fff', fontSize: '0.7rem', padding: '4px 0', textAlign: 'center', fontWeight: 'bold' }}>
                          IMAGEM PRINCIPAL
                        </div>
                      )}
                    </>
                  ) : (
                    <label style={{ position: 'relative', width: '100%', height: '100%', cursor: 'pointer', display: 'block' }}>
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const newImages = [...images];
                          newImages[i] = { file, preview: URL.createObjectURL(file) };
                          setImages(newImages);
                        }
                      }} />
                      <img src={`/car_placeholder_${i+1}.png`} style={{width: '100%', height: '100%', objectFit: 'cover', opacity: 1}} alt={`Guia Foto ${i+1}`} />
                      <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 'calc(1.1rem + 10px)', color: '#000', textShadow: '2px 2px 4px #fff, -2px -2px 4px #fff, 2px -2px 4px #fff, -2px 2px 4px #fff' }}>+ Foto {i+1}</span>
                    </label>
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