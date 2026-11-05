import { ShieldCheck } from 'lucide-react';


export function Header() {
  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--accent-color)',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}
        >
          <ShieldCheck size={18} />
          <span>Sistema de Gestão Clínica e Faturamento Hospitalar</span>
        </div>
      </div>

      <a
        href="https://www.linkedin.com/in/luiz-felipe-de-almeida-pimentel/"
        target="_blank"
        rel="noopener noreferrer"
        className="user-profile user-profile-link"
        title="Acessar perfil de Luiz Felipe no LinkedIn"
      >
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Luiz Felipe</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Analista de Sistemas</p>
        </div>
        <img
          src="/imagens/profile.jpg"
          alt="Foto de Perfil de Luiz Felipe"
          className="user-avatar"
        />
      </a>
    </header>
  );
}
