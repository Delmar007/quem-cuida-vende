const fs = require('fs');
const file = 'c:/Users/delma/OneDrive/Área de Trabalho/delmar-vendeseucarro/src/pages/Ads.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the state with a static constant
content = content.replace(
  /const \[fipeData, setFipeData\] = useState\(\{ marcas: \[\], modelos: \{\}, precos: \{\} \}\);/g,
  "const fipeData = { marcas: ['Toyota', 'Volkswagen', 'Ford', 'Honda', 'Hyundai', 'Nissan', 'Chevrolet', 'Kia', 'Mercedes-Benz', 'BMW', 'Audi', 'Peugeot', 'Jeep', 'Renault', 'Fiat', 'Mitsubishi'] };"
);

// Remove the fetch effect
content = content.replace(/useEffect\(\(\) => \{\n\s*fetch\('\/fipeData\.json'\)[\s\S]*?\}\);\n\s*\}, \[\]\);/g, '');

fs.writeFileSync(file, content);
console.log('Ads.jsx fixed');
