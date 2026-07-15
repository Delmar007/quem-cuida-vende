import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';

export default function DynamicBanner({ cars = [], sponsoredBanners = [], previewOverride, bannerFilterCategory, onCarClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [config, setConfig] = useState({ timer: 5, layout: 1 });
  const [bannerCars, setBannerCars] = useState([]);
  
  const roRef = useRef(null);
  const [scaleFactor, setScaleFactor] = useState(1);

  const containerRef = React.useCallback((node) => {
    if (roRef.current) {
      roRef.current.disconnect();
      roRef.current = null;
    }
    if (node) {
      const updateScale = (w) => {
        const width = w || node.getBoundingClientRect().width;
        const baseWidth = (previewOverride && previewOverride.layout === 8) ? 1080 : 940;
        if (width > 0) {
          setScaleFactor(width / baseWidth);
        }
      };
      
      updateScale(); // Initial measurement before paint
      
      const ro = new ResizeObserver(entries => {
        for (let entry of entries) {
          updateScale(entry.contentRect.width);
        }
      });
      
      ro.observe(node);
      roRef.current = ro;
    }
  }, [previewOverride]);

  // Fetch Config
  useEffect(() => {
    if (previewOverride) return;
    const fetchConfig = async () => {
      const { data } = await supabase.from('institucional').select('*').eq('page', 'banner_config').limit(1);
      if (data && data.length > 0) {
        try {
          const parsed = JSON.parse(data[0].text_content);
          if (parsed.timer) setConfig(parsed);
        } catch (e) {}
      }
    };
    fetchConfig();
  }, [previewOverride]);

  // Filter cars for banner
  useEffect(() => {
    if (previewOverride) return;
    if (!cars || cars.length === 0) return;
    let featured = cars.filter(c => {
      try { return JSON.parse(c.detalhes || '{}').destaqueBanner === true; } catch (e) { return false; }
    });
    
    // Filtro de categoria selecionada
    if (bannerFilterCategory) {
      const categoryFeatured = featured.filter(c => c.tipoVeiculo === bannerFilterCategory);
      if (categoryFeatured.length > 0) {
        featured = categoryFeatured;
      }
    }

    featured.sort((a, b) => new Date(b.dataCadastro || 0) - new Date(a.dataCadastro || 0));

    setBannerCars(featured);
  }, [cars, previewOverride, bannerFilterCategory]);

  const carouselItems = useMemo(() => {
    if (previewOverride) return [{ type: 'car', data: previewOverride.car }];
    if (!bannerCars || bannerCars.length === 0) return [];
    
    let items = [];
    let spIndex = 0;
    
    bannerCars.forEach((car, index) => {
      items.push({ type: 'car', data: car });
      if ((index + 1) % 5 === 0 && sponsoredBanners && sponsoredBanners.length > 0) {
        items.push({ type: 'sponsor', data: sponsoredBanners[spIndex % sponsoredBanners.length] });
        spIndex++;
      }
    });

    return items;
  }, [bannerCars, previewOverride, sponsoredBanners]);

  // Timer
  useEffect(() => {
    if (carouselItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % carouselItems.length);
    }, config.timer * 1000);
    return () => clearInterval(interval);
  }, [carouselItems.length, config.timer]);

  if (!carouselItems || carouselItems.length === 0) return null;

  const currentItem = carouselItems[currentIndex % carouselItems.length];
  
  if (currentItem && currentItem.type === 'sponsor') {
    const ad = currentItem.data;
    let pConfig = { scale: 1, x: 0, y: 0, textContent: '', textPos: 'center', showText: false, font: 'Inter', uppercase: false };
    try {
      const parsed = JSON.parse(ad.text_content || '{}');
      pConfig = { ...pConfig, ...parsed };
    } catch(e) {}
    
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

    return (
      <div 
        ref={containerRef}
        className="dynamic-banner-container" 
        style={{ width: '100%', paddingBottom: '37.234%', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
          <style>{`@import url('https://fonts.googleapis.com/css2?family=${pConfig.font.replace(/ /g, '+')}:wght@400;700;900&display=swap');`}</style>
          {ad.image && (
            <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'absolute' }}>
              <img src={ad.image} alt="Patrocínio" style={{ width: '100%', height: '100%', objectFit: pConfig.scale < 1 ? 'contain' : 'cover', objectPosition: `${50 + (pConfig.x || 0)}% ${50 + (pConfig.y || 0)}%`, transform: `scale(${pConfig.scale})`, transformOrigin: 'center' }} />
            </div>
          )}
          {pConfig.showText && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', ...getPosStyles(pConfig.textPos), padding: '24px', pointerEvents: 'none' }}>
              <h2 style={{ fontFamily: `"${pConfig.font}", sans-serif`, textTransform: pConfig.uppercase ? 'uppercase' : 'none', color: '#fff', textShadow: '2px 2px 10px rgba(0,0,0,0.9)', margin: 0, fontSize: '1.8rem', fontWeight: '900' }}>{pConfig.textContent || 'TEXTO DO PATROCINADOR'}</h2>
            </div>
          )}
        </div>
      </div>
    );
  }

  const car = currentItem.data;
  let imgs = [];
  try {
    if (typeof car.imagens === 'string') imgs = JSON.parse(car.imagens);
    else if (Array.isArray(car.imagens)) imgs = car.imagens;
  } catch(e) {}

  const mainImage = imgs.length > 0 ? imgs[0] : '/placeholder-car.jpg';
  let rightImgs = imgs.slice(1, 6);

  let imgTransform = 'none';
  let imgObjPos = 'center';
  let imgObjFit = 'cover';
  try {
    const det = JSON.parse(car.detalhes || '{}');
    if (det.imageTransform) {
      const { scale, x, y } = det.imageTransform;
      if (scale) {
        imgTransform = `scale(${scale})`;
        imgObjPos = `${50 + (x || 0)}% ${50 + (y || 0)}%`;
        if (scale < 1) imgObjFit = 'contain';
      }
    }
  } catch(e) {}

  const brandSearch = (car.marca || '').toLowerCase().split(' - ')[0].replace(/\s+/g, '');
  const logoUrl = brandSearch ? `https://logo.clearbit.com/${brandSearch}.com` : '';

  const knownLogos = [
    "ASTON MARTIN", "Acura", "Agrale", "Alfa Romeo", "Audi", "BMW", "BYD", "CHANA", "CHANGAN", "Cadillac", "Caoa Chery", "Chrysler", "Citroën", "Daewoo", "Daihatsu", "Dodge", "Ferrari", "Fiat", "Ford", "GEELY", "GM - Chevrolet", "GREAT WALL", "GWM", "Gurgel", "HAFEI", "Honda", "Hyundai", "Isuzu", "JAC", "Jaguar", "Jeep", "Kia Motors", "LAMBORGHINI", "LIFAN", "LOBINI", "Lada", "Land Rover", "Lexus", "Lotus", "MG", "MINI", "Mahindra", "Maserati", "Mazda", "Mclaren", "Mercedes-Benz", "Mercury", "Mitsubishi", "Nissan", "Peugeot", "Plymouth", "Pontiac", "Porsche", "RAM", "Renault", "Rolls-Royce", "Rover", "SSANGYONG", "Saab", "Saturn", "Seat", "Subaru", "Suzuki", "Toyota", "Troller", "VW - VolksWagen", "Volvo", "smart"
  ];

  const getLocalLogoUrl = (marcaStr) => {
    if (!marcaStr) return '';
    const cleanMarca = marcaStr.replace(/\*/g, '').trim();
    const m = cleanMarca.toLowerCase();
    
    if (m === 'vw' || m === 'volkswagen' || m.includes('vw -')) return '/logos/VW - VolksWagen.png';
    if (m === 'gm' || m === 'chevrolet' || m.includes('gm -')) return '/logos/GM - Chevrolet.png';
    if (m === 'mercedes' || m === 'mercedes benz' || m === 'mercedes-benz') return '/logos/Mercedes-Benz.png';
    if (m === 'caoa chery' || m === 'chery') return '/logos/Caoa Chery.png';
    if (m === 'kia') return '/logos/Kia Motors.png';
    if (m === 'land rover' || m === 'land-rover' || m === 'landrover') return '/logos/Land Rover.png';
    if (m === 'citroen') return '/logos/Citroën.png';

    const found = knownLogos.find(logo => logo.toLowerCase() === m);
    if (found) return `/logos/${found}.png`;

    return `/logos/${cleanMarca}.png`;
  };

  const renderLayout1 = () => {
    if (rightImgs.length === 0) return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 1, backgroundColor: '#000' }}>
        <img src={mainImage} alt={car.modelo} style={{ width: '100%', height: '100%', objectFit: imgObjFit, objectPosition: imgObjPos, transform: imgTransform }} />
      </div>
    );
    const rImgs = rightImgs.slice(0, 2);
    return (
      <>
        {/* Left Main Image */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: '65%', height: '100%', clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)', zIndex: 2, backgroundColor: '#000' }}>
          <img src={mainImage} alt={car.modelo} style={{ width: '100%', height: '100%', objectFit: imgObjFit, objectPosition: imgObjPos, transform: imgTransform }} />
        </div>

        {/* Right Detail Images */}
        <div style={{ position: 'absolute', right: 0, top: 0, width: '45%', height: '100%', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '2px', backgroundColor: '#000' }}>
          {rImgs.map((img, i) => (
            <div key={i} style={{ flex: 1, width: '100%', overflow: 'hidden' }}>
              <img src={img} alt={`Detalhe ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderLayout2 = () => (
    <>
      <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 1, backgroundColor: '#000' }}>
        <img src={mainImage} alt={car.modelo} style={{ width: '100%', height: '100%', objectFit: imgObjFit, objectPosition: imgObjPos, transform: imgTransform }} />
      </div>
      {rightImgs.length > 0 && (
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: '5px', zIndex: 2, display: 'flex', gap: '10px' }}>
          {rightImgs.slice(0, 3).map((img, i) => (
            <div key={i} style={{ width: '100px', height: '65px', borderRadius: '4px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.4)' }} className="banner-layout2-small-img">
              <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}
    </>
  );

  const renderLayout3 = () => {
    if (rightImgs.length === 0) return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 1, backgroundColor: '#000' }}>
        <img src={mainImage} alt={car.modelo} style={{ width: '100%', height: '100%', objectFit: imgObjFit, objectPosition: imgObjPos, transform: imgTransform }} />
      </div>
    );
    const hexImgs = rightImgs.slice(0, 5);
    const len = hexImgs.length;
    
    let gridStyle = { position: 'absolute', left: '0', top: '50%', transform: 'translate(0, -50%) scale(1.595)', zIndex: 3 };
    let imgStyle = { clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', backgroundColor: '#d32f2f', padding: '2px', objectFit: 'cover' };
    
    if (len <= 2) {
      gridStyle.display = 'grid';
      gridStyle.gridTemplateColumns = len === 1 ? '1fr' : '1fr 1fr';
      gridStyle.gap = '15px';
      gridStyle.width = len === 1 ? '160px' : '330px';
      imgStyle.width = '150px';
      imgStyle.height = '173px';
    } else if (len <= 4) {
      gridStyle.display = 'grid';
      gridStyle.gridTemplateColumns = '1fr 1fr';
      gridStyle.gap = '10px';
      gridStyle.width = '230px';
      imgStyle.width = '105px';
      imgStyle.height = '121px';
    } else {
      gridStyle.width = '164px';
      gridStyle.height = '234px';
      imgStyle.position = 'absolute';
      imgStyle.width = '80px';
      imgStyle.height = '92px';
    }

    return (
      <div style={{ width: '100%', height: '100%', backgroundColor: '#000', position: 'relative' }}>
        <img src={mainImage} alt={car.modelo} style={{ position: 'absolute', right: 0, top: 0, width: '70%', height: '100%', objectFit: imgObjFit, objectPosition: imgObjPos, transform: imgTransform, maskImage: 'linear-gradient(to right, transparent 0%, black 25%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 25%)' }} />
        
        {len === 5 ? (
          <div style={gridStyle}>
            {hexImgs.map((img, i) => {
              let left = 0, top = 0;
              if (i === 0) { left = 0; top = 0; }
              if (i === 1) { left = 84; top = 0; }
              if (i === 2) { left = 42; top = 71; }
              if (i === 3) { left = 0; top = 142; }
              if (i === 4) { left = 84; top = 142; }
              return (
                <div key={i} style={{ ...imgStyle, left: `${left}px`, top: `${top}px`, overflow: 'hidden' }}>
                  <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover', clipPath: imgStyle.clipPath }} />
                </div>
              );
            })}
          </div>
        ) : (
          <div style={gridStyle}>
            {hexImgs.map((img, i) => {
              let customStyle = { ...imgStyle, overflow: 'hidden' };
              if (len === 3 && i === 2) { customStyle.gridColumn = '1 / 3'; customStyle.justifySelf = 'center'; }
              return (
                <div key={i} style={customStyle}>
                  <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover', clipPath: imgStyle.clipPath }} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderLayout4 = () => {
    if (rightImgs.length === 0) return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 1, backgroundColor: '#000' }}>
        <img src={mainImage} alt={car.modelo} style={{ width: '100%', height: '100%', objectFit: imgObjFit, objectPosition: imgObjPos, transform: imgTransform }} />
      </div>
    );
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#000' }}>
        <img src={mainImage} alt={car.modelo} style={{ width: '100%', height: '100%', objectFit: imgObjFit, objectPosition: imgObjPos, opacity: 0.5, filter: 'blur(0.75px) brightness(0.85)', transform: imgTransform !== 'none' ? imgTransform : 'scale(1.05)' }} />
        <div className="banner-layout4-images-container" style={{ position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
          <div className="banner-layout4-images-group" style={{ display: 'flex', gap: '15px' }}>
            {rightImgs.slice(0, 5).map((img, i) => (
              <div key={i} className="banner-layout4-img-box" style={{ width: '112.5px', height: '200px', borderRadius: '4px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.8), 0 8px 10px -6px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', transform: `translateY(${i % 2 !== 0 ? '-10px' : '10px'})` }}>
                <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderLayout5 = () => {
    const rImgs = rightImgs.slice(0, 5);
    const len = rImgs.length;
    
    if (len === 0) return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 1, backgroundColor: '#000' }}>
        <img src={mainImage} alt={car.modelo} style={{ width: '100%', height: '100%', objectFit: imgObjFit, objectPosition: imgObjPos, transform: imgTransform }} />
      </div>
    );
    
    let gridCols = '1fr';
    let gridRows = '1fr';
    
    if (len === 1) { gridCols = '1fr'; gridRows = '1fr'; }
    else if (len === 2) { gridCols = '1fr'; gridRows = '1fr 1fr'; }
    else if (len === 3) { gridCols = '1fr 1fr'; gridRows = '1fr 1fr'; }
    else if (len === 4) { gridCols = '1fr 1fr'; gridRows = '1fr 1fr'; }
    else if (len === 5) { gridCols = '1fr 1fr'; gridRows = '1fr 1fr 1fr'; }
    
    return (
      <div style={{ display: 'flex', width: '100%', height: '100%', backgroundColor: '#000', position: 'relative' }}>
        <div style={{ width: '50%', height: '100%', position: 'relative' }}>
          <img src={mainImage} alt={car.modelo} style={{ width: '100%', height: '100%', objectFit: imgObjFit, objectPosition: imgObjPos, transform: imgTransform }} />
        </div>
        <div style={{ width: '50%', height: '100%', display: 'grid', gridTemplateColumns: gridCols, gridTemplateRows: gridRows, gap: '4px', padding: '4px', backgroundColor: '#000' }}>
          {rImgs.map((img, i) => {
            let gridColumn = 'auto';
            if (len === 3 && i === 0) gridColumn = '1 / 3';
            if (len === 5 && i === 0) gridColumn = '1 / 3';
            return (
              <div key={i} style={{ position: 'relative', overflow: 'hidden', gridColumn }}>
                <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLayout6 = () => {
    const rImgs = rightImgs.slice(0, 5);
    const len = rImgs.length;
    
    if (len === 0) return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 1, backgroundColor: '#000' }}>
        <img src={mainImage} alt={car.modelo} style={{ width: '100%', height: '100%', objectFit: imgObjFit, objectPosition: imgObjPos, transform: imgTransform }} />
      </div>
    );
    
    let gridCols = '1fr';
    let gridRows = '1fr';
    
    if (len === 1) { gridCols = '1fr'; gridRows = '1fr'; }
    else if (len === 2) { gridCols = '1fr'; gridRows = '1fr 1fr'; }
    else if (len === 3) { gridCols = '1fr 1fr'; gridRows = '1fr 1fr'; }
    else if (len === 4) { gridCols = '1fr 1fr'; gridRows = '1fr 1fr'; }
    else if (len === 5) { gridCols = '1fr 1fr 1fr 1fr'; gridRows = '1fr 1fr'; }

    return (
      <div style={{ width: '100%', height: '100%', backgroundColor: '#111', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: '-10%', top: '-10%', width: '120%', height: '120%', background: 'radial-gradient(circle at 30% 50%, rgba(239,68,68,0.4) 0%, rgba(17,17,17,1) 60%)', zIndex: 1 }}></div>
        
        <div style={{ position: 'absolute', top: 0, right: 0, width: '60%', height: '100%', zIndex: 1, backgroundColor: '#000' }}>
          <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: gridCols, gridTemplateRows: gridRows, gap: '2px' }}>
            {rImgs.map((img, i) => {
              let gridColumn = 'auto';
              if (len === 3 && i === 0) gridColumn = '1 / 3';
              if (len === 5 && i === 4) gridColumn = '1 / 5';
              return (
                <div key={i} style={{ position: 'relative', overflow: 'hidden', gridColumn }}>
                  <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ position: 'absolute', left: 0, top: 0, width: '60%', height: '100%', zIndex: 2, filter: 'drop-shadow(2px 0px 0px rgba(239,68,68,0.8))' }}>
          <div style={{ width: '100%', height: '100%', clipPath: 'polygon(0 0, 100% 0, 80% 100%, 0 100%)' }}>
            <img src={mainImage} alt={car.modelo} style={{ width: '100%', height: '100%', objectFit: imgObjFit, objectPosition: imgObjPos, opacity: 0.9, transform: imgTransform }} />
          </div>
        </div>
      </div>
    );
  };

  const renderLayout7 = () => {
    let targetInfo = { marca: 'MARCA', modelo: 'MODELO DESEJADO', ano: 'ANO', preco: 'PREÇO' };
    let det = {};
    try {
      if (previewOverride && previewOverride.targetCar) {
        targetInfo = previewOverride.targetCar;
      } else if (car.detalhes) {
        det = JSON.parse(car.detalhes);
        if (det.targetCar) targetInfo = det.targetCar;
      }
    } catch(e) {}

    const leftLabels = [
      car.ano || 'ANO',
      car.km ? `${car.km} KM` : '0 KM',
      det.cambio || 'Auto',
      det.tracao || '4x2',
      car.venda ? `R$ ${car.venda}` : 'Aceita Proposta'
    ];

    const rightLabels = [
      `Ano de: ${targetInfo.anoDe || '2020'}`,
      `Ano até: ${targetInfo.anoAte || '2022'}`,
      <span key="km" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><span>KM até:</span><span>{targetInfo.kmAte || '---'}</span></span>,
      `Valor de: ${targetInfo.precoDe || '90.000,00'}`,
      `Valor até: ${targetInfo.precoAte || '100.000,00'}`
    ];

    const rImgs = rightImgs.slice(0, 5);

    const targetBrandSearch = (targetInfo.marca || '').toLowerCase().split(' - ')[0].replace(/\s+/g, '');
    const targetLogoUrl = targetBrandSearch ? `https://logo.clearbit.com/${targetBrandSearch}.com` : '';
    
    // Simplificar tipoNegocio para duas linhas
    let negocioText = 'Troca';
    if (targetInfo.tipoNegocio === 'Troca por carro de maior valor') negocioText = 'Troca por\nMaior Valor';
    else if (targetInfo.tipoNegocio === 'Troca por carro de menor valor') negocioText = 'Troca por\nMenor Valor';
    else if (targetInfo.tipoNegocio === 'Troca por carro do mesmo valor') negocioText = 'Troca por\nMesmo Valor';

    return (
      <div style={{ display: 'flex', width: '100%', height: '100%', backgroundColor: '#000', overflow: 'hidden', position: 'relative' }}>
        
        {/* LADO ESQUERDO */}
        <div style={{ width: '50%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* Main Image */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <img src={mainImage} alt={car.modelo} style={{ width: '100%', height: '100%', objectFit: imgObjFit, objectPosition: imgObjPos, transform: imgTransform }} />
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '50px', background: 'linear-gradient(rgba(0,0,0,0.8), transparent)' }}></div>
            <div style={{ position: 'absolute', top: '15px', left: '15px', color: '#fff', fontSize: 'var(--base-size, 1rem)', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.8)', zIndex: 10, textTransform: 'uppercase' }}>
              {car.modelo}
            </div>
          </div>
          {/* 5 pequenas fotos */}
          <div style={{ height: '75px', display: 'flex', gap: '4px', padding: '4px 4px 4px 10px', backgroundColor: '#111' }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ color: '#fff', fontSize: 'var(--base-size, 1rem)', textAlign: 'center', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>{leftLabels[i]}</div>
                <div style={{ flex: 1, border: '1px solid rgba(255,255,255,0.3)', overflow: 'hidden', backgroundColor: '#000' }}>
                  {rImgs[i] && <img src={rImgs[i]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LADO DIREITO */}
        <div style={{ width: '50%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: '#000' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ position: 'absolute', top: '15px', right: '15px', color: '#fff', fontSize: 'var(--base-size, 1rem)', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.8)', zIndex: 10, textTransform: 'uppercase', textAlign: 'right' }}>
              {targetInfo.modelo}
            </div>
            <div style={{ position: 'absolute', bottom: '15px', right: '15px', opacity: 0.2 }}>
               <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 17l4 4 4-4M12 12v9M16 7l-4-4-4 4M12 12V3"/></svg>
            </div>
          </div>
          {/* 5 molduras com texto dentro */}
          <div style={{ height: '75px', display: 'flex', gap: '4px', padding: '4px 10px 4px 4px', backgroundColor: '#111' }}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ color: 'transparent', fontSize: 'var(--base-size, 1rem)', marginBottom: '2px' }}>-</div>
                <div style={{ flex: 1, border: '1px dashed rgba(255,255,255,0.4)', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px' }}>
                  <span style={{ color: '#fff', fontSize: 'var(--base-size, 1rem)', fontWeight: 'bold', textAlign: 'center', lineHeight: '1.2' }}>{rightLabels[i]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CENTRO: Logos e X */}
        <div style={{ position: 'absolute', top: 'calc(50% - 37.5px)', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', gap: '0px', zIndex: 20 }}>
          <div style={{ width: '150px', height: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img src={getLocalLogoUrl(car.marca)} alt={car.marca} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(2px 2px 5px rgba(0,0,0,0.8))' }} onError={(e) => { e.target.onerror = null; e.target.src = logoUrl; }} />
          </div>
          <div style={{ color: '#ef4444', fontSize: 'var(--base-size, 1rem)', fontWeight: '900', textShadow: '2px 2px 10px rgba(0,0,0,0.8)', margin: '0 -15px', zIndex: 21 }}>
            X
          </div>
          <div style={{ width: '150px', height: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <img src={getLocalLogoUrl(targetInfo.marca)} alt={targetInfo.marca} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(2px 2px 5px rgba(0,0,0,0.8))' }} onError={(e) => { e.target.onerror = null; e.target.src = targetLogoUrl; }} />
            
            <div style={{ position: 'absolute', left: '160px', top: '50%', transform: 'translateY(-50%)', width: '250px', textAlign: 'center', fontSize: 'var(--base-size, 1rem)', color: '#fff', fontWeight: '900', lineHeight: '1.1', textShadow: '2px 2px 5px rgba(0,0,0,0.8)', whiteSpace: 'pre-line' }}>
              {negocioText}
            </div>
          </div>
        </div>

      </div>
    );
  };

  
  const renderUnifiedOverlay = () => (
    <>
      {/* LOGO - Top Right */}
      <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 50, display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
        <img 
          src={getLocalLogoUrl(car.marca)} 
          alt={car.marca} 
          style={{ width: '100px', height: '100px', objectFit: 'contain', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.8))' }} 
          onError={(e) => { e.target.onerror = null; e.target.src = logoUrl; }} 
        />
      </div>

      {/* MODELO - Bottom Left */}
      <div style={{ position: 'absolute', bottom: '8px', left: '8px', zIndex: 50, maxWidth: '70%' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.5px', textShadow: '2px 2px 8px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.8)', lineHeight: '1.1' }}>
          {car.modelo}
        </h1>
      </div>

      {/* ANO / KM - Bottom Right */}
      <div style={{ position: 'absolute', bottom: '8px', right: '8px', zIndex: 50, display: 'flex', boxShadow: '0 4px 6px rgba(0,0,0,0.5)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.9)', 
          color: '#fff', 
          padding: '4px 12px', 
          fontSize: '20px',
          fontWeight: '900'
        }}>
          {car.ano}
        </div>
        <div style={{ 
          background: 'rgba(0,0,0,0.8)', 
          color: '#fff', 
          padding: '4px 12px', 
          fontSize: '20px',
          fontWeight: '700'
        }}>
          {car.km ? `${car.km} km` : '0 km'}
        </div>
      </div>
    </>
  );

  let activeLayout = previewOverride?.layout || config.layout || 1;

  if (!previewOverride && car) {
    try {
      const det = JSON.parse(car.detalhes || '{}');
      if (det.bannerLayout) {
        let parsed = parseInt(det.bannerLayout, 10);
        if (parsed === 8 && !previewOverride) {
          activeLayout = 1;
        } else {
          activeLayout = parsed;
        }
      }
    } catch(e) {}
  }

  const getDiscountBadge = (layoutId) => {
    let vendaFinal = parseFloat(car.venda);
    let fipeVal = parseFloat(car.fipe);
    
    if (!vendaFinal || !fipeVal) return null;
    
    const diff = fipeVal - vendaFinal;
    const pct = (diff / fipeVal) * 100;
    
    if (pct <= 0) return null;
    
    let discBg = '#ef4444';
    let discColor = '#fff';
    if (pct > 10 && pct <= 20) { discBg = '#facc15'; discColor = '#000'; }
    if (pct > 20) { discBg = '#22c55e'; discColor = '#fff'; }

    return (
      <div style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: discBg, color: discColor, width: '48px', height: '48px', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: 'var(--shadow-md)', lineHeight: '1.1', zIndex: 100 }}>
        <span style={{ fontSize: '14px' }}>-{pct.toFixed(0)}%</span>
        <span style={{ fontSize: '10px' }}>FIPE</span>
      </div>
    );
  };

  const renderLayout8 = () => {
    let parseDet = {};
    try { parseDet = JSON.parse(car.detalhes || '{}'); } catch(e) {}
    const cCambio = car.cambio || parseDet.cambio || '--';
    const cComb = car.combustivel || parseDet.combustivel || '--';
    const cTracao = car.tracao || parseDet.tracao || '--';

    return (
      <div style={{ width: '100%', height: '100%', backgroundColor: '#000', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Top Section */}
        <div style={{ height: '267px', backgroundColor: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', padding: '0 40px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
             <span style={{ fontSize: '1.8rem', color: '#fff', fontWeight: '800', textTransform: 'uppercase' }}>FIPE:</span>
             <span style={{ fontSize: '3.8rem', color: '#fff', fontWeight: '900', letterSpacing: '-1px' }}>R$ {parseFloat(car.fipe).toLocaleString('pt-BR')}</span>
          </div>
          <div style={{ width: '4px', height: '120px', backgroundColor: '#fff', margin: '0 40px' }}></div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
             <span style={{ fontSize: '1.8rem', color: '#fff', fontWeight: '800', textTransform: 'uppercase' }}>VALOR:</span>
             <span style={{ fontSize: '5rem', color: '#22c55e', fontWeight: '900', letterSpacing: '-2px', lineHeight: '1' }}>R$ {parseFloat(car.venda).toLocaleString('pt-BR')}</span>
          </div>
        </div>

        {/* Image Section (1080x546) */}
        <div style={{ height: '546px', width: '100%', position: 'relative', overflow: 'hidden' }}>
          {car.imagens && car.imagens.length > 0 ? (
            <div style={{ width: '100%', height: '100%', backgroundImage: `url(${car.imagens[0]})`, backgroundSize: imgObjFit === 'fill' ? '100% 100%' : imgObjFit, backgroundPosition: imgObjPos, transform: imgTransform, backgroundRepeat: 'no-repeat' }} />
          ) : car.imagem ? (
            <div style={{ width: '100%', height: '100%', backgroundImage: `url(${car.imagem})`, backgroundSize: imgObjFit === 'fill' ? '100% 100%' : imgObjFit, backgroundPosition: imgObjPos, transform: imgTransform, backgroundRepeat: 'no-repeat' }} />
          ) : (
             <div style={{ width: '100%', height: '100%', backgroundColor: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '2rem' }}>SEM IMAGEM</div>
          )}
          {/* Brand Logo inside image (top right) */}
          <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10 }}>
             <img src={getLocalLogoUrl(car.marca)} alt={car.marca} style={{ width: '100px', height: '100px', objectFit: 'contain', filter: /toyota|audi/i.test(car.marca || '') ? 'brightness(0) invert(0.85) sepia(0.1) drop-shadow(2px 2px 4px rgba(0,0,0,0.8))' : 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))' }} onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          {/* Model Text inside image (bottom center) */}
          <div style={{ position: 'absolute', bottom: '5px', left: '0', right: '0', textAlign: 'center', zIndex: 10 }}>
             <h1 style={{ fontSize: '3.5rem', fontWeight: '900', color: '#fff', margin: 0, textTransform: 'uppercase', textShadow: '2px 2px 8px rgba(0,0,0,0.9)' }}>{car.modelo}</h1>
          </div>
        </div>

        {/* Bottom Section */}
        <div style={{ height: '267px', backgroundColor: '#000', display: 'flex', flexDirection: 'column' }}>
           {/* Top bar of bottom section for team name */}
           <div style={{ padding: '10px 40px', borderBottom: '2px solid #222', display: 'flex', justifyContent: 'center', width: '100%' }}>
              <img src="/logos/logo_equipe_texto.png" alt="Equipe Personal Car" style={{ width: '100%', maxHeight: '40px', objectFit: 'contain' }} />
           </div>
           
           <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px' }}>
             {/* Left Stats Grid */}
             <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '16px 32px' }}>
                <span style={{ fontSize: '2rem', color: '#fff', fontWeight: '900' }}>{car.ano}</span>
                <span style={{ fontSize: '2rem', color: '#fff', fontWeight: '900', whiteSpace: 'nowrap' }}>KM: {car.km?.toLocaleString('pt-BR') || '0'} - {car.cidade || 'MS'}</span>
                <span style={{ fontSize: '2rem', color: '#fff', fontWeight: '900', textTransform: 'uppercase' }}>{cTracao !== '--' ? cTracao : cCambio}</span>
                <span style={{ fontSize: '2rem', color: '#fff', fontWeight: '900', textTransform: 'uppercase' }}>{cComb}</span>
             </div>

             {/* Center Call to Action */}
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2.5rem', color: '#22c55e', fontWeight: '900', textTransform: 'uppercase' }}>ACESSE O SITE</span>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="#22c55e">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
             </div>

             {/* Right Logo */}
             <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <img src="/logos/logo_equipe_icone.png" alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
             </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="dynamic-banner-container" 
      onClick={() => onCarClick && onCarClick(car)}
      style={{ width: '100%', paddingBottom: activeLayout === 8 ? '100%' : '37.234%', backgroundColor: '#111', borderRadius: activeLayout === 8 ? '0px' : 'var(--radius-xl)', overflow: 'hidden', position: 'relative', boxShadow: activeLayout === 8 ? 'none' : 'var(--shadow-premium)', cursor: onCarClick ? 'pointer' : 'default' }}
    >
      <div style={{ width: activeLayout === 8 ? '1080px' : '940px', height: activeLayout === 8 ? '1080px' : '350px', transform: `scale(${scaleFactor})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
        {activeLayout === 1 && renderLayout1()}
        {activeLayout === 2 && renderLayout2()}
        {activeLayout === 3 && renderLayout3()}
        {activeLayout === 4 && renderLayout4()}
        {activeLayout === 5 && renderLayout5()}
        {activeLayout === 6 && renderLayout6()}
        {activeLayout === 7 && renderLayout7()}
        {activeLayout === 8 && renderLayout8()}

        {activeLayout !== 7 && activeLayout !== 8 && renderUnifiedOverlay()}
        {activeLayout !== 7 && activeLayout !== 8 && getDiscountBadge(activeLayout)}
      </div>
    </div>
  );
}
