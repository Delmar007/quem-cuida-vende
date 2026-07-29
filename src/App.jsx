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
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ComprarAnuncios from './pages/ComprarAnuncios';
import PagamentoSucesso from './pages/PagamentoSucesso';
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
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/privacidade" element={<PrivacyPolicy />} />
          <Route path="/comprar-anuncios" element={<ComprarAnuncios />} />
          <Route path="/pagamento-sucesso" element={<PagamentoSucesso />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
