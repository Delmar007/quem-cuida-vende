import { useState, useEffect } from 'react';
import { FIPE_MARCAS } from '../data/fipeMarcas';

// Cache no LocalStorage com expiração mensal
const getCached = (key) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    const { data, expiry } = JSON.parse(item);
    if (new Date().getTime() > expiry) { localStorage.removeItem(key); return null; }
    return data;
  } catch { return null; }
};

const setCache = (key, data) => {
  try {
    const expiry = new Date().getTime() + 30 * 24 * 60 * 60 * 1000; // 30 dias
    localStorage.setItem(key, JSON.stringify({ data, expiry }));
  } catch (e) { console.warn('Cache error', e); }
};

export function useFipe(tipo = 'cars') {
  // Tipo normalizado
  const type = tipo === 'carros' ? 'cars' : tipo;

  // Marcas vêm DIRETAMENTE do arquivo estático — zero API call, zero falha
  const [marcas] = useState(FIPE_MARCAS);
  const [modelos, setModelos] = useState([]);
  const [anos, setAnos] = useState([]);
  const [loadingModelos, setLoadingModelos] = useState(false);
  const [loadingAnos, setLoadingAnos] = useState(false);
  const [error, setError] = useState(null);

  // Nível 2: Modelos (API V2 com cache local)
  const fetchModelos = (codigoMarca) => {
    if (!codigoMarca) return;
    setModelos([]);
    const cacheKey = `fipe_v2_modelos_${type}_${codigoMarca}`;
    const cached = getCached(cacheKey);
    if (cached) { setModelos(cached); return; }

    setLoadingModelos(true);
    fetch(`https://fipe.parallelum.com.br/api/v2/${type}/brands/${codigoMarca}/models`)
      .then(r => { if (!r.ok) throw new Error('Erro modelos'); return r.json(); })
      .then(data => {
        const mapped = (data || []).map(d => ({ codigo: String(d.code), nome: d.name }));
        setModelos(mapped);
        setCache(cacheKey, mapped);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoadingModelos(false));
  };

  // Nível 3: Anos (API V2 com cache local)
  const fetchAnos = (codigoMarca, codigoModelo) => {
    if (!codigoMarca || !codigoModelo) return;
    setAnos([]);
    const cacheKey = `fipe_v2_anos_${type}_${codigoMarca}_${codigoModelo}`;
    const cached = getCached(cacheKey);
    if (cached) { setAnos(cached); return; }

    setLoadingAnos(true);
    fetch(`https://fipe.parallelum.com.br/api/v2/${type}/brands/${codigoMarca}/models/${codigoModelo}/years`)
      .then(r => { if (!r.ok) throw new Error('Erro anos'); return r.json(); })
      .then(data => {
        const mapped = (data || []).map(d => ({ codigo: String(d.code), nome: d.name }));
        setAnos(mapped);
        setCache(cacheKey, mapped);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoadingAnos(false));
  };

  // Nível 4: Preço Final (API V2 com cache local)
  const fetchPreco = async (codigoMarca, codigoModelo, codigoAno) => {
    if (!codigoMarca || !codigoModelo || !codigoAno) return null;
    const cacheKey = `fipe_v2_preco_${type}_${codigoMarca}_${codigoModelo}_${codigoAno}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
      const r = await fetch(`https://fipe.parallelum.com.br/api/v2/${type}/brands/${codigoMarca}/models/${codigoModelo}/years/${codigoAno}`);
      if (!r.ok) throw new Error('Erro preço');
      const data = await r.json();
      const mapped = { Valor: data.price };
      setCache(cacheKey, mapped);
      return mapped;
    } catch (err) { setError(err.message); return null; }
  };

  return {
    marcas,
    modelos,
    anos,
    fetchModelos,
    fetchAnos,
    fetchPreco,
    loadingMarcas: false,   // marcas são instantâneas (estáticas)
    loadingModelos,
    loadingAnos,
    error
  };
}
