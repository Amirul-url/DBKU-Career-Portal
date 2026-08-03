import { useState } from "react";
import { Link } from "react-router-dom";

export function ApplicantAuthNav() {
  return (
    <header className="top-app-bar">
      <nav className="nav-inner" aria-label="Navigasi utama">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <img src="/logo-dbku.png" alt="Logo DBKU" />
          </span>
          <span translate="no">DBKU Career Portal</span>
        </Link>

        <div className="nav-links">
          <Link className="active" to="/">Laman Utama</Link>
          <Link to="/jobs">Kerja Kosong</Link>
          <Link to="/jobs">Latihan Industri</Link>
        </div>

        <div className="market-nav-actions">
          <Link to="/login">Log Masuk</Link>
          <Link to="/register" className="market-register-link">Daftar Akaun</Link>
        </div>
      </nav>
    </header>
  );
}

export function Icon({ children }) {
  return (
    <span
      className="material-symbols-outlined notranslate"
      aria-hidden="true"
      translate="no"
    >
      {children}
    </span>
  );
}

export function AuthField({ icon, label, required = false, children }) {
  return (
    <label className="split-field">
      <span>
        {label}
        {required ? <strong aria-hidden="true"> *</strong> : null}
      </span>
      <div className="split-input">
        <Icon>{icon}</Icon>
        {children}
      </div>
    </label>
  );
}

export function PasswordField({
  icon = "lock",
  label,
  placeholder,
  autoComplete,
  required = false,
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <AuthField icon={icon} label={label} required={required}>
      <input
        type={isVisible ? "text" : "password"}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
      />
      <button
        className="split-password-toggle"
        type="button"
        aria-label={isVisible ? "Sembunyikan kata laluan" : "Tunjuk kata laluan"}
        aria-pressed={isVisible}
        onClick={() => setIsVisible((current) => !current)}
      >
        <Icon>{isVisible ? "visibility" : "visibility_off"}</Icon>
      </button>
    </AuthField>
  );
}

function PromoPanel({ mode }) {
  const isLogin = mode === "login";

  return (
    <aside className="split-promo-panel" aria-label="Pertukaran akaun">
      <span className="split-promo-pill">{isLogin ? "DBKU Career Portal" : "Selamat Kembali"}</span>
      <h2>{isLogin ? "Baru di portal ini?" : "Sudah mempunyai akaun?"}</h2>
      <p>
        {isLogin
          ? "Daftar akaun untuk memohon kerja kosong dan latihan industri DBKU secara dalam talian."
          : "Log masuk semula untuk menyambung permohonan dan membaca makluman terkini."}
      </p>
      <Link to={isLogin ? "/register" : "/login"} className="split-ghost-action">
        {isLogin ? "Daftar Sekarang" : "Log Masuk"}
      </Link>
      <em>{isLogin ? "Semua permohonan bermula dengan profil yang lengkap." : "Maklumat yang tepat membantu proses semakan berjalan lancar."}</em>
      <div className="split-promo-circle" aria-hidden="true" />
    </aside>
  );
}

export function ApplicantAuthLayout({ mode, children }) {
  return (
    <div className={`auth-page auth-split-page ${mode}-mode`}>
      <ApplicantAuthNav />
      <main className="auth-split-shell">
        <div className="auth-split-card">
          {children}
          <PromoPanel mode={mode} />
        </div>
      </main>
    </div>
  );
}
