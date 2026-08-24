import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiRequest, getStoredUser } from "../lib/authApi";
import { getOpportunityApplicationTarget } from "../modules/applicant/jobApplicationRouting";
import { getSavedVacancies, removeSavedVacancy, upsertSavedVacancy } from "../modules/applicant/savedVacancies";

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
const dbkuDivisionCodes = {
  "Bahagian Audit Dalaman": "AUD",
  "Bahagian Projek Khas & Fasiliti Awam": "SPF",
  "Bahagian Hal Ehwal Undang-Undang": "LAW",
  "Bahagian Penguatkuasaan dan Keselamatan": "ENS",
  "Bahagian Pelesenan": "LES",
  "Bahagian Pengurusan Sumber Manusia": "HRM",
  "Bahagian Pentadbiran": "ADM",
  "Bahagian Transformasi dan Inovasi": "CTS",
  "Bahagian Kewangan": "FIN",
  "Bahagian Penilaian dan Pencukaian": "VAL",
  "Bahagian Teknologi Maklumat": "ICT",
  "Bahagian Kesihatan Persekitaran": "ENV",
  "Bahagian Perhubungan Awam": "PRD",
  "Bahagian Pembangunan & Perkhidmatan": "CDS",
  "Bahagian Pembangunan Sumber": "IRD",
  "Bahagian Landskap": "LNP",
  "Bahagian Kontrak dan Perolehan": "COP",
  "Bahagian Geoinformasi dan Pengurusan Hartanah": "GPM",
  "Bahagian Penyelenggaraan Infrastruktur": "IMT",
  "Bahagian Bangunan": "BLG",
  "Bahagian Projek Kejuruteraan": "ENG",
  "Bahagian Mekanikal dan Elektrikal": "MNE",
};
const divisionLabel = (division) => {
  const code = dbkuDivisionCodes[division];
  return code ? `${division} (${code})` : division;
};
const salaryLabel = (job) =>
  job.minimum_salary || job.maximum_salary
    ? `RM ${job.minimum_salary || "—"} - ${job.maximum_salary || "—"}`
    : "Rujuk dokumen rasmi";
const toOpportunity = (job) => ({
  ...job,
  organization: job.department,
  department: divisionLabel(job.division) || job.department,
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

export function JobMarketplaceContent({ actionTarget = "/login", embedded = false, vacancyType: vacancyTypeProp } = {}) {
  const [searchParams] = useSearchParams();
  const vacancyType = vacancyTypeProp || (searchParams.get("type") === "internship" ? "internship" : "job");
  const isInternshipPage = vacancyType === "internship";
  const [opportunities, setOpportunities] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [extraFilter, setExtraFilter] = useState("all");
  const [savedVacancies, setSavedVacancies] = useState([]);
  const [saveNotice, setSaveNotice] = useState("");
  const employmentFilter = isInternshipPage
    ? extraFilter === "Latihan Industri" ? extraFilter : "all"
    : ["Tetap", "Kontrak"].includes(extraFilter) ? extraFilter : "all";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const user = useMemo(() => getStoredUser(), []);
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
  useEffect(() => {
    setSavedVacancies(getSavedVacancies(user));
  }, [user]);
  const filteredOpportunities = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return opportunities.filter((job) =>
      (!keyword || `${job.title} ${job.department} ${job.division} ${job.summary}`.toLowerCase().includes(keyword)) &&
      (employmentFilter === "all" || job.employment_type === employmentFilter),
    ).map(toOpportunity);
  }, [employmentFilter, opportunities, search]);
  const selectedOpportunity = useMemo(
    () => filteredOpportunities.find((item) => item.id === selectedId) ?? filteredOpportunities[0] ?? null,
    [filteredOpportunities, selectedId],
  );
  const hasActiveFilter = Boolean(search.trim()) || employmentFilter !== "all";
  const emptyStateTitle = opportunities.length
    ? isInternshipPage
      ? "Tiada peluang latihan industri yang sepadan"
      : "Tiada jawatan yang sepadan"
    : isInternshipPage
      ? "Tiada peluang latihan industri disiarkan buat masa ini"
      : "Tiada jawatan kosong disiarkan buat masa ini";
  const emptyStateMessage = opportunities.length && hasActiveFilter
    ? "Sila ubah kata kunci carian atau pilihan tapisan untuk melihat peluang lain."
    : "";
  useEffect(() => {
    setSaveNotice("");
  }, [selectedOpportunity?.id]);
  const selectedOpportunitySaved = selectedOpportunity
    ? savedVacancies.some((item) => item.id === selectedOpportunity.id)
    : false;
  const applicationTarget = getOpportunityApplicationTarget(selectedOpportunity, { actionTarget });
  const handleSaveToggle = () => {
    if (!selectedOpportunity) return;

    if (!user) {
      setSaveNotice("Sila log masuk untuk menyimpan jawatan.");
      return;
    }

    const nextSavedVacancies = selectedOpportunitySaved
      ? removeSavedVacancy(user, selectedOpportunity.id)
      : upsertSavedVacancy(user, selectedOpportunity);
    setSavedVacancies(nextSavedVacancies);
    setSaveNotice(selectedOpportunitySaved ? "Jawatan dikeluarkan daripada senarai simpan." : "Jawatan disimpan.");
  };
  return (
      <main className={`market-shell market-reference-shell ${embedded ? "applicant-market-shell" : ""}`}>
        <section className="market-search-panel" aria-label="Cari peluang">
          <strong className="market-search-label">Cari Pekerjaan</strong>
          <label>
            <Icon>search</Icon>
            <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Cari mengikut jawatan, kata kunci atau jabatan" />
          </label>
          <button type="button" onClick={() => setSelectedId(filteredOpportunities[0]?.id ?? null)}>
            Cari
          </button>
          <select className="market-extra-filter" aria-label="Taraf jawatan" value={extraFilter} onChange={(event) => setExtraFilter(event.target.value)}>
            <option value="all">Taraf jawatan</option>
            {isInternshipPage ? (
              <option value="Latihan Industri">Latihan Industri</option>
            ) : <>
              <option value="Tetap">Tetap</option>
              <option value="Kontrak">Kontrak</option>
            </>}
          </select>
        </section>

        <p className="market-vacancy-count"><strong>{filteredOpportunities.length}</strong> {isInternshipPage ? "Peluang Latihan Industri" : "Kekosongan Jawatan"}</p>
        {loading || error || !filteredOpportunities.length ? (
          <section className="market-empty-state" id="jobs" aria-live="polite">
            <span className="market-empty-icon" aria-hidden="true">
              <Icon>{isInternshipPage ? "school" : "work"}</Icon>
            </span>
            <h2>{loading ? "Memuatkan senarai peluang" : error ? "Senarai tidak dapat dimuatkan" : emptyStateTitle}</h2>
            {loading || error || emptyStateMessage ? (
              <p>{loading ? "Sila tunggu sebentar sementara maklumat dimuatkan." : error || emptyStateMessage}</p>
            ) : null}
          </section>
        ) : (
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
            ) : null}

            <div className="market-detail-body">
              <h2>{selectedOpportunity.title}</h2>
              <div className="market-detail-department">
                {selectedOpportunity.organization || "Dewan Bandaraya Kuching Utara"}
              </div>

              <div className="market-detail-meta">
                <span>
                  <Icon>work</Icon>
                  Taraf jawatan: {selectedOpportunity.type}
                </span>
                <span>
                  <Icon>apartment</Icon>
                  Bahagian: {selectedOpportunity.department}
                </span>
                <span>
                  <Icon>location_on</Icon>
                  {selectedOpportunity.location}
                </span>
                <span>
                  <Icon>event</Icon>
                  Tarikh tutup: {selectedOpportunity.closing}
                </span>
              </div>

              <div className="market-detail-document">
                <span>Untuk mengetahui lebih lanjut, sila klik di sini:</span>
                {selectedOpportunity.official_document && (
                  <a
                    href={selectedOpportunity.official_document_view_url || selectedOpportunity.official_document}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Muat turun dokumen
                  </a>
                )}
              </div>

              <div className="market-detail-actions">
                <Link to={applicationTarget}>Mohon Sekarang</Link>
                <button
                  type="button"
                  className={selectedOpportunitySaved ? "saved" : ""}
                  onClick={handleSaveToggle}
                >
                  <Icon>{selectedOpportunitySaved ? "bookmark_added" : "bookmark"}</Icon>
                  {selectedOpportunitySaved ? "Disimpan" : "Simpan"}
                </button>
              </div>
              {saveNotice ? <p className="market-save-notice">{saveNotice}</p> : null}
            </div>
            </> : (
              <div className="market-detail-body">
                <h2>Tiada jawatan dipilih</h2>
                <p>Pilih jawatan daripada senarai untuk melihat butiran.</p>
              </div>
            )}
          </aside>
        </section>
        )}
      </main>
  );
}

export default function JobMarketplacePage() {
  const [searchParams] = useSearchParams();
  const isInternshipPage = searchParams.get("type") === "internship";

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
            <Link to="/internships">Latihan Industri</Link>
          </div>

          <div className="market-nav-actions">
            <Link to="/login">Log Masuk</Link>
            <Link to="/register" className="market-register-link">Daftar Akaun</Link>
          </div>
        </nav>
      </header>

      <JobMarketplaceContent />
    </div>
  );
}
