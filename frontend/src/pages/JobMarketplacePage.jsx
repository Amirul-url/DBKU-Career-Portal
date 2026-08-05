import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
      <span className="market-card-logo">
        <img src="/logo-dbku.png" alt="Logo DBKU" />
      </span>
      <span className="market-job-main">
        <strong className="market-job-title">{opportunity.title}</strong>
        <span className="market-job-dept">{opportunity.department}</span>
        <span className="market-job-location">{opportunity.location}</span>
        <span className="market-job-type">{opportunity.type}, Waktu bekerja biasa</span>
        <small className="market-job-posted">{opportunity.posted}</small>
      </span>
    </button>
  );
}

export default function LandingPage() {
  const [searchParams] = useSearchParams();
  const vacancyType = searchParams.get("type") === "internship" ? "internship" : "job";
  const isInternshipPage = vacancyType === "internship";
  const [opportunities, setOpportunities] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [extraFilter, setExtraFilter] = useState("all");
  const employmentFilter = isInternshipPage
    ? extraFilter === "Latihan Industri" ? extraFilter : "all"
    : ["Tetap", "Kontrak"].includes(extraFilter) ? extraFilter : "all";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    apiRequest(`/jobs/?type=${vacancyType}`)
      .then((data) => {
        const jobs = Array.isArray(data) ? data : data.results || [];
        setOpportunities(jobs);
        setSelectedId(jobs[0]?.id ?? null);
      })
      .catch(() => setError("Senarai jawatan tidak dapat dimuatkan buat masa ini."))
      .finally(() => setLoading(false));
  }, [vacancyType]);
  const filteredOpportunities = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const locationKeyword = locationSearch.trim().toLowerCase();
    return opportunities.filter((job) =>
      (!keyword || `${job.title} ${job.department} ${job.division} ${job.summary}`.toLowerCase().includes(keyword)) &&
      (!locationKeyword || (job.location || "").toLowerCase().includes(locationKeyword)) &&
      (employmentFilter === "all" || job.employment_type === employmentFilter),
    ).map(toOpportunity);
  }, [employmentFilter, locationSearch, opportunities, search]);
  const selectedOpportunity = useMemo(
    () => filteredOpportunities.find((item) => item.id === selectedId) ?? filteredOpportunities[0] ?? null,
    [filteredOpportunities, selectedId],
  );

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
            <Link className={isInternshipPage ? "" : "active"} to="/jobs">Kerja Kosong</Link>
            <Link className={isInternshipPage ? "active" : ""} to="/jobs?type=internship">Latihan Industri</Link>
          </div>

          <div className="market-nav-actions">
            <Link to="/login">Log Masuk</Link>
            <Link to="/register" className="market-register-link">Daftar Akaun</Link>
          </div>
        </nav>
      </header>

      <main className="market-shell market-reference-shell">
        <section className="market-search-panel" aria-label="Cari peluang">
          <strong className="market-search-label">Cari Pekerjaan</strong>
          <label>
            <Icon>search</Icon>
            <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Cari mengikut jawatan, kata kunci atau jabatan" />
          </label>
          <label>
            <Icon>location_on</Icon>
            <input value={locationSearch} onChange={(event) => setLocationSearch(event.target.value)} type="search" placeholder="Lokasi atau unit kerja" />
          </label>
          <button type="button" onClick={() => setSelectedId(filteredOpportunities[0]?.id ?? null)}>
            Cari
          </button>
          <select className="market-extra-filter" aria-label="Jenis lantikan" value={extraFilter} onChange={(event) => setExtraFilter(event.target.value)}>
            <option value="all">Jenis lantikan</option>
            {isInternshipPage ? (
              <option value="Latihan Industri">Latihan Industri</option>
            ) : <>
              <option value="Tetap">Tetap</option>
              <option value="Kontrak">Kontrak</option>
            </>}
          </select>
        </section>

        <p className="market-vacancy-count"><strong>{filteredOpportunities.length}</strong> {isInternshipPage ? "Peluang Latihan Industri" : "Kekosongan Jawatan"}</p>
        <section className="market-layout" id="jobs">
          <section className="market-results" aria-labelledby="results-title">
            <div className="market-results-head">
              <div>
                <h2 id="results-title">Senarai jawatan</h2>
                <p>Pilih satu jawatan untuk melihat butiran penuh.</p>
              </div>
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
