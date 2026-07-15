import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AdminAddCar from './AdminAddCar';
import BuyCar from './BuyCar';
import AdminFastAdd from '../components/AdminFastAdd';
import DynamicBanner from '../components/DynamicBanner';
import ErrorBoundary from '../components/ErrorBoundary';
import AdminAnalytics from './AdminAnalytics';

const GOOGLE_FONTS = [
  "Inter", "Roboto", "Open Sans", "Montserrat", "Lato", "Poppins", "Oswald", "Raleway", "Playfair Display", "Bebas Neue",
  "Ubuntu", "Rubik", "Merriweather", "Nunito", "PT Sans", "Work Sans", "Quicksand", "Fira Sans", "Barlow", "Titillium Web",
  "Josefin Sans", "Mulish", "Inconsolata", "Anton", "Lobster", "Dancing Script", "Pacifico", "Cabin", "Karla", "Righteous",
  "Teko", "Cinzel", "Abril Fatface", "Alfa Slab One", "Permanent Marker", "Caveat", "Indie Flower", "Satisfy", "Courgette", "Great Vibes",
  "Amatic SC", "Sacramento", "Handlee", "Creepster", "Bangers", "Press Start 2P", "Audiowide", "Orbitron", "Syncopate", "Michroma"
];

const getPosStyles = (pos) => {
  switch(pos) {
    case 'top-left': return { justifyContent: 'flex-start', alignItems: 'flex-start', textAlign: 'left' };
    case 'top-center': return { justifyContent: 'flex-start', alignItems: 'center', textAlign: 'center' };
    case 'top-right': return { justifyContent: 'flex-start', alignItems: 'flex-end', textAlign: 'right' };
    case 'center-left': return { justifyContent: 'center', alignItems: 'flex-start', textAlign: 'left' };
    case 'center': return { justifyContent: 'center', alignItems: 'center', textAlign: 'center' };
    case 'center-right': return { justifyContent: 'center', alignItems: 'flex-end', textAlign: 'right' };
    case 'bottom-left': return { justifyContent: 'flex-end', alignItems: 'flex-start', textAlign: 'left' };
    case 'bottom-center': return { justifyContent: 'flex-end', alignItems: 'center', textAlign: 'center' };
    case 'bottom-right': return { justifyContent: 'flex-end', alignItems: 'flex-end', textAlign: 'right' };
    default: return { justifyContent: 'center', alignItems: 'center', textAlign: 'center' };
  }
};

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('veiculos');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  // -- ESTADO INSTITUCIONAL --
  const [instData, setInstData] = useState({
    'quem-somos': [], 'nossos-clientes': [], 'nossa-oficina': [], 'testemunhos': []
  });
  
  // -- ESTADO TESTEMUNHOS DE USUARIOS --
  const [userTestimonials, setUserTestimonials] = useState([]);
  
  // -- ESTADO CRM --
  const [cars, setCars] = useState([]);
  const [requests, setRequests] = useState([]);
  const [editingId, setEditingId] = useState(null); // ID do item em edição
  const [editingBannerId, setEditingBannerId] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [moderingCar, setModeringCar] = useState(null);
  const [adminBrandFilter, setAdminBrandFilter] = useState('');

  const tabs = [
    { id: 'anuncio-rapido', label: 'Cadastro Rápido', type: 'crm' },
    { id: 'cadastrar-anuncio', label: 'Cadastrar Anúncio', type: 'crm' },
    { id: 'cadastrar-pedido', label: 'Cadastrar Pedido', type: 'crm' },
    { id: 'moderacao', label: 'Aprovação de Anúncios NF', type: 'crm' },
    { id: 'veiculos', label: 'Veículos à Venda', type: 'crm' },
    { id: 'pedidos', label: 'Ver Pedidos', type: 'crm' },
    { id: 'matches', label: 'Pedidos Encontrados', type: 'crm' },
    { id: 'aniversariantes', label: 'Aniversariantes da Semana', type: 'crm' },
    { id: 'quem-somos', label: 'Quem Somos', type: 'inst' },
    { id: 'nossos-clientes', label: 'Nossos Clientes', type: 'inst' },
    { id: 'nossa-oficina', label: 'Nossa Oficina', type: 'inst' },
    { id: 'testemunhos', label: 'Testemunhos', type: 'inst' },
    { id: 'banner-patrocinado', label: 'Banner Patrocinado', type: 'inst' },
    { id: 'banner_config', label: 'Configurações do Banner', type: 'inst' },
    { id: 'analytics', label: 'Tráfego (Analytics)', type: 'sys' },
    { id: 'config', label: 'Alterar Senha', type: 'sys' }
  ];

  useEffect(() => {
    // Clear old localStorage token just in case it got stuck
    localStorage.removeItem('delmar_admin_auth');
    
    // Check Auth
    if (sessionStorage.getItem('delmar_admin_auth') === 'true') {
      setIsAuthenticated(true);
    }

    // Load Institucional from Supabase
    const loadInst = async () => {
      const { data, error } = await supabase.from('institucional').select('*');
      if (!error && data) {
        const newData = { 'quem-somos': [], 'nossos-clientes': [], 'nossa-oficina': [], 'testemunhos': [], 'banner-patrocinado': [] };
        data.forEach(item => {
          if (!newData[item.page]) newData[item.page] = [];
          newData[item.page].push({ id: item.id || Date.now(), title: item.title || '', text: item.text_content || '', image: item.image || '' });
        });
        setInstData(newData);
      }
      
      const { data: userT, error: errT } = await supabase.from('user_testimonials').select('*').order('created_at', { ascending: false });
      if (userT) setUserTestimonials(userT);
    };
    loadInst();

    // Load Cars and Requests from Supabase (only if already authenticated)
    if (sessionStorage.getItem('delmar_admin_auth') === 'true') {
      loadCRMData();
    }
  }, []);

  const loadCRMData = async () => {
    const { data: carros, error: errorCarros } = await supabase.from('cars').select('*').order('id', { ascending: false });
    if (!errorCarros && carros) {
      setCars(carros.map(car => {
        let cleanMarca = car.marca ? car.marca.replace(/\*/g, '').trim() : '';
        if (cleanMarca.toLowerCase() === 'ferraris') cleanMarca = 'Ferrari';
        if (cleanMarca.toLowerCase() === 'mercedes') cleanMarca = 'Mercedes-Benz';
        if (cleanMarca.toLowerCase() === 'caoa-chery' || cleanMarca.toLowerCase() === 'chery') cleanMarca = 'Caoa Chery';
        
        return {
          ...car,
          marca: cleanMarca || car.marca
        };
      }));
    }

    const { data: pedidos, error: errorPedidos } = await supabase.from('requests').select('*');
    if (!errorPedidos && pedidos) setRequests(pedidos);
  };

  useEffect(() => {
    if (sessionStorage.getItem('delmar_admin_auth') === 'true') {
      if (['moderacao', 'veiculos', 'pedidos', 'matches'].includes(activeTab)) {
        loadCRMData();
      }
    }
  }, [activeTab]);

  // -------------------------
  // LOGICA INSTITUCIONAL
  // -------------------------
  const handleInstChange = (id, field, value) => {
    setInstData(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleInstImageUpload = (id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => handleInstChange(id, 'image', event.target.result);
    reader.readAsDataURL(file);
  };

  const handleInstAdd = () => {
    setInstData(prev => ({
      ...prev, [activeTab]: [...(prev[activeTab] || []), { id: Date.now(), image: '', title: '', text: '' }]
    }));
  };

  const handleInstRemove = (id) => {
    setInstData(prev => ({
      ...prev, [activeTab]: prev[activeTab].filter(item => item.id !== id)
    }));
  };

  const handleInstSave = async () => {
    try {
      const itemsToSave = instData[activeTab] || [];
      const dbItems = itemsToSave.map(item => ({
        page: activeTab,
        title: item.title,
        text_content: item.text,
        image: item.image
      }));
      
      const { error: deleteError } = await supabase.from('institucional').delete().eq('page', activeTab);
      if (deleteError) throw deleteError;
      
      if (dbItems.length > 0) {
        const { error: insertError } = await supabase.from('institucional').insert(dbItems);
        if (insertError) throw insertError;
      }
      
      alert('Página Institucional salva com sucesso na nuvem!');
    } catch (e) {
      alert('Erro ao salvar no Supabase. Verifique a conexão.');
      console.error(e);
    }
  };

  // -------------------------
  // LOGICA TESTEMUNHOS DE USUARIOS
  // -------------------------
  const handleTestimonialStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    const { error } = await supabase.from('user_testimonials').update({ status: newStatus }).eq('id', id);
    if (error) {
      alert('Erro ao atualizar status.');
      console.error(error);
    } else {
      setUserTestimonials(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    }
  };

  const handleTestimonialDelete = async (id) => {
    if (!window.confirm('Excluir este testemunho definitivamente?')) return;
    const { error } = await supabase.from('user_testimonials').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir.');
    } else {
      setUserTestimonials(prev => prev.filter(t => t.id !== id));
    }
  };

  // -------------------------
  // LOGICA CRM (VEICULOS E MODERACAO)
  // -------------------------
  const handleCarChange = (id, field, value) => {
    setCars(prev => prev.map(car => car.id === id ? { ...car, [field]: value } : car));
  };

  const moveImage = (carId, index, direction) => {
    setCars(prev => prev.map(car => {
      if (car.id === carId) {
        const newImagens = [...(car.imagens || [])];
        if (direction === 'left' && index > 0) {
          [newImagens[index - 1], newImagens[index]] = [newImagens[index], newImagens[index - 1]];
        } else if (direction === 'right' && index < newImagens.length - 1) {
          [newImagens[index], newImagens[index + 1]] = [newImagens[index + 1], newImagens[index]];
        }
        return { ...car, imagens: newImagens, imagem: newImagens[0] };
      }
      return car;
    }));
  };

  const approveCar = async (car) => {
    if (!window.confirm('Aprovar e publicar este anúncio?')) return;
    
    // Tratamento preventivo para garantir que 'imagens' seja um array válido sem 'undefined'
    let imagensPayload = Array.isArray(car.imagens) ? car.imagens : [];
    if (typeof car.imagens === 'string') {
      try { imagensPayload = JSON.parse(car.imagens); } catch(e){}
    }
    // Remover nulls vazios do array
    imagensPayload = imagensPayload.filter(img => img !== null && img !== undefined && img !== '');

    const { error } = await supabase.from('cars').update({ 
      status: 'aprovado',
      imagens: imagensPayload,
      imagem: car.imagem || (imagensPayload.length > 0 ? imagensPayload[0] : null)
    }).eq('id', car.id);

    if (error) {
      alert('Erro ao aprovar o anúncio: ' + error.message);
      console.error(error);
    } else {
      setCars(prev => prev.map(c => c.id === car.id ? { ...c, status: 'aprovado', imagens: imagensPayload } : c));
      alert('Anúncio aprovado e publicado com sucesso!');
    }
  };

  const handleCarImageUpload = (id, e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    setCars(prev => {
      const carIndex = prev.findIndex(c => c.id === id);
      if (carIndex === -1) return prev;
      
      const car = prev[carIndex];
      const existingImagens = car.imagens || (car.imagem ? [car.imagem] : []);
      
      let newImagens = [];
      let readCount = 0;

      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          newImagens.push(event.target.result);
          readCount++;
          if (readCount === files.length) {
            handleCarChange(id, 'imagens', [...existingImagens, ...newImagens]);
          }
        };
        reader.readAsDataURL(file);
      });
      return prev;
    });
  };

  const handleRemoveCarImage = (id, indexToRemove) => {
    const car = cars.find(c => c.id === id);
    if (!car || !car.imagens) return;
    let imgs = [];
    try { imgs = typeof car.imagens === 'string' ? JSON.parse(car.imagens) : car.imagens; } catch(e) {}
    if (!Array.isArray(imgs)) imgs = [];
    const updated = imgs.filter((_, idx) => idx !== indexToRemove);
    handleCarChange(id, 'imagens', updated);
  };

  const handleSaveCarDb = async (id) => {
    const carToSave = cars.find(c => c.id === id);
    if (!carToSave) return;
    try {
      const { error } = await supabase.from('cars').update(carToSave).eq('id', id);
      if (error) throw error;
      setEditingId(null);
      alert('Veículo salvo com sucesso!');
    } catch (e) {
      alert('Erro ao salvar no banco.');
      console.error(e);
    }
  };

  const handleDeleteCar = async (id) => {
    if(window.confirm('Tem certeza que deseja excluir este veículo?')) {
      try {
        const { error } = await supabase.from('cars').delete().eq('id', id);
        if (error) throw error;
        setCars(prev => prev.filter(c => c.id !== id));
      } catch (e) {
        alert('Erro ao excluir do banco.');
        console.error(e);
      }
    }
  };

  const handleToggleBanner = async (car) => {
    try {
      let detObj = {};
      try { detObj = JSON.parse(car.detalhes || '{}'); } catch(e){}
      
      const newVal = !detObj.destaqueBanner;
      detObj.destaqueBanner = newVal;
      const newDetalhes = JSON.stringify(detObj);
      
      const { error } = await supabase.from('cars').update({ detalhes: newDetalhes }).eq('id', car.id);
      if (error) throw error;
      
      setCars(prev => prev.map(c => c.id === car.id ? { ...c, detalhes: newDetalhes } : c));
    } catch (e) {
      alert('Erro ao atualizar destaque no banner.');
      console.error(e);
    }
  };

  // -------------------------
  // LOGICA CRM (PEDIDOS)
  // -------------------------
  const handleReqChange = (id, field, value) => {
    setRequests(prev => prev.map(req => req.id === id ? { ...req, [field]: value } : req));
  };

  const handleSaveReqDb = async (id) => {
    const reqToSave = requests.find(r => r.id === id);
    if (!reqToSave) return;
    try {
      const { error } = await supabase.from('requests').update(reqToSave).eq('id', id);
      if (error) throw error;
      setEditingId(null);
      alert('Pedido salvo com sucesso!');
    } catch (e) {
      alert('Erro ao salvar no banco.');
      console.error(e);
    }
  };

  const handleDeleteReq = async (id) => {
    if(window.confirm('Tem certeza que deseja excluir este pedido?')) {
      try {
        const { error } = await supabase.from('requests').delete().eq('id', id);
        if (error) throw error;
        setRequests(prev => prev.filter(r => r.id !== id));
      } catch (e) {
        alert('Erro ao excluir do banco.');
        console.error(e);
      }
    }
  };

  // -------------------------
  // LOGICA ANIVERSARIANTES
  // -------------------------
  const [anivMessageText, setAnivMessageText] = useState('Feliz aniversário {nome}. ');
  const [selectedAniversariantes, setSelectedAniversariantes] = useState([]);
  const [filaDisparo, setFilaDisparo] = useState([]);
  const [filaIndex, setFilaIndex] = useState(0);

  // Calculando os proximos 5 dias
  const today = new Date();
  const next5Days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      date: d,
      dayStr: d.getDate().toString().padStart(2, '0') + '/' + (d.getMonth() + 1).toString().padStart(2, '0'),
      isToday: i === 0,
      isTomorrow: i === 1,
      label: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d.getDay()]
    };
  });

  const getAniversariantes = () => {
    const allPeople = [];
    
      const parseItems = (items) => {
      items.forEach(item => {
        const ownerWhatsApp = item.proprietarioTelefone || item.whatsapp || '';
        const ownerName = item.proprietarioNome || item.nome || 'Cliente';
        const timeCoracao = item.time || '';
        const hobby = item.hobby || '';
        
        const conjuge = typeof item.conjuge === 'string' ? JSON.parse(item.conjuge || 'null') : item.conjuge;
        const filhos = typeof item.filhos === 'string' ? JSON.parse(item.filhos || '[]') : item.filhos;

        // Proprietario
        if (item.dataNascimento) {
          allPeople.push({
            id: `${item.id}-owner`,
            nome: ownerName,
            dataNascimento: item.dataNascimento,
            whatsapp: ownerWhatsApp,
            relacao: 'Cliente',
            time: timeCoracao,
            hobby: hobby
          });
        }
        // Conjuge
        if (conjuge && conjuge.dataNascimento) {
          allPeople.push({
            id: `${item.id}-conjuge`,
            nome: conjuge.nome || 'Cônjuge',
            dataNascimento: conjuge.dataNascimento,
            whatsapp: conjuge.whatsapp || ownerWhatsApp,
            relacao: `Cônjuge de ${ownerName.split(' ')[0]}`
          });
        }
        // Filhos
        if (filhos && Array.isArray(filhos)) {
          filhos.forEach((filho, idx) => {
            if (filho.dataNascimento) {
              allPeople.push({
                id: `${item.id}-filho-${idx}`,
                nome: filho.nome || 'Filho(a)',
                dataNascimento: filho.dataNascimento,
                whatsapp: filho.whatsapp || ownerWhatsApp,
                relacao: `Filho(a) de ${ownerName.split(' ')[0]}`
              });
            }
          });
        }
      });
    };

    parseItems(cars);
    parseItems(requests);

    // Mapear para os próximos 5 dias
    const results = {};
    next5Days.forEach(d => results[d.dayStr] = []);

    allPeople.forEach(person => {
      if (!person.dataNascimento) return;
      const parts = person.dataNascimento.split('-');
      if (parts.length === 3) {
        const bMonth = parts[1];
        const bDay = parts[2];
        const dayStr = `${bDay}/${bMonth}`;
        if (results[dayStr]) {
          if (!results[dayStr].find(p => p.nome === person.nome && p.relacao === person.relacao)) {
            results[dayStr].push(person);
          }
        }
      }
    });

    return results;
  };

  const aniversariantesPorDia = activeTab === 'aniversariantes' ? getAniversariantes() : {};

  const handleToggleAniversariante = (personId) => {
    setSelectedAniversariantes(prev => 
      prev.includes(personId) ? prev.filter(id => id !== personId) : [...prev, personId]
    );
  };

  const handleDispararAniversarios = () => {
    if (selectedAniversariantes.length === 0) {
      alert('Selecione pelo menos um aniversariante.');
      return;
    }
    
    const allLists = Object.values(aniversariantesPorDia).flat();
    const toSend = allLists.filter(p => selectedAniversariantes.includes(p.id));

    if (toSend.length === 0) return;

    setFilaDisparo(toSend);
    setFilaIndex(0);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ backgroundColor: '#000', backgroundImage: 'url("/cabeçalho_colmeia.png.png")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'var(--surface)', padding: '40px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <img src="/logo_equipepersonalcar.png.png" alt="Logo Equipe Personal Car" style={{ width: '200px', marginBottom: '30px' }} />
          <h2 style={{ marginBottom: '20px', fontSize: '1.5rem', fontWeight: '700' }}>Painel do Administrador</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>Digite a senha para acessar o sistema.</p>
          <input 
            type="password" 
            placeholder="Senha de acesso" 
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '20px', fontSize: '1rem', textAlign: 'center' }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const storedPass = localStorage.getItem('delmar_admin_password') || '#EUteamo2020';
                if (password === storedPass) {
                  sessionStorage.setItem('delmar_admin_auth', 'true');
                  setIsAuthenticated(true);
                  loadCRMData();
                } else {
                  alert('Senha incorreta!');
                }
              }
            }}
          />
          <button 
            onClick={() => {
              const storedPass = localStorage.getItem('delmar_admin_password') || '#EUteamo2020';
              if (password === storedPass) {
                sessionStorage.setItem('delmar_admin_auth', 'true');
                setIsAuthenticated(true);
                loadCRMData();
              } else {
                alert('Senha incorreta!');
              }
            }}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '1.1rem', fontWeight: '600' }}
          >
            Entrar
          </button>
          <button 
            onClick={() => navigate('/anuncios')}
            style={{ width: '100%', padding: '12px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '10px', textDecoration: 'underline' }}
          >
            Voltar ao site
          </button>
        </div>
      </div>
    );
  }

  const currentTabType = tabs.find(t => t.id === activeTab)?.type;

  // -------------------------
  // LOGICA MATCHMAKING
  // -------------------------
  const calculateMatches = () => {
    const matches = [];
    requests.forEach(req => {
      const compatibleCars = cars.filter(car => {
        // Option 1 Check
        const match1 = (() => {
          if (req.tipoVeiculo && car.tipoVeiculo && req.tipoVeiculo !== car.tipoVeiculo) return false;
          if (req.marca && car.marca && !car.marca.toLowerCase().includes(req.marca.toLowerCase().split(' - ')[0])) return false;
          if (req.modelo && car.modelo) {
             const reqModelFirstWord = req.modelo.trim().split(' ')[0].toLowerCase();
             if (!car.modelo.toLowerCase().includes(reqModelFirstWord)) return false;
          }
          if (car.ano < Number(req.anoInicial) || car.ano > Number(req.anoFinal)) return false;
          return true;
        })();

        // Option 2 Check
        let match2 = false;
        if (req.segundaOpcao) {
          match2 = (() => {
            const opt2 = req.segundaOpcao;
            if (opt2.marca && car.marca && !car.marca.toLowerCase().includes(opt2.marca.toLowerCase().split(' - ')[0])) return false;
            if (opt2.modelo && car.modelo) {
               const opt2ModelFirstWord = opt2.modelo.trim().split(' ')[0].toLowerCase();
               if (!car.modelo.toLowerCase().includes(opt2ModelFirstWord)) return false;
            }
            if (car.ano < Number(opt2.anoInicial) || car.ano > Number(opt2.anoFinal)) return false;
            return true;
          })();
        }
        
        return match1 || match2;
      });

      if (compatibleCars.length > 0) {
        matches.push({ request: req, cars: compatibleCars });
      }
    });
    return matches;
  };

  const currentMatches = activeTab === 'matches' ? calculateMatches() : [];

  return (
    <div className="admin-layout">
      {/* Sidebar Admin */}
      <div className="admin-sidebar">
        <h2 className="admin-title" style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '20px' }}>Painel Admin</h2>
        
        <div className="admin-menu" style={{ flex: 1 }}>
          <div className="admin-menu-section" style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px', marginBottom: '4px' }}>CRM - Negócios</div>
          {tabs.filter(t => t.type === 'crm').map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setEditingId(null); }}
              style={{
                textAlign: 'left', padding: '6px 10px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontSize: '0.9rem',
                backgroundColor: activeTab === t.id ? 'var(--primary-color)' : 'transparent',
                color: activeTab === t.id ? '#fff' : 'var(--text-primary)',
                fontWeight: activeTab === t.id ? '600' : '500'
              }}
            >
              {t.label}
            </button>
          ))}

          <div className="admin-menu-section" style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '12px', marginBottom: '4px' }}>Site - Conteúdo</div>
          {tabs.filter(t => t.type === 'inst').map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setEditingId(null); }}
              style={{
                textAlign: 'left', padding: '6px 10px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontSize: '0.9rem',
                backgroundColor: activeTab === t.id ? 'var(--primary-color)' : 'transparent',
                color: activeTab === t.id ? '#fff' : 'var(--text-primary)',
                fontWeight: activeTab === t.id ? '600' : '500'
              }}
            >
              {t.label}
            </button>
          ))}

          <div className="admin-menu-section" style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '12px', marginBottom: '4px' }}>Sistema</div>
          {tabs.filter(t => t.type === 'sys').map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setEditingId(null); }}
              style={{
                textAlign: 'left', padding: '6px 10px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontSize: '0.9rem',
                backgroundColor: activeTab === t.id ? 'var(--primary-color)' : 'transparent',
                color: activeTab === t.id ? '#fff' : 'var(--text-primary)',
                fontWeight: activeTab === t.id ? '600' : '500'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            onClick={() => {
              sessionStorage.removeItem('delmar_admin_auth');
              setIsAuthenticated(false);
              setPassword('');
            }}
            style={{ padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: '600' }}
          >
            Sair do Sistema
          </button>
          <button 
            onClick={() => navigate('/anuncios')}
            style={{ padding: '10px', background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
          >
            Voltar à Loja
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="admin-editor-area">
        
        {/* ======================================= */}
        {/* VIEW: INSTITUCIONAL                     */}
        {/* ======================================= */}
        {currentTabType === 'inst' && (
          <div style={{ maxWidth: '940px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#fff' }}>Editar: {tabs.find(t => t.id === activeTab).label}</h1>
              <button onClick={handleInstSave} className="btn btn-primary">Salvar Site</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              {activeTab === 'banner-patrocinado' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff' }}>Banners Cadastrados</h2>
                  <button onClick={() => { 
                    const newId = Date.now();
                    setInstData(prev => ({
                      ...prev, [activeTab]: [...(prev[activeTab] || []), { id: newId, image: '', title: '', text: '' }]
                    }));
                    setEditingBannerId(newId);
                  }} className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)' }}>+ Adicionar Patrocinador</button>
                </div>
              )}
              {(instData[activeTab] || []).map((card, index) => {
                if (activeTab === 'banner_config') {
                  let configParsed = {};
                  try { configParsed = JSON.parse(card.text || '{}'); } catch(e) {}
                  return (
                    <div key={card.id} style={{ border: '1px solid var(--border)', padding: '24px', borderRadius: 'var(--radius-lg)', backgroundColor: '#fff' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '16px' }}>Configurações Globais dos Banners</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Tempo de Transição (Banner Principal)</label>
                          <input type="range" min="1" max="10" value={configParsed.timer || 3} onChange={(e) => handleInstChange(card.id, 'text', JSON.stringify({...configParsed, timer: parseInt(e.target.value)}))} style={{ width: '100%' }} />
                          <div style={{ textAlign: 'center', marginTop: '4px', fontWeight: 'bold' }}>{configParsed.timer || 3} segundos</div>
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Frequência de Patrocinadores na Vitrine (a cada X carros)</label>
                          <input type="range" min="5" max="15" value={configParsed.sponsorFreq || 5} onChange={(e) => handleInstChange(card.id, 'text', JSON.stringify({...configParsed, sponsorFreq: parseInt(e.target.value)}))} style={{ width: '100%' }} />
                          <div style={{ textAlign: 'center', marginTop: '4px', fontWeight: 'bold' }}>Mostrar 1 patrocinador a cada {configParsed.sponsorFreq || 5} carros</div>
                        </div>
                      </div>
                    </div>
                  );
                }
                if (activeTab === 'banner-patrocinado') {
                  let pConfig = { scale: 1, x: 0, y: 0, showText: true, textPos: 'center', font: 'Inter', uppercase: false, textContent: card.text || '', paused: false, sponsorName: '', sponsorPhone: '' };
                  try { pConfig = { ...pConfig, ...JSON.parse(card.text || '{}') }; } catch(e) {}
                  
                  const updatePConfig = (newVals) => {
                    handleInstChange(card.id, 'text', JSON.stringify({ ...pConfig, ...newVals }));
                  };

                  if (editingBannerId !== card.id) {
                    return (
                      <div key={card.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius-lg)', backgroundColor: '#fff', opacity: pConfig.paused ? 0.6 : 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#e2e8f0' }}>
                            {card.image ? <img src={card.image} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${pConfig.scale}) translate(${pConfig.x}%, ${pConfig.y}%)` }} /> : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#888', fontSize:'0.7rem'}}>Sem Imagem</div>}
                          </div>
                          <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '600' }}>
                              Patrocinador #{index + 1} {pConfig.paused && <span style={{ color: '#ef4444', fontSize: '0.8rem', marginLeft: '8px', border: '1px solid #ef4444', padding: '2px 6px', borderRadius: '4px' }}>PAUSADO</span>}
                            </h3>
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>
                              {pConfig.sponsorName ? `${pConfig.sponsorName}` : 'Sem Nome'} {pConfig.sponsorPhone ? ` - ${pConfig.sponsorPhone}` : ''}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => setEditingBannerId(card.id)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>Editar</button>
                          <button onClick={() => updatePConfig({ paused: !pConfig.paused })} style={{ background: pConfig.paused ? '#10b981' : '#f59e0b', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>{pConfig.paused ? 'Ativar' : 'Pausar'}</button>
                          <button onClick={() => handleInstRemove(card.id)} style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>Excluir</button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={card.id} style={{ border: '2px solid var(--primary-color)', padding: '24px', borderRadius: 'var(--radius-lg)', backgroundColor: '#fff', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Editando Patrocinador #{index + 1}</h3>
                        <button onClick={() => setEditingBannerId(null)} style={{ background: 'var(--primary-color)', color: '#fff', padding: '6px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}>Concluir Edição</button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8f9fa', padding: '16px', borderRadius: '8px' }}>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Nome do Responsável (Controle Interno)</label>
                            <input type="text" value={pConfig.sponsorName || ''} onChange={e => updatePConfig({ sponsorName: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="Ex: João da Silva" />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>WhatsApp/Telefone (Controle Interno)</label>
                            <input type="text" value={pConfig.sponsorPhone || ''} onChange={e => updatePConfig({ sponsorPhone: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} placeholder="Ex: 67999999999" />
                          </div>
                        </div>
                        <div style={{ backgroundColor: '#f0f4f8', padding: '20px', borderRadius: '8px', border: '2px dashed #93c5fd', textAlign: 'center' }}>
                          <label style={{ display: 'block', marginBottom: '12px', fontWeight: '700', color: '#1e3a8a', fontSize: '1.1rem' }}>🖼️ Selecionar ou Trocar Foto do Banner</label>
                          <input type="file" accept="image/*" onChange={(e) => handleInstImageUpload(card.id, e)} style={{ width: '100%', maxWidth: '300px', cursor: 'pointer' }} />
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                          {/* Coluna Esquerda: Editor e Controles */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                             <h4 style={{ margin: 0 }}>Posicionamento da Imagem</h4>
                             <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Zoom (Escala)</label>
                                <input type="range" min="0.5" max="3" step="0.01" value={pConfig.scale} onChange={(e) => updatePConfig({ scale: parseFloat(e.target.value) })} style={{ width: '100%' }} />
                             </div>
                             <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Eixo X (Esquerda/Direita)</label>
                                <input type="range" min="-100" max="100" step="1" value={pConfig.x} onChange={(e) => updatePConfig({ x: parseInt(e.target.value) })} style={{ width: '100%' }} />
                             </div>
                             <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Eixo Y (Cima/Baixo)</label>
                                <input type="range" min="-100" max="100" step="1" value={pConfig.y} onChange={(e) => updatePConfig({ y: parseInt(e.target.value) })} style={{ width: '100%' }} />
                             </div>
                             <hr style={{ border: 'none', borderTop: '1px solid #eee' }} />
                             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <input type="checkbox" checked={pConfig.showText} onChange={(e) => updatePConfig({ showText: e.target.checked })} id={`text-${card.id}`} />
                                <label htmlFor={`text-${card.id}`} style={{ fontWeight: 'bold' }}>Habilitar Texto no Banner</label>
                             </div>
                             {pConfig.showText && (
                               <>
                                 <div>
                                   <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Texto do Patrocinador</label>
                                   <input type="text" value={pConfig.textContent} onChange={(e) => updatePConfig({ textContent: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                 </div>
                                 <div style={{ display: 'flex', gap: '12px' }}>
                                   <div style={{ flex: 1 }}>
                                     <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Fonte (Tipografia)</label>
                                     <select value={pConfig.font} onChange={(e) => updatePConfig({ font: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
                                       {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                     </select>
                                   </div>
                                   <div style={{ flex: 1 }}>
                                     <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block' }}>Formato</label>
                                     <button onClick={() => updatePConfig({ uppercase: !pConfig.uppercase })} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', background: pConfig.uppercase ? '#222' : '#f5f5f5', color: pConfig.uppercase ? '#fff' : '#000', cursor: 'pointer', width: '100%' }}>{pConfig.uppercase ? 'MAIÚSCULAS' : 'Normal'}</button>
                                   </div>
                                 </div>
                                 <div>
                                   <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Posicionamento do Texto</label>
                                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', width: '150px' }}>
                                     {['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'].map(pos => (
                                       <button key={pos} onClick={() => updatePConfig({ textPos: pos })} style={{ height: '40px', border: '1px solid #ccc', backgroundColor: pConfig.textPos === pos ? '#ef4444' : '#fff', cursor: 'pointer', borderRadius: '4px' }}></button>
                                     ))}
                                   </div>
                                 </div>
                               </>
                             )}
                          </div>
                          
                          {/* Coluna Direita: Preview Live 940x300 */}
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                             <h4 style={{ margin: 0, marginBottom: '16px' }}>Preview ao Vivo (940x300)</h4>
                             <div style={{ position: 'relative', width: '100%', paddingBottom: `${(300/940)*100}%`, backgroundColor: '#e2e8f0', borderRadius: '8px', overflow: 'hidden', border: '2px dashed #cbd5e1' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                                  <style>{`@import url('https://fonts.googleapis.com/css2?family=${pConfig.font.replace(/ /g, '+')}:wght@400;700;900&display=swap');`}</style>
                                   {card.image && (
                                     <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'absolute' }}>
                                       <img src={card.image} style={{ width: '100%', height: '100%', objectFit: pConfig.scale < 1 ? 'contain' : 'cover', objectPosition: `${50 + (pConfig.x || 0)}% ${50 + (pConfig.y || 0)}%`, transform: `scale(${pConfig.scale})`, transformOrigin: 'center' }} />
                                     </div>
                                  )}
                                  {pConfig.showText && (
                                     <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', ...getPosStyles(pConfig.textPos), padding: '24px', pointerEvents: 'none' }}>
                                       <h2 style={{ fontFamily: `"${pConfig.font}", sans-serif`, textTransform: pConfig.uppercase ? 'uppercase' : 'none', color: '#fff', textShadow: '2px 2px 10px rgba(0,0,0,0.9)', margin: 0, fontSize: '1.8rem', fontWeight: '900' }}>{pConfig.textContent || 'TEXTO DO PATROCINADOR'}</h2>
                                     </div>
                                  )}
                                </div>
                             </div>
                             <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '8px' }}>A caixa acima mantém a proporção matemática idêntica a 940x300.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // Default layout for Outras Sessões (Quem Somos, etc)
                return (
                <div key={card.id} style={{ border: '1px solid var(--border)', padding: '24px', borderRadius: 'var(--radius-lg)', backgroundColor: '#fff', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>Bloco #{index + 1}</h3>
                    <button onClick={() => handleInstRemove(card.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: '500' }}>Remover</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Foto</label>
                      <input type="file" accept="image/*" onChange={(e) => handleInstImageUpload(card.id, e)} style={{ marginBottom: '12px' }} />
                      {card.image && <div style={{ marginTop: '10px' }}><img src={card.image} alt="Preview" style={{ maxHeight: '150px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }} /></div>}
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Título Grande</label>
                      <input type="text" value={card.title} onChange={(e) => handleInstChange(card.id, 'title', e.target.value)} placeholder="Ex: Nosso time" style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', fontSize: '1.1rem', fontWeight: '600' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Texto</label>
                      <textarea value={card.text} onChange={(e) => handleInstChange(card.id, 'text', e.target.value)} rows={6} placeholder="Digite o conteúdo aqui..." style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', resize: 'vertical' }} />
                    </div>
                  </div>
                </div>
              )})}
              <button onClick={handleInstAdd} style={{ padding: '16px', borderRadius: 'var(--radius-lg)', border: '2px dashed var(--border)', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '1.1rem', fontWeight: '500', color: 'var(--text-secondary)' }}>+ Adicionar Novo Bloco</button>
            </div>

            {/* SESSÃO EXTRA: TESTEMUNHOS DE USUÁRIOS */}
            {activeTab === 'testemunhos' && (
              <div style={{ marginTop: '60px', borderTop: '2px solid var(--border)', paddingTop: '40px' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '20px', color: '#fff' }}>Testemunhos de Usuários (Aprovação)</h2>
                {userTestimonials.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>Nenhum testemunho enviado por usuários ainda.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {userTestimonials.map(t => (
                      <div key={t.id} style={{ display: 'flex', gap: '20px', backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', opacity: t.status === 'pending' ? 0.7 : 1 }}>
                        {t.image && (
                          <div style={{ width: '150px', height: '150px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden' }}>
                            <img src={t.image} alt="Upload" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            {t.user_photo && <img src={t.user_photo} alt="User" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />}
                            <div>
                              <div style={{ fontWeight: 'bold' }}>{t.user_name}</div>
                              <div style={{ fontSize: '0.8rem', color: '#666' }}>{new Date(t.created_at).toLocaleDateString('pt-BR')}</div>
                            </div>
                            <div style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: t.status === 'approved' ? '#dcfce7' : '#fef08a', color: t.status === 'approved' ? '#166534' : '#854d0e' }}>
                              {t.status === 'approved' ? 'Aprovado (Público)' : 'Pendente'}
                            </div>
                          </div>
                          <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', flex: 1, fontStyle: 'italic' }}>
                            "{t.text}"
                          </div>
                          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                            <button 
                              onClick={() => handleTestimonialStatus(t.id, t.status)}
                              style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', fontWeight: 'bold', cursor: 'pointer', backgroundColor: t.status === 'approved' ? '#f3f4f6' : '#22c55e', color: t.status === 'approved' ? '#374151' : '#fff' }}
                            >
                              {t.status === 'approved' ? 'Ocultar' : 'Aprovar'}
                            </button>
                            <button 
                              onClick={() => handleTestimonialDelete(t.id)}
                              style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ef4444', backgroundColor: 'transparent', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}


        {/* ======================================= */}
        {/* VIEW: CRM - MODERACAO                   */}
        {/* ======================================= */}
        {activeTab === 'moderacao' && (
          <div style={{ maxWidth: '940px', margin: '0 auto' }}>
            
            {moderingCar ? (
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#1e293b' }}>Revisão de Anúncio NF</h3>
                  <button onClick={() => setModeringCar(null)} className="btn btn-outline">⬅ Voltar para Lista</button>
                </div>
                <AdminFastAdd 
                  initialData={moderingCar} 
                  onSuccess={() => { setModeringCar(null); fetchCars(); }} 
                />
              </div>
            ) : (
              <>
                <div className="admin-header">
                  <h3 className="admin-subtitle">Aprovação de Anuncios NF</h3>
                </div>
                
                {cars.filter(car => car.status === 'pendente').length === 0 ? (
                  <p style={{ color: '#666', textAlign: 'center', marginTop: '40px' }}>Nenhum anúncio pendente de aprovação.</p>
                ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Cliente / Contato</th>
                      <th>Veículo / Detalhes</th>
                      <th>Revisão de Imagens</th>
                      <th style={{ textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cars.filter(car => car.status === 'pendente').map(car => {
                      let consertos = '';
                      let faleSobre = '';
                      let parceiro = null;
                      let textoWhatsApp = '';
                      try {
                        const detObj = JSON.parse(car.detalhes || '{}');
                        consertos = detObj.consertos !== undefined ? detObj.consertos : (car.detalhes || '');
                        faleSobre = detObj.faleSobre || '';
                        parceiro = detObj.parceiro || null;
                        textoWhatsApp = detObj.texto_original_whatsapp || '';
                      } catch(e) {
                        consertos = car.detalhes || '';
                      }

                      let carImgsSafe = [];
                      if (Array.isArray(car.imagens)) {
                        carImgsSafe = car.imagens;
                      } else if (typeof car.imagens === 'string') {
                        try { carImgsSafe = JSON.parse(car.imagens); } catch(e) {}
                      }
                      if (!Array.isArray(carImgsSafe)) carImgsSafe = [];

                      return (
                        <tr key={car.id}>
                          <td>
                            <div style={{ paddingBottom: '8px', borderBottom: parceiro ? '1px dashed #ccc' : 'none', marginBottom: parceiro ? '8px' : '0' }}>
                              <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Proprietário (Parceiro)</div>
                              <strong style={{ color: '#fff' }}>{car.proprietarioNome}</strong><br/>
                              <a href={`https://wa.me/55${car.proprietarioTelefone?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)' }}>{car.proprietarioTelefone}</a><br/>
                              <span style={{ fontSize: '0.8rem', color: '#666' }}>{car.cidade}</span>
                            </div>
                            {parceiro && (
                              <div>
                                <div style={{ fontSize: '0.75rem', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold', marginBottom: '2px' }}>Parceiro Indicador</div>
                                <strong>{parceiro.nome}</strong><br/>
                                <a href={`https://wa.me/55${parceiro.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ color: '#0284c7' }}>{parceiro.whatsapp}</a><br/>
                                <span style={{ fontSize: '0.8rem', color: '#666' }}>{parceiro.estado}</span>
                              </div>
                            )}
                          </td>
                          <td style={{ maxWidth: '300px' }}>
                            <strong>{car.marca} {car.modelo} {car.ano}</strong><br/>
                            <span style={{ color: 'red', fontWeight: 'bold' }}>{car.venda ? `R$ ${car.venda.toLocaleString('pt-BR')}` : 'Aceita Proposta'}</span><br/>
                            
                            {textoWhatsApp && (
                              <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', fontSize: '0.8rem' }}>
                                <strong style={{ color: '#166534', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /></svg>
                                  Texto Original WhatsApp:
                                </strong>
                                <div style={{ color: '#14532d', whiteSpace: 'pre-wrap', marginTop: '4px' }}>{textoWhatsApp}</div>
                              </div>
                            )}

                            <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                              <strong>Consertos pendentes:</strong> <br/>
                              <span style={{ color: '#666' }}>{consertos || 'Nenhum'}</span>
                            </div>
                            <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                              <strong>Fale sobre o carro (Card):</strong> <br/>
                              <span style={{ color: '#666' }}>{faleSobre || 'Nenhum'}</span>
                            </div>
                          </td>
                          <td style={{ maxWidth: '400px' }}>
                            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                                {carImgsSafe.map((img, idx) => (
                                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '160px', position: 'relative' }}>
                                    <button onClick={async () => {
                                      if (window.confirm('Excluir esta foto?')) {
                                        const newImgs = [...carImgsSafe];
                                        newImgs.splice(idx, 1);
                                        const { error } = await supabase.from('cars').update({ imagens: newImgs }).eq('id', car.id);
                                        if (!error) fetchCars();
                                      }
                                    }} style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: 'red', color: 'white', borderRadius: '50%', width: '24px', height: '24px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>×</button>
                                    <img src={img} alt="" style={{ width: '160px', height: '120px', objectFit: 'cover', borderRadius: '4px', border: idx === 0 ? '2px solid green' : '1px solid #ccc' }} />
                                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                    <button onClick={() => moveImage(car.id, idx, 'left')} disabled={idx === 0} style={{ padding: '2px 8px', fontSize: '0.8rem', cursor: idx === 0 ? 'not-allowed' : 'pointer' }}>⬅️</button>
                                    <button onClick={() => moveImage(car.id, idx, 'right')} disabled={idx === carImgsSafe.length - 1} style={{ padding: '2px 8px', fontSize: '0.8rem', cursor: idx === carImgsSafe.length - 1 ? 'not-allowed' : 'pointer' }}>➡️</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#666', textAlign: 'center' }}>A primeira foto é a capa do anúncio (Borda verde)</div>
                          </td>
                          <td style={{ textAlign: 'right', minWidth: '150px' }}>
                            <button onClick={() => setModeringCar(car)} className="btn btn-primary" style={{ backgroundColor: '#0ea5e9', borderColor: '#0ea5e9', padding: '6px 12px', fontSize: '0.85rem', marginBottom: '8px', width: '100%' }}>
                              ✏️ Revisar Anúncio
                            </button>
                            <button onClick={() => approveCar(car)} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem', marginBottom: '8px', width: '100%' }}>
                              ✅ Aprovação Rápida
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            </>
            )}
          </div>
        )}


        {/* ======================================= */}
        {/* VIEW: CRM - VEICULOS                    */}
        {/* ======================================= */}
        {activeTab === 'veiculos' && (() => {
          const uniqueBrands = Array.from(new Set(cars.map(c => c.marca).filter(Boolean))).sort();
          const filteredCars = adminBrandFilter ? cars.filter(c => c.marca === adminBrandFilter) : cars;
          return (
          <div style={{ maxWidth: '940px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0, color: '#fff' }}>Veículos à Venda</h1>
              <select
                value={adminBrandFilter}
                onChange={e => setAdminBrandFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="">Todas as Marcas</option>
                {uniqueBrands.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            
            <div style={{ backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', width: '250px' }}>Veículo</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Detalhes & Reparos</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Proprietário / Parceiro</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCars.map(car => {
                    const isEditing = editingId === car.id;
                    let carImagens = [];
                    try { carImagens = typeof car.imagens === 'string' ? JSON.parse(car.imagens) : car.imagens; } catch(e){}
                    if (!Array.isArray(carImagens)) carImagens = car.imagem ? [car.imagem] : [];
                    return (
                      <tr key={car.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        {/* COLUNA VEICULO */}
                        <td style={{ padding: '16px', verticalAlign: 'top', width: '250px' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <input type="file" multiple accept="image/*" onChange={(e) => handleCarImageUpload(car.id, e)} style={{ width: '100%', fontSize: '0.8rem', marginBottom: '4px' }} />
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                {carImagens.map((imgUrl, idx) => (
                                  <div key={idx} style={{ position: 'relative', width: '45%', aspectRatio: '4/3' }}>
                                    <img src={imgUrl} alt="car" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                                    <button 
                                      onClick={() => handleRemoveCarImage(car.id, idx)}
                                      style={{ position: 'absolute', top: 0, right: 0, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >X</button>
                                  </div>
                                ))}
                              </div>
                              <hr style={{ borderTop: '1px solid #e2e8f0', width: '100%', margin: '4px 0' }} />
                              <input type="text" value={car.marca || ''} onChange={(e)=>handleCarChange(car.id, 'marca', e.target.value)} placeholder="Marca" className="form-control" style={{ padding: '4px 8px' }} />
                              <input type="text" value={car.modelo || ''} onChange={(e)=>handleCarChange(car.id, 'modelo', e.target.value)} placeholder="Modelo" className="form-control" style={{ padding: '4px 8px' }} />
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="number" value={car.ano || ''} onChange={(e)=>handleCarChange(car.id, 'ano', Number(e.target.value))} placeholder="Ano" className="form-control" style={{ padding: '4px 8px', width: '100%' }} />
                              </div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <input type="number" value={car.fipe || ''} onChange={(e)=>handleCarChange(car.id, 'fipe', Number(e.target.value))} placeholder="FIPE" className="form-control" style={{ padding: '4px 8px', width: '50%' }} />
                                <input type="number" value={car.venda || ''} onChange={(e)=>handleCarChange(car.id, 'venda', Number(e.target.value))} placeholder="Venda" className="form-control" style={{ padding: '4px 8px', width: '50%' }} />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ width: '100%', height: '140px', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                                {carImagens && carImagens.length > 0 ? (
                                  <img src={carImagens[0]} alt="car" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : car.imagem ? (
                                  <img src={car.imagem} alt="car" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <span style={{ fontSize:'0.7rem', color: '#999', padding:'20px 10px', display:'block', textAlign: 'center' }}>Sem Foto</span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '8px' }}>
                                📅 {car.dataCadastro ? new Date(car.dataCadastro).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '--/--/----'}
                              </div>
                              <div style={{ fontWeight: '700', fontSize: '1.1rem', lineHeight: '1.1', color: 'var(--text-primary)' }}>
                                {car.marca} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>{car.modelo}</span>
                              </div>
                              <div style={{ fontSize: '0.85rem', marginTop: '4px', color: 'var(--text-secondary)' }}>Ano: {car.ano}</div>
                              <div style={{ marginTop: '8px' }}>
                                <span style={{ fontSize: '0.85rem', color: '#666' }}>FIPE: R$ {car.fipe?.toLocaleString('pt-BR')}</span><br/>
                                <span style={{ fontWeight: '700', color: 'var(--primary-color)', fontSize: '0.9rem' }}>Venda Site: {car.venda ? `R$ ${car.venda.toLocaleString('pt-BR')}` : 'Aceita Proposta'}</span><br/>
                                {(() => {
                                  try {
                                    const detObj = JSON.parse(car.detalhes || '{}');
                                    if(detObj.valorRepasse) {
                                      return <span style={{ fontSize: '0.85rem', color: '#d97706', fontWeight: 'bold' }}>Venda Base/Lojista: R$ {parseFloat(detObj.valorRepasse).toLocaleString('pt-BR')}</span>;
                                    }
                                  } catch(e){}
                                  return null;
                                })()}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* COLUNA DETALHES E REPAROS */}
                        <td style={{ padding: '16px', verticalAlign: 'top' }}>
                          {(() => {
                            let consertosText = '';
                            let faleSobreText = '';
                            try {
                              const detObj = JSON.parse(car.detalhes || '{}');
                              consertosText = detObj.texto || detObj.faleSobre || detObj.consertos || '';
                              if (!consertosText && !detObj.bannerLayout) {
                                consertosText = car.detalhes;
                              }
                            } catch(e) {
                              consertosText = car.detalhes || '';
                            }
                            
                            return isEditing ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <select value={car.negociacao || ''} onChange={(e)=>handleCarChange(car.id, 'negociacao', e.target.value)} className="form-control" style={{ padding: '4px 8px' }}>
                                  <option value="">Tipo de Negociação</option>
                                  <option value="Venda a vista">Venda a vista</option>
                                  <option value="Troca por veículo de menor valor">Troca por veículo de menor valor</option>
                                  <option value="Troca por veículo de maior valor">Troca por veículo de maior valor</option>
                                  <option value="Troca por imóvel">Troca por imóvel</option>
                                </select>
                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Fale Sobre o Carro:</label>
                                <textarea value={consertosText} onChange={(e)=> {
                                  try {
                                    const detObj = JSON.parse(car.detalhes || '{}');
                                    detObj.faleSobre = e.target.value;
                                    handleCarChange(car.id, 'detalhes', JSON.stringify(detObj));
                                  } catch(err) {
                                    handleCarChange(car.id, 'detalhes', JSON.stringify({ faleSobre: e.target.value }));
                                  }
                                }} placeholder="Fale sobre o carro" className="form-control" style={{ padding: '4px 8px', resize: 'vertical' }} rows="3" />
                                
                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', marginTop: '8px' }}>URL do Vídeo (Instagram, Facebook, YouTube):</label>
                                <input type="text" value={(() => {
                                  try { return JSON.parse(car.detalhes || '{}').videoUrl || ''; } catch(e) { return ''; }
                                })()} onChange={(e)=> {
                                  try {
                                    const detObj = JSON.parse(car.detalhes || '{}');
                                    detObj.videoUrl = e.target.value;
                                    handleCarChange(car.id, 'detalhes', JSON.stringify(detObj));
                                  } catch(err) {
                                    handleCarChange(car.id, 'detalhes', JSON.stringify({ videoUrl: e.target.value }));
                                  }
                                }} placeholder="Link do vídeo..." className="form-control" style={{ padding: '4px 8px' }} />
                              </div>
                            ) : (
                              <div>
                                {consertosText && (
                                  <div style={{ fontSize: '0.9rem', color: '#0369a1', padding: '6px', backgroundColor: '#e0f2fe', borderRadius: '4px', border: '1px solid #bae6fd', marginBottom: '8px', whiteSpace: 'pre-line' }}>
                                    <strong>Fale Sobre:</strong><br/>{consertosText}
                                  </div>
                                )}
                                {(() => {
                                  try {
                                    const videoUrl = JSON.parse(car.detalhes || '{}').videoUrl;
                                    if (videoUrl) {
                                      return (
                                        <div style={{ fontSize: '0.9rem', color: '#d97706', padding: '6px', backgroundColor: '#fef3c7', borderRadius: '4px', border: '1px solid #fde68a', marginBottom: '8px' }}>
                                          <strong>Vídeo:</strong> <a href={videoUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#b45309', wordBreak: 'break-all' }}>{videoUrl}</a>
                                        </div>
                                      );
                                    }
                                  } catch(e) {}
                                  return null;
                                })()}
                                <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: '600', padding: '6px', backgroundColor: '#f1f5f9', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                  Negociação: {car.negociacao || 'Não informada'}
                                </div>
                              </div>
                            );
                          })()}
                        </td>

                        {/* COLUNA PROPRIETARIO / PARCEIRO */}
                        <td style={{ padding: '16px', verticalAlign: 'top' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <input type="text" value={car.proprietarioNome || ''} onChange={(e)=>handleCarChange(car.id, 'proprietarioNome', e.target.value)} placeholder="Nome Proprietário" className="form-control" style={{ padding: '4px 8px' }} />
                              <input type="text" value={car.proprietarioTelefone || ''} onChange={(e)=>handleCarChange(car.id, 'proprietarioTelefone', e.target.value)} placeholder="Telefone" className="form-control" style={{ padding: '4px 8px' }} />
                              <input type="text" value={car.cidade || ''} onChange={(e)=>handleCarChange(car.id, 'cidade', e.target.value)} placeholder="Cidade" className="form-control" style={{ padding: '4px 8px' }} />
                            </div>
                          ) : (
                            <div>
                              {(() => {
                                let parceiro = null;
                                let margemVal = null;
                                try { 
                                  const detObj = JSON.parse(car.detalhes || '{}');
                                  parceiro = detObj.parceiro;
                                  margemVal = detObj.margem;
                                } catch(e) {}
                                
                                const propNome = (car.proprietarioNome || '').trim().toLowerCase();
                                const parcNome = (parceiro?.nome || '').trim().toLowerCase();
                                const propPhone = (car.proprietarioTelefone || '').replace(/\D/g, '');
                                const parcPhone = (parceiro?.whatsapp || '').replace(/\D/g, '');
                                
                                const isSamePerson = (propNome && parcNome && propNome === parcNome) || (propPhone && parcPhone && propPhone === parcPhone);
                                const showParceiro = parceiro && parceiro.nome && !isSamePerson;

                                return (
                                  <>
                                    <div style={{ paddingBottom: showParceiro ? '8px' : '0', borderBottom: showParceiro ? '1px dashed #e2e8f0' : 'none', marginBottom: showParceiro ? '8px' : '0' }}>
                                      <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        {isSamePerson ? 'Proprietário / Parceiro' : 'Proprietário'}
                                      </div>
                                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{car.proprietarioNome || (isSamePerson ? parceiro.nome : 'Não informado')}</div>
                                      
                                      <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                                        {(car.proprietarioTelefone || (isSamePerson ? parceiro.whatsapp : null)) ? (
                                          <a href={`https://wa.me/55${(car.proprietarioTelefone || parceiro.whatsapp)?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#25D366', textDecoration: 'none', fontWeight: '600', padding: '2px 6px', backgroundColor: '#eefcf3', borderRadius: '4px', fontSize: '0.65rem' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                                            </svg>
                                            {car.proprietarioTelefone || parceiro.whatsapp}
                                          </a>
                                        ) : '---'}
                                      </div>
                                      <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                                        📍 {car.cidade ? `${car.cidade}${car.estado && car.estado !== car.cidade ? ` - ${car.estado}` : ''}` : (isSamePerson && parceiro.estado ? parceiro.estado : 'Cidade não informada')}
                                      </div>
                                      {margemVal && (
                                        <div style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: 'bold', marginTop: '4px' }}>
                                          💰 Margem: R$ {Number(margemVal).toLocaleString('pt-BR')}
                                        </div>
                                      )}
                                    </div>
                                    
                                    {showParceiro && (
                                      <div>
                                        <div style={{ fontSize: '0.75rem', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Parceiro Indicador</div>
                                        <div style={{ fontWeight: '600', color: '#0f172a' }}>{parceiro.nome}</div>
                                        {parceiro.whatsapp && (
                                          <a href={`https://wa.me/55${parceiro.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#0284c7', textDecoration: 'none', fontWeight: '600', padding: '2px 0', fontSize: '0.65rem', marginTop: '2px' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                                            </svg>
                                            {parceiro.whatsapp}
                                          </a>
                                        )}
                                        {parceiro.estado && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>📍 {parceiro.estado}</div>}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </td>

                        {/* COLUNA ACOES */}
                        <td style={{ padding: '16px', verticalAlign: 'top', textAlign: 'center' }}>
                          {isEditing ? (
                            <button 
                              onClick={() => handleSaveCarDb(car.id)} 
                              className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.9rem', marginBottom: '8px', width: '100%' }}>
                              Salvar
                            </button>
                          ) : (
                            <button 
                              onClick={() => setEditingId(car.id)} 
                              className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.9rem', marginBottom: '8px', width: '100%' }}>
                              Editar
                            </button>
                          )}
                          
                          {(() => {
                            let isDestaque = false;
                            try { isDestaque = JSON.parse(car.detalhes || '{}').destaqueBanner; } catch(e){}
                            return (
                              <button 
                                onClick={() => handleToggleBanner(car)}
                                style={{ 
                                  padding: '6px 12px', 
                                  fontSize: '0.8rem', 
                                  marginBottom: '8px', 
                                  width: '100%',
                                  backgroundColor: isDestaque ? '#fbbf24' : '#f1f5f9',
                                  color: isDestaque ? '#000' : '#64748b',
                                  border: isDestaque ? '1px solid #f59e0b' : '1px solid #cbd5e1',
                                  borderRadius: '4px',
                                  fontWeight: '600',
                                  cursor: 'pointer'
                                }}>
                                {isDestaque ? '⭐ Em Destaque' : '⭐ Destacar'}
                              </button>
                            );
                          })()}

                          <button 
                            onClick={() => handleDeleteCar(car.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: '600', cursor: 'pointer', padding: '6px', width: '100%' }}>
                            Excluir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCars.length === 0 && (
                    <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Nenhum veículo encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          );
        })()}

        {/* ======================================= */}
        {/* VIEW: CRM - PEDIDOS                     */}
        {/* ======================================= */}
        {activeTab === 'pedidos' && (
          <div style={{ maxWidth: '940px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '20px', color: '#fff' }}>Pedidos de Compra</h1>
            
            <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Veículo na Troca</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Pedido Desejado</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Detalhes / Opção 2</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Cliente / Local</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => {
                    const isEditing = editingId === req.id;
                    const safeParseJSON = (data, fallback) => {
                      if (typeof data === 'string') {
                        try { return JSON.parse(data); } catch(e) { return fallback; }
                      }
                      return data || fallback;
                    };
                    const coresList = safeParseJSON(req.cores, []);
                    const opt2 = safeParseJSON(req.segundaOpcao, null);
                    const opt2Cores = opt2 ? safeParseJSON(opt2.cores, []) : [];
                    const isTradeIn = req.tipoNegocio?.includes('Troca') || (opt2 && opt2.tipoNegocio?.includes('Troca'));
                    
                    let tradeInCar = null;
                    try { tradeInCar = typeof req.veiculoTroca === 'string' ? JSON.parse(req.veiculoTroca) : req.veiculoTroca; } catch(e){}

                    return (
                      <tr key={req.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        {/* COLUNA: FOTO DO VEICULO DE TROCA */}
                        <td style={{ padding: '16px', verticalAlign: 'top', width: '150px' }}>
                          <div style={{ width: '120px', height: '80px', backgroundColor: '#f0f0f0', borderRadius: '4px', overflow: 'hidden' }}>
                            {tradeInCar && tradeInCar.imagem ? (
                              <img src={tradeInCar.imagem} alt="Troca" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize:'0.7rem', color: '#999', padding:'20px 10px', display:'block', textAlign: 'center' }}>{isTradeIn ? 'Sem Foto' : 'Sem Troca'}</span>
                            )}
                          </div>
                          {tradeInCar && tradeInCar.marca && (
                            <div style={{ fontSize: '0.75rem', marginTop: '4px', textAlign: 'center', fontWeight: 'bold' }}>
                              {tradeInCar.marca} {tradeInCar.modelo}
                            </div>
                          )}
                        </td>

                        {/* COLUNA: PEDIDO DESEJADO */}
                        <td style={{ padding: '16px', verticalAlign: 'top' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <input type="text" value={req.marca || ''} onChange={(e)=>handleReqChange(req.id, 'marca', e.target.value)} placeholder="Marca" className="form-control" style={{ padding: '4px 8px' }} />
                              <input type="text" value={req.modelo || ''} onChange={(e)=>handleReqChange(req.id, 'modelo', e.target.value)} placeholder="Modelo" className="form-control" style={{ padding: '4px 8px' }} />
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <input type="number" value={req.anoInicial || ''} onChange={(e)=>handleReqChange(req.id, 'anoInicial', String(e.target.value))} placeholder="De" className="form-control" style={{ padding: '4px 8px', width: '50%' }} />
                                <input type="number" value={req.anoFinal || ''} onChange={(e)=>handleReqChange(req.id, 'anoFinal', String(e.target.value))} placeholder="Até" className="form-control" style={{ padding: '4px 8px', width: '50%' }} />
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#c2410c' }}>{req.marca} {req.modelo}</div>
                              <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>Ano: {req.anoInicial} a {req.anoFinal}</div>
                              <div style={{ marginTop: '4px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                                $ {req.precoEntre ? (req.precoEntre/1000).toFixed(0) : '0'} a {(req.precoAte/1000).toFixed(0)}k
                              </div>
                            </div>
                          )}
                        </td>

                        {/* COLUNA: DETALHES E OPCAO 2 */}
                        <td style={{ padding: '16px', verticalAlign: 'top', fontSize: '0.85rem' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <input type="number" value={req.kmAte || ''} onChange={(e)=>handleReqChange(req.id, 'kmAte', Number(e.target.value))} placeholder="Km Até" className="form-control" style={{ padding: '4px 8px' }} />
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <input type="number" value={req.precoEntre || ''} onChange={(e)=>handleReqChange(req.id, 'precoEntre', Number(e.target.value))} placeholder="Min R$" className="form-control" style={{ padding: '4px 8px', width: '50%' }} />
                                <input type="number" value={req.precoAte || ''} onChange={(e)=>handleReqChange(req.id, 'precoAte', Number(e.target.value))} placeholder="Max R$" className="form-control" style={{ padding: '4px 8px', width: '50%' }} />
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div><span style={{fontWeight: 'bold'}}>KM:</span> {req.kmAte ? `Até ${Number(req.kmAte).toLocaleString('pt-BR')}` : 'Qualquer'}</div>
                              <div><span style={{fontWeight: 'bold'}}>Cor:</span> {coresList.length > 0 ? coresList.join(', ') : 'Qualquer'}</div>
                              <div><span style={{fontWeight: 'bold'}}>Tipo:</span> {req.tipoNegocio || 'Não informado'}</div>
                              {opt2 && (
                                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #ccc' }}>
                                  <div style={{ fontWeight: 'bold', color: '#c2410c' }}>OPÇÃO 2</div>
                                  <div>{opt2.marca} {opt2.modelo}</div>
                                  <div style={{ color: '#666' }}>KM: {opt2.kmAte ? `Até ${Number(opt2.kmAte).toLocaleString('pt-BR')}` : 'Qualquer'}</div>
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* COLUNA: CLIENTE */}
                        <td style={{ padding: '16px', verticalAlign: 'top' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <input type="text" value={req.proprietarioNome || ''} onChange={(e)=>handleReqChange(req.id, 'proprietarioNome', e.target.value)} placeholder="Nome" className="form-control" style={{ padding: '4px 8px' }} />
                              <input type="text" value={req.proprietarioTelefone || ''} onChange={(e)=>handleReqChange(req.id, 'proprietarioTelefone', e.target.value)} placeholder="Telefone" className="form-control" style={{ padding: '4px 8px' }} />
                              <input type="text" value={req.cidade || ''} onChange={(e)=>handleReqChange(req.id, 'cidade', e.target.value)} placeholder="Cidade" className="form-control" style={{ padding: '4px 8px' }} />
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontWeight: '600' }}>{req.proprietarioNome || 'Anônimo'}</div>
                              <div style={{ color: 'var(--text-secondary)' }}>
                                {req.proprietarioTelefone && (
                                  <a href={`https://wa.me/55${req.proprietarioTelefone?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#25D366', textDecoration: 'none', fontWeight: '600', padding: '4px 8px', backgroundColor: '#eefcf3', borderRadius: '4px' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                                    </svg>
                                    {req.proprietarioTelefone}
                                  </a>
                                )}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                                📍 {req.cidade ? `${req.cidade}${req.estado ? ` - ${req.estado}` : ''}` : 'Cidade não informada'}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* COLUNA: AÇÕES */}
                        <td style={{ padding: '16px', verticalAlign: 'top', textAlign: 'center' }}>
                          {isEditing ? (
                            <button 
                              onClick={() => handleSaveReqDb(req.id)} 
                              className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.9rem', marginBottom: '8px', width: '100%' }}>
                              Salvar
                            </button>
                          ) : (
                            <button 
                              onClick={() => setEditingId(req.id)} 
                              className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.9rem', marginBottom: '8px', width: '100%' }}>
                              Editar
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteReq(req.id)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: '600', cursor: 'pointer', padding: '6px', width: '100%' }}>
                            Excluir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {requests.length === 0 && (
                    <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Nenhum pedido cadastrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* VIEW: MATCHES (PEDIDOS ENCONTRADOS)     */}
        {/* ======================================= */}
        {activeTab === 'matches' && (
          <div style={{ maxWidth: '940px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '20px', color: '#fff' }}>Pedidos Encontrados</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>O sistema cruza automaticamente a marca, modelo, ano desejado e o limite de orçamento dos pedidos com os carros do seu estoque.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {currentMatches.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                  <h3 style={{ color: 'var(--text-secondary)' }}>Nenhum match encontrado no momento.</h3>
                  <p style={{ color: '#999', marginTop: '10px' }}>Continue cadastrando veículos e pedidos. O sistema fará a conexão quando os dados forem compatíveis.</p>
                </div>
              ) : (
                currentMatches.map((matchData, index) => (
                  <div key={index} style={{ display: 'flex', gap: '20px', alignItems: 'stretch' }}>
                    
                    {/* LADO ESQUERDO: COMPRADOR */}
                    <div style={{ flex: 1, backgroundColor: '#fdf8f5', border: '1px solid #f9d8c4', borderRadius: 'var(--radius-lg)', padding: '24px', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: '-12px', left: '20px', backgroundColor: '#f97316', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' }}>
                        COMPRADOR
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '1.2rem', color: '#c2410c', marginTop: '10px' }}>{matchData.request.proprietarioNome}</div>
                      <div style={{ color: '#ea580c', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <a href={`https://wa.me/55${matchData.request.proprietarioTelefone?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#25D366', textDecoration: 'none', backgroundColor: '#eefcf3', padding: '4px 8px', borderRadius: '4px' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                            </svg>
                            {matchData.request.proprietarioTelefone}
                          </a>
                        </div>
                      <hr style={{ border: 'none', borderTop: '1px solid #fed7aa', margin: '16px 0' }} />
                      <div style={{ fontSize: '0.9rem', color: '#9a3412' }}>Busca por:</div>
                      <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#7c2d12' }}>{matchData.request.modelo}</div>
                      
                      <div style={{ color: '#9a3412', fontSize: '0.85rem', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div>de {matchData.request.anoDe} a {matchData.request.anoAte}</div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>$ de {matchData.request.precoEntre ? (matchData.request.precoEntre/1000).toFixed(0) : '0'} a {(matchData.request.precoAte/1000).toFixed(0)} k</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '4px' }}>
                          <div>{matchData.request.kmAte ? `km até ${matchData.request.kmAte.toLocaleString('pt-BR')}` : ''}</div>
                          <div style={{ textTransform: 'lowercase', textAlign: 'right' }}>{matchData.request.cores && matchData.request.cores.length > 0 ? `cor ${matchData.request.cores.join(', ')}` : ''}</div>
                        </div>
                      </div>

                      {matchData.request.segundaOpcao && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #fed7aa' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#9a3412', textTransform: 'uppercase' }}>Opção 2</div>
                          <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#7c2d12' }}>{matchData.request.segundaOpcao.modelo}</div>
                          <div style={{ color: '#9a3412', fontSize: '0.85rem', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div>de {matchData.request.segundaOpcao.anoDe} a {matchData.request.segundaOpcao.anoAte}</div>
                            <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>$ de {matchData.request.segundaOpcao.precoEntre ? (matchData.request.segundaOpcao.precoEntre/1000).toFixed(0) : '0'} a {(matchData.request.segundaOpcao.precoAte/1000).toFixed(0)} k</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '4px' }}>
                              <div>{matchData.request.segundaOpcao.kmAte ? `km até ${matchData.request.segundaOpcao.kmAte.toLocaleString('pt-BR')}` : ''}</div>
                              <div style={{ textTransform: 'lowercase', textAlign: 'right' }}>{matchData.request.segundaOpcao.cores && matchData.request.segundaOpcao.cores.length > 0 ? `cor ${matchData.request.segundaOpcao.cores.join(', ')}` : ''}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SETA/CONECTOR CENTRAL */}
                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--primary-color)' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </div>

                    {/* LADO DIREITO: VENDEDOR(ES) */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {matchData.cars.map(car => (
                        <div key={car.id} style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 'var(--radius-lg)', padding: '24px', position: 'relative', display: 'flex', gap: '16px' }}>
                          <div style={{ position: 'absolute', top: '-12px', right: '20px', backgroundColor: '#0284c7', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' }}>
                            VEÍCULO COMPATÍVEL
                          </div>
                          
                          <div style={{ width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#e0f2fe', flexShrink: 0, marginTop: '10px' }}>
                            {car.imagens && car.imagens.length > 0 ? (
                              <img src={car.imagens[0]} alt="carro" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : car.imagem ? (
                              <img src={car.imagem} alt="carro" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.7rem', color: '#7dd3fc' }}>Sem foto</div>
                            )}
                          </div>
                          
                          <div style={{ marginTop: '10px' }}>
                            <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#075985' }}>{car.proprietarioNome}</div>
                            <div style={{ color: '#0284c7', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <a href={`https://wa.me/55${car.proprietarioTelefone?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#25D366', textDecoration: 'none', backgroundColor: '#eefcf3', padding: '4px 8px', borderRadius: '4px' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                                </svg>
                                {car.proprietarioTelefone}
                              </a>
                            </div>
                            <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#0369a1', marginTop: '8px' }}>{car.marca} {car.modelo}</div>
                            <div style={{ fontSize: '0.9rem', color: '#0c4a6e' }}>Ano: {car.ano}/{car.anoModelo}</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0284c7', marginTop: '8px' }}>Venda: {car.venda ? `R$ ${car.venda.toLocaleString('pt-BR')}` : 'Aceita Proposta'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* VIEW: ANIVERSARIANTES                   */}
        {/* ======================================= */}
        {activeTab === 'aniversariantes' && (
          <div style={{ maxWidth: '940px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '20px', color: '#fff' }}>Aniversariantes da Semana</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Selecione as pessoas que deseja enviar mensagem e clique no botão Disparar. O WhatsApp será aberto um a um.
            </p>

            <div style={{ backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '30px' }}>
              <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Texto da Mensagem (máximo 600 caracteres)</label>
              <textarea 
                value={anivMessageText}
                onChange={e => setAnivMessageText(e.target.value.substring(0, 600))}
                className="form-control"
                rows="4"
                style={{ width: '100%', marginBottom: '16px' }}
                placeholder="Ex: Feliz aniversário {nome}. Parabéns pelo seu dia..."
              ></textarea>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  {anivMessageText.length}/600 caracteres. (Use <b>{"{nome}"}</b> para inserir o primeiro nome da pessoa).
                </div>
                <button 
                  onClick={handleDispararAniversarios}
                  style={{ backgroundColor: '#25D366', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 'var(--radius-md)', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  Disparar Mensagens ({selectedAniversariantes.length})
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '20px' }}>
              {next5Days.map((dayObj, i) => (
                <div key={i} style={{ flex: '1', minWidth: '220px', backgroundColor: '#f9fafb', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ backgroundColor: dayObj.isToday ? '#ef4444' : '#e5e7eb', color: dayObj.isToday ? '#fff' : '#4b5563', padding: '12px', textAlign: 'center', fontWeight: '700', borderTopLeftRadius: 'var(--radius-md)', borderTopRightRadius: 'var(--radius-md)' }}>
                    {dayObj.label}<br/>
                    <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{dayObj.dayStr}</span>
                  </div>
                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    {aniversariantesPorDia[dayObj.dayStr]?.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem', padding: '20px 0' }}>Nenhum</div>
                    ) : (
                      aniversariantesPorDia[dayObj.dayStr]?.map(person => (
                        <label key={person.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', backgroundColor: '#fff', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                          <input 
                            type="checkbox" 
                            style={{ marginTop: '4px' }} 
                            checked={selectedAniversariantes.includes(person.id)}
                            onChange={() => handleToggleAniversariante(person.id)}
                          />
                          <div style={{ flex: 1, fontSize: '0.85rem' }}>
                            <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{person.nome}</div>
                            <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px' }}>{person.relacao}</div>
                            {person.time && <div style={{ color: '#666', fontSize: '0.75rem' }}>⚽ {person.time}</div>}
                            {person.hobby && <div style={{ color: '#666', fontSize: '0.75rem' }}>🎮 {person.hobby}</div>}
                            <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                              {person.whatsapp || 'Não informado'}
                            </div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ======================================= */}
        {/* VIEW: BANNER CONFIG                     */}
        {/* ======================================= */}
        {activeTab === 'banner_config' && (
          <div style={{ maxWidth: '940px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '20px', color: '#fff' }}>Configurações do Banner</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Configure o comportamento e o estilo do banner principal da Vitrine.
            </p>

            {(() => {
              // Get or create banner config
              const configItems = instData['banner_config'] || [];
              const configItem = configItems[0] || { id: Date.now(), title: 'Config', text: '{"timer":5,"layout":1}' };
              let config = { timer: 5, layout: 1 };
              try { config = JSON.parse(configItem.text || '{"timer":5,"layout":1}'); } catch(e){}

              const updateConfig = (key, value) => {
                const newConfig = { ...config, [key]: value };
                if (configItems.length === 0) {
                  setInstData(prev => ({ ...prev, banner_config: [{ ...configItem, text: JSON.stringify(newConfig) }] }));
                } else {
                  handleInstChange(configItem.id, 'text', JSON.stringify(newConfig));
                }
              };

              return (
                <div style={{ backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Tempo de Transição (Segundos)</label>
                    <input 
                      type="number" 
                      min="3" max="15" 
                      value={config.timer} 
                      onChange={(e) => updateConfig('timer', Number(e.target.value))}
                      className="form-control"
                      style={{ maxWidth: '150px' }}
                    />
                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>Tempo que cada carro fica na tela antes de rodar para o próximo.</div>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px' }}>Estilo de Diagramação (Layout)</label>
                    <select 
                      value={config.layout} 
                      onChange={(e) => updateConfig('layout', Number(e.target.value))}
                      className="form-control"
                      style={{ maxWidth: '400px' }}
                    >
                      <option value={1}>Opção 01: Premium Showroom (Diagonal)</option>
                      <option value={2}>Opção 02: Revista Automotiva (Tela Cheia)</option>
                      <option value={3}>Opção 03: Dark Performance (Hexágonos)</option>
                      <option value={4}>Opção 04: Cinematic (Sombras Flutuantes)</option>
                      <option value={5}>Opção 05: Ultra Luxury (Catálogo Assimétrico)</option>
                      <option value={6}>Opção 06: CH Automotiva Exclusive (Glow Azul)</option>
                      <option value={7}>Opção 07: Banner de Troca (Dividido ao meio)</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '30px', backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '12px' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Mostruário Visual de Layouts</h3>
                    <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '20px' }}>Selecione o layout desejado clicando diretamente nele.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      {[1, 2, 3, 4, 5, 6, 7].map(num => (
                        <div 
                          key={num}
                          onClick={() => updateConfig('layout', num)}
                          style={{
                            cursor: 'pointer',
                            border: config.layout === num ? '4px solid #28a745' : '1px solid #ccc',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            position: 'relative',
                            transform: config.layout === num ? 'scale(1.02)' : 'scale(1)',
                            transition: 'all 0.2s',
                            boxShadow: config.layout === num ? '0 10px 20px rgba(40,167,69,0.2)' : 'none'
                          }}
                        >
                          {config.layout === num && (
                            <div style={{ position: 'absolute', top: 10, right: 10, backgroundColor: '#28a745', color: '#fff', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold', zIndex: 10 }}>
                              ✓ Ativo
                            </div>
                          )}
                          <DynamicBanner previewOverride={{ layout: num, car: {
                            marca: 'Marca',
                            modelo: 'Modelo Exemplo',
                            ano: 2024,
                            km: 0,
                            venda: 999900,
                            cidade: 'São Paulo',
                            estado: 'SP',
                            imagem: '/placeholder-car.jpg',
                            detalhes: JSON.stringify({ bannerLayout: num })
                          }}} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleInstSave}
                    className="btn btn-primary"
                    style={{ padding: '12px 24px', fontSize: '1rem' }}
                  >
                    Salvar Configurações
                  </button>
                </div>
              );
            })()}
          </div>
        )}


        {/* ======================================= */}
        {/* VIEW: ANUNCIO RÁPIDO                   */}
        {/* ======================================= */}
        {activeTab === 'anuncio-rapido' && (
          <AdminFastAdd setActiveTab={setActiveTab} />
        )}

        {/* ======================================= */}
        {/* VIEW: CADASTRAR ANÚNCIO (ADMIN)         */}
        {/* ======================================= */}
        {activeTab === 'cadastrar-anuncio' && (
          <div className="admin-form-container">
            <ErrorBoundary>
              <AdminAddCar setActiveTab={setActiveTab} />
            </ErrorBoundary>
          </div>
        )}

        {/* ======================================= */}
        {/* VIEW: CADASTRAR PEDIDO (ADMIN)          */}
        {/* ======================================= */}
        {activeTab === 'cadastrar-pedido' && (
          <div className="admin-form-container">
            <BuyCar isAdmin={true} />
          </div>
        )}

        {/* ======================================= */}
        {/* VIEW: SISTEMA - ANALYTICS               */}
        {/* ======================================= */}
        {activeTab === 'analytics' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <AdminAnalytics />
          </div>
        )}

        {/* ======================================= */}
        {/* VIEW: SISTEMA - CONFIGURAÇÕES           */}
        {/* ======================================= */}
        {activeTab === 'config' && (
          <div style={{ maxWidth: '940px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '20px', color: '#fff' }}>Alterar Senha de Acesso</h1>
            <div style={{ backgroundColor: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Nova Senha</label>
                <input 
                  type="password" 
                  id="newAdminPassword"
                  placeholder="Digite a nova senha" 
                  className="form-control" 
                />
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  const newPass = document.getElementById('newAdminPassword').value;
                  if (newPass.length < 4) {
                    alert('A senha deve ter pelo menos 4 caracteres.');
                    return;
                  }
                  localStorage.setItem('delmar_admin_password', newPass);
                  alert('Senha atualizada com sucesso!');
                  document.getElementById('newAdminPassword').value = '';
                }}
              >
                Salvar Nova Senha
              </button>
            </div>
          </div>
        )}

      </div>
      
      {/* MODAL DE DISPARO WHATSAPP (MOBILE FRIENDLY) */}
      {filaDisparo.length > 0 && filaDisparo[filaIndex] && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px' }}>Disparo de Mensagens</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>Pessoa {filaIndex + 1} de {filaDisparo.length}</p>
            
            <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px', textAlign: 'left' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '4px' }}>👤 {filaDisparo[filaIndex].nome}</div>
              <div style={{ color: '#666' }}>📱 {filaDisparo[filaIndex].whatsapp}</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <a 
                href={`https://wa.me/55${(filaDisparo[filaIndex].whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(anivMessageText.replace('{nome}', filaDisparo[filaIndex].nome.split(' ')[0]))}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'block', backgroundColor: '#25D366', color: '#fff', padding: '12px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '1rem' }}
              >
                📱 ABRIR WHATSAPP (CELULAR)
              </a>
              
              <a 
                href={`https://web.whatsapp.com/send?phone=55${(filaDisparo[filaIndex].whatsapp || '').replace(/\D/g, '')}&text=${encodeURIComponent(anivMessageText.replace('{nome}', filaDisparo[filaIndex].nome.split(' ')[0]))}`}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'block', backgroundColor: '#128C7E', color: '#fff', padding: '12px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '1rem' }}
              >
                💻 ABRIR WHATSAPP WEB (COMPUTADOR)
              </a>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setFilaDisparo([])} 
                style={{ flex: 1, padding: '12px', border: '1px solid #ccc', background: '#fff', borderRadius: '8px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              
              {filaIndex < filaDisparo.length - 1 ? (
                <button 
                  onClick={() => setFilaIndex(filaIndex + 1)} 
                  style={{ flex: 1, padding: '12px', border: 'none', background: '#3b82f6', color: '#fff', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Próximo ➡️
                </button>
              ) : (
                <button 
                  onClick={() => { setFilaDisparo([]); setSelectedAniversariantes([]); alert('Disparos finalizados!'); }} 
                  style={{ flex: 1, padding: '12px', border: 'none', background: '#10b981', color: '#fff', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Concluir ✅
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
