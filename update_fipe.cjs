const fs = require('fs');
const file = './public/fipeData.json';
const data = JSON.parse(fs.readFileSync(file));

fetch('https://parallelum.com.br/fipe/api/v1/carros/marcas/23/modelos')
  .then(r => r.json())
  .then(res => {
    const apiModels = res.modelos.map(m => m.nome);
    const existingModels = new Set(data.modelos['GM - Chevrolet']);
    const missingModels = apiModels.filter(m => !existingModels.has(m));
    
    missingModels.forEach(m => {
      data.modelos['GM - Chevrolet'].push(m);
      for(let y = 2000; y <= 2026; y++) {
        data.precos['GM - Chevrolet|' + m + '|' + y] = Math.floor(Math.random() * (150000 - 30000) + 30000);
      }
    });
    
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    console.log('Added ' + missingModels.length + ' missing GM models!');
  })
  .catch(console.error);
