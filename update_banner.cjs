const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicBanner.jsx', 'utf8');

// Fix imgObjFit default
code = code.replace(/let imgObjFit = 'contain';/, "let imgObjFit = 'cover';");

// Rewrite renderUnifiedOverlay
const oldOverlay = code.substring(code.indexOf('const renderUnifiedOverlay'), code.indexOf('const renderLayout7'));
const newOverlay = `const renderUnifiedOverlay = () => {
    return (
      <>
        {/* LOGO - Top Right */}
        <div style={{ position: 'absolute', right: '8px', top: '8px', zIndex: 50, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
          <img src={getLocalLogoUrl(car.marca)} alt="Marca" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
        </div>

        {/* MODELO - Bottom Left */}
        <div style={{ position: 'absolute', bottom: '8px', left: '8px', zIndex: 50, textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}>
          <h2 style={{ color: '#fff', fontSize: '28px', fontWeight: '900', margin: 0, lineHeight: 1.1, textTransform: 'uppercase' }}>
            {car.modelo}
          </h2>
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
            {car.km ? \`\${car.km} km\` : '0 km'}
          </div>
        </div>
      </>
    );
  };

  `;
code = code.replace(oldOverlay, newOverlay);

// Rewrite renderLayout1
const oldLayout1 = code.substring(code.indexOf('const renderLayout1'), code.indexOf('const renderLayout2'));
const newLayout1 = `const renderLayout1 = () => {
    if (rightImgs.length === 0) return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 1, backgroundColor: '#000' }}>
        <img src={mainImage} alt={car.modelo} style={{ width: '100%', height: '100%', objectFit: imgObjFit, objectPosition: imgObjPos, transform: imgTransform }} />
      </div>
    );
    const rImgs = rightImgs.slice(0, 2);
    return (
      <>
        <div style={{ position: 'absolute', left: 0, top: 0, width: '65%', height: '100%', clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)', zIndex: 2, backgroundColor: '#000' }}>
          <img src={mainImage} alt={car.modelo} style={{ width: '100%', height: '100%', objectFit: imgObjFit, objectPosition: imgObjPos, transform: imgTransform }} />
        </div>
        <div style={{ position: 'absolute', right: 0, top: 0, width: '45%', height: '100%', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '2px', backgroundColor: '#000' }}>
          {rImgs.map((img, i) => (
            <div key={i} style={{ flex: 1, width: '100%', overflow: 'hidden' }}>
              <img src={img} alt="Detalhe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      </>
    );
  };

  `;
code = code.replace(oldLayout1, newLayout1);

// Rewrite renderLayout2
const oldLayout2 = code.substring(code.indexOf('const renderLayout2'), code.indexOf('const renderLayout3'));
const newLayout2 = `const renderLayout2 = () => {
    return (
      <>
        <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 1, backgroundColor: '#000' }}>
          <img src={mainImage} alt={car.modelo} style={{ width: '100%', height: '100%', objectFit: imgObjFit, objectPosition: imgObjPos, transform: imgTransform }} />
        </div>
        {rightImgs.length > 0 && (
          <div style={{ position: 'absolute', right: '15px', bottom: '50px', zIndex: 2, display: 'flex', gap: '10px' }}>
            {rightImgs.slice(0, 3).map((img, i) => (
              <div key={i} style={{ width: '100px', height: '65px', borderRadius: '4px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.4)' }}>
                <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  `;
code = code.replace(oldLayout2, newLayout2);

// Rewrite renderLayout3
const oldLayout3 = code.substring(code.indexOf('const renderLayout3'), code.indexOf('const renderLayout4'));
const newLayout3 = `const renderLayout3 = () => {
    if (rightImgs.length === 0) return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 1, backgroundColor: '#000' }}>
        <img src={mainImage} alt={car.modelo} style={{ width: '100%', height: '100%', objectFit: imgObjFit, objectPosition: imgObjPos, transform: imgTransform }} />
      </div>
    );
    const hexImgs = rightImgs.slice(0, 5);
    const len = hexImgs.length;
    
    let gridStyle = { position: 'absolute', left: '18%', top: '50%', transform: 'translate(-50%, -50%) scale(1.45)', zIndex: 3 };
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
        <img src={mainImage} alt={car.modelo} style={{ position: 'absolute', right: 0, top: 0, width: '70%', height: '100%', objectFit: imgObjFit, objectPosition: imgObjPos, transform: imgTransform, maskImage: 'linear-gradient(to right, transparent 0%, black 50%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 50%)' }} />
        
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
                <div key={i} style={{ ...imgStyle, left: \`\${left}px\`, top: \`\${top}px\`, overflow: 'hidden' }}>
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

  `;
code = code.replace(oldLayout3, newLayout3);

// Rewrite renderLayout4
const oldLayout4 = code.substring(code.indexOf('const renderLayout4'), code.indexOf('const renderLayout5'));
const newLayout4 = `const renderLayout4 = () => {
    if (rightImgs.length === 0) return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 1, backgroundColor: '#000' }}>
        <img src={mainImage} alt={car.modelo} style={{ width: '100%', height: '100%', objectFit: imgObjFit, objectPosition: imgObjPos, transform: imgTransform }} />
      </div>
    );
    return (
      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', backgroundColor: '#000' }}>
        <img src={mainImage} alt={car.modelo} style={{ width: '100%', height: '100%', objectFit: imgObjFit, objectPosition: imgObjPos, opacity: 0.5, filter: 'blur(1.5px) brightness(0.7)', transform: imgTransform !== 'none' ? imgTransform : 'scale(1.05)' }} />
        <div style={{ position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
          <div style={{ display: 'flex', gap: '15px' }}>
            {rightImgs.slice(0, 3).map((img, i) => (
              <div key={i} style={{ width: '150px', height: '200px', borderRadius: '4px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.8), 0 8px 10px -6px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', transform: \`translateY(\${i % 2 !== 0 ? '-10px' : '10px'})\` }}>
                <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  `;
code = code.replace(oldLayout4, newLayout4);

// Rewrite renderLayout5
const oldLayout5 = code.substring(code.indexOf('const renderLayout5'), code.indexOf('const renderLayout6'));
const newLayout5 = `const renderLayout5 = () => {
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

  `;
code = code.replace(oldLayout5, newLayout5);

// Rewrite renderLayout6
const oldLayout6 = code.substring(code.indexOf('const renderLayout6'), code.indexOf('const renderUnifiedOverlay'));
const newLayout6 = `const renderLayout6 = () => {
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

  `;
code = code.replace(oldLayout6, newLayout6);

fs.writeFileSync('src/components/DynamicBanner.jsx', code);
