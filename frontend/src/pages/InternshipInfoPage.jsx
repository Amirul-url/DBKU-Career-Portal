import { Link } from "react-router-dom";

const fieldOptions = [
  "Kejuruteraan Awam",
  "Kejuruteraan Mekanikal",
  "Kejuruteraan Elektrik atau Elektronik",
  "Teknologi Maklumat / Sistem",
  "Perakaunan / Kewangan",
  "Pengurusan Sumber Manusia / Pentadbiran",
  "Komunikasi Korporat / Perhubungan Awam / Khidmat Pelanggan",
  "Perancangan bandar, landskap, bangunan atau bidang berkaitan DBKU",
];

const requiredDocuments = [
  "Surat rasmi daripada institusi / kolej / universiti",
  "Transkrip akademik terkini",
  "Resume",
  "Salinan kad pengenalan dan kad pelajar untuk tujuan pengesahan",
  "Dokumen sokongan lain sekiranya berkaitan",
];

function Icon({ children, className = "" }) {
  return (
    <span className={`material-symbols-outlined notranslate ${className}`} aria-hidden="true" translate="no">
      {children}
    </span>
  );
}

export default function InternshipInfoPage() {
  return (
    <div className="internship-info-page">
      <header className="top-app-bar">
        <nav className="nav-inner" aria-label="Navigasi utama">
          <Link className="brand" to="/">
            <span className="brand-mark">
              <img src="/logo-dbku.png" alt="Logo DBKU" />
            </span>
            <span>Portal Kerjaya DBKU</span>
          </Link>

          <div className="nav-links">
            <Link to="/">Laman Utama</Link>
            <Link to="/jobs">Kerja Kosong</Link>
            <Link className="active" to="/internships">Latihan Industri</Link>
          </div>

          <div className="market-nav-actions">
            <Link to="/login">Log Masuk</Link>
            <Link to="/register" className="market-register-link">Daftar Akaun</Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="internship-hero" aria-label="Peluang latihan industri">
          <div className="internship-hero-grid" aria-hidden="true">
            <img src="/discussion.jpg" alt="" />
            <img src="/banner landing page.jpg" alt="" />
            <img src="/senior urban planner.jpg" alt="" />
          </div>
          <div className="internship-hero-overlay">
            <h1>Peluang Latihan Industri</h1>
          </div>
        </section>

        <section className="internship-content-shell">
          <div className="internship-intro">
            <span>Latihan Industri DBKU</span>
            <h2>Peluang pembelajaran dalam persekitaran perkhidmatan bandar raya.</h2>
            <p>
              DBKU membuka peluang kepada pelajar institusi pengajian tinggi untuk menjalani latihan industri mengikut
              keperluan bahagian, bidang pengajian dan kekosongan semasa.
            </p>
          </div>

          <article className="internship-copy-card">
            <h3>Peluang Latihan Industri dengan Dewan Bandaraya Kuching Utara</h3>
            <p>
              Kami mengalu-alukan pelajar yang bermotivasi tinggi, berdisiplin dan komited untuk memohon latihan
              industri di jabatan atau bahagian berkaitan dalam DBKU.
            </p>

            <h4>Kelayakan dan syarat asas</h4>
            <ol>
              <li>Warganegara Malaysia.</li>
              <li>Dilindungi insurans oleh institusi / kolej / universiti masing-masing.</li>
              <li>
                Sedang mengikuti pengajian di institusi yang diiktiraf dan bidang pengajian berkaitan dengan fungsi DBKU.
              </li>
            </ol>

            <h4>Bidang pengajian yang boleh dipertimbangkan</h4>
            <div className="internship-field-grid">
              {fieldOptions.map((field) => (
                <span key={field}>
                  <Icon>check_circle</Icon>
                  {field}
                </span>
              ))}
            </div>

            <h4>Logistik</h4>
            <p>
              Pelajar bertanggungjawab mengurus penginapan dan pengangkutan sendiri sepanjang tempoh latihan industri.
            </p>

            <h4>Permohonan</h4>
            <p>
              Sila kemukakan permohonan latihan industri kepada Bahagian Pengurusan Sumber Manusia DBKU atau melalui
              saluran rasmi yang dimaklumkan dari semasa ke semasa.
            </p>

            <h4>Dokumen yang diperlukan</h4>
            <ol>
              {requiredDocuments.map((document) => (
                <li key={document}>{document}</li>
              ))}
            </ol>

            <div className="internship-cta-panel">
              <div>
                <strong>Bersedia untuk hantar permohonan?</strong>
                <p>Daftar akaun pemohon dan lengkapkan profil sebelum membuat permohonan latihan industri.</p>
              </div>
              <Link to="/register">
                Daftar Akaun
                <Icon>arrow_forward</Icon>
              </Link>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
