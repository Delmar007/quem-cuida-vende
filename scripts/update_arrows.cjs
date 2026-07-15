const fs = require('fs');
const file = 'c:/Users/delma/OneDrive/Área de Trabalho/delmar-vendeseucarro/src/pages/Ads.jsx';
let content = fs.readFileSync(file, 'utf8');

const target1 = `style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}`;
const replace1 = `style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', width: '40px', height: '40px', fontSize: '3rem', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}`;

const target2 = `style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}`;
const replace2 = `style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', width: '40px', height: '40px', fontSize: '3rem', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}`;

content = content.replace(target1, replace1);
content = content.replace(target2, replace2);

fs.writeFileSync(file, content);
console.log('Ads.jsx carousel buttons updated');
