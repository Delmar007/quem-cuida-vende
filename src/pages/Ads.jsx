import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import DynamicBanner from '../components/DynamicBanner';

const initialCars = [];

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

const initialRequests = [];

export default function Ads() {
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('delmar_favoritos') || '[]'); } catch { return []; }
  });

  const toggleFavorite = (e, carId) => {
    e.stopPropagation();
    let newFavs;
    if (favorites.includes(carId)) {
      newFavs = favorites.filter(id => id !== carId);
    } else {
      newFavs = [...favorites, carId];
    }
    setFavorites(newFavs);
    localStorage.setItem('delmar_favoritos', JSON.stringify(newFavs));
  };
  const [cars, setCars] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sponsoredBanners, setSponsoredBanners] = useState([]);
  const [sponsorFreq, setSponsorFreq] = useState(5);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'vitrine'); // 'vitrine' | 'marca' | 'pedidos'
  const [showBrands, setShowBrands] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [fipeData, setFipeData] = useState({ marcas: [] });
  const [showCategorias, setShowCategorias] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState(location.state?.selectedCategoria || null);
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
    const handleResize = () => {
      if (headerRef.current) setHeaderHeight(headerRef.current.offsetHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [selectedEstado, setSelectedEstado] = useState('Brasil');
  const [showEstados, setShowEstados] = useState(false);
  const brStates = [
    { uf: 'Brasil', name: 'Brasil (Todos)' },
    { uf: 'AC', name: 'Acre' }, { uf: 'AL', name: 'Alagoas' }, { uf: 'AP', name: 'Amapá' }, { uf: 'AM', name: 'Amazonas' },
    { uf: 'BA', name: 'Bahia' }, { uf: 'CE', name: 'Ceará' }, { uf: 'DF', name: 'Distrito Federal' }, { uf: 'ES', name: 'Espírito Santo' },
    { uf: 'GO', name: 'Goiás' }, { uf: 'MA', name: 'Maranhão' }, { uf: 'MT', name: 'Mato Grosso' }, { uf: 'MS', name: 'Mato Grosso do Sul' },
    { uf: 'MG', name: 'Minas Gerais' }, { uf: 'PA', name: 'Pará' }, { uf: 'PB', name: 'Paraíba' }, { uf: 'PR', name: 'Paraná' },
    { uf: 'PE', name: 'Pernambuco' }, { uf: 'PI', name: 'Piauí' }, { uf: 'RJ', name: 'Rio de Janeiro' }, { uf: 'RN', name: 'Rio Grande do Norte' },
    { uf: 'RS', name: 'Rio Grande do Sul' }, { uf: 'RO', name: 'Rondônia' }, { uf: 'RR', name: 'Roraima' }, { uf: 'SC', name: 'Santa Catarina' },
    { uf: 'SP', name: 'São Paulo' }, { uf: 'SE', name: 'Sergipe' }, { uf: 'TO', name: 'Tocantins' }
  ];

  const predefinedBrands = [
    "Acura", "Agrale", "Alfa Romeo", "ASTON MARTIN", "Audi", "BMW", "BYD", "Cadillac", "Caoa Chery", "CHANA", "CHANGAN", "Chrysler", "Citroën", "Daewoo", "Daihatsu", "Dodge", "Ferrari", "Fiat", "Ford", "GEELY", "GM - Chevrolet", "GREAT WALL", "Gurgel", "GWM", "HAFEI", "Honda", "Hyundai", "Isuzu", "JAC", "Jaguar", "Jeep", "Kia Motors", "Lada", "LAMBORGHINI", "Land Rover", "Lexus", "LIFAN", "LOBINI", "Lotus", "Mahindra", "Maserati", "Mazda", "Mclaren", "Mercedes-Benz", "Mercury", "MG", "MINI", "Mitsubishi", "Nissan", "Peugeot", "Plymouth", "Pontiac", "Porsche", "RAM", "Renault", "Rolls-Royce", "Rover", "Saab", "Saturn", "Seat", "smart", "SSANGYONG", "Subaru", "Suzuki", "Toyota", "Troller", "Volvo", "VW - VolksWagen"
  ];

  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [showNegociacao, setShowNegociacao] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    setFipeData({ marcas: predefinedBrands });

    return () => subscription.unsubscribe();
  }, []);

  const [filterOption, setFilterOption] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showFiltrosMenu, setShowFiltrosMenu] = useState(false);
  const [lastClickedFilter, setLastClickedFilter] = useState(null);
  const [bannerFilterCategory, setBannerFilterCategory] = useState(null);
  const [showBannerFilters, setShowBannerFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const normalizeString = (str) => {
    return str ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '';
  };

  const knownLogos = [
    "ASTON MARTIN", "Acura", "Agrale", "Alfa Romeo", "Audi", "BMW", "BYD", "CHANA", "CHANGAN", "Cadillac", "Caoa Chery", "Chrysler", "Citroën", "Daewoo", "Daihatsu", "Dodge", "Ferrari", "Fiat", "Ford", "GEELY", "GM - Chevrolet", "GREAT WALL", "GWM", "Gurgel", "HAFEI", "Honda", "Hyundai", "Isuzu", "JAC", "Jaguar", "Jeep", "Kia Motors", "LAMBORGHINI", "LIFAN", "LOBINI", "Lada", "Land Rover", "Lexus", "Lotus", "MG", "MINI", "Mahindra", "Maserati", "Mazda", "Mclaren", "Mercedes-Benz", "Mercury", "Mitsubishi", "Nissan", "Peugeot", "Plymouth", "Pontiac", "Porsche", "RAM", "Renault", "Rolls-Royce", "Rover", "SSANGYONG", "Saab", "Saturn", "Seat", "Subaru", "Suzuki", "Toyota", "Troller", "VW - VolksWagen", "Volvo", "smart"
  ];

  const getLocalLogoUrl = (marcaStr) => {
    if (!marcaStr) return '';
    const m = marcaStr.toLowerCase().trim();
    if (m === 'vw' || m === 'volkswagen' || m.includes('vw -')) return '/logos/VW - VolksWagen.png';
    if (m === 'gm' || m === 'chevrolet' || m.includes('gm -')) return '/logos/GM - Chevrolet.png';
    if (m === 'mercedes' || m === 'mercedes benz' || m === 'mercedes-benz') return '/logos/Mercedes-Benz.png';
    if (m === 'caoa chery' || m === 'chery') return '/logos/Caoa Chery.png';
    if (m === 'kia') return '/logos/Kia Motors.png';
    if (m === 'land rover' || m === 'land-rover' || m === 'landrover') return '/logos/Land Rover.png';
    if (m === 'citroen') return '/logos/Citroën.png';
    const found = knownLogos.find(logo => logo.toLowerCase() === m);
    if (found) return `/logos/${found}.png`;
    return `/logos/${marcaStr}.png`;
  };
  
  // Modal states
  const [selectedCar, setSelectedCar] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Google Analytics Tracking: Dispara um evento sempre que um carro for aberto no modal
  useEffect(() => {
    if (selectedCar && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_car', {
        event_category: 'Carros',
        event_label: `${selectedCar.marca} ${selectedCar.modelo}`,
        car_id: selectedCar.id,
        car_brand: selectedCar.marca,
        car_model: selectedCar.modelo
      });
    }
  }, [selectedCar]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const carId = params.get('carId');
    if (carId && cars && cars.length > 0) {
      const car = cars.find(c => c.id === carId);
      if (car) {
        setSelectedCar(car);
        // Clean URL to prevent re-triggering if cars state updates
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [cars]);

  useEffect(() => {
    const loadData = async () => {
      const { data: carros, error: errorCarros } = await supabase.from('cars').select('*').eq('status', 'aprovado');
      if (!errorCarros && carros) {
        setCars(carros.map(car => {
          let cleanMarca = car.marca ? car.marca.replace(/\*/g, '').trim() : '';
          if (cleanMarca.toLowerCase() === 'ferraris') cleanMarca = 'Ferrari';
          if (cleanMarca.toLowerCase() === 'mercedes') cleanMarca = 'Mercedes-Benz';
          if (cleanMarca.toLowerCase() === 'caoa-chery' || cleanMarca.toLowerCase() === 'chery') cleanMarca = 'Caoa Chery';
          
          return {
            ...car,
            marca: cleanMarca || car.marca,
            imagens: typeof car.imagens === 'string' ? JSON.parse(car.imagens) : car.imagens
          };
        }));
      }

      const { data: pedidos, error: errorPedidos } = await supabase.from('requests').select('*').eq('status', 'aprovado');
      if (!errorPedidos && pedidos) setRequests(pedidos);
      
      const { data: inst } = await supabase.from('institucional').select('*').in('page', ['banner-patrocinado', 'banner_config']);
      if (inst) {
        setSponsoredBanners(inst.filter(i => {
          if (i.page !== 'banner-patrocinado') return false;
          try {
            const p = JSON.parse(i.text_content || '{}');
            if (p.paused) return false;
          } catch(e) {}
          return true;
        }));
        const config = inst.find(i => i.page === 'banner_config');
        if (config) {
          try {
            const parsed = JSON.parse(config.text_content || '{}');
            if (parsed.sponsorFreq) setSponsorFreq(parseInt(parsed.sponsorFreq, 10));
          } catch(e) {}
        }
      }
    };
    loadData();
  }, []);

  const handleOpenTradeIn = async (carId) => {
    let car = cars.find(c => c.id === carId);
    if (!car) {
       const { data } = await supabase.from('cars').select('*').eq('id', carId).single();
       if (data) {
         data.imagens = typeof data.imagens === 'string' ? JSON.parse(data.imagens) : data.imagens;
         car = data;
       }
    }
    if (car) {
      setSelectedCar(car);
      setCurrentImageIndex(0);
    }
  };

  const handleMarcaClick = () => {
    if (activeTab === 'marca' && showBrands) {
      setActiveTab('vitrine');
      setShowBrands(false);
      setSelectedBrand(null);
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    } else {
      setActiveTab('marca');
      setShowBrands(true);
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }
  };

  const handlePedidosClick = () => {
    setActiveTab('pedidos');
    setShowBrands(false);
    setSelectedBrand(null);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const handleEstoqueTotalClick = () => {
    setActiveTab('vitrine');
    setShowBrands(false);
    setSelectedBrand(null);
    setSelectedCategoria(null);
    setCars(prev => [...prev].sort(() => Math.random() - 0.5));
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const handleSelectBrand = (marca) => {
    setSelectedBrand(marca);
    setShowBrands(false);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const filterList = (list) => {
    return [...list].sort((a, b) => {
      if (filterOption === 'novo') return (b.ano || b.anoAte) - (a.ano || a.anoAte);
      if (filterOption === 'velho') return (a.ano || a.anoDe) - (b.ano || b.anoDe);
      if (filterOption === 'caro') return (b.venda || b.precoAte) - (a.venda || a.precoAte);
      if (filterOption === 'barato') return (a.venda || b.precoAte) - (b.venda || a.precoAte);
      if (filterOption === 'desconto' && a.fipe) {
        const descA = (a.fipe - a.venda) / a.fipe;
        const descB = (b.fipe - b.venda) / b.fipe;
        return descB - descA;
      }
      
      // Default: mais recentes primeiro
      if (b.created_at && a.created_at) {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return (b.id || 0) - (a.id || 0);
    });
  };

  const getFilteredData = () => {
    if (activeTab === 'vitrine' || activeTab === 'marca') {
      let filtered = cars.filter(car => car.status !== 'pendente');
      if (activeTab === 'marca' && selectedBrand) {
        filtered = filtered.filter(car => car.marca && car.marca.toLowerCase() === selectedBrand.toLowerCase());
      }
      if (selectedCategoria) {
        filtered = filtered.filter(car => car.tipoVeiculo === selectedCategoria);
      }
      if (selectedEstado !== 'Brasil') {
        filtered = filtered.filter(car => car.estado === selectedEstado);
      }
      return filterList(filtered);
    } else {
      let filteredReqs = requests;
      if (selectedEstado !== 'Brasil') {
        filteredReqs = filteredReqs.filter(req => req.estado === selectedEstado);
      }
      return filterList(filteredReqs);
    }
  };

  const renderBannerFilter = () => (
    <div style={{ position: 'relative', width: '100%' }} onClick={() => setShowBannerFilters(!showBannerFilters)}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <div style={{ marginRight: '16px', color: '#fff' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: '700' }}>Filtro do Banner</h3>
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontWeight: '400' }}>{bannerFilterCategory || 'Encontre no banner'}</span>
        </div>
        <div style={{ color: '#fff' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>

      {showBannerFilters && (
        <div onClick={(e) => e.stopPropagation()} style={{ 
          position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px',
          background: 'linear-gradient(to bottom, #E53935 0%, #8B0000 100%)', border: '1px solid #ff5252',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
          padding: '12px', zIndex: 9999, minWidth: '180px', width: '100%',
          display: 'flex', flexDirection: 'column', gap: '8px',
          maxHeight: '300px', overflowY: 'auto'
        }}>
          <button
            onClick={() => { setBannerFilterCategory(null); setShowBannerFilters(false); setShowFiltrosMenu(false); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100); }}
            style={{
              textAlign: 'center', background: 'none', border: 'none',
              color: !bannerFilterCategory ? '#fff' : 'rgba(255,255,255,0.7)',
              fontWeight: !bannerFilterCategory ? '700' : '500', cursor: 'pointer', padding: '4px 8px', fontSize: '0.95rem'
            }}
          >
            Desativar Filtro
          </button>
          {['Antigos', '3/4', 'Caminhão', 'Cavalo', 'Conversível', 'Crossover', 'Elétrico', 'Furgão', 'Hatchback', 'Híbrido', 'SW', 'Pick-UP', 'Sedã', 'Sport', 'SUV', 'Van'].map(cat => (
            <button
              key={cat}
              onClick={() => { setBannerFilterCategory(cat); setShowBannerFilters(false); setShowFiltrosMenu(false); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100); }}
              style={{
                textAlign: 'center', background: 'none', border: 'none',
                color: bannerFilterCategory === cat ? '#fff' : 'rgba(255,255,255,0.7)',
                fontWeight: bannerFilterCategory === cat ? '700' : '500', cursor: 'pointer', padding: '4px 8px', fontSize: '0.95rem'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderEstadoFilter = () => (
    <div style={{ position: 'relative', width: '100%' }} onClick={() => setShowEstados(!showEstados)}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <div style={{ marginRight: '16px', color: 'var(--primary-color)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: '700' }}>{selectedEstado === 'Brasil' ? 'Escolha o Estado' : `Estado: ${selectedEstado}`}</h3>
          <span style={{ fontSize: '0.85rem', color: '#aaa', fontWeight: '400' }}>Selecione o estado</span>
        </div>
        <div style={{ color: '#fff' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>

      {showEstados && (
        <div onClick={(e) => e.stopPropagation()} style={{ 
          position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px',
          background: 'linear-gradient(to bottom, #333 0%, #050505 100%)', border: '1px solid #444',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
          padding: '12px', zIndex: 9999, minWidth: '180px', width: '100%',
          display: 'flex', flexDirection: 'column', gap: '8px',
          maxHeight: '300px', overflowY: 'auto'
        }}>
          {brStates.map(st => (
            <button
              key={st.uf}
              onClick={() => { setSelectedEstado(st.uf); setShowEstados(false); setShowFiltrosMenu(false); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100); }}
              style={{
                textAlign: 'center', background: 'none', border: 'none',
                color: selectedEstado === st.uf ? '#fff' : 'rgba(255,255,255,0.7)',
                fontWeight: selectedEstado === st.uf ? '700' : '500', cursor: 'pointer', padding: '4px 8px', fontSize: '0.95rem'
              }}
            >
              {st.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderFeedFilter = (isPedidos = false) => {
    const options = [
      { id: 'novo', label: 'Mais Novo' },
      { id: 'velho', label: 'Mais Velho' },
      { id: 'caro', label: 'Mais Caro' },
      { id: 'barato', label: 'Mais Barato' },
    ];
    if (!isPedidos) {
      options.push({ id: 'desconto', label: 'Melhor Desconto' });
    }

    return (
      <div style={{ position: 'relative', width: '100%' }} onClick={() => setShowFilters(!showFilters)}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <div style={{ marginRight: '16px', color: '#fff' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: '700' }}>
              Filtro do Feed
              {filterOption && <span style={{ width: '8px', height: '8px', backgroundColor: '#fff', borderRadius: '50%', display: 'inline-block', marginLeft: '8px', transform: 'translateY(-2px)' }}></span>}
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontWeight: '400' }}>{options.find(o => o.id === filterOption)?.label || 'Refine sua busca'}</span>
          </div>
          <div style={{ color: '#fff' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>

        {showFilters && (
        <div onClick={(e) => e.stopPropagation()} style={{ 
          position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px',
          background: 'linear-gradient(to bottom, #E53935 0%, #8B0000 100%)', border: '1px solid #ff5252',
          borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
          padding: '12px', zIndex: 9999, minWidth: '180px', width: '100%',
          display: 'flex', flexDirection: 'column', gap: '8px'
        }}>
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => {
                setFilterOption(opt.id);
                setShowFilters(false);
                setShowFiltrosMenu(false);
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
              }}
              style={{
                textAlign: 'center',
                background: 'none', border: 'none',
                color: filterOption === opt.id ? '#fff' : 'rgba(255,255,255,0.7)',
                fontWeight: filterOption === opt.id ? '700' : '500',
                cursor: 'pointer', padding: '4px 8px', width: '100%',
                fontSize: '0.95rem'
              }}
            >
              {opt.label}
            </button>
          ))}
          {filterOption && (
            <button
              onClick={() => {
                setFilterOption('');
                setShowFilters(false);
                setShowFiltrosMenu(false);
                setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
              }}
              style={{
                textAlign: 'center', marginTop: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)',
                background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', width: '100%'
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
    );
  };

  const filteredData = getFilteredData();

  const activeCars = cars.filter(c => c.status !== 'pendente');
  
  const getDiscountTier = (car) => {
    const discount = (car.fipe && car.venda) ? Math.round(((car.fipe - car.venda) / car.fipe) * 100) : 0;
    if (discount > 20) return 'green';
    if (discount > 10) return 'yellow';
    if (discount > 0) return 'red';
    return 'none';
  };

  const countRed = activeCars.filter(c => getDiscountTier(c) === 'red').length;
  const countYellow = activeCars.filter(c => getDiscountTier(c) === 'yellow').length;
  const countGreen = activeCars.filter(c => getDiscountTier(c) === 'green').length;

  return (
    <div style={{ backgroundColor: 'var(--background)', minHeight: '100vh' }}>
        {/* TOP BLACK BAR */}
        <div style={{ width: '100%', backgroundColor: '#000', backgroundImage: 'url("/cabeçalho_colmeia.png.png")', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', justifyContent: 'center', borderBottom: '2px solid rgba(255,255,255,0.1)', boxSizing: 'border-box' }}>
          <div style={{ width: '100%', maxWidth: '940px', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4px', paddingLeft: '20px', paddingRight: '20px', boxSizing: 'border-box' }}>
            
            {/* Logo */}
            <Link to="/anuncios" style={{ width: '100%', display: 'flex', justifyContent: 'center', textDecoration: 'none', marginBottom: '8px' }}>
              <img src="/logo_larga.png" alt="Equipe Personal Car" style={{ width: '100%', height: 'auto', display: 'block', transition: 'transform 0.3s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
            </Link>

            {/* Contador de Veículos e Círculos de Desconto */}
            <div className="header-counters-wrapper" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: '16px', minHeight: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span translate="no" style={{ color: '#ef4444', fontWeight: '600', fontSize: '1.2rem' }}>
                  {activeCars.length} Veículos
                </span>
                <select
                  value={selectedBrand || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if(val) {
                      handleSelectBrand(val);
                    } else {
                      handleEstoqueTotalClick();
                    }
                  }}
                  style={{
                    backgroundColor: '#111',
                    color: '#fff',
                    border: '1px solid #333',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Todas as Marcas</option>
                  {[...(fipeData?.marcas || [])].sort().map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              {/* Círculos de desconto - Posicionados entre o centro e a borda direita */}
              <div className="discount-circles" style={{ position: 'absolute', right: '25%', transform: 'translateX(50%)', display: 'flex', gap: '10px' }}>
                {/* Red Circle (<=10%) */}
                <div className="discount-circle" style={{ backgroundColor: '#ef4444', color: '#fff' }} title="Até 10% de desconto">
                  {countRed}
                </div>
                {/* Yellow Circle (>10% and <=20%) */}
                <div className="discount-circle" style={{ backgroundColor: '#facc15', color: '#000' }} title="11% a 20% de desconto">
                  {countYellow}
                </div>
                {/* Green Circle (>20%) */}
                <div className="discount-circle" style={{ backgroundColor: '#22c55e', color: '#fff' }} title="Acima de 20% de desconto">
                  {countGreen}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Topo (Extracted for sticky behavior) */}
        <nav ref={headerRef} className="sticky-mobile-header" style={{ width: '100%', display: 'flex', justifyContent: 'center', backgroundColor: '#000', borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 2000, margin: 0 }}>
          <div className="scroll-menu-mobile" style={{ width: '100%', maxWidth: '940px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '600', fontSize: '0.95rem', padding: '10px 20px', boxSizing: 'border-box' }}>
            <button onClick={() => { if (!session) { alert('Complete seu cadastro (faça login com o Google na página inicial) antes de prosseguir.'); return; } navigate('/comprar?fast=true'); }} style={{ color: '#e0e0e0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: '600', transition: 'color 0.2s', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#e0e0e0'}>
              <span>Comprar um carro</span>
              <span style={{ color: '#ef4444', fontSize: '11px', fontStyle: 'italic', marginTop: '2px', lineHeight: '1' }}>Cadastrar Encomenda</span>
            </button>
            <button onClick={() => { if (!session) { alert('Complete seu cadastro (faça login com o Google na página inicial) antes de prosseguir.'); return; } navigate('/vender?fast=true'); }} style={{ color: '#e0e0e0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: '600', transition: 'color 0.2s', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#e0e0e0'}>
              <span>Vender um carro</span>
              <span style={{ color: '#ef4444', fontSize: '11px', fontStyle: 'italic', marginTop: '2px', lineHeight: '1' }}>Anunciar Gratuitamente</span>
            </button>
            <button onClick={() => { navigate('/lojistas'); }} style={{ color: '#e0e0e0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: '600', transition: 'color 0.2s', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#e0e0e0'}>
              <span>Lojista Profissional</span>
              <span style={{ color: '#ef4444', fontSize: '11px', fontStyle: 'italic', marginTop: '2px', lineHeight: '1' }}>lojas e concessionárias</span>
            </button>
            <Link to="/institucional/quem-somos" style={{ color: '#e0e0e0', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#e0e0e0'}>Quem somos</Link>
            <Link to="/institucional/nossa-oficina" style={{ color: '#e0e0e0', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#e0e0e0'}>Nosso escritório</Link>
            <Link to="/institucional/testemunhos" style={{ color: '#e0e0e0', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = '#fff'} onMouseOut={e => e.currentTarget.style.color = '#e0e0e0'}>Testemunhos</Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Link to="/perfil" title="Meu Perfil" style={{ display: 'flex', alignItems: 'center' }}>
                {session && session.user?.user_metadata?.avatar_url ? (
                  <img src={session.user.user_metadata.avatar_url} alt="Perfil" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #fff' }} />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                )}
              </Link>
              <a href="https://www.google.com" title="Sair do site" style={{ color: '#fff', transition: 'transform 0.2s', display: 'flex', alignItems: 'center' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              </a>
              <Link to="/admin" title="Cadastrar Veículos Admin" style={{ color: '#fff', transition: 'transform 0.2s', display: 'flex', alignItems: 'center' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              </Link>
            </div>
          </div>
        </nav>

      <main style={{ maxWidth: '940px', margin: '32px auto 64px auto', padding: '0 20px' }}>
        {/* Hero Banner Section */}
        {cars.length > 0 && (
          <DynamicBanner cars={cars} sponsoredBanners={sponsoredBanners} bannerFilterCategory={bannerFilterCategory} onCarClick={setSelectedCar} />
        )}
        
        {/* PREMIUM ACTION CARDS TOGGLE AND CONTENT */}
        {(() => {
          const cards = [
            (
              <div key={1} onClick={(e) => { handleMarcaClick(); setLastClickedFilter(1); setShowFiltrosMenu(false); }} className="premium-card" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', cursor: 'pointer', background: 'linear-gradient(to bottom, #333 0%, #050505 100%)', color: '#fff', height: '70px', boxSizing: 'border-box', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ marginRight: '16px', color: '#fff' }}>
                  <svg width="28" height="28" viewBox="0 0 100 100" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M 30 15 L 70 15 L 75 30 L 85 30 L 85 35 L 80 40 L 80 50 L 20 50 L 20 40 L 15 35 L 15 30 L 25 30 Z M 29 28 L 71 28 L 68 17 L 32 17 Z" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M 45 45 L 85 45 L 90 60 L 100 60 L 100 65 L 95 70 L 95 85 L 85 85 L 85 95 L 75 95 L 75 85 L 45 85 L 45 95 L 35 95 L 35 85 L 30 85 L 30 70 L 35 65 L 35 60 L 40 60 Z M 44 58 L 86 58 L 82 48 L 48 48 Z M 42 72 L 54 72 L 54 76 L 42 76 Z M 76 72 L 88 72 L 88 76 L 76 76 Z" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M 15 45 L 55 45 L 60 60 L 70 60 L 70 65 L 65 70 L 65 85 L 55 85 L 55 95 L 45 95 L 45 85 L 15 85 L 15 95 L 5 95 L 5 85 L 0 85 L 0 70 L 5 65 L 5 60 L 10 60 Z M 14 58 L 56 58 L 52 48 L 18 48 Z M 12 72 L 24 72 L 24 76 L 12 76 Z M 46 72 L 58 72 L 58 76 L 46 76 Z" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: '700' }}>Escolher por marca</h3>
                  <span style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: '400' }}>Veja todas as marcas disponíveis</span>
                </div>
                <div style={{ color: '#fff' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>
            ),
            (
              <div key={2} onClick={(e) => { handlePedidosClick(); setLastClickedFilter(2); setShowFiltrosMenu(false); }} className="premium-card" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', cursor: 'pointer', background: 'linear-gradient(to bottom, #E53935 0%, #8B0000 100%)', color: '#fff', height: '70px', boxSizing: 'border-box', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ marginRight: '16px', color: '#fff' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: '700' }}>Ver pedidos</h3>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', fontWeight: '400' }}>Acompanhe seus pedidos</span>
                </div>
                <div style={{ color: '#fff' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>
            ),
            (
              <div key={3} onClick={(e) => { handleEstoqueTotalClick(); setLastClickedFilter(3); setShowFiltrosMenu(false); }} className="premium-card" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', cursor: 'pointer', background: 'linear-gradient(to bottom, #333 0%, #050505 100%)', color: '#fff', height: '70px', boxSizing: 'border-box', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ marginRight: '16px', color: '#fff' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 16l1.5-4.5A2 2 0 0 1 6.4 10h11.2a2 2 0 0 1 1.9 1.5L21 16h1a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2H7v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2H2a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h1zm3.5-4l-1 3h11l-1-3h-9z" />
                    <path d="M15 1l1 1.5 1.5 1-1.5 1-1 1.5-1-1.5-1.5-1 1.5-1z" />
                    <path d="M19.5 4.5l.8 1.2 1.2.8-1.2.8-.8 1.2-.8-1.2-1.2-.8 1.2-.8z" />
                    <path d="M11.5 3.5l.6 1 1 .6-1 .6-.6 1-.6-1-1-.6 1-.6z" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1rem', margin: 0, fontWeight: '700' }}>Carros disponíveis</h3>
                  <span style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: '400' }}>Confira nosso estoque total</span>
                </div>
                <div style={{ color: '#fff' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>
            ),
            (
              <div key={4} className="premium-card" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', background: 'linear-gradient(to bottom, #E53935 0%, #8B0000 100%)', color: '#fff', overflow: 'visible', height: '70px', boxSizing: 'border-box', borderRadius: 'var(--radius-lg)' }}>
                 <div style={{ width: '100%' }}>{renderBannerFilter()}</div>
              </div>
            ),
            (
              <div key={5} className="premium-card" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', background: 'linear-gradient(to bottom, #333 0%, #050505 100%)', color: '#fff', overflow: 'visible', height: '70px', boxSizing: 'border-box', borderRadius: 'var(--radius-lg)' }}>
                 <div style={{ width: '100%' }}>{renderEstadoFilter()}</div>
              </div>
            ),
            (
              <div key={6} className="premium-card" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', background: 'linear-gradient(to bottom, #E53935 0%, #8B0000 100%)', color: '#fff', overflow: 'visible', height: '70px', boxSizing: 'border-box', borderRadius: 'var(--radius-lg)' }}>
                 <div style={{ width: '100%' }}>{renderFeedFilter(activeTab === 'pedidos')}</div>
              </div>
            )
          ];

          return (
            <>
              {/* DESKTOP: Grid 2x3 */}
              <div className="desktop-filters-grid">
                {cards}
              </div>

              {/* MOBILE: Sticky Button + Accordion Content */}
              <div style={{ marginTop: '32px', marginBottom: '32px', top: headerHeight > 0 ? headerHeight : 0, zIndex: 1999 }} className="mobile-filters-toggle sticky-mobile-filters">
                <button 
                  onClick={() => setShowFiltrosMenu(!showFiltrosMenu) }
                  style={{ 
                    width: '100%', 
                    backgroundColor: 'var(--primary-color)', 
                    color: '#fff', 
                    border: 'none', 
                    borderRadius: 'var(--radius-lg)', 
                    padding: '16px', 
                    fontSize: '1.1rem', 
                    fontWeight: '700', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '12px', 
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-md)',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                  Filtros
                </button>

                {/* Acordeão de Filtros */}
                <div style={{ marginTop: showFiltrosMenu ? '8px' : '4px' }}>
                  {showFiltrosMenu ? (
                    <div style={{ 
                      position: 'relative',
                      zIndex: 50,
                      display: 'grid', 
                      gridTemplateColumns: '1fr', 
                      gap: '2px', 
                      backgroundColor: '#fff',
                      padding: '16px',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      {cards}
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          );
        })()}

        {activeTab === 'marca' && showBrands && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px', marginBottom: '40px' }}>
            {fipeData.marcas.map(m => (
              <div 
                key={m}
                onClick={() => handleSelectBrand(m)}
                style={{
                  aspectRatio: '1',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.2s',
                  padding: '8px',
                  backgroundColor: 'var(--surface)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img 
                  src={getLocalLogoUrl(m)} 
                  alt={m} 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', textAlign: 'center', lineHeight: '1.2' }}>{m}</span>
              </div>
            ))}
          </div>
        )}

        {(activeTab === 'vitrine' || (activeTab === 'marca' && selectedBrand)) && (
          <div style={{ marginTop: '0px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px', width: '100%' }}>
              {selectedCategoria && (
                <button onClick={() => setSelectedCategoria(null)} style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '4px', padding: '2px 10px', cursor: 'pointer', fontSize: '0.8rem', marginBottom: '10px' }}>Limpar filtro de categoria ({selectedCategoria})</button>
              )}

            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px', width: '100%' }}>
                {(() => {
                  let elements = [];
                  let bannerIndex = 0;

                  // renderSponsoredBanner removed

                  for (let i = 0; i < filteredData.length; i++) {
                    const car = filteredData[i];
                    const discount = (car.fipe && car.venda) ? Math.round(((car.fipe - car.venda) / car.fipe) * 100) : 0;
                    let discBg = '#ef4444';
                    let discColor = '#fff';
                    if (discount > 20) { discBg = '#22c55e'; discColor = '#fff'; } else if (discount > 10) { discBg = '#facc15'; discColor = '#000'; }
                    let detalhes = {};
                    try { detalhes = JSON.parse(car.detalhes || '{}'); } catch(e) {}

                    elements.push(
                      <div key={car.id} 
                        className="premium-card car-card-premium"
                        onClick={() => { setSelectedCar(car); setCurrentImageIndex(0); }}
                        style={{ display: 'flex', flexDirection: 'column', position: 'relative', cursor: 'pointer', backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                      >
                        {/* Imagem Superior */}
                        <div style={{ aspectRatio: '16/10', backgroundColor: '#111', position: 'relative', overflow: 'hidden' }}>
                          {(car.imagens && car.imagens.length > 0) ? (
                            <img src={car.imagens[0]} alt={car.modelo} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
                          ) : car.imagem ? (
                            <div style={{position: 'relative', width: '100%', height: '100%'}}>
                                <img src={car.imagem} alt={car.modelo} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
                              </div>
                          ) : (
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>Sem Imagem</div>
                          )}
                          
                          <div style={{ position: 'absolute', bottom: '12px', right: '12px', backgroundColor: 'rgba(0,0,0,0.75)', color: '#fff', padding: '3px 8px', borderRadius: 'var(--radius-sm)', fontSize: '0.55rem', fontWeight: '600', backdropFilter: 'blur(4px)' }}>
                            {car.tipoVeiculo || 'Premium'}
                          </div>

                          {discount > 0 && (
                            <div style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: discBg, color: discColor, width: '48px', height: '48px', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: 'var(--shadow-md)', lineHeight: '1.1' }}>
                              <span style={{ fontSize: '0.8rem' }}>-{discount}%</span>
                              <span style={{ fontSize: '0.55rem' }}>FIPE</span>
                            </div>
                          )}
                        </div>

                        {/* Conteúdo Informativo */}
                        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div style={{ marginBottom: '16px', minHeight: '40px' }}>
                            <h3 style={{ fontWeight: '800', fontSize: '0.85rem', margin: '0 0 4px 0', color: 'var(--text-primary)', lineHeight: '1.2' }}>{car.modelo}</h3>
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', marginTop: '8px' }}>
                              <img src={getLocalLogoUrl(car.marca)} alt={car.marca} style={{ width: '60px', height: '60px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                            </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: detalhes.faleSobre ? '12px' : '20px', paddingBottom: detalhes.faleSobre ? '0' : '20px', borderBottom: detalhes.faleSobre ? 'none' : '1px solid var(--border)', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{car.ano}</span>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22h18"/><path d="M4 9h16"/><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"/></svg>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{car.combustivel || detalhes.combustivel || '--'}</span>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 8v8M12 8v8M16 8v8M8 12h8"/></svg>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{car.cambio || detalhes.cambio || '--'}</span>
                                  </div>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>{car.km ? (car.km >= 1000 ? (car.km/1000).toFixed(0)+'k km' : car.km + ' km') : '--'}</span>
                                  </div>
                                </div>
                                <button onClick={(e) => toggleFavorite(e, car.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.2)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} title={favorites.includes(car.id) ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill={favorites.includes(car.id) ? "#ef4444" : "none"} stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                              </button>
                            </div>
                            {(() => {
                              const text = detalhes.faleSobre || detalhes.texto || detalhes.consertos || '';
                              if (!text) return null;
                              return (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.4', whiteSpace: 'pre-line' }}>
                                  {text}
                                </div>
                              );
                            })()}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                            <div>
                              <div className="fipe-price-card" style={{ color: '#888', textDecoration: 'line-through' }}>FIPE: R$ {car.fipe?.toLocaleString('pt-BR')}</div>
                              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary-color)', lineHeight: '1' }}>{car.venda ? `R$ ${car.venda.toLocaleString('pt-BR')}` : 'Aceita Proposta'}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {(() => {
                                let vUrl = '';
                                try { vUrl = JSON.parse(car.detalhes || '{}').videoUrl; } catch(e){}
                                if (!vUrl) return null;
                                return (
                                  <div onClick={(e) => { e.stopPropagation(); window.open(vUrl, '_blank'); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f97316', color: '#fff', transition: 'all 0.2s ease', cursor: 'pointer' }} onMouseOver={e => {e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.backgroundColor = '#ea580c';}} onMouseOut={e => {e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#f97316';}} title="Ver Vídeo">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                                  </div>
                                );
                              })()}

                              <div onClick={(e) => { 
                                e.stopPropagation(); 
                                const shareUrl = `${window.location.origin}/anuncios?carId=${car.id}`;
                                const text = `Olha esse carro que encontrei: ${car.marca} ${car.modelo}! Veja os detalhes aqui: ${shareUrl}`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank'); 
                              }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#b3b3b3', color: '#fff', transition: 'all 0.2s ease', cursor: 'pointer' }} onMouseOver={e => {e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.backgroundColor = '#999';}} onMouseOut={e => {e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#b3b3b3';}} title="Encaminhar para um amigo">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                              </div>

                              <div onClick={(e) => { e.stopPropagation(); setSelectedCar(car); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#25D366', color: '#fff', transition: 'all 0.2s ease', cursor: 'pointer' }} onMouseOver={e => {e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.backgroundColor = '#128C7E';}} onMouseOut={e => {e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.backgroundColor = '#25D366';}} title="Ver Detalhes">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12.031 0C5.385 0 .003 5.381.003 12.029c0 2.124.553 4.195 1.606 6.02L0 24l6.108-1.603a11.96 11.96 0 0 0 5.922 1.564h.005c6.645 0 12.025-5.382 12.025-12.029 0-3.218-1.254-6.246-3.533-8.525A11.996 11.996 0 0 0 12.031 0zm0 20.046h-.004a9.998 9.998 0 0 1-5.093-1.396l-.365-.216-3.785.993 1.01-3.692-.238-.378A10.02 10.02 0 0 1 2.007 12.03c.002-5.516 4.492-10.003 10.007-10.003 2.673 0 5.185 1.042 7.075 2.934a10.012 10.012 0 0 1 2.93 7.081c-.004 5.517-4.493 10.004-10.004 10.004zm5.138-7.391c-.282-.141-1.666-.822-1.925-.916-.258-.094-.447-.141-.635.141-.188.282-.728.916-.893 1.104-.165.188-.33.212-.612.071-.282-.141-1.189-.438-2.266-1.398-.838-.747-1.403-1.67-1.568-1.952-.165-.282-.018-.435.123-.576.127-.127.282-.329.423-.494.141-.165.188-.282.282-.471.094-.188.047-.353-.024-.494-.071-.141-.635-1.529-.87-2.094-.229-.55-.462-.476-.635-.484-.165-.008-.353-.008-.541-.008a1.046 1.046 0 0 0-.753.353c-.258.282-.988.965-.988 2.353s1.012 2.73 1.153 2.918c.141.188 1.988 3.035 4.812 4.254.672.29 1.197.463 1.606.592.674.215 1.288.184 1.773.111.541-.08 1.666-.682 1.901-1.341.235-.659.235-1.224.165-1.341-.071-.118-.259-.188-.541-.329z" /></svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  return elements;
                })()}
              </div>
          </div>
        )}

        {activeTab === 'pedidos' && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div></div>

            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {filteredData.map(req => {
                  const brandRaw = req.marca || '';
                  const logoUrl = getLocalLogoUrl(brandRaw);
                  
                  let opt2 = null;
                  try {
                    opt2 = typeof req.segundaOpcao === 'string' ? JSON.parse(req.segundaOpcao) : req.segundaOpcao;
                  } catch(e) {}
                  
                  return (
                    <div key={req.id} style={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid var(--border)', 
                      borderRadius: 'var(--radius-md)', 
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                      {/* Header: Logo */}
                      <div style={{ position: 'relative', width: '100%', height: '100px', backgroundColor: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', borderBottom: '1px solid #eee' }}>
                        {logoUrl ? (
                          <img 
                            src={logoUrl} 
                            onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            alt={brandRaw} 
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                          />
                        ) : null}
                        <div style={{ display: logoUrl ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: '2rem', fontWeight: '800', color: '#ccc', textTransform: 'uppercase' }}>
                          {brandRaw.charAt(0) || '?'}
                        </div>
                      </div>

                      {/* Content below image */}
                      <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-primary)', lineHeight: '1.2' }}>{req.modelo}</div>
                        
                        <div style={{ color: '#444', fontSize: '0.85rem', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div>de {req.anoInicial} a {req.anoFinal}</div>
                          <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#c2410c' }}>$ de {req.precoEntre ? (req.precoEntre/1000).toFixed(0) : '0'} a {(req.precoAte/1000).toFixed(0)} k</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                            <div>{req.kmAte ? `km até ${Number(req.kmAte).toLocaleString('pt-BR')}` : ''}</div>
                            <div style={{ textTransform: 'lowercase', textAlign: 'right' }}>{req.cores && req.cores.length > 0 ? `cor ${req.cores.join(', ')}` : ''}</div>
                          </div>
                          {req.estado && <div style={{ fontSize: '0.85rem', color: '#444', fontWeight: 'bold' }}>Estado: {req.estado}</div>}
                        </div>
                        
                        {req.veiculoTroca && (
                          <div style={{ marginTop: '12px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>VEÍCULO OFERECIDO NA TROCA:</div>
                            <img 
                              src={req.veiculoTroca.imagem} 
                              alt="Troca" 
                              onClick={() => handleOpenTradeIn(req.veiculoTroca.id)}
                              style={{ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                            />
                            <div style={{ textAlign: 'center', marginTop: '6px', fontWeight: '600', fontSize: '0.85rem' }}>
                              {req.veiculoTroca.marca} {req.veiculoTroca.modelo} {req.veiculoTroca.ano}
                            </div>
                            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--primary-color)', cursor: 'pointer', marginTop: '4px', textDecoration: 'underline' }} onClick={() => handleOpenTradeIn(req.veiculoTroca.id)}>
                              Clique na foto para ver mais detalhes
                            </div>
                          </div>
                        )}
                        
                        {opt2 && (
                          <div style={{ marginTop: '8px', borderTop: '1px dashed #ccc', paddingTop: '6px' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', background: '#e2e8f0', padding: '2px 4px', borderRadius: '2px' }}>OPÇÃO 2</span>
                            <div style={{ fontWeight: '700', fontSize: '0.8rem', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt2.marca} {opt2.modelo}</div>
                            {opt2.kmAte ? <div style={{ fontSize: '0.7rem', color: '#666' }}>Até {(opt2.kmAte/1000).toFixed(0)}k km</div> : null}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
          </div>
        )}

        {/* TRUST BANNER PREMIUM */}
        <div style={{
          marginTop: '64px',
          background: 'linear-gradient(135deg, #111 0%, #1a1a1a 100%)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '32px',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'center' }}>
            <div style={{ color: 'var(--primary-color)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div>
              <h4 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '700' }}>Segurança e confiança</h4>
              <p style={{ color: '#aaa', margin: 0, fontSize: '0.9rem' }}>Transações 100% seguras</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'center', borderLeft: '1px solid rgba(255,255,255,0.1)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ color: 'var(--primary-color)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
            </div>
            <div>
              <h4 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '700' }}>Veículos verificados</h4>
              <p style={{ color: '#aaa', margin: 0, fontSize: '0.9rem' }}>Qualidade garantida</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'center' }}>
            <div style={{ color: 'var(--primary-color)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
            </div>
            <div>
              <h4 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '700' }}>67 99169-4802</h4>
              <p style={{ color: '#aaa', margin: 0, fontSize: '0.9rem' }}>Atendimento especializado</p>
            </div>
          </div>
        </div>

      </main>

      {/* MODAL DETALHES DO CARRO */}
      {selectedCar && (
          <div 
            onClick={() => setSelectedCar(null)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          >
              <div 
                onClick={e => e.stopPropagation()}
                className="car-modal-container"
              >
                {/* Fechar Modal */}
                <button 
                  onClick={() => setSelectedCar(null)}
                  style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', color: '#fff', transition: 'background 0.2s' }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.2)'}
                >
                  ✕
                </button>
    
                {/* CIMA: CARROSSEL DE IMAGENS */}
                <div className="car-modal-top">
                {(() => {
                  const gallery = selectedCar.imagens && selectedCar.imagens.length > 0 ? selectedCar.imagens : (selectedCar.imagem ? [selectedCar.imagem] : []);
                  
                  if (gallery.length === 0) {
                    return <div style={{ color: '#666' }}>Sem foto</div>;
                  }
  
                  return (
                    <>
                      <img src={gallery[currentImageIndex]} alt="Carro" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      
                      {gallery.length > 1 && (
                        <>
                          <button 
                            onClick={() => setCurrentImageIndex(prev => prev === 0 ? gallery.length - 1 : prev - 1)}
                            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', width: '40px', height: '40px', fontSize: '3rem', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                          >
                            &lt;
                          </button>
                          <button 
                            onClick={() => setCurrentImageIndex(prev => prev === gallery.length - 1 ? 0 : prev + 1)}
                            style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', width: '40px', height: '40px', fontSize: '3rem', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
                          >
                            &gt;
                          </button>
                          <div style={{ position: 'absolute', bottom: '16px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            {gallery.map((_, idx) => (
                              <div key={idx} style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: idx === currentImageIndex ? 'var(--primary-color)' : 'rgba(255,255,255,0.5)' }}></div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
  
              {/* BAIXO: DADOS DO CARRO */}
              <div className="car-modal-bottom">
                
                {/* Esquerda: Informações do Veículo */}
                <div className="car-modal-bottom-info" style={{ paddingTop: '3px' }}>
                  <div style={{ marginBottom: '3px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: '800', lineHeight: '1.1', margin: '0', color: 'var(--text-primary)' }}>{selectedCar.modelo}</h2>
                      {selectedCar.versao && (
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{selectedCar.versao}</div>
                      )}
                    </div>
                    <img src={getLocalLogoUrl(selectedCar.marca)} alt="Logo" className="modal-logo" onError={e => e.target.style.display='none'} style={{ flexShrink: 0 }} />
                  </div>
    
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px', marginBottom: '8px' }}>
                    {(() => {
                      let modalDet = {};
                      try { modalDet = JSON.parse(selectedCar.detalhes || '{}'); } catch(e){}
                      return (
                        <>
                          <div style={{ padding: '6px 12px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Ano Fab</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>{selectedCar.ano}</span>
                          </div>
                          <div style={{ padding: '6px 12px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Câmbio</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>{selectedCar.cambio || modalDet.cambio || '--'}</span>
                          </div>
                          <div style={{ padding: '6px 12px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Combustível</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>{selectedCar.combustivel || modalDet.combustivel || '--'}</span>
                          </div>
                          <div style={{ padding: '6px 12px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>IPVA Pago</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>{selectedCar.ipva_pago ? 'Sim' : (selectedCar.ipva_pago === false ? 'Não' : '--')}</span>
                          </div>
                          <div style={{ padding: '6px 12px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Tração</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>{selectedCar.tracao || modalDet.tracao || '--'}</span>
                          </div>
                          <div style={{ padding: '6px 12px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Quilometragem</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>{selectedCar.km ? Number(selectedCar.km).toLocaleString('pt-BR') : '0'} km</span>
                          </div>
                          <div style={{ padding: '6px 12px', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Estado (UF)</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>{selectedCar.estado || '--'}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {(() => {
                    let sobreTxt = selectedCar.detalhes || '';
                    try { 
                      const d = JSON.parse(sobreTxt); 
                      sobreTxt = d.faleSobre || d.texto || d.consertos || ''; 
                    } catch(e){}
                    if (!sobreTxt) return null;
                    return (
                      <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)', whiteSpace: 'pre-line', marginTop: '12px' }}>
                        {sobreTxt}
                      </div>
                    );
                  })()}
                </div>

                {/* Direita: Preço e WhatsApp */}
                <div className="car-modal-bottom-action">
                  <div className="fipe-price-modal" style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>Valor FIPE: <span style={{ textDecoration: 'line-through' }}>R$ {selectedCar.fipe?.toLocaleString('pt-BR')}</span></div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Preço Delmar:</div>
                  <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#ef4444', lineHeight: '1', marginBottom: '16px' }}>
                    {selectedCar.venda ? `R$ ${selectedCar.venda.toLocaleString('pt-BR')}` : 'Aceita Proposta'}
                  </div>
    
                  <a 
                    onClick={() => { if(window.fbq) window.fbq('track', 'Contact'); }}
                    href={`https://wa.me/5567991694802?text=Olá!%20Tenho%20interesse%20no%20${encodeURIComponent(selectedCar.marca + ' ' + selectedCar.modelo + ' ' + (selectedCar.ano||'') + ((selectedCar.imagens && selectedCar.imagens.length > 0) ? '\n\nVeja a foto: ' + selectedCar.imagens[0] : (selectedCar.imagem ? '\n\nVeja a foto: ' + selectedCar.imagem : '')))}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: '700', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', backgroundColor: '#25D366', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', transition: 'background 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#1DA851'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = '#25D366'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                    Verificar Disponibilidade
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
