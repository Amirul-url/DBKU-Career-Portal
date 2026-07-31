import { Link } from "react-router-dom";

const stats = [
  ["5", "Kekosongan Aktif"],
  ["23", "Jabatan DBKU"],
  ["2", "Program Latihan Industri"],
  ["100%", "Permohonan Dalam Talian"],
];

const services = [
  {
    icon: "manage_search",
    title: "Cari Peluang",
    text: "Semak kerja kosong dan latihan industri mengikut jabatan, bidang, atau jenis lantikan.",
  },
  {
    icon: "assignment",
    title: "Mohon Secara Dalam Talian",
    text: "Daftar profil pemohon dan hantar permohonan tanpa perlu borang manual.",
  },
  {
    icon: "track_changes",
    title: "Semak Status",
    text: "Pantau perkembangan permohonan melalui akaun pemohon yang berdaftar.",
  },
];

const latestRoles = [
  ["Pegawai Perancang Bandar Kanan", "Jabatan Perancangan", "Sepenuh Masa"],
  ["Pelatih Sokongan Teknologi Maklumat", "Perkhidmatan Digital", "Latihan Industri"],
  ["Kerani Akaun", "Perbendaharaan", "Kontrak"],
];

const steps = [
  ["01", "Cari jawatan", "Gunakan carian dan filter untuk lihat peluang yang sesuai."],
  ["02", "Daftar akaun", "Lengkapkan profil pemohon menggunakan maklumat yang tepat."],
  ["03", "Hantar permohonan", "Semak syarat jawatan dan teruskan permohonan secara online."],
  ["04", "Pantau status", "Log masuk untuk melihat kemas kini permohonan daripada DBKU."],
];

function Icon({ children, className = "" }) {
  return (
    <span
      className={`material-symbols-outlined notranslate ${className}`}
      aria-hidden="true"
      translate="no"
    >
      {children}
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="landing-page corporate-landing-page">
      <header className="top-app-bar">
        <nav className="nav-inner" aria-label="Navigasi utama">
          <Link className="brand" to="/">
            <span className="brand-mark">
              <img src="/logo-dbku.png" alt="Logo DBKU" />
            </span>
            <span translate="no">DBKU Career Portal</span>
          </Link>

          <div className="nav-links">
            <Link className="active" to="/">Utama</Link>
            <Link to="/jobs">Kerja Kosong</Link>
            <Link to="/jobs">Latihan Industri</Link>
          </div>

          <div className="market-nav-actions">
            <Link to="/login">Log Masuk</Link>
            <Link to="/register" className="market-register-link">Daftar Akaun</Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="corporate-hero">
          <div className="corporate-hero-inner">
            <div className="corporate-hero-copy">
              <span>Portal Rasmi Kerjaya DBKU</span>
              <h1>Peluang kerjaya DBKU bermula di sini.</h1>
              <p>
                Semak kerja kosong dan latihan industri, daftar akaun pemohon, dan
                pantau status permohonan secara dalam talian.
              </p>
              <div className="corporate-hero-actions">
                <Link className="corporate-primary-action" to="/jobs">
                  Lihat Kekosongan
                </Link>
                <Link className="corporate-secondary-action" to="/register">
                  Daftar Akaun
                </Link>
              </div>
            </div>

            <div className="corporate-hero-media">
              <img src="/banner landing page.jpg" alt="Bangunan Dewan Bandaraya Kuching Utara" />
            </div>
          </div>
        </section>

        <section className="corporate-section">
          <div className="corporate-section-heading">
            <span>Fungsi Portal</span>
            <h2>Satu tempat untuk urusan permohonan kerjaya DBKU.</h2>
          </div>
          <div className="corporate-service-grid">
            {services.map((service) => (
              <article key={service.title}>
                <span>
                  <Icon>{service.icon}</Icon>
                </span>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="corporate-content-grid">
          <div className="corporate-latest">
            <div className="corporate-section-heading compact">
              <span>Peluang Terkini</span>
              <h2>Jawatan yang sedang dibuka</h2>
            </div>
            {latestRoles.map(([title, department, type]) => (
              <Link to="/jobs" key={title}>
                <span>
                  <Icon>{type === "Latihan Industri" ? "school" : "work"}</Icon>
                </span>
                <div>
                  <strong>{title}</strong>
                  <small>{department}</small>
                </div>
                <em>{type}</em>
              </Link>
            ))}
          </div>

          <div className="corporate-process">
            <div className="corporate-section-heading compact">
              <span>Aliran Pemohon</span>
              <h2>Cara menggunakan portal</h2>
            </div>
            {steps.map(([number, title, text]) => (
              <div key={number}>
                <strong>{number}</strong>
                <span>
                  <b>{title}</b>
                  <small>{text}</small>
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="corporate-stats" aria-label="Ringkasan portal">
          {stats.map(([value, label]) => (
            <div key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </section>

        <section className="corporate-cta">
          <div>
            <h2>Bersedia untuk memohon?</h2>
            <p>Lihat senarai kekosongan dan latihan industri yang tersedia di DBKU.</p>
          </div>
          <Link to="/jobs">
            Lihat Semua Peluang
            <Icon>arrow_forward</Icon>
          </Link>
        </section>
      </main>

      <footer className="corporate-footer">
        <div>
          <strong translate="no">DBKU Career Portal</strong>
          <span>© 2026 Dewan Bandaraya Kuching Utara (DBKU). Semua hak cipta terpelihara.</span>
        </div>
        <nav aria-label="Pautan footer">
          <a href="#dasar-privasi">Dasar Privasi</a>
          <a href="#terma">Terma Penggunaan</a>
          <a href="#hubungi">Hubungi Kami</a>
        </nav>
      </footer>
    </div>
  );
}
