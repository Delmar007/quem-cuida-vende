const fs = require('fs');
['src/pages/BuyCar.jsx', 'src/pages/SellCar.jsx'].forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replaceAll("<div style={{ display: 'flex', gap: '16px' }}>", '<div className="form-row">');
  fs.writeFileSync(file, content);
});
