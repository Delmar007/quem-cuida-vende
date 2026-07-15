const fs = require('fs');
const path = require('path');
const https = require('https');

const fipeDataPath = path.join(__dirname, 'public', 'fipeData.json');
const logosDir = path.join(__dirname, 'public', 'logos');

if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

const fipeData = JSON.parse(fs.readFileSync(fipeDataPath, 'utf8'));

const downloadImage = (url, filepath) => {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }, (response) => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(filepath);
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
         downloadImage(response.headers.location, filepath).then(resolve);
      } else {
        resolve(false);
      }
    }).on('error', () => {
      resolve(false);
    });
  });
};

const getSlug = (marca) => {
  let m = marca.toLowerCase();
  if (m === 'gm - chevrolet') return 'chevrolet';
  if (m === 'vw - volkswagen') return 'volkswagen';
  if (m === 'caoa chery') return 'chery';
  if (m === 'kia motors') return 'kia';
  return m.replace(/ /g, '-');
};

const getDomain = (slug) => {
  if (slug === 'volkswagen') return 'vw.com';
  if (slug === 'fiat') return 'fiat.com';
  if (slug === 'ford') return 'ford.com';
  if (slug === 'chevrolet') return 'chevrolet.com';
  return `${slug.replace(/-/g, '')}.com`;
};

async function run() {
  console.log('Iniciando o download das logos...');
  let count = 0;
  for (const marca of fipeData.marcas) {
    const slug = getSlug(marca);
    const filePath = path.join(logosDir, `${marca}.png`); // Guardamos com o nome exato da FIPE para facilitar no React
    
    // Tenta carlogos.org
    let success = await downloadImage(`https://www.carlogos.org/car-logos/${slug}-logo.png`, filePath);
    
    // Fallback para clearbit
    if (!success) {
       success = await downloadImage(`https://logo.clearbit.com/${getDomain(slug)}`, filePath);
    }
    
    if (success) {
      console.log(`[OK] Logo baixada: ${marca}`);
      count++;
    } else {
      console.log(`[ERRO] Não foi possível encontrar a logo: ${marca}`);
    }
  }
  console.log(`Finalizado! ${count} de ${fipeData.marcas.length} logos importadas com sucesso.`);
}

run();
