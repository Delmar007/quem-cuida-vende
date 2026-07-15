const fs = require('fs');
const file = 'c:/Users/delma/OneDrive/Área de Trabalho/delmar-vendeseucarro/src/pages/SellCar.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /if \(modeloNomeUpper\.includes\('AUT'\).*?guessCambio = 'Autom.*?';\n\s*\}/s;

const newBlock = `    if (modeloNomeUpper.includes('DUALOGIC')) {
      guessCambio = 'Dualogic';
    } else if (
      modeloNomeUpper.includes('AUT') || 
      modeloNomeUpper.includes('CVT') || 
      modeloNomeUpper.includes('TIPTRONIC') || 
      modeloNomeUpper.includes('DSG') ||
      modeloNomeUpper.includes('S-TRONIC') ||
      modeloNomeUpper.includes('PDK') ||
      modeloNomeUpper.includes('POWERSHIFT') ||
      modeloNomeUpper.includes('I-MOTION') ||
      modeloNomeUpper.includes('EASYTRONIC') ||
      modeloNomeUpper.includes('EAT6') ||
      modeloNomeUpper.includes('EAT8') ||
      modeloNomeUpper.includes('XTRONIC') ||
      modeloNomeUpper.includes('MULTIDRIVE') ||
      modeloNomeUpper.includes('GSR') ||
      modeloNomeUpper.includes('GEARTRONIC')
    ) {
      guessCambio = 'Automático';
    }`;

if (content.match(regex)) {
  content = content.replace(regex, newBlock);
  fs.writeFileSync(file, content);
  console.log('Script concluded successfully');
} else {
  console.log('Could not find regex match');
}
