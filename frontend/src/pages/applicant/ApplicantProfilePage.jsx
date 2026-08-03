import { useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { clearAuthSession, getStoredUser } from "../../lib/authApi";
import { Icon } from "./ApplicantAuthShared";

const sidebarNavItems = [
  { icon: "stars", label: "Match Jobs", to: "/jobs" },
  { icon: "search", label: "Search Jobs", to: "/jobs" },
  { icon: "work_history", label: "My Jobs", href: "#applications" },
  { icon: "person", label: "Profile", to: "/profile" },
  { icon: "more_horiz", label: "More", href: "#more" },
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

function ProfileTopbar({ user }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login");
  };

  return (
    <header className="profile-topbar">
      <nav className="profile-topbar-inner" aria-label="Navigasi pemohon">
        <Link className="profile-brand" to="/">
          <span className="brand-mark">
            <img src="/logo-dbku.png" alt="Logo DBKU" />
          </span>
          <span translate="no">DBKU Career Portal</span>
        </Link>

        <div className="profile-actions">
          <span className="profile-user-chip">{user?.full_name?.charAt(0) || user?.email?.charAt(0) || "P"}</span>
          <button type="button" className="profile-icon-button" aria-label="Notifikasi">
            <Icon>notifications</Icon>
          </button>
          <button type="button" className="profile-logout-button" onClick={handleLogout}>
            Log Keluar
          </button>
        </div>
      </nav>
    </header>
  );
}

function ProfileSidebar({ user }) {
  return (
    <aside className="profile-sidebar" aria-label="Navigasi pemohon">
      <div className="profile-sidebar-head">
        <span className="profile-user-chip">{user?.full_name?.charAt(0) || user?.email?.charAt(0) || "P"}</span>
        <span>
          <strong>{user?.full_name || user?.first_name || "Pemohon DBKU"}</strong>
          <small>{user?.email || "Akaun pemohon"}</small>
        </span>
      </div>

      <nav className="profile-main-nav">
        {sidebarNavItems.map((item) => (
          item.to ? (
            <NavLink to={item.to} className={({ isActive }) => (isActive ? "active" : undefined)} key={item.label}>
              <span className="profile-section-icon">
                <Icon>{item.icon}</Icon>
              </span>
              <strong>{item.label}</strong>
            </NavLink>
          ) : (
            <a href={item.href} key={item.label}>
              <span className="profile-section-icon">
                <Icon>{item.icon}</Icon>
              </span>
              <strong>{item.label}</strong>
            </a>
          )
        ))}
      </nav>

      <button type="button" className="profile-outline-button">
        <Icon>download</Icon>
        Muat Turun Resume
      </button>
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
          Edit
        </button>
      </header>
      {children}
    </section>
  );
}

export default function ApplicantProfilePage() {
  const navigate = useNavigate();
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
    <div className="applicant-profile-page">
      <ProfileTopbar user={user} />
      <main className="profile-shell">
        <div className="profile-heading">
          <span>Profil Pemohon</span>
          <h1>Profil Saya</h1>
          <p>Lengkapkan profil sebelum menghantar permohonan kerja kosong atau latihan industri DBKU.</p>
        </div>

        <div className="profile-layout">
          <ProfileSidebar user={user} />

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
  );
}
