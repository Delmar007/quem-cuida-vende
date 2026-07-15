import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import BuyCar from './pages/BuyCar';
import SellCar from './pages/SellCar';
import Ads from './pages/Ads';
import Admin from './pages/Admin';
import AdminFranqueado from './pages/AdminFranqueado';
import Institutional from './pages/Institutional';
import ClientPortal from './pages/ClientPortal';
import LojistaPro from './pages/LojistaPro';
import LojistaCadastro from './pages/LojistaCadastro';
import LojistaPagamento from './pages/LojistaPagamento';
import ScrollToTop from './components/ScrollToTop';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="app-wrapper">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/comprar" element={<BuyCar />} />
          <Route path="/vender" element={<SellCar />} />
          <Route path="/anuncios" element={<Ads />} />
          <Route path="/perfil" element={<ClientPortal />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin-franqueado" element={<AdminFranqueado />} />
          <Route path="/lojistas" element={<LojistaPro />} />
          <Route path="/lojistas/cadastro" element={<LojistaCadastro />} />
          <Route path="/lojistas/pagamento" element={<LojistaPagamento />} />
          <Route path="/institucional/:page" element={<Institutional />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
