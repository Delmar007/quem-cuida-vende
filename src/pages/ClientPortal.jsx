import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { maskCPF, validateCPF } from '../utils/masks';
import { supabase } from '../lib/supabase';

export default function ClientPortal() {
  const navigate = useNavigate();
  const [cpfInput, setCpfInput] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userCars, setUserCars] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [userFavorites, setUserFavorites] = useState([]);

  useEffect(() => {
    // Check if already logged in via sessionStorage
    const savedCpf = sessionStorage.getItem('delmar_client_cpf');
    if (savedCpf) {
      setCpfInput(savedCpf);
      loadUserData(savedCpf);
    }
  }, []);

  const loadUserData = async (cpfToLoad) => {
    const cleanToLoad = cpfToLoad.replace(/\D/g, '');
    
    const { data: allCars } = await supabase.from('cars').select('*');
    const { data: allReqs } = await supabase.from('requests').select('*');

    const myCars = (allCars || []).filter(c => (c.cpf || '').replace(/\D/g, '') === cleanToLoad);
    const myReqs = (allReqs || []).filter(r => (r.cpf || '').replace(/\D/g, '') === cleanToLoad);

    const favIds = (() => {
      try { return JSON.parse(localStorage.getItem('delmar_favoritos') || '[]'); } catch { return []; }
    })();
    const myFavs = (allCars || []).filter(c => favIds.includes(c.id));

    setUserCars(myCars);
    setUserRequests(myReqs);
    setUserFavorites(myFavs);
    setIsLoggedIn(true);
    sessionStorage.setItem('delmar_client_cpf', cpfToLoad);
  };

  const removeFavorite = (carId) => {
    try {
      const favs = JSON.parse(localStorage.getItem('delmar_favoritos') || '[]');
      const newFavs = favs.filter(id => id !== carId);
      localStorage.setItem('delmar_favoritos', JSON.stringify(newFavs));
      setUserFavorites(userFavorites.filter(c => c.id !== carId));
    } catch(e) {}
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!validateCPF(cpfInput)) {
      alert('Por favor, digite um CPF válido.');
      return;
    }
    loadUserData(cpfInput);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('delmar_client_cpf');
    setIsLoggedIn(false);
    setCpfInput('');
  };

  if (!isLoggedIn) {
    return (
      <div className="main-content flex-center">
        <div className="box-centered" style={{ maxWidth: '400px', textAlign: 'center' }}>
          <img src="/logo-delmar.png" alt="Delmar Logo" style={{ width: '200px', marginBottom: '20px' }} />
          <h2 style={{ color: 'red', marginBottom: '16px' }}>Área do Cliente</h2>
          <p style={{ marginBottom: '24px', color: '#666' }}>Digite o CPF usado no cadastro para ver e editar seus anúncios e pedidos.</p>
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">Seu CPF</label>
              <input 
                type="text" 
                value={cpfInput} 
                onChange={(e) => setCpfInput(maskCPF(e.target.value))} 
                className="form-control" 
                placeholder="Ex: 000.000.000-00" 
                required 
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>Entrar</button>
          </form>
          <div style={{ marginTop: '20px' }}>
            <Link to="/" style={{ color: 'red', textDecoration: 'none', fontWeight: '600' }}>Voltar para o site</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <nav style={{ backgroundColor: '#fff', borderBottom: '1px solid var(--border)', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/"><img src="/logos/logo_equipe_texto.png" alt="Equipe Personal Car Logo" style={{ height: '40px' }} /></Link>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/anuncios" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: '500' }}>Vitrine</Link>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'red', fontWeight: '700', cursor: 'pointer', fontSize: '1rem' }}>Sair</button>
        </div>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>Meu Painel</h1>
        <p style={{ color: '#666', marginBottom: '40px' }}>CPF: {cpfInput}</p>

        {/* MEUS VEICULOS À VENDA */}
        <section style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.5rem', color: 'red', borderBottom: '2px solid red', paddingBottom: '8px', flex: 1 }}>Meus Veículos à Venda</h2>
            <Link to="/vender" className="btn btn-outline" style={{ marginLeft: '20px', padding: '6px 12px', fontSize: '0.85rem' }}>+ Anunciar Novo</Link>
          </div>
          
          {userCars.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', border: '1px solid #eaeaea', borderRadius: '8px', color: '#999' }}>
              Você não possui nenhum veículo anunciado.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {userCars.map(car => (
                <div key={car.id} style={{ display: 'flex', border: '1px solid #eaeaea', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  {car.imagens && car.imagens[0] ? (
                    <img src={car.imagens[0]} alt="Carro" style={{ width: '200px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '200px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>Sem foto</div>
                  )}
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: '600' }}>{car.marca}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '4px' }}>{car.modelo} {car.ano}</div>
                    <div style={{ color: 'red', fontSize: '1.4rem', fontWeight: '800' }}>
                      {car.venda ? `R$ ${Number(car.venda).toLocaleString('pt-BR')}` : 'Aceita Proposta'}
                    </div>
                  </div>
                  <div style={{ padding: '20px', display: 'flex', alignItems: 'center' }}>
                    <button 
                      onClick={() => navigate(`/vender?edit=${car.id}`)}
                      className="btn btn-primary"
                    >
                      Editar Anúncio
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* MEUS PEDIDOS DE COMPRA */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.5rem', color: 'red', borderBottom: '2px solid red', paddingBottom: '8px', flex: 1 }}>Meus Pedidos de Compra</h2>
            <Link to="/comprar" className="btn btn-outline" style={{ marginLeft: '20px', padding: '6px 12px', fontSize: '0.85rem' }}>+ Fazer Pedido</Link>
          </div>
          
          {userRequests.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', border: '1px solid #eaeaea', borderRadius: '8px', color: '#999' }}>
              Você não possui nenhum pedido de compra ativo.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {userRequests.map(req => (
                <div key={req.id} style={{ display: 'flex', border: '1px solid #eaeaea', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fdf8f5', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div style={{ padding: '20px', flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', color: '#ea580c', fontWeight: '600', marginBottom: '4px' }}>Procurando por:</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#c2410c' }}>{req.marca} {req.modelo}</div>
                    <div style={{ fontSize: '0.95rem', color: '#666', marginTop: '4px' }}>
                      De {req.anoDe} até {req.anoAte} • Até R$ {req.precoAte ? Number(req.precoAte).toLocaleString('pt-BR') : '0,00'}
                    </div>
                  </div>
                  <div style={{ padding: '20px', display: 'flex', alignItems: 'center' }}>
                    <button 
                      onClick={() => navigate(`/comprar?edit=${req.id}`)}
                      className="btn btn-primary"
                    >
                      Editar Pedido
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* MEUS FAVORITOS */}
        <section style={{ marginTop: '40px', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.5rem', color: 'red', borderBottom: '2px solid red', paddingBottom: '8px', flex: 1 }}>Meus Favoritos</h2>
          </div>
          
          {userFavorites.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', border: '1px solid #eaeaea', borderRadius: '8px', color: '#999' }}>
              Você ainda não adicionou nenhum carro aos favoritos.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {userFavorites.map(car => (
                <div key={car.id} style={{ display: 'flex', border: '1px solid #eaeaea', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  {car.imagens && car.imagens[0] ? (
                    <img src={car.imagens[0]} alt="Carro" style={{ width: '200px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '200px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>Sem foto</div>
                  )}
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: '600' }}>{car.marca}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '4px' }}>{car.modelo} {car.ano}</div>
                    <div style={{ color: 'red', fontSize: '1.4rem', fontWeight: '800' }}>
                      {car.venda ? `R$ ${Number(car.venda).toLocaleString('pt-BR')}` : 'Aceita Proposta'}
                    </div>
                  </div>
                  <div style={{ padding: '20px', display: 'flex', alignItems: 'center' }}>
                    <button 
                      onClick={() => removeFavorite(car.id)}
                      className="btn btn-outline"
                      style={{ color: 'red', borderColor: 'red' }}
                    >
                      Excluir Favorito
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
