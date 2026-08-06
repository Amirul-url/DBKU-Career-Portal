import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiRequest, fetchAuthenticatedBlob } from "../lib/authApi";

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
const fileNameFromUrl = (url) => {
  const fallback = "Dokumen rasmi DBKU.pdf";
  if (!url) return fallback;

  try {
    const pathname = new URL(url, window.location.origin).pathname;
    return decodeURIComponent(pathname.split("/").pop() || fallback);
  } catch {
    return fallback;
  }
};
const normalizedDocumentName = (name) =>
  (name || "Dokumen rasmi DBKU.pdf")
    .replace(/_[a-z0-9]{7,}(?=\.[^.]+$)/i, "")
    .replaceAll("_", " ");
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

export default function LandingPage() {
  const [searchParams] = useSearchParams();
  const documentBlobUrls = useRef([]);
  const vacancyType = searchParams.get("type") === "internship" ? "internship" : "job";
  const isInternshipPage = vacancyType === "internship";
  const [opportunities, setOpportunities] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
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
  useEffect(() => () => {
    documentBlobUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);
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
  const handleDocumentOpen = async (event) => {
    const documentUrl = selectedOpportunity?.official_document_view_url || selectedOpportunity?.official_document;
    if (!documentUrl) return;

    event.preventDefault();

    try {
      const blob = await fetchAuthenticatedBlob(documentUrl);
      const documentName = normalizedDocumentName(selectedOpportunity?.official_document_name || fileNameFromUrl(documentUrl));
      const pdfBlob = blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
      const objectUrl = URL.createObjectURL(pdfBlob);
      const previousTitle = document.title;
      documentBlobUrls.current.push(objectUrl);
      const printFrame = document.createElement("iframe");
      printFrame.title = documentName;
      printFrame.style.cssText = "position:fixed;width:0;height:0;border:0;visibility:hidden;";
      let isCleanedUp = false;
      const cleanup = () => {
        if (isCleanedUp) return;
        isCleanedUp = true;
        document.title = previousTitle;
        URL.revokeObjectURL(objectUrl);
        documentBlobUrls.current = documentBlobUrls.current.filter((url) => url !== objectUrl);
        printFrame.remove();
      };
      printFrame.addEventListener("load", () => {
        window.setTimeout(() => {
          const frameWindow = printFrame.contentWindow;
          if (!frameWindow) return cleanup();
          document.title = documentName;
          window.addEventListener("afterprint", cleanup, { once: true });
          frameWindow.addEventListener("afterprint", cleanup, { once: true });
          frameWindow.focus();
          frameWindow.print();
          window.setTimeout(() => {
            document.title = previousTitle;
          }, 0);
        }, 600);
      }, { once: true });
      document.body.appendChild(printFrame);
      printFrame.src = objectUrl;
    } catch {
      window.alert("Dokumen tidak dapat dimuatkan. Sila cuba lagi.");
    }
  };

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

      <main className="market-shell market-reference-shell">
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
              <div className="market-detail-department">
                <Icon>apartment</Icon>
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
                    onClick={handleDocumentOpen}
                    rel="noreferrer"
                  >
                    Muat turun dokumen
                  </a>
                )}
              </div>

              <div className="market-detail-actions">
                <Link to="/login">Mohon Sekarang</Link>
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
