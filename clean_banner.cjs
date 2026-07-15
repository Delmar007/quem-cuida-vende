const fs = require('fs');

let content = fs.readFileSync('./src/components/DynamicBanner.jsx', 'utf8');

// 1. Remove Layout 1 text
content = content.replace(/\{\/\* Content Overlay \*\/\}[\s\S]*?(?=<\/>\s*\);\s*const renderLayout2)/, '');

// 2. Remove Layout 2 text
content = content.replace(/<div style=\{\{ position: 'absolute', left: '15px', bottom: '15px', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' \}\}>[\s\S]*?(?=<div style=\{\{ position: 'absolute', right: '15px', bottom: '15px')/, '');

// 3. Remove Layout 3 text
content = content.replace(/<div style=\{\{ position: 'absolute', left: '15px', bottom: '15px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px' \}\}>[\s\S]*?(?=<\/div>\s*<\/div>\s*\);\s*const renderLayout4)/, '');

// 4. Remove Layout 4 text
content = content.replace(/<div className="banner-layout4-logo"[\s\S]*?<\/div>\s*<div className="banner-layout4-images-container"/, '<div className="banner-layout4-images-container"');
content = content.replace(/<div style=\{\{ position: 'absolute', bottom: '15px', left: '15px', right: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 3 \}\}>[\s\S]*?<\/div>\s*<\/div>\s*\);\s*const renderLayout5/, '</div>\n  );\n\n  const renderLayout5');

// 5. Remove Layout 5 text
content = content.replace(/<div style=\{\{ position: 'absolute', top: '50%', left: '50%', transform: 'translate\(-50%, -50%\)', width: '80px', height: '80px'[\s\S]*?<\/div>\s*<div style=\{\{ width: len === 0/, '<div style={{ width: len === 0');
content = content.replace(/<div style=\{\{ position: 'absolute', bottom: '15px', left: '15px', right: '15px', textAlign: 'center'[\s\S]*?<\/div>\s*<\/div>\s*\{len > 0/, '</div>\n        \n        {len > 0');
// Remove labels in Layout 5 grid
content = content.replace(/<div style=\{\{ position: 'absolute', bottom: '4px', right: '4px'[\s\S]*?<\/div>\s*<\/div>\s*\);\s*\}\)/g, '</div>\n              );\n            })');

// 6. Remove Layout 6 text
content = content.replace(/<div style=\{\{ position: 'absolute', top: '15px', left: '15px', zIndex: 10[\s\S]*?<\/div>\s*<\/div>\s*\);\s*\};/g, '</div>\n    );\n  };');

// 7. Inject Unified Overlay
const unifiedOverlay = `
  const renderUnifiedOverlay = () => (
    <>
      {/* LOGO - Top Right */}
      <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 50, display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
        <img 
          src={getLocalLogoUrl(car.marca)} 
          alt={car.marca} 
          style={{ width: '80px', height: '80px', objectFit: 'contain', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.8))' }} 
          onError={(e) => { e.target.onerror = null; e.target.src = logoUrl; }} 
        />
      </div>

      {/* MODELO - Bottom Left */}
      <div style={{ position: 'absolute', bottom: '8px', left: '8px', zIndex: 50, maxWidth: '60%' }}>
        <h1 style={{ fontSize: 'calc(1.8rem * var(--banner-text-scale, 1))', fontWeight: '900', margin: 0, color: '#fff', textTransform: 'uppercase', letterSpacing: '-0.5px', textShadow: '2px 2px 8px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.8)', lineHeight: '1.1' }}>
          {car.modelo}
        </h1>
      </div>

      {/* ANO / KM - Bottom Right */}
      <div style={{ position: 'absolute', bottom: '8px', right: '8px', zIndex: 50, display: 'flex' }}>
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.9)', 
          color: '#fff', 
          padding: '2px 8px', 
          borderTopLeftRadius: 'var(--radius-sm)',
          borderBottomLeftRadius: 'var(--radius-sm)',
          fontSize: '1.2rem',
          fontWeight: '900',
          boxShadow: '0 4px 6px rgba(0,0,0,0.5)'
        }}>
          {car.ano}
        </div>
        <div style={{ 
          background: 'rgba(0,0,0,0.8)', 
          color: '#fff', 
          padding: '2px 8px', 
          borderTopRightRadius: 'var(--radius-sm)',
          borderBottomRightRadius: 'var(--radius-sm)',
          fontSize: '1.2rem',
          fontWeight: '700',
          boxShadow: '0 4px 6px rgba(0,0,0,0.5)'
        }}>
          {car.km ? \`\${car.km} km\` : '0 km'}
        </div>
      </div>
    </>
  );

  let activeLayout = previewOverride?.layout || config.layout || 1;
`;

content = content.replace(/let activeLayout = previewOverride\?\.layout \|\| config\.layout \|\| 1;/, unifiedOverlay);

content = content.replace(/\{activeLayout !== 7 && getDiscountBadge\(activeLayout\)\}/, '{activeLayout !== 7 && renderUnifiedOverlay()}\n        {activeLayout !== 7 && getDiscountBadge(activeLayout)}');

fs.writeFileSync('./src/components/DynamicBanner.jsx', content, 'utf8');
console.log('Regex replacements completed!');
