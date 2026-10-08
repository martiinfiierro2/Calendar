import Icon from '../../shared/Icon';
import '../../componentes/login.css';

export default function AuthPanel({ icon = 'mail', eyebrow, title, children }) {
  return (
    <div className="login-app">
      <div className="login-decoracion login-decoracion-uno" />
      <div className="login-decoracion login-decoracion-dos" />
      <section className="login-panel auth-panel">
        <div className="login-marca">
          <div className="login-logo">C</div>
          <div><span>Planifica mejor</span><h1>Calendar</h1></div>
        </div>
        <div className="auth-card">
          <span className="auth-card-icon"><Icon name={icon} size={28} /></span>
          <div className="login-copy">
            <span className="login-eyebrow">{eyebrow}</span>
            <h2>{title}</h2>
          </div>
          {children}
        </div>
      </section>
    </div>
  );
}
