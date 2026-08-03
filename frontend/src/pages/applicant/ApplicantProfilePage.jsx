import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { clearAuthSession, getStoredUser } from "../../lib/authApi";
import { Icon } from "./ApplicantAuthShared";

const sidebarNavItems = [
  { icon: "stars", label: "Padanan Kerja", to: "/jobs" },
  { icon: "search", label: "Cari Kerja", to: "/jobs" },
  { icon: "work_history", label: "Kerja Saya", href: "#applications" },
  { icon: "person", label: "Profil", to: "/profile" },
  { icon: "more_horiz", label: "Lagi", href: "#more" },
];

const emptyProfileCards = [
  {
    icon: "tune",
    title: "Keutamaan Kerja",
    body: "Tetapkan jawatan, bidang, lokasi dan jenis pekerjaan yang anda minati.",
  },
  {
    icon: "history",
    title: "Pengalaman",
    body: "Tambah pengalaman kerja, latihan industri atau projek berkaitan.",
  },
  {
    icon: "school",
    title: "Pendidikan",
    body: "Masukkan kelayakan akademik supaya permohonan lebih lengkap.",
  },
  {
    icon: "psychology",
    title: "Kemahiran",
    body: "Senaraikan kemahiran teknikal, bahasa dan sijil profesional anda.",
  },
];

function ProfileContentHeader({ user }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login");
  };

  return (
    <header className="profile-content-header">
      <div>
        <p>Selamat datang</p>
        <strong>{user?.full_name || user?.first_name || "Pemohon DBKU"}</strong>
      </div>
      <div className="profile-actions">
          <span className="profile-user-chip">{user?.full_name?.charAt(0) || user?.email?.charAt(0) || "P"}</span>
          <button type="button" className="profile-icon-button" aria-label="Notifikasi">
            <Icon>notifications</Icon>
          </button>
          <button type="button" className="profile-logout-button" onClick={handleLogout}>
            Log Keluar
          </button>
      </div>
    </header>
  );
}

function ProfileSidebar({ isOpen, onToggle }) {
  return (
    <aside className={`profile-sidebar ${isOpen ? "open" : "collapsed"}`} aria-label="Navigasi pemohon">
      <div className="profile-sidebar-head">
        {isOpen ? (
          <Link className="profile-sidebar-brand" to="/">
            <span className="brand-mark">
              <img src="/logo-dbku.png" alt="Logo DBKU" />
            </span>
            <span>
              <strong>Portal Kerjaya DBKU</strong>
              <small>Portal Pemohon</small>
            </span>
          </Link>
        ) : null}
        <button
          type="button"
          className="profile-sidebar-toggle"
          aria-label={isOpen ? "Kecilkan sidebar" : "Buka sidebar"}
          onClick={onToggle}
          title={isOpen ? "Kecilkan sidebar" : "Buka sidebar"}
        >
          <Icon>menu</Icon>
        </button>
      </div>

      <nav className="profile-main-nav">
        {sidebarNavItems.map((item) => (
          item.to ? (
            <NavLink
              to={item.to}
              className={({ isActive }) => (isActive ? "active" : undefined)}
              key={item.label}
              title={!isOpen ? item.label : undefined}
            >
              <span className="profile-section-icon">
                <Icon>{item.icon}</Icon>
              </span>
              {isOpen ? <strong>{item.label}</strong> : <span className="sr-only">{item.label}</span>}
            </NavLink>
          ) : (
            <a href={item.href} key={item.label} title={!isOpen ? item.label : undefined}>
              <span className="profile-section-icon">
                <Icon>{item.icon}</Icon>
              </span>
              {isOpen ? <strong>{item.label}</strong> : <span className="sr-only">{item.label}</span>}
            </a>
          )
        ))}
      </nav>
    </aside>
  );
}

function ProfileCard({ children, id, title }) {
  return (
    <section className="profile-content-card" id={id}>
      <header>
        <h2>{title}</h2>
        <button type="button" className="profile-edit-button">
          <Icon>edit</Icon>
          Kemaskini
        </button>
      </header>
      {children}
    </section>
  );
}

export default function ApplicantProfilePage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const user = getStoredUser();
  const displayName = user?.full_name || user?.first_name || "Pemohon DBKU";
  const email = user?.email || "Belum dikemaskini";

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true, state: { message: "Sila log masuk untuk melihat profil anda." } });
    }
  }, [navigate, user]);

  if (!user) {
    return null;
  }

  return (
    <div className={`applicant-profile-page ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      <ProfileSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((current) => !current)} />
      <div className="profile-main-area">
        <ProfileContentHeader user={user} />
        <main className="profile-shell">
        <div className="profile-heading">
          <h1>Profil Saya</h1>
          <p>Lengkapkan profil sebelum menghantar permohonan kerja kosong atau latihan industri DBKU.</p>
        </div>

        <div className="profile-layout">
          <div className="profile-content">
            <ProfileCard id="profile-section-1" title="Maklumat Peribadi">
              <div className="profile-personal-row">
                <div className="profile-avatar" aria-hidden="true">
                  {displayName.charAt(0)}
                </div>
                <div>
                  <h3>{displayName}</h3>
                  <p>{email}</p>
                  <span className="profile-status-pill">Akaun pemohon aktif</span>
                </div>
              </div>
            </ProfileCard>

            {emptyProfileCards.map((card, index) => (
              <ProfileCard id={`profile-section-${index + 2}`} title={card.title} key={card.title}>
                <div className="profile-empty-row">
                  <span>
                    <Icon>{card.icon}</Icon>
                  </span>
                  <p>{card.body}</p>
                </div>
              </ProfileCard>
            ))}
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
