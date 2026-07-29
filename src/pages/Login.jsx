import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simula o login e envia o construtor/admin para o painel
    navigate('/admin');
  };

  return (
    <div className="login-container">
      <div className="login-background"></div>
      
      <div className="login-content flex-center">
        <div className="premium-card login-card">
          <div className="login-header">
            <div className="login-icon-wrapper">
              <ShieldCheck size={48} color="var(--primary-color)" />
            </div>
            <h1 className="page-title">Acesso Restrito</h1>
            <p className="login-subtitle">Faça login para começar a construir o site</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label className="form-label">E-mail de Acesso</label>
              <div className="input-with-icon">
                <Mail className="input-icon" size={20} />
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="admin@quemcuidavende.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-huge login-submit">
              Entrar no Painel <ArrowRight size={20} style={{ marginLeft: '8px' }} />
            </button>
          </form>
          
          <div className="login-footer">
            <p>Esqueceu a senha? <a href="#" className="login-link">Recuperar acesso</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
