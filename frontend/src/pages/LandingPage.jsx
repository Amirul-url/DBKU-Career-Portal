import { Link } from "react-router-dom";

const highlights = [
  ["work", "Kerja Kosong", "Jawatan tetap, kontrak, dan peluang profesional DBKU."],
  ["school", "Internship", "Penempatan latihan industri untuk pelajar berkaitan."],
  ["track_changes", "Status Online", "Semak perkembangan permohonan melalui portal."],
];

const stats = [
  ["5", "Openings"],
  ["23", "Departments"],
  ["2", "Internships"],
  ["98%", "Satisfaction"],
];

function Icon({ children, className = "" }) {
  return <span className={`material-symbols-outlined ${className}`}>{children}</span>;
}

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="top-app-bar">
        <nav className="nav-inner" aria-label="Main navigation">
          <Link className="brand" to="/">
            <span className="brand-mark">
              <img src="/logo-dbku.png" alt="DBKU logo" />
            </span>
            <span>DBKU Career Portal</span>
          </Link>

          <div className="nav-links">
            <Link className="active" to="/">Home</Link>
            <Link to="/jobs">Jobs</Link>
            <Link to="/jobs">Internships</Link>
          </div>

          <div className="market-nav-actions">
            <Link to="/login">Login</Link>
            <Link to="/register" className="market-register-link">Register</Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <span className="market-eyebrow">DBKU Job and Internship Portal</span>
            <h1>Mulakan kerjaya anda bersama DBKU.</h1>
            <p>
              Portal rasmi untuk mencari kerja kosong dan internship di Kuching North City
              Commission. Semak peluang terkini, daftar profil, dan hantar permohonan secara
              online.
            </p>
            <div className="landing-hero-actions">
              <Link className="landing-primary-action" to="/jobs">
                <Icon>manage_search</Icon>
                Browse Jobs
              </Link>
              <Link className="landing-secondary-action" to="/register">
                Register Applicant
              </Link>
            </div>
          </div>

          <div className="landing-hero-media">
            <img src="/discussion.jpg" alt="DBKU career discussion" />
            <div className="landing-floating-card">
              <Icon>apartment</Icon>
              <div>
                <strong>Urban Planning</strong>
                <span>Open intake closes in 18 days</span>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-stats" aria-label="Portal summary">
          {stats.map(([value, label]) => (
            <div key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </section>

        <section className="landing-highlights" aria-label="Portal features">
          {highlights.map(([icon, title, text]) => (
            <article key={title}>
              <span>
                <Icon>{icon}</Icon>
              </span>
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          ))}
        </section>

        <section className="landing-cta">
          <div>
            <h2>Ready to apply?</h2>
            <p>
              Terus ke halaman carian untuk lihat senarai kekosongan dan internship yang tersedia.
            </p>
          </div>
          <Link to="/jobs">
            View Opportunities
            <Icon>arrow_forward</Icon>
          </Link>
        </section>
      </main>
    </div>
  );
}
