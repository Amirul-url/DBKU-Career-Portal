import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../lib/authApi";

const dateLabel = (value) =>
  value
    ? new Date(value).toLocaleDateString("ms-MY", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Tidak dinyatakan";
const listItems = (value) =>
  value ? value.split("\n").filter(Boolean) : ["Rujuk dokumen rasmi untuk butiran lanjut."];
const salaryLabel = (job) =>
  job.minimum_salary || job.maximum_salary
    ? `RM ${job.minimum_salary || "—"} - ${job.maximum_salary || "—"}`
    : "Rujuk dokumen rasmi";
const toOpportunity = (job) => ({
  ...job,
  department: job.division || job.department,
  category: job.vacancy_type === "internship" ? "Latihan Industri" : "Jawatan",
  type: job.employment_type || (job.vacancy_type === "internship" ? "Latihan Industri" : "Jawatan"),
  salary: salaryLabel(job),
  closing: dateLabel(job.closing_date),
  posted: `Disiarkan ${dateLabel(job.created_at)}`,
  icon: job.vacancy_type === "internship" ? "school" : "work",
  responsibilities: listItems(job.responsibilities),
  requirements: listItems(job.requirements),
});

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

function OpportunityCard({ opportunity, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`market-job-card ${selected ? "selected" : ""}`}
      onClick={onSelect}
    >
      <span className="market-job-icon">
        <Icon>{opportunity.icon}</Icon>
      </span>
      <span className="market-job-main">
        <span className="market-job-top">
          <strong>{opportunity.title}</strong>
          <small>{opportunity.posted}</small>
        </span>
        <span className="market-job-dept">{opportunity.department}</span>
        <span className="market-job-summary">{opportunity.summary}</span>
        <span className="market-job-meta">
          <span>
            <Icon>work</Icon>
            {opportunity.type}
          </span>
          <span>
            <Icon>payments</Icon>
            {opportunity.salary}
          </span>
          <span>
            <Icon>event</Icon>
            Tutup {opportunity.closing}
          </span>
        </span>
      </span>
      <span className="market-job-badge">{opportunity.category}</span>
    </button>
  );
}

export default function LandingPage() {
  const [opportunities, setOpportunities] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    category: "Semua",
    type: "Semua",
    department: "Semua",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    apiRequest("/jobs/")
      .then((data) => {
        const jobs = Array.isArray(data) ? data : data.results || [];
        setOpportunities(jobs);
        setSelectedId(jobs[0]?.id ?? null);
      })
      .catch(() => setError("Senarai jawatan tidak dapat dimuatkan buat masa ini."))
      .finally(() => setLoading(false));
  }, []);
  const filteredOpportunities = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const locationKeyword = locationSearch.trim().toLowerCase();
    return opportunities.filter((job) =>
      (!keyword || `${job.title} ${job.department} ${job.division} ${job.summary}`.toLowerCase().includes(keyword)) &&
      (!locationKeyword || (job.location || "").toLowerCase().includes(locationKeyword)),
    ).filter((job) =>
      (selectedFilters.category === "Semua" ||
        (selectedFilters.category === "Jawatan" && job.vacancy_type === "job") ||
        (selectedFilters.category === "Latihan Industri" && job.vacancy_type === "internship")) &&
      (selectedFilters.type === "Semua" || job.employment_type === selectedFilters.type) &&
      (selectedFilters.department === "Semua" || (job.division || job.department) === selectedFilters.department),
    ).map(toOpportunity);
  }, [locationSearch, opportunities, search, selectedFilters]);
  const selectedOpportunity = useMemo(
    () => filteredOpportunities.find((item) => item.id === selectedId) ?? filteredOpportunities[0] ?? null,
    [filteredOpportunities, selectedId],
  );
  const jobCount = opportunities.filter((job) => job.vacancy_type === "job").length;
  const internshipCount = opportunities.filter((job) => job.vacancy_type === "internship").length;
  const marketFilters = useMemo(() => [
    ["category", "Jenis Peluang", ["Semua", "Jawatan", "Latihan Industri"]],
    ["type", "Jenis Kerja", ["Semua", ...new Set(opportunities.map((job) => job.employment_type).filter(Boolean))]],
    ["department", "Bahagian", ["Semua", ...new Set(opportunities.map((job) => job.division || job.department).filter(Boolean))]],
  ], [opportunities]);

  return (
    <div className="market-page">
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
            <a className="active" href="#jobs">Kerja Kosong</a>
            <a href="#jobs">Latihan Industri</a>
          </div>

          <div className="market-nav-actions">
            <Link to="/login">Log Masuk</Link>
            <Link to="/register" className="market-register-link">Daftar Akaun</Link>
          </div>
        </nav>
      </header>

      <main className="market-shell">
        <section className="market-intro" aria-labelledby="market-title">
          <div>
            <span className="market-eyebrow">Portal Kerjaya dan Latihan Industri DBKU</span>
            <h1 id="market-title">Cari peluang kerjaya dan latihan industri DBKU.</h1>
            <p>
              Terokai kekosongan semasa, semak syarat jawatan, dan mulakan permohonan
              dalam satu portal rasmi Dewan Bandaraya Kuching Utara.
            </p>
          </div>
          <div className="market-intro-stats" aria-label="Ringkasan portal">
            <span>
              <strong>{jobCount}</strong>
              Kekosongan
            </span>
            <span>
              <strong>{new Set(opportunities.map((job) => job.division || job.department)).size}</strong>
              Bahagian
            </span>
            <span>
              <strong>{internshipCount}</strong>
              Latihan Industri
            </span>
          </div>
        </section>

        <section className="market-search-panel" aria-label="Cari peluang">
          <label>
            <Icon>search</Icon>
            <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Cari mengikut jawatan, kata kunci atau jabatan" />
          </label>
          <label>
            <Icon>location_on</Icon>
            <input value={locationSearch} onChange={(event) => setLocationSearch(event.target.value)} type="search" placeholder="Lokasi atau unit kerja" />
          </label>
          <button type="button" onClick={() => setSelectedId(filteredOpportunities[0]?.id ?? null)}>
            <Icon>manage_search</Icon>
            Cari
          </button>
        </section>

        <section className="market-layout" id="jobs">
          <aside className="market-filters" aria-label="Tapisan">
            <div className="market-panel-title">
              <Icon>tune</Icon>
              <strong>Tapisan</strong>
            </div>

            {marketFilters.map(([key, title, values]) => (
              <div className="market-filter-group" key={key}>
                <h2>{title}</h2>
                {values.map((value) => (
                  <label key={value}>
                    <input
                      type="checkbox"
                      checked={selectedFilters[key] === value}
                      onChange={() => setSelectedFilters((current) => ({ ...current, [key]: value }))}
                    />
                    <span>{value}</span>
                  </label>
                ))}
              </div>
            ))}
          </aside>

          <section className="market-results" aria-labelledby="results-title">
            <div className="market-results-head">
              <div>
                <h2 id="results-title">Peluang Disyorkan</h2>
                <p>Memaparkan {filteredOpportunities.length} kekosongan semasa DBKU</p>
              </div>
              <select aria-label="Susun keputusan" defaultValue="recent">
                <option value="recent">Terkini</option>
                <option value="closing">Tarikh tutup terdekat</option>
                <option value="salary">Julat gaji</option>
              </select>
            </div>

            <div className="market-job-list">
              {loading && <p className="market-empty">Memuatkan jawatan semasa…</p>}
              {error && <p className="market-empty">{error}</p>}
              {!loading && !error && !filteredOpportunities.length && <p className="market-empty">Tiada jawatan yang sepadan.</p>}
              {filteredOpportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  selected={opportunity.id === selectedOpportunity?.id}
                  onSelect={() => setSelectedId(opportunity.id)}
                />
              ))}
            </div>
          </section>

          <aside className="market-detail" aria-label="Butiran peluang dipilih">
            {selectedOpportunity ? <>
            {selectedOpportunity.image ? (
              <img
                src={selectedOpportunity.image}
                alt="Meja kerja perancangan bandar"
                className="market-detail-image"
              />
            ) : (
              <div className="market-detail-icon">
                <Icon>{selectedOpportunity.icon}</Icon>
              </div>
            )}

            <div className="market-detail-body">
              <span className="market-job-badge">{selectedOpportunity.category}</span>
              <h2>{selectedOpportunity.title}</h2>
              <p>{selectedOpportunity.summary}</p>

              <div className="market-detail-meta">
                <span>
                  <Icon>apartment</Icon>
                  {selectedOpportunity.department}
                </span>
                <span>
                  <Icon>location_on</Icon>
                  {selectedOpportunity.location}
                </span>
                <span>
                  <Icon>payments</Icon>
                  {selectedOpportunity.salary}
                </span>
                <span>
                  <Icon>event</Icon>
                  Tarikh tutup: {selectedOpportunity.closing}
                </span>
              </div>

              <div className="market-detail-section">
                <h3>Tanggungjawab</h3>
                <ul>
                  {selectedOpportunity.responsibilities.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="market-detail-section">
                <h3>Syarat Kelayakan</h3>
                <ul>
                  {selectedOpportunity.requirements.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="market-detail-actions">
                <Link to="/login">Mohon Sekarang</Link>
                {selectedOpportunity.official_document && (
                  <a href={selectedOpportunity.official_document} target="_blank" rel="noreferrer">
                    <Icon>download</Icon>
                    Muat turun dokumen
                  </a>
                )}
                <button type="button">
                  <Icon>bookmark</Icon>
                  Simpan
                </button>
              </div>
            </div>
            </> : (
              <div className="market-detail-body">
                <h2>Tiada jawatan dipilih</h2>
                <p>Pilih jawatan daripada senarai untuk melihat butiran.</p>
              </div>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
}
