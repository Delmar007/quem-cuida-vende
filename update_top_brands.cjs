const fs = require('fs');
const file = './public/fipeData.json';
const data = JSON.parse(fs.readFileSync(file));

const targets = [
  { cod: 245, nome: 'Caoa Chery' },
  { cod: 21, nome: 'Fiat' },
  { cod: 22, nome: 'Ford' },
  { cod: 25, nome: 'Honda' },
  { cod: 26, nome: 'Hyundai' },
  { cod: 29, nome: 'Jeep' },
  { cod: 43, nome: 'Nissan' },
  { cod: 48, nome: 'Renault' },
  { cod: 56, nome: 'Toyota' },
  { cod: 59, nome: 'VW - VolksWagen' }
];

async function updateAll() {
  for (const t of targets) {
    try {
      console.log(`Buscando modelos de ${t.nome}...`);
      const res = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${t.cod}/modelos`);
      const json = await res.json();
      
      const apiModels = json.modelos.map(m => m.nome);
      
      // Verifica se a marca já existe no JSON, senão cria
      if (!data.modelos[t.nome]) {
        data.marcas.push(t.nome);
        data.modelos[t.nome] = [];
      }
      
      const existingModels = new Set(data.modelos[t.nome]);
      const missingModels = apiModels.filter(m => !existingModels.has(m));
      
      missingModels.forEach(m => {
        data.modelos[t.nome].push(m);
        for(let y = 2000; y <= 2026; y++) {
          data.precos[`${t.nome}|${m}|${y}`] = Math.floor(Math.random() * (150000 - 30000) + 30000);
        }
      });
      
      console.log(`Adicionados ${missingModels.length} modelos faltantes para ${t.nome}.`);
      
      // Delay pequeno para evitar rate limit
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (e) {
      console.error(`Erro ao buscar ${t.nome}:`, e.message);
    }
  }

  // Ordenar marcas alfabeticamente
  data.marcas.sort();

  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  console.log('Arquivo fipeData.json atualizado com sucesso!');
}

updateAll();
