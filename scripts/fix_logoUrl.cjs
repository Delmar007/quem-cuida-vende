const fs = require('fs');
const file = 'c:/Users/delma/OneDrive/Área de Trabalho/delmar-vendeseucarro/src/pages/Ads.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = "`https://logo.clearbit.com/${brandSearch}.com`";
const newStr = "`/logos/${brandRaw}.png`";

content = content.replace(targetStr, newStr);

fs.writeFileSync(file, content);
console.log('Fixed logoUrl directly');
