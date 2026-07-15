const fs = require('fs');
const file = 'c:/Users/delma/OneDrive/Área de Trabalho/delmar-vendeseucarro/src/pages/Ads.jsx';
let content = fs.readFileSync(file, 'utf8');

const target = `                    const brandRaw = req.marca || '';
                    const brandSearch = brandRaw.toLowerCase().split(' - ')[0].replace(/\\s+/g, '');
                    const logoUrl = brandSearch ? \`https://logo.clearbit.com/\${brandSearch}.com\` : '';`;

const replace = `                    const brandRaw = req.marca || '';
                    const logoUrl = brandRaw ? \`/logos/\${brandRaw}.png\` : '';`;

content = content.replace(target, replace);
fs.writeFileSync(file, content);
console.log('Pedidos logo fixed');
