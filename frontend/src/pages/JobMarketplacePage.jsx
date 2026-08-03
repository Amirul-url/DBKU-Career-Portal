import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const opportunities = [
  {
    id: "urban-planner",
    title: "Perancang Bandar Kanan",
    department: "Jabatan Perancangan",
    category: "Jawatan",
    type: "Sepenuh Masa",
    salary: "RM 4,500 - 6,200",
    location: "Ibu Pejabat DBKU",
    closing: "18 Ogos 2026",
    posted: "Disiarkan 2 hari lalu",
    icon: "architecture",
    image: "/senior urban planner.jpg",
    summary:
      "Menerajui projek pembangunan bandar strategik yang menyokong Kuching Utara yang mampan dan selesa didiami.",
    responsibilities: [
      "Menyediakan ringkasan perancangan bandar, laporan dan cadangan teknikal.",
      "Menyelaras semakan pembangunan bersama jabatan dalaman dan agensi berkaitan.",
      "Menyokong inisiatif penambahbaikan bandar melalui data perancangan dan input lapangan.",
    ],
    requirements: [
      "Ijazah dalam Perancangan Bandar, Seni Bina, Geografi atau bidang berkaitan.",
      "Minimum 5 tahun pengalaman berkaitan perancangan atau pembangunan perbandaran.",
      "Kemahiran penulisan laporan dan penyelarasan pihak berkepentingan yang baik.",
    ],
  },
  {
    id: "it-support-intern",
    title: "Pelatih Sokongan IT",
    department: "Perkhidmatan Digital",
    category: "Latihan Industri",
    type: "Latihan Industri",
    salary: "Elaun disediakan",
    location: "Unit ICT",
    closing: "25 Ogos 2026",
    posted: "Disiarkan 4 hari lalu",
    icon: "computer",
    summary:
      "Membantu perisian perbandaran, operasi meja bantuan dan dokumentasi aliran kerja digital.",
    responsibilities: [
      "Membantu sokongan tahap pertama untuk pengguna dalaman dan peranti.",
      "Mendokumentasikan isu meja bantuan lazim dan langkah penyelesaian asas.",
      "Menyokong rekod digital, kemas kini inventori dan ujian sistem.",
    ],
    requirements: [
      "Pelajar diploma atau ijazah dalam IT, Sains Komputer atau bidang berkaitan.",
      "Bersedia menjalani latihan industri minimum 3 bulan.",
      "Selesa dengan tugasan asas perisian, perkakasan dan sokongan pengguna.",
    ],
  },
  {
    id: "environmental-officer",
    title: "Pegawai Alam Sekitar",
    department: "Alam Sekitar Bandar",
    category: "Jawatan",
    type: "Tetap",
    salary: "RM 3,200 - 4,800",
    location: "Pejabat Operasi",
    closing: "30 Ogos 2026",
    posted: "Disiarkan 1 minggu lalu",
    icon: "eco",
    summary:
      "Menyelaras protokol pengurusan sisa dan inisiatif kawasan hijau di kawasan DBKU.",
    responsibilities: [
      "Memantau aktiviti perkhidmatan alam sekitar dalam zon bandar yang ditetapkan.",
      "Menyediakan pemerhatian lapangan dan laporan tindakan susulan.",
      "Menyelaras aktiviti kebersihan awam dan inisiatif hijau.",
    ],
    requirements: [
      "Diploma atau ijazah dalam Sains Alam Sekitar atau disiplin berkaitan.",
      "Pengalaman dalam perkhidmatan perbandaran adalah satu kelebihan.",
      "Boleh menjalankan pemeriksaan lapangan dan berkomunikasi dengan komuniti.",
    ],
  },
  {
    id: "accounting-clerk",
    title: "Pembantu Perakaunan",
    department: "Perbendaharaan",
    category: "Jawatan",
    type: "Kontrak",
    salary: "RM 2,000 - 2,800",
    location: "Jabatan Perbendaharaan",
    closing: "12 September 2026",
    posted: "Disiarkan 1 minggu lalu",
    icon: "account_balance_wallet",
    summary:
      "Membantu kutipan hasil perbandaran, rekod bayaran dan tugasan laporan kewangan.",
    responsibilities: [
      "Mengemas kini rekod bayaran dan membantu kerja penyelarasan harian.",
      "Menyediakan jadual sokongan untuk laporan kewangan.",
      "Mengurus dokumentasi kaunter dan tugasan pemfailan.",
    ],
    requirements: [
      "SPM/STPM, diploma atau kelayakan setara dalam perakaunan atau kewangan.",
      "Teliti dengan nombor, rekod dan kerja pentadbiran rutin.",
      "Kemahiran asas hamparan kerja dan pengendalian dokumen.",
    ],
  },
  {
    id: "landscape-intern",
    title: "Pelatih Seni Bina Landskap",
    department: "Unit Landskap",
    category: "Latihan Industri",
    type: "Latihan Industri",
    salary: "Elaun disediakan",
    location: "Unit Landskap",
    closing: "5 September 2026",
    posted: "Disiarkan 10 hari lalu",
    icon: "park",
    summary:
      "Membantu konsep penambahbaikan taman, pemerhatian tapak dan dokumentasi landskap.",
    responsibilities: [
      "Menyokong ukuran tapak, dokumentasi foto dan penyediaan konsep.",
      "Membantu pegawai dengan pelan penanaman dan nota penambahbaikan ruang awam.",
      "Menyediakan papan pembentangan ringkas dan rekod kemajuan.",
    ],
    requirements: [
      "Pelajar Seni Bina Landskap, Reka Bentuk, Hortikultur atau bidang berkaitan.",
      "Boleh bekerja di tapak dan mengurus dokumentasi pejabat.",
      "Kemahiran asas perisian reka bentuk atau lukisan adalah satu kelebihan.",
    ],
  },
];

const filters = [
  ["category", "Jenis Peluang", ["Semua", "Jawatan", "Latihan Industri"]],
  ["type", "Jenis Kerja", ["Semua", "Sepenuh Masa", "Tetap", "Kontrak", "Latihan Industri"]],
  [
    "department",
    "Jabatan",
    ["Semua", "Jabatan Perancangan", "Perkhidmatan Digital", "Alam Sekitar Bandar", "Perbendaharaan", "Unit Landskap"],
  ],
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
  const [selectedId, setSelectedId] = useState(opportunities[0].id);
  const selectedOpportunity = useMemo(
    () => opportunities.find((item) => item.id === selectedId) ?? opportunities[0],
    [selectedId],
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
              <strong>5</strong>
              Kekosongan
            </span>
            <span>
              <strong>23</strong>
              Jabatan
            </span>
            <span>
              <strong>2</strong>
              Latihan Industri
            </span>
          </div>
        </section>

        <section className="market-search-panel" aria-label="Cari peluang">
          <label>
            <Icon>search</Icon>
            <input type="search" placeholder="Cari mengikut jawatan, kata kunci atau jabatan" />
          </label>
          <label>
            <Icon>location_on</Icon>
            <input type="search" placeholder="Lokasi atau unit kerja" />
          </label>
          <button type="button">
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

            {filters.map(([key, title, values]) => (
              <div className="market-filter-group" key={key}>
                <h2>{title}</h2>
                {values.map((value) => (
                  <label key={value}>
                    <input type="checkbox" defaultChecked={value === "Semua"} />
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
                <p>Memaparkan {opportunities.length} kekosongan daripada jabatan DBKU</p>
              </div>
              <select aria-label="Susun keputusan" defaultValue="recent">
                <option value="recent">Terkini</option>
                <option value="closing">Tarikh tutup terdekat</option>
                <option value="salary">Julat gaji</option>
              </select>
            </div>

            <div className="market-job-list">
              {opportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  selected={opportunity.id === selectedOpportunity.id}
                  onSelect={() => setSelectedId(opportunity.id)}
                />
              ))}
            </div>
          </section>

          <aside className="market-detail" aria-label="Butiran peluang dipilih">
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
                <button type="button">
                  <Icon>bookmark</Icon>
                  Simpan
                </button>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
