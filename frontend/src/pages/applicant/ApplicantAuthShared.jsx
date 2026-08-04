import { useState } from "react";
import {
  Bell,
  Brain,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronUp,
  CirclePlus,
  Eye,
  EyeOff,
  FileText,
  Film,
  GraduationCap,
  History,
  Lightbulb,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  Minus,
  MoreHorizontal,
  Pencil,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";

const getActiveClass = ({ isActive }) => (isActive ? "active" : undefined);

const iconMap = {
  add_circle: CirclePlus,
  cancel: X,
  check: Check,
  description: FileText,
  edit: Pencil,
  emoji_objects: Lightbulb,
  expand_less: ChevronUp,
  expand_more: ChevronDown,
  history: History,
  lock: LockKeyhole,
  logout: LogOut,
  mail: Mail,
  menu: Menu,
  more_horiz: MoreHorizontal,
  movie: Film,
  notifications: Bell,
  person: UserRound,
  psychology: Brain,
  remove: Minus,
  save: Save,
  school: GraduationCap,
  search: Search,
  shield: ShieldCheck,
  stars: Sparkles,
  tune: SlidersHorizontal,
  visibility: Eye,
  visibility_off: EyeOff,
  work_history: BriefcaseBusiness,
};

export function ApplicantAuthNav() {
  return (
    <header className="top-app-bar">
      <nav className="nav-inner" aria-label="Navigasi utama">
        <Link className="brand" to="/">
          <span className="brand-mark">
            <img src="/logo-dbku.png" alt="Logo DBKU" />
          </span>
          <span>Portal Kerjaya DBKU</span>
        </Link>

        <div className="nav-links">
          <NavLink to="/" end className={getActiveClass}>Laman Utama</NavLink>
          <NavLink to="/jobs" className={getActiveClass}>Kerja Kosong</NavLink>
          <NavLink to="/jobs" className={getActiveClass}>Latihan Industri</NavLink>
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
  const IconComponent = iconMap[children] || CirclePlus;

  return (
    <span
      className="app-svg-icon material-symbols-outlined notranslate"
      aria-hidden="true"
      translate="no"
    >
      <IconComponent strokeWidth={2.4} />
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
  name,
  fieldName,
  value,
  disabled = false,
  onChange,
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <AuthField icon={icon} label={label} required={required}>
      <input
        type={isVisible ? "text" : "password"}
        name={name}
        data-field={fieldName}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        onChange={onChange}
        required={required}
      />
      <button
        className="split-password-toggle"
        type="button"
        aria-label={isVisible ? "Sembunyikan kata laluan" : "Tunjuk kata laluan"}
        aria-pressed={isVisible}
        disabled={disabled}
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
      <span className="split-promo-pill">{isLogin ? "Portal Kerjaya DBKU" : "Selamat Kembali"}</span>
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
