const fs = require('fs');
const file = 'c:/Users/delma/OneDrive/Área de Trabalho/delmar-vendeseucarro/src/pages/SellCar.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. State
content = content.replace('const [fipeData, setFipeData] = useState({ marcas: [], modelos: {}, precos: {} });', 
  `const [fipeMarcas, setFipeMarcas] = useState([]);
  const [fipeModelos, setFipeModelos] = useState([]);
  const [fipeAnos, setFipeAnos] = useState([]);
  const [selectedMarcaCode, setSelectedMarcaCode] = useState('');
  const [selectedModeloCode, setSelectedModeloCode] = useState('');
  const [selectedAnoCode, setSelectedAnoCode] = useState('');`);

// 2. useEffects
content = content.replace(
  /fetch\('\/fipeData\.json'\)[\s\S]*?setFormData\(prev => \(\{ \.\.\.prev, precoFipe: '' \}\)\);\n    \}\n  \}, \[formData\.marca, formData\.modelo, formData\.ano, fipeData\]\);/,
  `fetch('https://parallelum.com.br/fipe/api/v1/carros/marcas')
      .then(res => res.json())
      .then(data => setFipeMarcas(data))
      .catch(err => console.error("Erro ao buscar marcas FIPE:", err));
  }, []);

  useEffect(() => {
    if (selectedMarcaCode) {
      fetch(\`https://parallelum.com.br/fipe/api/v1/carros/marcas/\${selectedMarcaCode}/modelos\`)
        .then(res => res.json())
        .then(data => setFipeModelos(data.modelos || []))
        .catch(err => console.error("Erro ao buscar modelos FIPE:", err));
    } else {
      setFipeModelos([]);
    }
  }, [selectedMarcaCode]);

  useEffect(() => {
    if (selectedMarcaCode && selectedModeloCode) {
      fetch(\`https://parallelum.com.br/fipe/api/v1/carros/marcas/\${selectedMarcaCode}/modelos/\${selectedModeloCode}/anos\`)
        .then(res => res.json())
        .then(data => setFipeAnos(data || []))
        .catch(err => console.error("Erro ao buscar anos FIPE:", err));
    } else {
      setFipeAnos([]);
    }
  }, [selectedMarcaCode, selectedModeloCode]);

  useEffect(() => {
    if (selectedMarcaCode && selectedModeloCode && selectedAnoCode) {
      fetch(\`https://parallelum.com.br/fipe/api/v1/carros/marcas/\${selectedMarcaCode}/modelos/\${selectedModeloCode}/anos/\${selectedAnoCode}\`)
        .then(res => res.json())
        .then(data => {
           if (data && data.Valor) {
             const numericValue = parseFloat(data.Valor.replace('R$', '').replace(/\\./g, '').replace(',', '.').trim());
             setFormData(prev => ({ ...prev, precoFipe: numericValue }));
           }
        })
        .catch(err => console.error("Erro ao buscar valor FIPE:", err));
    } else {
      setFormData(prev => ({ ...prev, precoFipe: '' }));
    }
  }, [selectedMarcaCode, selectedModeloCode, selectedAnoCode]);

  const handleMarcaChange = (e) => {
    const codigo = e.target.value;
    const marcaNome = fipeMarcas.find(m => String(m.codigo) === String(codigo))?.nome || '';
    setSelectedMarcaCode(codigo);
    setFormData(prev => ({ ...prev, marca: marcaNome, modelo: '', ano: '', anoModelo: '', precoFipe: '' }));
    setSelectedModeloCode('');
    setSelectedAnoCode('');
  };

  const handleModeloChange = (e) => {
    const codigo = e.target.value;
    const modeloNome = fipeModelos.find(m => String(m.codigo) === String(codigo))?.nome || '';
    setSelectedModeloCode(codigo);
    setFormData(prev => ({ ...prev, modelo: modeloNome, ano: '', anoModelo: '', precoFipe: '' }));
    setSelectedAnoCode('');
  };

  const handleAnoChange = (e) => {
    const codigo = e.target.value;
    const anoNome = fipeAnos.find(a => String(a.codigo) === String(codigo))?.nome || '';
    const yearNumber = anoNome.substring(0, 4);
    setSelectedAnoCode(codigo);
    setFormData(prev => ({ ...prev, ano: yearNumber, anoModelo: yearNumber, precoFipe: '' }));
  };`
);

// 3. handleChange
content = content.replace(
  /const handleChange = \(e\) => \{[\s\S]*?if \(name === 'marca'\) \{[\s\S]*?\}\n  \};/,
  `const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };`
);

// 4. Remove modelosParaMarca and anosDisponiveis
content = content.replace(
  /const modelosParaMarca = formData\.marca \? \(fipeData\.modelos\[formData\.marca\] \|\| \[\]\) : \[\];[\s\S]*?const anosDisponiveis = useMemo\(\(\) => \{[\s\S]*?\}, \[formData\.marca, formData\.modelo, fipeData\.precos\]\);/,
  ''
);

// 5. Replace HTML Selects
content = content.replace(
  /<select name="marca" value=\{formData\.marca\} onChange=\{handleChange\} className="form-control" required>\s*<option value="">Selecione\.\.\.<\/option>\s*\{fipeData\.marcas\.map\(m => <option key=\{m\} value=\{m\}>\{m\}<\/option>\)\}\s*<\/select>/g,
  `<select name="marca" value={selectedMarcaCode} onChange={handleMarcaChange} className="form-control" required>
                <option value="">Selecione...</option>
                {fipeMarcas.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
              </select>`
);

content = content.replace(
  /<select name="modelo" value=\{formData\.modelo\} onChange=\{handleChange\} className="form-control" required>\s*<option value="">Selecione\.\.\.<\/option>\s*\{modelosParaMarca\.map\(m => <option key=\{m\} value=\{m\}>\{m\}<\/option>\)\}\s*<\/select>/g,
  `<select name="modelo" value={selectedModeloCode} onChange={handleModeloChange} className="form-control" required disabled={!selectedMarcaCode}>
                <option value="">Selecione...</option>
                {fipeModelos.map(m => <option key={m.codigo} value={m.codigo}>{m.nome}</option>)}
              </select>`
);

content = content.replace(
  /<select name="ano" value=\{formData\.ano\} onChange=\{handleChange\} className="form-control" required>\s*<option value=""><\/option>\s*\{anosDisponiveis\.map\(a => <option key=\{a\} value=\{a\}>\{a\}<\/option>\)\}\s*<\/select>/g,
  `<select name="ano" value={selectedAnoCode} onChange={handleAnoChange} className="form-control" required disabled={!selectedModeloCode}>
                <option value=""></option>
                {fipeAnos.map(a => <option key={a.codigo} value={a.codigo}>{a.nome}</option>)}
              </select>`
);

content = content.replace(
  /<select name="anoModelo" value=\{formData\.anoModelo\} onChange=\{handleChange\} className="form-control" required>\s*<option value=""><\/option>\s*\{anosDisponiveis\.map\(a => <option key=\{a\} value=\{a\}>\{a\}<\/option>\)\}\s*<\/select>/g,
  `<select name="anoModelo" value={selectedAnoCode} onChange={handleAnoChange} className="form-control" required disabled={!selectedModeloCode}>
                <option value=""></option>
                {fipeAnos.map(a => <option key={a.codigo} value={a.codigo}>{a.nome}</option>)}
              </select>`
);

fs.writeFileSync(file, content);
console.log('Script concluded successfully');
