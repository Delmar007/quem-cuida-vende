const fs = require('fs');
const file = 'c:/Users/delma/OneDrive/Área de Trabalho/delmar-vendeseucarro/src/pages/SellCar.jsx';
let content = fs.readFileSync(file, 'utf8');

// Fix garbled characters
content = content.replace(/Fabricaǜo/g, 'Fabricação');
content = content.replace(/Cǽmbio/g, 'Câmbio');
content = content.replace(/Automǭtico/g, 'Automático');
content = content.replace(/Hidramǭtico/g, 'Hidramático');
content = content.replace(/informaes/g, 'informações');
content = content.replace(/Preo FIPE/g, 'Preço FIPE');
content = content.replace(/Preo Pedido/g, 'Preço Pedido');

// Remove Ano do Modelo and clean up Ano select
content = content.replace(/<div className="form-group" style=\{\{ flex: 1 \}\}>\s*<label className="form-label">Ano do Modelo.*?<\/select>\s*<\/div>/gs, '');

// Simplify handleAnoChange to not touch anoModelo
content = content.replace(
  /setFormData\(prev => \(\{ \.\.\.prev, ano: yearNumber, anoModelo: yearNumber, precoFipe: '' \}\)\);/g,
  `setFormData(prev => ({ ...prev, ano: yearNumber, precoFipe: '' }));`
);

// Clear anoModelo in handleMarcaChange and handleModeloChange
// We don't need to clear it since it's removed, but it's safe to leave or change to just not have it.
content = content.replace(/anoModelo: '', /g, '');

// Fix Preço FIPE React removeChild error by wrapping text nodes in <span>
content = content.replace(
  /R\$ \{Number\(formData\.precoFipe\)\.toLocaleString\('pt-BR', \{minimumFractionDigits: 2\}\)\}/g,
  `<span>R$ {Number(formData.precoFipe).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>`
);

content = content.replace(
  /Preencha as 3 informa\es \(Marca, Modelo e Ano\) para ver o FIPE\./g,
  `<span>Preencha as 3 informações (Marca, Modelo e Ano) para ver o FIPE.</span>`
);
content = content.replace(
  /Preencha as 3 informações \(Marca, Modelo e Ano\) para ver o FIPE\./g,
  `<span>Preencha as 3 informações (Marca, Modelo e Ano) para ver o FIPE.</span>`
);

content = content.replace(
  />\s*Buscando FIPE\.\.\.\s*</g,
  `><span>Buscando FIPE...</span><`
);

fs.writeFileSync(file, content);
console.log('Script concluded successfully');
