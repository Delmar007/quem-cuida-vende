const fs = require('fs');
const file = 'c:/Users/delma/OneDrive/Área de Trabalho/delmar-vendeseucarro/src/pages/Ads.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<img src=\{gallery\[currentImageIndex\]\} alt="Carro" style=\{\{ width: '100%', height: '100%', objectFit: 'cover' \}\} \/>/g,
  '<img src={gallery[currentImageIndex]} alt="Carro" style={{ width: \'100%\', height: \'100%\', objectFit: \'contain\' }} />'
);

fs.writeFileSync(file, content);
console.log('Ads.jsx image objectFit updated to contain');
