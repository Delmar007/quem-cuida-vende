const fs = require('fs');
const readline = require('readline');

async function processData() {
  const fileStream = fs.createReadStream('tabela-fipe-historico-precos.csv');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const latestData = {}; // key: "marca|modelo|anoModelo", value: { price, anoRef, mesRef }
  const marcasSet = new Set();
  const modelosByMarca = {}; // marca: Set(modelos)

  const ignoredMarcas = new Set(['Wake', 'Walk', 'SHINERAY', 'Matra', 'RELY', 'JINBEI', 'Fyber', 'Fibravan', 'Baby', 'BRM', 'Bugre', 'Cross Lander', 'EFFA', 'Engesa', 'Envemo']);

  let isFirst = true;
  for await (const line of rl) {
    if (isFirst) {
      isFirst = false;
      continue;
    }
    
    // Split by comma. Need to be careful if there are quoted commas, but typical FIPE CSV doesn't have them in 'marca' or 'modelo' usually, or we can just reconstruct 'modelo' if it has commas.
    const parts = line.split(',');
    if (parts.length < 8) continue;
    
    const valor = parseFloat(parts.pop());
    const anoReferencia = parseInt(parts.pop(), 10);
    const mesReferencia = parseInt(parts.pop(), 10);
    const anoModelo = parseInt(parts.pop(), 10);
    
    const marca = parts[2];
    if (ignoredMarcas.has(marca)) continue;
    
    const modelo = parts.slice(3).join(','); // Join remaining parts in case modelo had commas

    const key = `${marca}|${modelo}|${anoModelo}`;
    
    if (!latestData[key] || 
        anoReferencia > latestData[key].anoRef || 
        (anoReferencia === latestData[key].anoRef && mesReferencia > latestData[key].mesRef)) {
      latestData[key] = { price: valor, anoRef: anoReferencia, mesRef: mesReferencia };
    }
    
    marcasSet.add(marca);
    if (!modelosByMarca[marca]) modelosByMarca[marca] = new Set();
    modelosByMarca[marca].add(modelo);
  }

  const result = {
    marcas: Array.from(marcasSet).sort(),
    modelos: {},
    precos: {}
  };
  
  for (const marca of result.marcas) {
    result.modelos[marca] = Array.from(modelosByMarca[marca]).sort();
  }
  
  for (const key in latestData) {
    result.precos[key] = latestData[key].price;
  }
  
  fs.writeFileSync('public/fipeData.json', JSON.stringify(result));
  console.log(`Processed FIPE data successfully! Generated public/fipeData.json with ${result.marcas.length} marcas and ${Object.keys(result.precos).length} prices.`);
}

processData().catch(console.error);
