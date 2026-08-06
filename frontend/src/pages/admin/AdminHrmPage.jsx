import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  apiRequest,
  clearAuthSession,
  getStoredUser,
  recordLogoutActivity,
} from "../../lib/authApi";
import { adminNavItems, getAdminRoutePath, getAdminRouteState } from "../../modules/admin/adminRoutes";
import { Icon } from "../applicant/ApplicantAuthShared";

const dbkuDepartments = [
  { name: "Bahagian Audit Dalaman", code: "AUD" },
  { name: "Bahagian Projek Khas & Fasiliti Awam", code: "SPF" },
  { name: "Bahagian Hal Ehwal Undang-Undang", code: "LAW" },
  { name: "Bahagian Penguatkuasaan dan Keselamatan", code: "ENS" },
  { name: "Bahagian Pelesenan", code: "LES" },
  { name: "Bahagian Pengurusan Sumber Manusia", code: "HRM" },
  { name: "Bahagian Pentadbiran", code: "ADM" },
  { name: "Bahagian Transformasi dan Inovasi", code: "CTS" },
  { name: "Bahagian Kewangan", code: "FIN" },
  { name: "Bahagian Penilaian dan Pencukaian", code: "VAL" },
  { name: "Bahagian Teknologi Maklumat", code: "ICT" },
  { name: "Bahagian Kesihatan Persekitaran", code: "ENV" },
  { name: "Bahagian Perhubungan Awam", code: "PRD" },
  { name: "Bahagian Pembangunan & Perkhidmatan", code: "CDS" },
  { name: "Bahagian Pembangunan Sumber", code: "IRD" },
  { name: "Bahagian Landskap", code: "LNP" },
  { name: "Bahagian Kontrak dan Perolehan", code: "COP" },
  { name: "Bahagian Geoinformasi dan Pengurusan Hartanah", code: "GPM" },
  { name: "Bahagian Penyelenggaraan Infrastruktur", code: "IMT" },
  { name: "Bahagian Bangunan", code: "BLG" },
  { name: "Bahagian Projek Kejuruteraan", code: "ENG" },
  { name: "Bahagian Mekanikal dan Elektrikal", code: "MNE" },
];

const statusLabel = {
  submitted: "Baharu",
  screening: "Saringan",
  shortlisted: "Disenarai pendek",
  interview: "Temu duga",
  offered: "Tawaran",
  accepted: "Diterima",
  rejected: "Ditolak",
  withdrawn: "Ditarik balik",
  draft: "Draf",
};
const statusClass = {
  submitted: "blue",
  screening: "amber",
  shortlisted: "green",
  interview: "violet",
  offered: "green",
  accepted: "green",
  rejected: "red",
  withdrawn: "slate",
  draft: "slate",
};
const dateValue = (value) =>
  value
    ? new Date(value).toLocaleDateString("ms-MY", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "—";
const dbkuS5Template = {
  title: "Penolong Pegawai Penerangan Gred S5",
  vacancy_type: "job",
  department: "Dewan Bandaraya Kuching Utara",
  advertisement_no: "DBKU/6/2026",
  service_group: "Pelaksana",
  service_classification: "Sosial",
  employment_type: "Kontrak",
  grade: "S5",
  minimum_salary: "1650.00",
  maximum_salary: "6620.00",
  closing_date: "2026-07-27",
  status: "open",
  summary:
    "Bil. Iklan: DBKU/6/2026\nKumpulan Perkhidmatan: Pelaksana\nKlasifikasi Perkhidmatan: Sosial\nGaji minimum RM1,650.00 · Gaji maksimum RM6,620.00.",
  responsibilities:
    "1. Merancang, mengurus dan menyelaras penyampaian maklumat serta komunikasi korporat DBKU.\n2. Merangka strategi komunikasi dan pelan komunikasi korporat.\n3. Mengurus hubungan media, kenyataan media dan sidang media.\n4. Mengurus kandungan media sosial, laman web rasmi dan bahan penerbitan.\n5. Menyelaras komunikasi krisis, publisiti serta promosi organisasi.",
  requirements:
    "Warganegara Malaysia yang bermastautin di Sarawak.\nMemiliki STPM / STAM / Matrikulasi atau Diploma dalam bidang berkaitan yang diiktiraf Kerajaan.\nKepujian sekurang-kurangnya Gred C dalam Bahasa Melayu.\nHanya calon yang layak selepas tapisan akan dipanggil untuk ujian atau temu duga.",
  application_instructions:
    "Muat turun dan lengkapkan Borang Permohonan Jawatan Kosong DBKU. Kemukakan borang bersama surat permohonan kerja SAHAJA menggunakan sampul surat bersaiz 4” x 9” kepada Bahagian Pengurusan Sumber Manusia, Dewan Bandaraya Kuching Utara.",
  application_notes:
    "Permohonan tidak lengkap, tidak memenuhi syarat atau diterima selepas tarikh tutup tidak akan dipertimbangkan. Hanya pemohon yang layak selepas tapisan akan dipanggil untuk ujian dan temu duga.",
};
const createEmptyJobForm = (vacancyType = "job") => ({
  title: "",
  vacancy_type: vacancyType,
  department: "Dewan Bandaraya Kuching Utara",
  division: "",
  location: "Dewan Bandaraya Kuching Utara, Bukit Siol, Jalan Semariang, Petra Jaya, 93050, Kuching, Sarawak",
  advertisement_no: "",
  service_group: "",
  service_classification: "",
  employment_type: vacancyType === "internship" ? "Latihan Industri" : "",
  grade: "",
  minimum_salary: "",
  maximum_salary: "",
  closing_date: "",
  summary: "",
  responsibilities: "",
  requirements: "",
  application_instructions: "",
  application_notes: "",
  status: "open",
});
const opportunityTypeLabels = {
  job: "Jawatan DBKU",
  internship: "Latihan Industri",
};
const dashboardTypes = [
  {
    type: "job",
    label: "Jawatan DBKU",
    createLabel: "Tambah Jawatan DBKU",
    applicationsLabel: "Permohonan Jawatan DBKU",
  },
  {
    type: "internship",
    label: "Latihan Industri",
    applicationsLabel: "Permohonan Latihan Industri",
  },
];
const applicationStatusKeys = ["submitted", "screening", "shortlisted", "rejected"];

function Badge({ status }) {
  return (
    <span className={`hrm-badge ${statusClass[status] || "slate"}`}>
      {statusLabel[status] || status}
    </span>
  );
}

export default function AdminHrmPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user] = useState(getStoredUser);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [documentFile, setDocumentFile] = useState(null);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState("");
  const routeState = getAdminRouteState(location.pathname);
  const [jobForm, setJobForm] = useState(() => createEmptyJobForm(routeState.vacancyType || "job"));
  const panel = routeState.panel || "dashboard";
  const activeVacancyType = routeState.vacancyType || jobForm.vacancy_type || "job";
  const isKnownRoute =
    location.pathname === "/admin" ||
    adminNavItems.some((item) => item.to === location.pathname.replace(/\/+$/, ""));

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([apiRequest("/jobs/"), apiRequest("/applications/")])
      .then(([jobData, appData]) => {
        setJobs(Array.isArray(jobData) ? jobData : jobData.results || []);
        setApplications(
          Array.isArray(appData) ? appData : appData.results || [],
        );
      })
      .catch((error) =>
        setNotice(error.message || "Data tidak dapat dimuatkan."),
      )
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
    else if (user.role !== "admin") navigate("/", { replace: true });
    else Promise.resolve().then(loadData);
  }, [loadData, navigate, user]);
  useEffect(() => {
    if (!notice) return undefined;
    const timeoutId = window.setTimeout(() => setNotice(""), 5000);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);
  const dashboardMetrics = useMemo(() => {
    const jobTypesById = new Map(jobs.map((job) => [job.id, job.vacancy_type]));
    const applicationsByType = (type) =>
      applications.filter((application) => {
        const vacancyType = application.vacancy_detail?.vacancy_type || jobTypesById.get(application.vacancy);
        return vacancyType === type;
      });
    const metricsByType = (type) => {
      const typeJobs = jobs.filter((job) => job.vacancy_type === type);
      const typeApplications = applicationsByType(type);
      return {
        applications: typeApplications,
        jobs: typeJobs,
        new: typeApplications.filter((app) => app.status === "submitted").length,
        open: typeJobs.filter((job) => job.status === "open").length,
        shortlist: typeApplications.filter((app) => app.status === "shortlisted").length,
        total: typeApplications.length,
      };
    };
    const overallMetrics = {
      applications,
      jobs,
      new: applications.filter((app) => app.status === "submitted").length,
      open: jobs.filter((job) => job.status === "open").length,
      shortlist: applications.filter((app) => app.status === "shortlisted").length,
      total: applications.length,
    };
    return {
      all: overallMetrics,
      internship: metricsByType("internship"),
      job: metricsByType("job"),
    };
  }, [applications, jobs]);
  const setReview = async (id, status) => {
    try {
      await apiRequest(`/applications/${id}/review/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setNotice(
        status === "shortlisted"
          ? "Calon telah disenarai pendek."
          : "Permohonan telah ditolak.",
      );
      loadData();
    } catch (error) {
      setNotice(error.message);
    }
  };
  const submitJob = async (event) => {
    event.preventDefault();
    try {
      const payload = new FormData();
      Object.entries({ ...jobForm, location: jobForm.location || "Dewan Bandaraya Kuching Utara, Bukit Siol, Jalan Semariang, Petra Jaya, 93050, Kuching, Sarawak" }).forEach(
        ([key, value]) => payload.append(key, value || ""),
      );
      if (documentFile) payload.append("official_document", documentFile);
      await apiRequest("/jobs/", { method: "POST", body: payload });
      setNotice("Iklan berjaya diterbitkan.");
      if (documentPreviewUrl) URL.revokeObjectURL(documentPreviewUrl);
      setDocumentFile(null);
      setDocumentPreviewUrl("");
      setJobForm(createEmptyJobForm(jobForm.vacancy_type));
      navigate(getAdminRoutePath("manage", jobForm.vacancy_type));
      loadData();
    } catch (error) {
      setNotice(error.message);
    }
  };
  const logout = async () => {
    await recordLogoutActivity();
    clearAuthSession();
    navigate("/login", { replace: true });
  };
  const openCreatePanel = (_label, vacancyType = "job") => {
    if (jobForm.vacancy_type !== vacancyType) {
      if (documentPreviewUrl) URL.revokeObjectURL(documentPreviewUrl);
      setDocumentFile(null);
      setDocumentPreviewUrl("");
      setJobForm(createEmptyJobForm(vacancyType));
    }
    navigate(getAdminRoutePath("create", vacancyType));
  };
  const openFilteredPanel = (_label, view, vacancyType = "job") => {
    const panelName = view === "Permohonan" ? "applications" : "manage";
    navigate(getAdminRoutePath(panelName, vacancyType));
  };
  if (!user || user.role !== "admin") return null;
  if (location.pathname === "/admin") return <Navigate to="dashboard" replace />;
  if (!isKnownRoute) return <Navigate to="/admin/dashboard" replace />;
  const activeOpportunityLabel = opportunityTypeLabels[activeVacancyType] || opportunityTypeLabels.job;
  const activeMetrics = dashboardMetrics[activeVacancyType] || dashboardMetrics.job;
  const overallMetrics = dashboardMetrics.all;
  const filteredJobs = activeMetrics.jobs;
  const filteredApplications = activeMetrics.applications;
  const latestApplications = overallMetrics.applications.slice(0, 6);
  const isInternshipForm = jobForm.vacancy_type === "internship";
  return (
    <div className="min-h-screen min-w-[900px] bg-slate-50">
      <aside
        className={`fixed inset-y-0 left-0 z-10 flex flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ${isSidebarOpen ? "w-[350px]" : "w-[72px]"}`}
      >
        <div
          className={`grid h-[72px] items-center gap-2 border-b border-slate-200 ${isSidebarOpen ? "grid-cols-[minmax(0,1fr)_auto] px-4" : "grid-cols-1 justify-items-center px-0"}`}
        >
          <div
            className={`flex min-w-0 items-center gap-3 ${isSidebarOpen ? "" : "hidden"}`}
          >
            <img
              className="h-9 w-9 object-contain"
              src="/logo-dbku.png"
              alt="DBKU"
            />
            <div>
              <p className="font-semibold text-slate-950">
                Portal Kerjaya DBKU
              </p>
              <p className="text-xs text-slate-500">Pentadbir HRM</p>
            </div>
          </div>
          <button
            className="rounded-md border border-slate-200 bg-white p-2 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            type="button"
            aria-label={isSidebarOpen ? "Kecilkan sidebar" : "Buka sidebar"}
            onClick={() => setIsSidebarOpen((current) => !current)}
          >
            <Icon>menu</Icon>
          </button>
        </div>
        <nav className={`space-y-1 py-5 ${isSidebarOpen ? "px-4" : "px-3"}`}>
          {adminNavItems.map((item, index) =>
            item.kind === "section" ? (
              isSidebarOpen ? (
                <p
                  className="px-4 pb-2 pt-4 text-[13px] font-bold text-slate-400"
                  key={item.label}
                >
                  {item.label}
                </p>
              ) : (
                <div className="h-6" key={item.label} />
              )
            ) : (
              <NavLink
                className={({ isActive }) => `flex w-full items-center rounded-md py-3 text-left text-[15px] font-semibold ${isSidebarOpen ? "gap-4 px-4" : "justify-center px-0"} ${isActive ? "bg-emerald-50 text-slate-950" : "text-slate-950"}`}
                end
                key={`${item.label}-${index}`}
                onClick={() => {
                  if (item.panel === "create" && item.vacancyType && jobForm.vacancy_type !== item.vacancyType) {
                    if (documentPreviewUrl) URL.revokeObjectURL(documentPreviewUrl);
                    setDocumentFile(null);
                    setDocumentPreviewUrl("");
                    setJobForm(createEmptyJobForm(item.vacancyType));
                  }
                }}
                title={!isSidebarOpen ? item.label : undefined}
                to={item.to}
              >
                <Icon>{item.icon}</Icon>
                {isSidebarOpen ? (
                  item.label
                ) : (
                  <span className="sr-only">{item.label}</span>
                )}
              </NavLink>
            ),
          )}
        </nav>
      </aside>
      <main
        className={`min-h-screen bg-slate-50 transition-[margin] duration-200 ${isSidebarOpen ? "ml-[350px]" : "ml-[72px]"}`}
      >
        <header className="flex h-[72px] items-center justify-between border-b border-emerald-100 bg-white px-11">
          <div>
            <p className="text-sm font-bold text-slate-950">Selamat datang</p>
            <strong className="mt-1 block text-[17px] text-slate-950">
              {user.full_name || user.first_name || "Pentadbir HRM"}
            </strong>
          </div>
          <div className="profile-actions">
            <button
              type="button"
              className="profile-icon-button"
              aria-label="Notifikasi"
            >
              <Icon>notifications</Icon>
            </button>
            <details className="profile-account-menu">
              <summary
                className="profile-account-trigger"
                aria-label="Menu profil"
              >
                <span className="profile-user-chip">
                  <Icon>person</Icon>
                </span>
                <Icon>expand_more</Icon>
              </summary>
              <div className="profile-account-dropdown">
                <div className="profile-account-card-head">
                  <span className="profile-user-chip">
                    <Icon>person</Icon>
                  </span>
                  <span>
                    <strong>
                      {user.full_name || user.first_name || "Pentadbir HRM"}
                    </strong>
                    <em>{user.email || "Pentadbir HRM"}</em>
                  </span>
                </div>
                <button
                  type="button"
                  className="profile-logout-button"
                  onClick={logout}
                >
                  <Icon>logout</Icon>Log Keluar
                </button>
              </div>
            </details>
          </div>
        </header>
        <section className="hrm-content">
          {notice && (
            <div className="hrm-notice">
              {notice}
              <button onClick={() => setNotice("")}>×</button>
            </div>
          )}
          {panel === "create" && (
            <form className="simple-job-form" onSubmit={submitJob}>
              <header><span className="hrm-eyebrow">{isInternshipForm ? "TAMBAH JAWATAN LATIHAN INDUSTRI" : "TAMBAH JAWATAN DBKU"}</span><h1>{isInternshipForm ? "Siarkan jawatan latihan industri baharu" : "Siarkan jawatan DBKU baharu"}</h1><p>Masukkan ringkasan penting. Maklumat penuh disediakan melalui dokumen rasmi untuk dimuat turun pemohon.</p></header>
              <label>Tajuk jawatan<input required value={jobForm.title} onChange={(event) => setJobForm({ ...jobForm, title: event.target.value })} placeholder={isInternshipForm ? "cth. Latihan Industri Teknologi Maklumat" : "cth. Penolong Pegawai Penerangan Gred S5"} /></label>
              <label>Bahagian<select required value={jobForm.division || ""} onChange={(event) => setJobForm({ ...jobForm, division: event.target.value })}><option value="">Sila pilih</option>{dbkuDepartments.map((division) => <option key={division.code} value={division.name}>{division.name} ({division.code})</option>)}</select></label>
              <label>Jabatan<input required value={jobForm.department} onChange={(event) => setJobForm({ ...jobForm, department: event.target.value })} placeholder="cth. Jabatan Pentadbiran" /></label>
              <label>Lokasi<input value={jobForm.location || ""} onChange={(event) => setJobForm({ ...jobForm, location: event.target.value })} placeholder="cth. Petra Jaya, Kuching" /></label>
              <label>Taraf jawatan<select value={jobForm.employment_type} onChange={(event) => setJobForm({ ...jobForm, employment_type: event.target.value })}><option value="">Pilih jenis</option><option>Tetap</option><option>Kontrak</option><option>Latihan Industri</option></select></label>
              <label>Tarikh tutup<input required type="date" value={jobForm.closing_date} onChange={(event) => setJobForm({ ...jobForm, closing_date: event.target.value })} /></label>
              <label>Ringkasan jawatan<textarea required value={jobForm.summary} onChange={(event) => setJobForm({ ...jobForm, summary: event.target.value })} placeholder="Terangkan ringkas peranan atau perkara utama jawatan ini..." /></label>
              <label>Dokumen rasmi untuk pemohon<input required type="file" accept="application/pdf,image/png,image/jpeg" onChange={(event) => setDocumentFile(event.target.files?.[0] || null)} /><small>Muat naik fail iklan atau borang permohonan. Pemohon akan memuat turun fail ini untuk butiran penuh.</small></label>
              <button className="hrm-primary" type="submit"><Icon>add_circle</Icon>Siarkan jawatan</button>
            </form>
          )}
          {panel === "dashboard" && (
            <>
              <div className="hrm-heading">
                <div>
                  <h1>Ringkasan pengambilan</h1>
                  <p>
                    Pantau prestasi jawatan DBKU dan latihan industri dalam satu paparan.
                  </p>
                </div>
              </div>
              <div className="hrm-stats">
                <Stat icon="work_history" label="Iklan aktif" value={overallMetrics.open} tone="green" />
                <Stat icon="description" label="Jumlah permohonan" value={overallMetrics.total} tone="blue" />
                <Stat icon="stars" label="Disenarai pendek" value={overallMetrics.shortlist} tone="mint" />
                <Stat icon="notifications" label="Permohonan baharu" value={overallMetrics.new} tone="amber" />
              </div>
              <div className="hrm-category-grid">
                {dashboardTypes.map((item) => (
                  <DashboardCategoryCard
                    key={item.type}
                    label={item.label}
                    metrics={dashboardMetrics[item.type]}
                    onCreate={item.type === "job" ? () => openCreatePanel("Tambah Jawatan DBKU", item.type) : null}
                    onManage={item.type === "job" ? () => openFilteredPanel("Urus Jawatan DBKU", "Urus Jawatan", item.type) : null}
                    onViewApplications={() => openFilteredPanel(item.applicationsLabel, "Permohonan", item.type)}
                  />
                ))}
              </div>
              <div className="hrm-grid">
                <section className="hrm-card hrm-table-card">
                  <header>
                    <div>
                      <h2>Permohonan terkini</h2>
                      <p>Calon daripada jawatan DBKU dan latihan industri</p>
                    </div>
                    <div className="hrm-card-actions">
                      <button onClick={() => openFilteredPanel("Permohonan Jawatan DBKU", "Permohonan", "job")} type="button">
                        DBKU <Icon>chevron_right</Icon>
                      </button>
                      <button onClick={() => openFilteredPanel("Permohonan Latihan Industri", "Permohonan", "internship")} type="button">
                        Latihan Industri <Icon>chevron_right</Icon>
                      </button>
                    </div>
                  </header>
                  <ApplicationTable applications={latestApplications} onReview={setReview} compact />
                </section>
                <section className="hrm-card hrm-analytics">
                  <header>
                    <h2>Analitik pemohon</h2>
                    <p>Agihan status permohonan keseluruhan</p>
                  </header>
                  <div className="hrm-chart">
                    {applicationStatusKeys.map((status) => {
                      const statusCount = overallMetrics.applications.filter((app) => app.status === status).length;
                      const statusPercent = overallMetrics.applications.length ? Math.max(8, (statusCount / overallMetrics.applications.length) * 100) : 8;
                      return (
                        <div key={status}>
                          <span>
                            <Badge status={status} />
                          </span>
                          <i>
                            <b style={{ width: `${statusPercent}%` }} />
                          </i>
                          <strong>{statusCount}</strong>
                        </div>
                      );
                    })}
                  </div>
                  <footer>
                    <Icon>history</Icon> Dikemas kini secara langsung
                  </footer>
                </section>
              </div>
            </>
          )}
          {panel === "advanced-create" && (
            <>
              <div className="hrm-heading">
                <div>
                  <span className="hrm-eyebrow">JAWATAN & LATIHAN</span>
                  <h1>Siarkan peluang baharu</h1>
                  <p>
                    Gunakan template rasmi DBKU untuk menyusun iklan jawatan
                    dengan lengkap.
                  </p>
                </div>
              </div>
              <div className="hrm-job-layout">
                <form className="hrm-card hrm-job-form" onSubmit={submitJob}>
                  <div className="hrm-form-title">
                    <h2>Butiran iklan</h2>
                    <button
                      type="button"
                      className="hrm-template-button"
                      onClick={() => setJobForm(dbkuS5Template)}
                    >
                      Guna template DBKU S5
                    </button>
                  </div>
                  <p className="hrm-template-note">
                    Template berdasarkan format iklan Penolong Pegawai
                    Penerangan Gred S5. Sila semak semula butiran sebelum
                    diterbitkan.
                  </p>
                  <h3 className="hrm-form-section">1. Butiran jawatan</h3>
                  <label>Bil. iklan<input value={jobForm.advertisement_no || ""} onChange={(e) => setJobForm({ ...jobForm, advertisement_no: e.target.value })} placeholder="cth. DBKU/6/2026" /></label>
                  <label>
                    Tajuk jawatan
                    <input
                      required
                      value={jobForm.title}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, title: e.target.value })
                      }
                      placeholder="cth. Pegawai Perancang Bandar"
                    />
                  </label>
                  <div className="hrm-form-two">
                    <label>
                      Jenis peluang
                      <select
                        value={jobForm.vacancy_type}
                        onChange={(e) =>
                          setJobForm({
                            ...jobForm,
                            vacancy_type: e.target.value,
                          })
                        }
                      >
                        <option value="job">Jawatan</option>
                        <option value="internship">Latihan industri</option>
                      </select>
                    </label>
                    <label>
                      Taraf jawatan
                      <input
                        value={jobForm.employment_type}
                        onChange={(e) =>
                          setJobForm({
                            ...jobForm,
                            employment_type: e.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                  <div className="hrm-form-two">
                    <label>
                      Gred jawatan
                      <input
                        value={jobForm.grade || ""}
                        onChange={(e) =>
                          setJobForm({ ...jobForm, grade: e.target.value })
                        }
                        placeholder="cth. S5"
                      />
                    </label>
                    <label>
                      Tarikh tutup
                      <input
                        type="date"
                        value={jobForm.closing_date}
                        onChange={(e) =>
                          setJobForm({
                            ...jobForm,
                            closing_date: e.target.value,
                          })
                        }
                      />
                    </label>
                  </div>
                  <label>
                    Jabatan
                    <input
                      required
                      value={jobForm.department}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, department: e.target.value })
                      }
                      placeholder="cth. Jabatan Perancangan Bandar"
                    />
                  </label>
                  <div className="hrm-form-two">
                    <label>Kumpulan perkhidmatan<input value={jobForm.service_group || ""} onChange={(e) => setJobForm({ ...jobForm, service_group: e.target.value })} placeholder="cth. Pelaksana" /></label>
                    <label>Klasifikasi perkhidmatan<input value={jobForm.service_classification || ""} onChange={(e) => setJobForm({ ...jobForm, service_classification: e.target.value })} placeholder="cth. Sosial" /></label>
                  </div>
                  <h3 className="hrm-form-section">2. Jadual gaji</h3>
                  <div className="hrm-form-two">
                    <label>Gaji minimum (RM)<input type="number" min="0" step="0.01" value={jobForm.minimum_salary || ""} onChange={(e) => setJobForm({ ...jobForm, minimum_salary: e.target.value })} placeholder="cth. 1650.00" /></label>
                    <label>Gaji maksimum (RM)<input type="number" min="0" step="0.01" value={jobForm.maximum_salary || ""} onChange={(e) => setJobForm({ ...jobForm, maximum_salary: e.target.value })} placeholder="cth. 6620.00" /></label>
                  </div>
                  <h3 className="hrm-form-section">3. Skop tugas utama</h3>
                  <label>
                    Ringkasan iklan
                    <textarea
                      required
                      value={jobForm.summary}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, summary: e.target.value })
                      }
                      placeholder="Bil. iklan, klasifikasi perkhidmatan dan jadual gaji..."
                    />
                  </label>
                  <label>
                    Skop tugas utama
                    <textarea
                      value={jobForm.responsibilities || ""}
                      onChange={(e) =>
                        setJobForm({
                          ...jobForm,
                          responsibilities: e.target.value,
                        })
                      }
                      placeholder="Nyatakan tanggungjawab dan skop tugas utama..."
                    />
                  </label>
                  <label>
                    <h3 className="hrm-form-section">4. Syarat lantikan</h3>
                    Syarat lantikan
                    <textarea
                      value={jobForm.requirements || ""}
                      onChange={(e) =>
                        setJobForm({ ...jobForm, requirements: e.target.value })
                      }
                      placeholder="Nyatakan kelayakan, syarat bahasa dan arahan permohonan..."
                    />
                  </label>
                  <label>Cara memohon<textarea value={jobForm.application_instructions || ""} onChange={(e) => setJobForm({ ...jobForm, application_instructions: e.target.value })} placeholder="Nyatakan borang/dokumen yang perlu dikemukakan dan alamat penghantaran..." /></label>
                  <label>Catatan am<textarea value={jobForm.application_notes || ""} onChange={(e) => setJobForm({ ...jobForm, application_notes: e.target.value })} placeholder="Nyatakan syarat permohonan tidak lengkap, proses tapisan dan makluman penting..." /></label>
                  <label>
                    Dokumen rasmi / borang softcopy
                    <input
                      type="file"
                      accept="application/pdf,image/png,image/jpeg"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        if (documentPreviewUrl)
                          URL.revokeObjectURL(documentPreviewUrl);
                        setDocumentFile(file);
                        setDocumentPreviewUrl(
                          file ? URL.createObjectURL(file) : "",
                        );
                      }}
                    />
                    <small className="hrm-file-help">
                      PDF, PNG atau JPG · pratonton dipaparkan di sebelah kanan.
                    </small>
                  </label>
                  <button className="hrm-primary" type="submit">
                    <Icon>add_circle</Icon>Terbitkan iklan
                  </button>
                </form>
                <section className="hrm-document-column">
                  <section className="hrm-card hrm-document-preview">
                    <header>
                      <h2>Pratonton borang</h2>
                      {documentFile ? <span>{documentFile.name}</span> : null}
                    </header>
                    {documentPreviewUrl ? (
                      documentFile?.type === "application/pdf" ? (
                        <iframe
                          src={documentPreviewUrl}
                          title="Pratonton dokumen rasmi"
                        />
                      ) : (
                        <img
                          src={documentPreviewUrl}
                          alt="Pratonton dokumen rasmi"
                        />
                      )
                    ) : (
                      <div className="hrm-document-empty">
                        <Icon>description</Icon>
                        <strong>Tiada dokumen dipilih</strong>
                        <p>
                          Muat naik PDF, PNG atau JPG untuk melihat kandungan
                          borang di sini.
                        </p>
                      </div>
                    )}
                  </section>
                  <section className="hrm-card hrm-open-jobs">
                    <header>
                      <h2>Iklan semasa</h2>
                      <span>{jobs.length} rekod</span>
                    </header>
                    {jobs.map((job) => (
                      <article key={job.id}>
                        <div>
                          <Badge
                            status={
                              job.status === "open" ? "shortlisted" : job.status
                            }
                          />
                          <h3>{job.title}</h3>
                          <p>
                            {job.department} ·{" "}
                            {job.vacancy_type === "job"
                              ? "Jawatan"
                              : "Latihan Industri"}
                          </p>
                        </div>
                        <time>Tutup {dateValue(job.closing_date)}</time>
                      </article>
                    ))}
                    {!jobs.length && !loading && (
                      <p className="hrm-empty">Belum ada iklan jawatan.</p>
                    )}
                  </section>
                </section>
              </div>
            </>
          )}
          {panel === "manage" && (
            <>
              <div className="hrm-heading">
                <div>
                  <span className="hrm-eyebrow">URUS JAWATAN</span>
                  <h1>Senarai {activeOpportunityLabel}</h1>
                  <p>Semak semua iklan {activeOpportunityLabel.toLowerCase()} yang telah disiarkan.</p>
                </div>
                <button
                  className="hrm-primary"
                  type="button"
                  onClick={() => {
                    openCreatePanel(activeVacancyType === "internship" ? "Tambah Latihan Industri" : "Tambah Jawatan DBKU", activeVacancyType);
                  }}
                >
                  <Icon>add_circle</Icon>Tambah {activeOpportunityLabel}
                </button>
              </div>
              <section className="hrm-card hrm-table-card">
                <header>
                  <div>
                    <h2>{activeOpportunityLabel} disiarkan</h2>
                    <p>{filteredJobs.length} rekod {activeOpportunityLabel.toLowerCase()}</p>
                  </div>
                </header>
                <JobManagementTable jobs={filteredJobs} applications={applications} itemLabel={activeOpportunityLabel.toLowerCase()} />
              </section>
            </>
          )}
          {panel === "applications" && (
            <>
              <div className="hrm-heading">
                <div>
                  <span className="hrm-eyebrow">PENGURUSAN PERMOHONAN</span>
                  <h1>Permohonan {activeOpportunityLabel}</h1>
                  <p>
                    Pilih calon yang memenuhi keperluan {activeOpportunityLabel.toLowerCase()} dengan lebih cepat.
                  </p>
                </div>
              </div>
              <section className="hrm-card hrm-table-card">
                <header>
                  <div>
                    <h2>Permohonan {activeOpportunityLabel}</h2>
                    <p>{filteredApplications.length} permohonan direkodkan</p>
                  </div>
                </header>
                <ApplicationTable
                  applications={filteredApplications}
                  onReview={setReview}
                />
              </section>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
function Stat({ icon, label, value, tone }) {
  return (
    <article className={`hrm-stat ${tone}`}>
      <span>
        <Icon>{icon}</Icon>
      </span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}
function DashboardCategoryCard({ label, metrics, onCreate, onManage, onViewApplications }) {
  return (
    <article className="hrm-category-card">
      <header>
        <div>
          <span>{label}</span>
          <h2>{metrics?.open || 0} iklan aktif</h2>
        </div>
        {onCreate ? (
          <button onClick={onCreate} type="button">
            <Icon>add_circle</Icon>Tambah
          </button>
        ) : null}
      </header>
      <div className="hrm-category-metrics">
        <span>
          <strong>{metrics?.total || 0}</strong>
          Permohonan
        </span>
        <span>
          <strong>{metrics?.new || 0}</strong>
          Baharu
        </span>
        <span>
          <strong>{metrics?.shortlist || 0}</strong>
          Disenarai pendek
        </span>
      </div>
      <footer>
        {onManage ? <button onClick={onManage} type="button">Urus iklan</button> : null}
        <button onClick={onViewApplications} type="button">Lihat permohonan</button>
      </footer>
    </article>
  );
}
function JobManagementTable({ jobs, applications, itemLabel = "jawatan" }) {
  if (!jobs.length)
    return <p className="hrm-empty">Belum ada {itemLabel} disiarkan.</p>;

  return (
    <div className="hrm-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Bil.</th>
            <th>Bahagian</th>
            <th>Tarikh siar</th>
            <th>Tarikh tutup</th>
            <th>Pemohon</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job, index) => {
            const applicantCount = applications.filter(
              (application) => application.vacancy === job.id,
            ).length;
            const isOpen = job.is_open ?? job.status === "open";
            const statusText = isOpen
              ? "Aktif"
              : job.status === "open"
                ? "Tamat tempoh"
                : "Ditutup";
            return (
              <tr key={job.id}>
                <td>{index + 1}</td>
                <td>{job.division || "—"}</td>
                <td>{dateValue(job.created_at)}</td>
                <td>{dateValue(job.closing_date)}</td>
                <td>{applicantCount}</td>
                <td>
                  <span className={`hrm-badge ${isOpen ? "green" : "slate"}`}>
                    {statusText}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
function ApplicationTable({ applications, onReview, compact }) {
  if (!applications.length)
    return (
      <p className="hrm-empty">
        {compact
          ? "Tiada permohonan baharu buat masa ini."
          : "Tiada permohonan untuk dipaparkan."}
      </p>
    );
  return (
    <div className="hrm-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Calon</th>
            <th>Jawatan dipohon</th>
            <th>Status</th>
            <th>Tarikh</th>
            {!compact && <th>Tindakan</th>}
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id}>
              <td>
                <strong>{app.applicant_name}</strong>
                <small>{app.reference_no}</small>
              </td>
              <td>{app.vacancy_detail?.title || "—"}</td>
              <td>
                <Badge status={app.status} />
              </td>
              <td>{dateValue(app.submitted_at || app.created_at)}</td>
              {!compact && (
                <td>
                  <div className="hrm-actions">
                    <button
                      className="shortlist"
                      onClick={() => onReview(app.id, "shortlisted")}
                      disabled={["shortlisted", "rejected"].includes(
                        app.status,
                      )}
                    >
                      Senarai pendek
                    </button>
                    <button
                      className="reject"
                      onClick={() => onReview(app.id, "rejected")}
                      disabled={["shortlisted", "rejected"].includes(
                        app.status,
                      )}
                    >
                      Tolak
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
