const fs = require('fs');
const file = 'c:/Users/delma/OneDrive/Área de Trabalho/delmar-vendeseucarro/src/pages/SellCar.jsx';
let content = fs.readFileSync(file, 'utf8');

// Update handleAnoChange to parse fuel type
content = content.replace(
  /const handleAnoChange = \(e\) => \{[\s\S]*?setFormData\(prev => \(\{ \.\.\.prev, ano: yearNumber, precoFipe: '' \}\)\);\n  \};/g,
  `const handleAnoChange = (e) => {
    const codigo = e.target.value;
    const anoNome = fipeAnos.find(a => String(a.codigo) === String(codigo))?.nome || '';
    
    // Parse year and fuel from anoNome (e.g., "2015 Gasolina")
    const parts = anoNome.split(' ');
    const yearNumber = parts[0];
    const combustivelType = parts.slice(1).join(' ') || '';

    setSelectedAnoCode(codigo);
    setFormData(prev => ({ ...prev, ano: yearNumber, combustivel: combustivelType, precoFipe: '' }));
  };`
);

// Remove the combustivel select block from UI
content = content.replace(
  /<div className="form-group" style=\{\{ flex: 1 \}\}>\s*<label className="form-label">Combust.*?<\/div>\s*<\/div>/g,
  `</div>\n            </div>`
);

fs.writeFileSync(file, content);
console.log('Script concluded successfully');
