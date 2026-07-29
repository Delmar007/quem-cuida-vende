import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'Inter, sans-serif', color: '#333', lineHeight: '1.8' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '10px', color: '#111' }}>Política de Privacidade</h1>
      <p style={{ color: '#888', marginBottom: '40px' }}>Última atualização: julho de 2026</p>

      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.3rem', color: '#1a1a2e' }}>1. Informações que coletamos</h2>
        <p>Quando você utiliza nosso site, podemos coletar as seguintes informações:</p>
        <ul>
          <li>Nome e endereço de e-mail (quando você faz login com o Google)</li>
          <li>Fotos e informações dos anúncios que você publica</li>
          <li>Número de WhatsApp, quando fornecido voluntariamente</li>
          <li>Dados de acesso e navegação (cookies e logs de uso)</li>
        </ul>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.3rem', color: '#1a1a2e' }}>2. Como usamos suas informações</h2>
        <p>As informações coletadas são usadas exclusivamente para:</p>
        <ul>
          <li>Permitir o cadastro e gerenciamento dos seus anúncios</li>
          <li>Exibir seus anúncios para outros usuários da plataforma</li>
          <li>Entrar em contato com você sobre seus anúncios, quando necessário</li>
          <li>Melhorar a experiência de uso da plataforma</li>
        </ul>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.3rem', color: '#1a1a2e' }}>3. Compartilhamento de dados</h2>
        <p>
          Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais.
          Seus dados podem ser compartilhados apenas quando exigido por lei ou autoridade competente.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.3rem', color: '#1a1a2e' }}>4. Login com Google</h2>
        <p>
          Utilizamos o serviço de autenticação do Google (Google OAuth 2.0). Ao fazer login com o Google,
          recebemos apenas seu nome e e-mail, conforme as permissões que você autoriza.
          Não temos acesso à sua senha do Google. Para saber como o Google gerencia seus dados,
          acesse a <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>Política de Privacidade do Google</a>.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.3rem', color: '#1a1a2e' }}>5. Segurança</h2>
        <p>
          Seus dados são armazenados de forma segura utilizando a plataforma Supabase,
          com criptografia e controles de acesso. Tomamos medidas razoáveis para proteger
          suas informações contra acesso não autorizado.
        </p>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.3rem', color: '#1a1a2e' }}>6. Seus direitos</h2>
        <p>Você tem o direito de:</p>
        <ul>
          <li>Solicitar a exclusão dos seus dados a qualquer momento</li>
          <li>Editar ou remover seus anúncios publicados</li>
          <li>Entrar em contato conosco para quaisquer dúvidas sobre privacidade</li>
        </ul>
      </section>

      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '1.3rem', color: '#1a1a2e' }}>7. Contato</h2>
        <p>
          Para dúvidas sobre esta política, entre em contato pelo WhatsApp ou pelo formulário do site.
        </p>
      </section>

      <p style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', fontSize: '0.9rem', color: '#666' }}>
        Esta política se aplica ao site <strong>Quem Cuida Vende</strong> e à plataforma <strong>Equipe Personal Car</strong>,
        operados por Delmar de Oliveira Neto, com sede em Santa Catarina, Brasil.
      </p>
    </div>
  );
}
