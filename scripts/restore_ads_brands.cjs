const fs = require('fs');
const file = 'c:/Users/delma/OneDrive/Área de Trabalho/delmar-vendeseucarro/src/pages/Ads.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `const fipeData = { marcas: ['Toyota', 'Volkswagen', 'Ford', 'Honda', 'Hyundai', 'Nissan', 'Chevrolet', 'Kia', 'Mercedes-Benz', 'BMW', 'Audi', 'Peugeot', 'Jeep', 'Renault', 'Fiat', 'Mitsubishi'] };`;

const newStr = `const [fipeData, setFipeData] = useState({ marcas: [] });

  useEffect(() => {
    fetch('https://parallelum.com.br/fipe/api/v1/carros/marcas')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data)) {
          setFipeData({ marcas: data.map(m => m.nome) });
        }
      })
      .catch(err => console.error('Erro ao buscar marcas FIPE:', err));
  }, []);`;

content = content.replace(targetStr, newStr);

fs.writeFileSync(file, content);
console.log('Ads.jsx brands restored via API');
