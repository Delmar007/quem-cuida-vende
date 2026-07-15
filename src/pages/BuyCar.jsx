import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { maskCurrency, maskInt, applyCurrencyBlur, unmask, maskCPF, validateCPF } from '../utils/masks';
import FipeSelects from '../components/FipeSelects';
import { useFipe } from '../hooks/useFipe';
import TradeInForm from '../components/TradeInForm';
import StateCitySelect from '../components/StateCitySelect';
import { detectAndBlur } from '../utils/imageUtils';
const anos = Array.from({ length: 2026 - 1970 + 1 }, (_, i) => 2026 - i);
const coresDisponiveis = ['Branco', 'Preto', 'Prata', 'Cinza', 'Vermelho', 'Azul', 'Verde', 'Amarelo', 'Marrom', 'Laranja', 'Bordô', 'Bege', 'Dourado', 'Rosa', 'Roxo'];
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

export default function BuyCar({ isAdmin }) {
  const [session, setSession] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFamiliares, setShowFamiliares] = useState(false);
  
  const [showSegundaOpcao, setShowSegundaOpcao] = useState(false);
  const [fipeData, setFipeData] = useState({ marcas: [], precos: {} });
  const [precosFipe, setPrecosFipe] = useState([]);
  const [precosFipe2, setPrecosFipe2] = useState([]);
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const fastMode = searchParams.get('fast') === 'true';
  const navigate = useNavigate();

  useEffect(() => {
    if (editId) {
      const loadRequest = async () => {
        const { data: req, error } = await supabase.from('requests').select('*').eq('id', editId).single();
        if (!error && req) {
          setFormData({
            nome: req.proprietarioNome || '',
            cpf: req.cpf || '',
            whatsapp: req.proprietarioTelefone || '',
            email: req.email || '',
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
            tipoVeiculo: req.tipoVeiculo || '',
            marca: req.marca || '',
            modelo: req.modelo || '',
            anoDe: req.anoDe?.toString() || '',
            anoAte: req.anoAte?.toString() || '',
            kmAte: req.kmAte ? maskInt(req.kmAte.toString()) : '',
            precoEntre: req.precoEntre ? maskCurrency(req.precoEntre.toString()) : '',
            precoAte: req.precoAte ? maskCurrency(req.precoAte.toString()) : '',
            tipoNegocio: req.tipoNegocio || '',
            cores: req.cores || [],
            
            tipoVeiculo2: req.segundaOpcao?.tipoVeiculo || '',
            marca2: req.segundaOpcao?.marca || '',
            modelo2: req.segundaOpcao?.modelo || '',
            anoDe2: req.segundaOpcao?.anoDe?.toString() || '',
            anoAte2: req.segundaOpcao?.anoAte?.toString() || '',
            kmAte2: req.segundaOpcao?.kmAte ? maskInt(req.segundaOpcao.kmAte.toString()) : '',
            precoEntre2: req.segundaOpcao?.precoEntre ? maskCurrency(req.segundaOpcao.precoEntre.toString()) : '',
            precoAte2: req.segundaOpcao?.precoAte ? maskCurrency(req.segundaOpcao.precoAte.toString()) : '',
            tipoNegocio2: req.segundaOpcao?.tipoNegocio || '',
            cores2: req.segundaOpcao?.cores || []
          });
          if (req.segundaOpcao && req.segundaOpcao.marca) {
            setShowSegundaOpcao(true);
          }
        }
      };
      loadRequest();
    }
  }, [editId]);

  const { fetchPreco } = useFipe('cars');
  
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    whatsapp: '',
    email: '',
    dataNascimento: '',
    cidade: '',
    estado: '',
    estadoCivil: 'solteiro',
    conjugeNome: '',
    conjugeDataNascimento: '',
    conjugeWhatsapp: '',
    filhosCount: '0',
    filhos: [],
    sexo: 'Masculino',
    time: '',
    hobby: '',
    tipoVeiculo: '',
    marca: '',
    modelo: '',
    anoDe: '',
    anoAte: '',
    kmAte: '',
    precoEntre: '',
    precoAte: '',
    tipoNegocio: '',
    cores: [],
    marca2: '',
    modelo2: '',
    anoDe2: '',
    anoAte2: '',
    kmAte2: '',
    precoEntre2: '',
    precoAte2: '',
    tipoNegocio2: '',
    cores2: []
  });

  const [tradeInData, setTradeInData] = useState({
    tipoVeiculo: '', marca: '', modelo: '', ano: '', anoModelo: '', cambio: '', tracao: '',
    km: '', precoFipe: '', precoPedido: '', ipvaPago: 'sim', cidade: 'Campo Grande',
    detalhes: '', faleSobre: ''
  });
  const [tradeInImages, setTradeInImages] = useState(Array(6).fill(null));

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
  }, []);

  useEffect(() => {
    async function fetchPrices(marcaCode, modeloCode, anoDe, anoAte, setState) {
      if (!marcaCode || !modeloCode || !anoDe || !anoAte) {
        setState([]);
        return;
      }
      
      const yearStart = Math.min(Number(anoDe), Number(anoAte));
      const yearEnd = Math.max(Number(anoDe), Number(anoAte));
      
      try {
        const r = await fetch(`https://fipe.parallelum.com.br/api/v2/cars/brands/${marcaCode}/models/${modeloCode}/years`);
        if (!r.ok) throw new Error();
        const anosAPI = await r.json();
        
        const results = [];
        for (let y = yearStart; y <= yearEnd; y++) {
          const validAno = anosAPI.find(a => String(a.name).includes(String(y)));
          if (validAno) {
             const precoData = await fetchPreco(marcaCode, modeloCode, validAno.code);
             if (precoData && precoData.Valor) {
                results.push({ ano: y, preco: precoData.Valor, exists: true });
             } else {
                results.push({ ano: y, preco: null, exists: false });
             }
          } else {
             results.push({ ano: y, preco: null, exists: false });
          }
        }
        setState(results);
      } catch (e) {
        setState([]);
      }
    }

    fetchPrices(formData.marcaCode, formData.modeloCode, formData.anoDe, formData.anoAte, setPrecosFipe);
  }, [formData.marcaCode, formData.modeloCode, formData.anoDe, formData.anoAte]);

  useEffect(() => {
    async function fetchPrices(marcaCode, modeloCode, anoDe, anoAte, setState) {
      if (!marcaCode || !modeloCode || !anoDe || !anoAte) {
        setState([]);
        return;
      }
      
      const yearStart = Math.min(Number(anoDe), Number(anoAte));
      const yearEnd = Math.max(Number(anoDe), Number(anoAte));
      
      try {
        const r = await fetch(`https://fipe.parallelum.com.br/api/v2/cars/brands/${marcaCode}/models/${modeloCode}/years`);
        if (!r.ok) throw new Error();
        const anosAPI = await r.json();
        
        const results = [];
        for (let y = yearStart; y <= yearEnd; y++) {
          const validAno = anosAPI.find(a => String(a.name).includes(String(y)));
          if (validAno) {
             const precoData = await fetchPreco(marcaCode, modeloCode, validAno.code);
             if (precoData && precoData.Valor) {
                results.push({ ano: y, preco: precoData.Valor, exists: true });
             } else {
                results.push({ ano: y, preco: null, exists: false });
             }
          } else {
             results.push({ ano: y, preco: null, exists: false });
          }
        }
        setState(results);
      } catch (e) {
        setState([]);
      }
    }

    fetchPrices(formData.marca2Code, formData.modelo2Code, formData.anoDe2, formData.anoAte2, setPrecosFipe2);
  }, [formData.marca2Code, formData.modelo2Code, formData.anoDe2, formData.anoAte2]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'cpf') {
      setFormData(prev => ({ ...prev, [name]: maskCPF(value) }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'marca') {
      setFormData(prev => ({ ...prev, modelo: '' }));
    }
    if (name === 'marca2') {
      setFormData(prev => ({ ...prev, modelo2: '' }));
    }
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

  const handleFilhoChange = (index, field, value) => {
    setFormData(prev => {
      const newFilhos = [...prev.filhos];
      newFilhos[index] = { ...newFilhos[index], [field]: value };
      return { ...prev, filhos: newFilhos };
    });
  };

  const handleColorChange = (cor) => {
    setFormData(prev => {
      const { cores } = prev;
      if (cores.includes(cor)) {
        return { ...prev, cores: cores.filter(c => c !== cor) };
      }
      if (cores.length < 6) {
        return { ...prev, cores: [...cores, cor] };
      }
      return prev;
    });
  };

  const handleColorChange2 = (cor) => {
    setFormData(prev => {
      const { cores2 } = prev;
      if (cores2.includes(cor)) {
        return { ...prev, cores2: cores2.filter(c => c !== cor) };
      }
      if (cores2.length < 6) {
        return { ...prev, cores2: [...cores2, cor] };
      }
      return prev;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAdmin && !session) {
      alert("Atenção: só acessa o site após fazer o login do Google. Caso queira vender ou fazer pedido, faça o cadastro/login primeiro.");
      return;
    }
    if (!isAdmin && !fastMode && !validateCPF(formData.cpf)) {
      alert("Por favor, digite um CPF válido.");
      return;
    }
    setLoading(true);

    const newRequest = {
      id: editId || Date.now().toString(),
      cpf: formData.cpf || '000.000.000-00',
      clienteNome: formData.nome,
      clienteTelefone: formData.whatsapp,
      clienteEmail: formData.email,
      cidade: formData.cidade,
      estado: formData.estado,
      status: 'pendente',
      dataNascimento: formData.dataNascimento,
      estadoCivil: formData.estadoCivil,
      conjuge: (formData.estadoCivil === 'casado' || formData.estadoCivil === 'namorando') ? {
        nome: formData.conjugeNome,
        dataNascimento: formData.conjugeDataNascimento,
        whatsapp: formData.conjugeWhatsapp
      } : null,
      filhos: formData.filhos,
      sexo: formData.sexo,
      time: formData.time,
      hobby: formData.hobby,
      tipoVeiculo: formData.tipoVeiculo,
      marca: formData.marca,
      modelo: formData.modelo,
      anoInicial: String(formData.anoDe),
      anoFinal: String(formData.anoAte),
      kmAte: formData.kmAte ? unmask(formData.kmAte) : 0,
      precoEntre: formData.precoEntre ? unmask(formData.precoEntre) : 0,
      precoAte: formData.precoAte ? unmask(formData.precoAte) : 0,
      tipoNegocio: formData.tipoNegocio,
      cores: formData.cores,
      segundaOpcao: showSegundaOpcao ? {
        marca: formData.marca2,
        modelo: formData.modelo2,
        anoInicial: String(formData.anoDe2),
        anoFinal: String(formData.anoAte2),
        kmAte: formData.kmAte2 ? unmask(formData.kmAte2) : 0,
        precoEntre: formData.precoEntre2 ? unmask(formData.precoEntre2) : 0,
        precoAte: formData.precoAte2 ? unmask(formData.precoAte2) : 0,
        tipoNegocio: formData.tipoNegocio2,
        cores: formData.cores2
      } : null
    };

    const isTradeIn = formData.tipoNegocio?.includes('Troca') || (showSegundaOpcao && formData.tipoNegocio2?.includes('Troca'));

    if (isTradeIn) {
      if (!tradeInData.tipoVeiculo || !tradeInData.marca || !tradeInData.modelo || !tradeInData.cambio || !tradeInData.precoPedido) {
        alert("Por favor, preencha todos os campos obrigatórios do veículo de troca.");
        setLoading(false);
        return;
      }

      setLoading("Processando imagens da troca...");
      const uploadedImageUrls = [];
      for (let i = 0; i < tradeInImages.length; i++) {
        const item = tradeInImages[i];
        if (item && item.file) {
          setLoading(`Borrando placas... (${i+1}/${tradeInImages.filter(x => x && x.file).length})`);
          const file = await detectAndBlur(item.file);
          
          setLoading(`Enviando foto da troca ${i+1}...`);
          const fileExt = file.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { data, error } = await supabase.storage.from('carros').upload(filePath, file);

          if (!error && data) {
            const { data: { publicUrl } } = supabase.storage.from('carros').getPublicUrl(filePath);
            uploadedImageUrls.push(publicUrl);
          } else {
            uploadedImageUrls.push(null);
          }
        } else {
          uploadedImageUrls.push(null);
        }
      }

      const newTradeInCar = {
        id: Date.now().toString() + "T",
        cpf: formData.cpf || '000.000.000-00',
        proprietarioNome: formData.nome,
        proprietarioTelefone: formData.whatsapp,
        proprietarioEmail: formData.email,
        dataNascimento: formData.dataNascimento,
        estadoCivil: formData.estadoCivil,
        conjuge: (formData.estadoCivil === 'casado' || formData.estadoCivil === 'namorando') ? {
          nome: formData.conjugeNome,
          dataNascimento: formData.conjugeDataNascimento,
          whatsapp: formData.conjugeWhatsapp
        } : null,
        filhos: formData.filhos,
        sexo: formData.sexo,
        time: formData.time,
        hobby: formData.hobby,
        cidade: tradeInData.cidade,
        status: 'pendente',
        negociacao: 'Troca',
        tipoVeiculo: tradeInData.tipoVeiculo,
        marca: tradeInData.marca,
        modelo: tradeInData.modelo,
        ano: tradeInData.ano ? parseInt(tradeInData.ano) : null,
        anoModelo: tradeInData.anoModelo ? parseInt(tradeInData.anoModelo) : null,
        km: tradeInData.km ? unmask(tradeInData.km) : 0,
        fipe: tradeInData.precoFipe ? unmask(tradeInData.precoFipe) : 0,
        venda: tradeInData.precoPedido ? unmask(tradeInData.precoPedido) : 0,
        ipva_pago: tradeInData.ipvaPago === 'sim',
        cambio: tradeInData.cambio,
        tracao: tradeInData.tracao,
        detalhes: JSON.stringify({
          texto: tradeInData.detalhes || '',
          bannerLayout: 7,
          targetCar: {
            marca: formData.marca || formData.carroSelecionado || 'Qualquer',
            modelo: formData.modelo || '',
            anoDe: formData.anoDe || '',
            anoAte: formData.anoAte || '',
            kmAte: formData.kmAte || '',
            precoDe: formData.precoEntre || '',
            precoAte: formData.precoAte || '',
            tipoNegocio: (formData.tipoNegocio?.includes('Troca') ? formData.tipoNegocio : formData.tipoNegocio2) || 'Troca'
          }
        }),
        faleSobre: tradeInData.faleSobre,
        imagem: uploadedImageUrls.find(url => url !== null) || null,
        imagens: uploadedImageUrls,
        dataCadastro: new Date().toISOString()
      };

      await supabase.from('cars').insert([newTradeInCar]);

      // Atrelar o carro de troca ao pedido
      newRequest.veiculoTroca = {
        id: newTradeInCar.id,
        imagem: newTradeInCar.imagem,
        marca: newTradeInCar.marca,
        modelo: newTradeInCar.modelo,
        ano: newTradeInCar.ano
      };
    }

    if (editId) {
      await supabase.from('requests').update(newRequest).eq('id', editId);
    } else {
      await supabase.from('requests').insert([newRequest]);
    }
  
    try {
      const templateParams = {
        to_email: formData.email,
        client_name: formData.nome,
        car_model: formData.carroSelecionado || formData.modelo || formData.marca,
        car_year: formData.anoDe + ' a ' + formData.anoAte,
        car_price: formData.precoAte,
        client_phone: formData.whatsapp
      };
      await emailjs.send('service_lydi1bc', 'template_0rtycgr', templateParams, 'YYtEpb4jX4ABDnDje');
    } catch (err) {
      console.error('Erro ao enviar email:', err);
    }

    if (window.fbq) {
      window.fbq('track', 'Lead', {
        content_name: 'Pedido de Carro / Troca'
      });
    }

    setLoading(false);
    alert('Seu pedido foi cadastrado! A qualquer momento entraremos em contato via whatsapp. Prepare-se para viver uma experiência INCRÍVEL !!!');
    navigate('/anuncios', { state: { activeTab: 'pedidos' } });
  };

  return (
    <div className={isAdmin ? "" : "main-content flex-center"} style={isAdmin ? { padding: '20px', backgroundColor: '#fff', borderRadius: '8px' } : { position: 'relative', backgroundColor: '#000', backgroundImage: 'url("/cabeçalho_colmeia.png.png")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', minHeight: '100vh', padding: '40px 20px' }}>
      <div className={isAdmin ? "" : "box-centered"} style={{ position: 'relative', maxWidth: isAdmin ? 'none' : '940px', width: '100%' }}>
        {!isAdmin && (
          <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: '24px', left: '24px', display: 'flex', alignItems: 'center', color: '#666', textDecoration: 'none', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontFamily: 'inherit', zIndex: 10 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Voltar
          </button>
        )}
        <h2 className="page-title" style={{ color: 'red', textAlign: isAdmin ? 'center' : 'left' }}>{editId ? 'Editar seu pedido:' : (isAdmin ? 'Cadastrar Novo Pedido (Admin)' : 'Cadastre seu pedido:')}</h2>
        {!isAdmin && !session && !editId && (
          <Link to="/" className="mobile-only" style={{ alignItems: 'center', color: '#1976D2', textDecoration: 'none', fontWeight: '600', marginBottom: '20px', fontSize: '0.9rem', backgroundColor: '#e3f2fd', padding: '8px 12px', borderRadius: '6px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Volte e logue no Google
          </Link>
        )}
        <form onSubmit={handleSubmit}>
          { !isAdmin && !fastMode && (
            <>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Nome Completo <span style={{color: 'red'}}>*</span></label>
              <input type="text" name="nome" value={formData.nome} onChange={handleChange} className="form-control" required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">CPF <span style={{color: 'red'}}>*</span></label>
              <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} className="form-control" required placeholder="Apenas números" />
            </div>
          </div>
          <div className="form-row">
            <StateCitySelect formData={formData} setFormData={setFormData} required={!fastMode} />
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">WhatsApp <span style={{color: 'red'}}>*</span></label>
              <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="form-control" required />
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
</>
          )}

          <p style={{color: 'red', fontSize: '1.2rem', fontWeight: '600', marginBottom: '16px', textAlign: 'center'}}>Vamos buscar o seu novo carro.</p>
          
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

          <FipeSelects formData={formData} setFormData={setFormData} hideAnoAndPreco={true} />

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Ano De <span style={{color: 'red'}}>*</span></label>
              <select name="anoDe" value={formData.anoDe} onChange={handleChange} className="form-control" required>
                <option value=""></option>
                {anos.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Ano Até <span style={{color: 'red'}}>*</span></label>
              <select name="anoAte" value={formData.anoAte} onChange={handleChange} className="form-control" required>
                <option value=""></option>
                {anos.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Com KM até:</label>
              <input type="text" name="kmAte" value={formData.kmAte} onChange={handleIntChange} className="form-control" placeholder="Ex: 50.000" />
            </div>
            <div className="form-group" style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
              <button 
                type="button" 
                onClick={() => setFormData(prev => ({ ...prev, marca: '', modelo: '', anoDe: '', anoAte: '', kmAte: '' }))}
                style={{ padding: '8px 16px', fontSize: '0.8rem', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                NOVA BUSCA
              </button>
            </div>
          </div>

          {formData.marca && formData.modelo && formData.modelo !== 'Qualquer' && (
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ color: 'red', fontWeight: 'bold' }}>Preços FIPE:</label>
              {(!formData.anoDe || !formData.anoAte) ? (
                <div style={{ color: '#666', fontSize: '0.9rem', backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px', fontStyle: 'italic' }}>
                  Preencha as 4 informações (Marca, Modelo, Ano De e Ano Até) para ver a FIPE.
                </div>
              ) : precosFipe.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {precosFipe.map(pf => (
                    <div key={pf.ano} style={{ display: 'inline-block', backgroundColor: '#ffe5e5', color: 'red', fontWeight: 'bold', padding: '8px 12px', borderRadius: '4px' }}>
                      {pf.exists 
                        ? `${pf.ano}: ${pf.preco}`
                        : `${pf.ano}: Esse modelo não foi fabricado nesta data`}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#d32f2f', fontSize: '0.9rem', backgroundColor: '#ffe5e5', padding: '8px', borderRadius: '4px' }}>
                  FIPE indisponível para este intervalo de anos.
                </div>
              )}
            </div>
          )}

          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Preço entre (R$):</label>
              <input type="text" name="precoEntre" value={formData.precoEntre} onChange={handleCurrencyChange} onBlur={handleCurrencyBlur} className="form-control" placeholder="Ex: 50.000,00" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Preço até (R$):</label>
              <input type="text" name="precoAte" value={formData.precoAte} onChange={handleCurrencyChange} onBlur={handleCurrencyBlur} className="form-control" placeholder="Ex: 100.000,00" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Preferência por cor: (escolha até 6 opções)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {coresDisponiveis.map(c => (
                <label key={c} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.cores.includes(c)}
                    onChange={() => handleColorChange(c)}
                  /> {c}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tipo de Negócio <span style={{color: 'red'}}>*</span></label>
            <select name="tipoNegocio" value={formData.tipoNegocio} onChange={handleChange} className="form-control" required>
              <option value="">Selecione...</option>
              <option value="Compra a vista">Compra a vista</option>
              <option value="Carta de credito">Carta de crédito</option>
              <option value="Troca por carro de menor valor">Troca por carro de menor valor</option>
              <option value="Troca por carro de maior valor">Troca por carro de maior valor</option>
              <option value="Troca por carro do mesmo valor">Troca por carro do mesmo valor</option>
            </select>
          </div>

          <div style={{ marginTop: '32px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              type="button"
              onClick={() => setShowSegundaOpcao(!showSegundaOpcao)}
              style={{
                width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px',
                fontSize: '1.8rem', fontWeight: 'bold', cursor: 'pointer', padding: 0
              }}
            >
              {showSegundaOpcao ? '-' : '+'}
            </button>
            <span style={{ fontSize: '1.2rem', fontWeight: '700' }}>Segunda opção de compra</span>
          </div>

          {showSegundaOpcao && (
            <div style={{ padding: '24px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
              <FipeSelects formData={formData} setFormData={setFormData} hideAnoAndPreco={true} fieldSuffix="2" />

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Ano De <span style={{color: 'red'}}>*</span></label>
                  <select name="anoDe2" value={formData.anoDe2} onChange={handleChange} className="form-control" required={showSegundaOpcao}>
                    <option value=""></option>
                    {anos.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Ano Até <span style={{color: 'red'}}>*</span></label>
                  <select name="anoAte2" value={formData.anoAte2} onChange={handleChange} className="form-control" required={showSegundaOpcao}>
                    <option value=""></option>
                    {anos.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Com KM até:</label>
                  <input type="text" name="kmAte2" value={formData.kmAte2 || ''} onChange={handleIntChange} className="form-control" placeholder="Ex: 50.000" />
                </div>
                <div className="form-group" style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                  <button 
                    type="button" 
                    onClick={() => setFormData(prev => ({ ...prev, marca2: '', modelo2: '', anoDe2: '', anoAte2: '', kmAte2: '' }))}
                    style={{ padding: '8px 16px', fontSize: '0.8rem', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    NOVA BUSCA
                  </button>
                </div>
              </div>

              {formData.marca2 && formData.modelo2 && formData.modelo2 !== 'Qualquer' && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ color: 'red', fontWeight: 'bold' }}>Preços FIPE:</label>
                  {(!formData.anoDe2 || !formData.anoAte2) ? (
                    <div style={{ color: '#666', fontSize: '0.9rem', backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px', fontStyle: 'italic' }}>
                      Preencha as 4 informações (Marca, Modelo, Ano De e Ano Até) para ver a FIPE.
                    </div>
                  ) : precosFipe2.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {precosFipe2.map(pf => (
                        <div key={pf.ano} style={{ display: 'inline-block', backgroundColor: '#ffe5e5', color: 'red', fontWeight: 'bold', padding: '8px 12px', borderRadius: '4px' }}>
                          {pf.exists 
                            ? `${pf.ano}: ${pf.preco}`
                            : `${pf.ano}: Esse modelo não foi fabricado nesta data`}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#d32f2f', fontSize: '0.9rem', backgroundColor: '#ffe5e5', padding: '8px', borderRadius: '4px' }}>
                      FIPE indisponível para este intervalo de anos.
                    </div>
                  )}
                </div>
              )}

              <div className="form-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Preço entre (R$):</label>
                  <input type="text" name="precoEntre2" value={formData.precoEntre2} onChange={handleCurrencyChange} onBlur={handleCurrencyBlur} className="form-control" placeholder="Ex: 50.000,00" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Preço até (R$):</label>
                  <input type="text" name="precoAte2" value={formData.precoAte2} onChange={handleCurrencyChange} onBlur={handleCurrencyBlur} className="form-control" placeholder="Ex: 100.000,00" />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label className="form-label">Preferência por cor: (escolha até 6 opções)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {coresDisponiveis.map(c => (
                    <label key={`cor2-${c}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                      <input 
                        type="checkbox" 
                        checked={formData.cores2.includes(c)}
                        onChange={() => handleColorChange2(c)}
                      /> {c}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tipo de Negócio <span style={{color: 'red'}}>*</span></label>
                <select name="tipoNegocio2" value={formData.tipoNegocio2} onChange={handleChange} className="form-control" required>
                  <option value="">Selecione...</option>
                  <option value="Compra a vista">Compra a vista</option>
                  <option value="Carta de credito">Carta de crédito</option>
                  <option value="Troca por carro de menor valor">Troca por carro de menor valor</option>
                  <option value="Troca por carro de maior valor">Troca por carro de maior valor</option>
                  <option value="Troca por carro do mesmo valor">Troca por carro do mesmo valor</option>
                </select>
              </div>
            </div>
          )}

          { (formData.tipoNegocio?.includes('Troca') || formData.tipoNegocio2?.includes('Troca')) && (
            <div style={{ marginTop: '40px', padding: '24px', border: '2px solid red', borderRadius: '8px', backgroundColor: '#fffdfd' }}>
              <h2 style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>Vamos cadastrar seu carro atual para a troca</h2>
              <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>Preencha os dados e anexe as fotos do seu veículo atual que entrará na negociação.</p>
              <TradeInForm data={tradeInData} setData={setTradeInData} images={tradeInImages} setImages={setTradeInImages} />
              
              <div style={{ marginTop: '32px', pointerEvents: 'none' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#1e3a8a', textAlign: 'center' }}>Como ficará o anúncio do seu veículo na nossa vitrine:</h4>
                <DynamicBanner previewOverride={{
                  layout: 7,
                  car: {
                    estado: formData.estado || 'UF',
                    marca: tradeInData.marca || 'Marca',
                    modelo: tradeInData.modelo || 'Modelo',
                    ano: tradeInData.ano || new Date().getFullYear(),
                    km: tradeInData.km || '0',
                    imagens: tradeInImages.filter(img => img && img.preview).length > 0
                      ? tradeInImages.filter(img => img && img.preview).map(img => img.preview)
                      : ['/car_placeholder_1.png', '/car_placeholder_2.png', '/car_placeholder_3.png', '/car_placeholder_4.png', '/car_placeholder_5.png', '/car_placeholder_6.png']
                  }
                }} />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '32px' }}>
            {loading ? 'Processando...' : 'Salvar'}
          </button>
        </form>
      </div>
    </div>
  );
}
