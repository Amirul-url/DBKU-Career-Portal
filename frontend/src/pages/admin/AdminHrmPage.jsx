import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  apiRequest,
  clearAuthSession,
  getStoredUser,
  recordLogoutActivity,
} from "../../lib/authApi";
import { buildHrmDashboardMetrics, buildRecentApplicationsView } from "../../modules/admin/hrmDashboardMetrics";
import { ADMIN_ROUTES, adminNavItems, getAdminRoutePath, getAdminRouteState } from "../../modules/admin/adminRoutes";
import { InternshipApplicationReadOnlyPanel } from "../applicant/ApplicantApplicationViewPage";
import { Icon } from "../applicant/ApplicantAuthShared";
import SuperAdminApplicantsPanel from "./SuperAdminApplicantsPanel";

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
const hrmDepartmentAliases = new Set([
  "HRM",
  "Pengurusan Sumber Manusia (HRM)",
  "Bahagian Pengurusan Sumber Manusia (HRM)",
]);

function getDepartmentCode(department = "") {
  const codeMatch = String(department || "").match(/\(([^)]+)\)$/);
  return codeMatch?.[1] || (String(department || "").toUpperCase() === "HRM" ? "HRM" : "");
}

function isHrmDepartmentUser(user) {
  return hrmDepartmentAliases.has(user?.department || "") || getDepartmentCode(user?.department) === "HRM";
}

function getDepartmentWorkspaceLabel(user) {
  return getDepartmentCode(user?.department) || "DBKU";
}

function getAdminShellRoleLabel(user) {
  const workspaceLabel = getDepartmentWorkspaceLabel(user);
  return user?.department_role ? `${user.department_role} ${workspaceLabel}` : `Pentadbir ${workspaceLabel}`;
}

const statusLabel = {
  department_new: "Baharu",
  hrm_department_new: "Baharu",
  hrm_department_accepted: "Diterima Bahagian",
  hrm_department_rejected: "Ditolak Bahagian",
  submitted: "Baharu",
  screening: "Saringan",
  incomplete: "Tidak Lengkap",
  shortlisted: "Disenarai pendek",
  interview: "Temu duga",
  offered: "Tawaran",
  accepted: "Diterima",
  rejected: "Ditolak",
  withdrawn: "Ditarik balik",
  draft: "Draf",
};
const statusClass = {
  department_new: "red",
  hrm_department_new: "red",
  hrm_department_accepted: "green",
  hrm_department_rejected: "red",
  submitted: "blue",
  screening: "amber",
  incomplete: "amber",
  shortlisted: "green",
  interview: "violet",
  offered: "green",
  accepted: "green",
  rejected: "red",
  withdrawn: "slate",
  draft: "slate",
};
const hrmReviewTab = "Semakan HRM";
const departmentDecisionTab = "Keputusan Bahagian";
const organizationFeedbackTab = "Maklumbalas Organisasi";
const organizationFeedbackReportDefaults = {
  date: "",
  time: "8.00 pagi",
  place:
    "Unit Pengurusan Latihan\nBahagian Pengurusan Sumber Manusia\nTingkat 3, Bangunan Dewan Bandaraya Kuching Utara\nBukit Siol, Jalan Semariang, Petra Jaya\n93050 Kuching, SARAWAK",
  confirmationDate: "",
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
const buildQuickJobSummary = (form) =>
  [
    form.title,
    form.division ? `Bahagian: ${form.division}` : "",
    form.employment_type ? `Taraf jawatan: ${form.employment_type}` : "",
  ].filter(Boolean).join("\n");
const jobEditFields = ["title", "division", "department", "location", "employment_type", "closing_date", "status"];
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
const applicationStatusKeys = ["submitted", "screening", "incomplete", "shortlisted", "rejected"];
const jobStatusOptions = [
  { value: "all", label: "Semua status" },
  { value: "active", label: "Aktif" },
  { value: "expired", label: "Tamat tempoh" },
  { value: "closed", label: "Ditutup" },
];
const monthFilterOptions = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Mac" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Jun" },
  { value: "7", label: "Julai" },
  { value: "8", label: "Ogos" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Disember" },
];
const getJobDisplayStatus = (job) => {
  const isOpen = job.is_open ?? job.status === "open";
  if (isOpen) return "active";
  return job.status === "open" ? "expired" : "closed";
};
function getJobDateParts(job) {
  const value = job?.created_at || "";
  if (!value) return { month: "", year: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { month: "", year: "" };
  return {
    month: String(date.getMonth() + 1),
    year: String(date.getFullYear()),
  };
}
const getJobStatusText = (job) => {
  const displayStatus = getJobDisplayStatus(job);
  if (displayStatus === "active") return "Aktif";
  if (displayStatus === "expired") return "Tamat tempoh";
  return "Ditutup";
};

function Badge({ status }) {
  return (
    <span className={`hrm-badge ${statusClass[status] || "slate"}`}>
      {statusLabel[status] || status}
    </span>
  );
}

function hasSubmittedDepartmentDecision(application) {
  return Boolean(application?.profile_data?.department_decision?.submitted_at);
}

function hasOrganizationFeedbackBeenSent(application) {
  return Boolean(getOrganizationFeedbackRelease(application).sent_to_applicant_at);
}

function isDepartmentPendingDecisionApplication(application) {
  return Boolean(application?.assigned_department && !hasSubmittedDepartmentDecision(application));
}

function isHrmPendingDepartmentDecisionApplication(application) {
  return Boolean(
    hasSubmittedDepartmentDecision(application) &&
      ["accepted", "rejected"].includes(application?.status) &&
      !hasOrganizationFeedbackBeenSent(application),
  );
}

function getHrmDepartmentDecisionStatus(application) {
  if (application?.status === "accepted") return "hrm_department_accepted";
  if (application?.status === "rejected") return "hrm_department_rejected";
  return application?.status || "submitted";
}

function getInternshipApplicationDisplayStatus(application, isHrmWorkspace) {
  if (isHrmWorkspace && isHrmPendingDepartmentDecisionApplication(application)) return getHrmDepartmentDecisionStatus(application);
  if (!isHrmWorkspace && isDepartmentPendingDecisionApplication(application)) return "department_new";
  return application?.status || "submitted";
}

function getSidebarApplicationBadgeCount(item, metrics, { isHrmWorkspace = true } = {}) {
  if (item?.panel !== "applications" || !item?.vacancyType) return 0;
  const applications = metrics?.[item.vacancyType]?.applications || [];
  if (!isHrmWorkspace) {
    return applications.filter(isDepartmentPendingDecisionApplication).length;
  }
  return applications.filter((application) =>
    (application?.status || "submitted") === "submitted" ||
    isHrmPendingDepartmentDecisionApplication(application)
  ).length;
}

function formatSidebarBadgeCount(count) {
  return count > 99 ? "99+" : String(count);
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
  const [jobModalMode, setJobModalMode] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobActionForm, setJobActionForm] = useState({});
  const [jobActionSaving, setJobActionSaving] = useState(false);
  const [jobDeleteTarget, setJobDeleteTarget] = useState(null);
  const [jobMonthFilter, setJobMonthFilter] = useState("all");
  const [jobStatusFilter, setJobStatusFilter] = useState("all");
  const [jobYearFilter, setJobYearFilter] = useState("all");
  const routeState = getAdminRouteState(location.pathname);
  const [jobForm, setJobForm] = useState(() => createEmptyJobForm(routeState.vacancyType || "job"));
  const panel = routeState.panel || "dashboard";
  const activeApplicationId = routeState.applicationId || "";
  const activeVacancyType = routeState.vacancyType || jobForm.vacancy_type || "job";
  const isHrmWorkspace = isHrmDepartmentUser(user);
  const workspaceLabel = getDepartmentWorkspaceLabel(user);
  const shellRoleLabel = getAdminShellRoleLabel(user);
  const visibleAdminNavItems = useMemo(
    () => isHrmWorkspace ? adminNavItems : adminNavItems.filter((item) =>
      item.panel === "dashboard" ||
      item.panel === "applicants" ||
      (item.kind === "section" && ["PEMOHON", "JAWATAN DBKU", "LATIHAN INDUSTRI"].includes(item.label)) ||
      (item.panel === "manage" && item.vacancyType === "job") ||
      (item.panel === "applications" && ["job", "internship"].includes(item.vacancyType))
    ),
    [isHrmWorkspace],
  );
  const isKnownRoute =
    location.pathname === "/admin" ||
    panel === "application-detail" ||
    visibleAdminNavItems.some((item) => item.to === location.pathname.replace(/\/+$/, ""));

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
  const dashboardMetrics = useMemo(() => buildHrmDashboardMetrics(jobs, applications), [applications, jobs]);
  const setReview = async (id, status, options = {}) => {
    try {
      await apiRequest(`/applications/${id}/review/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...options }),
      });
      const reviewNotice = {
        shortlisted: "Permohonan telah dihantar ke bahagian.",
        incomplete: "Permohonan telah ditanda tidak lengkap.",
        rejected: "Permohonan telah ditanda tidak layak.",
      };
      setNotice(reviewNotice[status] || "Semakan permohonan telah dikemaskini.");
      loadData();
    } catch (error) {
      setNotice(error.message);
    }
  };
  const saveHrmAssessment = async (application, assessment) => {
    if (!application) return null;

    const profileData = {
      ...(application.profile_data || {}),
      hrm_assessment: assessment,
    };
    const updatedApplication = await apiRequest(`/applications/${application.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_data: profileData }),
    });
    setApplications((current) =>
      current.map((item) => (String(item.id) === String(updatedApplication.id) ? updatedApplication : item)),
    );
    return updatedApplication;
  };
  const saveDepartmentDecision = async (application, decision) => {
    if (!application) return null;

    const profileData = {
      ...(application.profile_data || {}),
      department_decision: decision,
    };
    const updatedApplication = await apiRequest(`/applications/${application.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile_data: profileData,
        status: decision.recommendation === "Tolak" ? "rejected" : "accepted",
      }),
    });
    setApplications((current) =>
      current.map((item) => (String(item.id) === String(updatedApplication.id) ? updatedApplication : item)),
    );
    setNotice("Keputusan bahagian telah dihantar kepada HRM.");
    return updatedApplication;
  };
  const saveOrganizationFeedbackDocument = async (application, files) => {
    const fileList = Array.isArray(files) ? files.filter(Boolean) : [files].filter(Boolean);
    if (!application || !fileList.length) return null;

    const payload = new FormData();
    fileList.forEach((file) => {
      payload.append("organizationFeedbackDocuments", file);
    });

    const updatedApplication = await apiRequest(`/applications/${application.id}/`, {
      method: "PATCH",
      body: payload,
    });
    setApplications((current) =>
      current.map((item) => (String(item.id) === String(updatedApplication.id) ? updatedApplication : item)),
    );
    setNotice("Dokumen maklumbalas organisasi telah dimuat naik.");
    return updatedApplication;
  };
  const deleteOrganizationFeedbackDocument = async (application, documentId = "") => {
    if (!application) return null;

    const updatedApplication = await apiRequest(`/applications/${application.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        documentId
          ? { clearOrganizationFeedbackDocumentId: documentId }
          : { clearOrganizationFeedbackDocument: true },
      ),
    });
    setApplications((current) =>
      current.map((item) => (String(item.id) === String(updatedApplication.id) ? updatedApplication : item)),
    );
    setNotice("Dokumen maklumbalas organisasi telah dihapuskan.");
    return updatedApplication;
  };
  const sendOrganizationFeedbackToApplicant = async (application, feedback = {}) => {
    if (!application) return null;

    const currentProfileData = application.profile_data || {};
    const profileData = {
      ...currentProfileData,
      organization_feedback_release: {
        ...(currentProfileData.organization_feedback_release || {}),
        internship_period: feedback.internshipPeriod || "",
        report_date: feedback.reportDate || organizationFeedbackReportDefaults.date,
        report_time: feedback.reportTime || organizationFeedbackReportDefaults.time,
        report_place: feedback.reportPlace || organizationFeedbackReportDefaults.place,
        confirmation_date: feedback.confirmationDate || organizationFeedbackReportDefaults.confirmationDate,
        sent_at_label: dateValue(feedback.sentAt),
        sent_by: user?.full_name || user?.email || "",
        sent_to_applicant_at: feedback.sentAt || new Date().toISOString(),
      },
    };
    const updatedApplication = await apiRequest(`/applications/${application.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_data: profileData }),
    });
    setApplications((current) =>
      current.map((item) => (String(item.id) === String(updatedApplication.id) ? updatedApplication : item)),
    );
    setNotice("Maklumbalas organisasi telah dihantar kepada pemohon.");
    return updatedApplication;
  };
  const openJobView = (job) => {
    setSelectedJob(job);
    setJobModalMode("view");
  };
  const openJobEdit = (job) => {
    setSelectedJob(job);
    setJobActionForm({
      title: job.title || "",
      division: job.division || "",
      department: job.department || "",
      location: job.location || "",
      employment_type: job.employment_type || "",
      closing_date: job.closing_date || "",
      status: job.status || "open",
    });
    setJobModalMode("edit");
  };
  const closeJobModal = () => {
    setJobModalMode("");
    setSelectedJob(null);
    setJobActionForm({});
    setJobActionSaving(false);
  };
  const saveJobEdit = async (event) => {
    event.preventDefault();
    if (!selectedJob) return;

    try {
      setJobActionSaving(true);
      const payload = jobEditFields.reduce((current, field) => {
        current[field] = jobActionForm[field] || "";
        return current;
      }, {});
      await apiRequest(`/jobs/${selectedJob.id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setNotice("Iklan jawatan berjaya dikemaskini.");
      closeJobModal();
      loadData();
    } catch (error) {
      setNotice(error.message || "Iklan jawatan tidak dapat dikemaskini.");
      setJobActionSaving(false);
    }
  };
  const requestDeleteJob = (job) => {
    setJobDeleteTarget(job);
  };
  const confirmDeleteJob = async () => {
    if (!jobDeleteTarget) return;
    try {
      setJobActionSaving(true);
      await apiRequest(`/jobs/${jobDeleteTarget.id}/`, { method: "DELETE" });
      setNotice("Iklan jawatan telah dipadam.");
      setJobDeleteTarget(null);
      setJobActionSaving(false);
      loadData();
    } catch (error) {
      setNotice(error.message || "Iklan jawatan tidak dapat dipadam.");
      setJobActionSaving(false);
    }
  };
  const submitJob = async (event) => {
    event.preventDefault();
    try {
      const payload = new FormData();
      const normalizedJobForm = {
        ...jobForm,
        location: jobForm.location || "Dewan Bandaraya Kuching Utara, Bukit Siol, Jalan Semariang, Petra Jaya, 93050, Kuching, Sarawak",
        summary: jobForm.summary || buildQuickJobSummary(jobForm),
      };
      Object.entries(normalizedJobForm).forEach(
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
  const activeManageOpportunityLabel = activeVacancyType === "job" ? "Jawatan Kosong DBKU" : activeOpportunityLabel;
  const activeMetrics = dashboardMetrics[activeVacancyType] || dashboardMetrics.job;
  const overallMetrics = dashboardMetrics.all;
  const summaryMetrics = dashboardMetrics.summary;
  const jobYearOptions = Array.from(
    new Set(activeMetrics.jobs.map((job) => getJobDateParts(job).year).filter(Boolean)),
  ).sort((first, second) => Number(second) - Number(first));
  const isJobFilterActive = jobMonthFilter !== "all" || jobStatusFilter !== "all" || jobYearFilter !== "all";
  const resetJobFilters = () => {
    setJobMonthFilter("all");
    setJobYearFilter("all");
    setJobStatusFilter("all");
  };
  const filteredJobs = activeMetrics.jobs.filter((job) => {
    const jobDate = getJobDateParts(job);
    return (
      (jobMonthFilter === "all" || jobDate.month === jobMonthFilter) &&
      (jobYearFilter === "all" || jobDate.year === jobYearFilter) &&
      (jobStatusFilter === "all" || getJobDisplayStatus(job) === jobStatusFilter)
    );
  });
  const filteredApplications = activeMetrics.applications;
  const selectedApplication = activeApplicationId
    ? activeMetrics.applications.find((application) => String(application.id) === String(activeApplicationId))
    : null;
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
              <p className="text-xs text-slate-500">{shellRoleLabel}</p>
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
          {visibleAdminNavItems.map((item, index) => {
            if (item.kind === "section") {
              return isSidebarOpen ? (
                <p
                  className="px-4 pb-2 pt-4 text-[13px] font-bold text-slate-400"
                  key={item.label}
                >
                  {item.label}
                </p>
              ) : (
                <div className="h-6" key={item.label} />
              );
            }

            const sidebarBadgeCount = getSidebarApplicationBadgeCount(item, dashboardMetrics, { isHrmWorkspace });

            return (
              <NavLink
                className={({ isActive }) => {
                  const isDetailActive = panel === "application-detail" && item.to === ADMIN_ROUTES.applications.internship;
                  return `relative flex w-full items-center rounded-md py-3 text-left text-[14px] font-bold ${isSidebarOpen ? "gap-4 px-4" : "justify-center px-0"} ${isActive || isDetailActive ? "bg-emerald-50 text-slate-950" : "text-slate-950"}`;
                }}
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
                  <>
                    <span className="min-w-0 flex-1">{item.label}</span>
                    {sidebarBadgeCount > 0 ? (
                      <span
                        className="hrm-sidebar-badge"
                        aria-label={`${sidebarBadgeCount} permohonan baharu`}
                      >
                        {formatSidebarBadgeCount(sidebarBadgeCount)}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <>
                    <span className="sr-only">{item.label}</span>
                    {sidebarBadgeCount > 0 ? (
                      <span
                        className="hrm-sidebar-badge collapsed"
                        aria-label={`${sidebarBadgeCount} permohonan baharu`}
                      >
                        {formatSidebarBadgeCount(sidebarBadgeCount)}
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <main
        className={`min-h-screen bg-slate-50 transition-[margin] duration-200 ${isSidebarOpen ? "ml-[350px]" : "ml-[72px]"}`}
      >
        <header className="hrm-sticky-topbar flex h-[72px] items-center justify-between border-b border-emerald-100 bg-white px-11">
          <div>
            <p className="text-sm font-bold text-slate-950">Selamat datang</p>
            <strong className="mt-1 block text-[17px] text-slate-950">
              {user.full_name || user.first_name || shellRoleLabel}
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
                      {user.full_name || user.first_name || shellRoleLabel}
                    </strong>
                    <em>{user.email || shellRoleLabel}</em>
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
          {panel === "applicants" && <SuperAdminApplicantsPanel allowDelete={false} compact />}
          {panel === "create" && (
            <>
              <div className="hrm-heading">
                <div>
                  <h1 className="text-3xl font-bold text-slate-950">{isInternshipForm ? "Siarkan jawatan latihan industri baharu" : "Siarkan jawatan DBKU baharu"}</h1>
                  <p>Masukkan ringkasan penting. Maklumat penuh disediakan melalui dokumen rasmi untuk dimuat turun pemohon.</p>
                </div>
              </div>
              <form className="simple-job-form" onSubmit={submitJob}>
              <label>Tajuk jawatan<input required value={jobForm.title} onChange={(event) => setJobForm({ ...jobForm, title: event.target.value })} placeholder={isInternshipForm ? "cth. Latihan Industri Teknologi Maklumat" : "cth. Penolong Pegawai Penerangan Gred S5"} /></label>
              <label>Bahagian<select required value={jobForm.division || ""} onChange={(event) => setJobForm({ ...jobForm, division: event.target.value })}><option value="">Sila pilih</option>{dbkuDepartments.map((division) => <option key={division.code} value={division.name}>{division.name} ({division.code})</option>)}</select></label>
              <label>Jabatan<input required value={jobForm.department} onChange={(event) => setJobForm({ ...jobForm, department: event.target.value })} placeholder="cth. Jabatan Pentadbiran" /></label>
              <label>Lokasi<input value={jobForm.location || ""} onChange={(event) => setJobForm({ ...jobForm, location: event.target.value })} placeholder="cth. Petra Jaya, Kuching" /></label>
              <label>Taraf jawatan<select value={jobForm.employment_type} onChange={(event) => setJobForm({ ...jobForm, employment_type: event.target.value })}><option value="">Pilih jenis</option><option>Tetap</option><option>Kontrak</option></select></label>
              <label>Tarikh tutup<input required type="date" value={jobForm.closing_date} onChange={(event) => setJobForm({ ...jobForm, closing_date: event.target.value })} /></label>
              <label>Dokumen rasmi untuk pemohon<input required type="file" accept="application/pdf,image/png,image/jpeg" onChange={(event) => setDocumentFile(event.target.files?.[0] || null)} /><small>Muat naik fail iklan atau borang permohonan. Pemohon akan memuat turun fail ini untuk butiran penuh.</small></label>
              <button className="hrm-primary" type="submit"><Icon>add_circle</Icon>Siarkan jawatan</button>
              </form>
            </>
          )}
          {panel === "dashboard" && (
            <>
              <div className="hrm-heading">
                <div>
                  <h1 className="text-3xl font-bold text-slate-950">Papan pemuka {workspaceLabel}</h1>
                  <p>
                    {isHrmWorkspace
                      ? "Semak permohonan baharu, iklan aktif dan saluran pengambilan."
                      : `Semak permohonan yang dihantar kepada ${user?.department || "bahagian anda"}.`}
                  </p>
                </div>
              </div>
              <div className="hrm-stats">
                <Stat icon="work_history" label="Iklan jawatan aktif" value={summaryMetrics.activeJobAds} tone="green" />
                <Stat icon="description" label="Jumlah permohonan" value={summaryMetrics.totalApplications} tone="blue" />
                <Stat icon="stars" label="Disenarai pendek" value={summaryMetrics.shortlist} tone="mint" />
                <Stat icon="notifications" label="Permohonan baharu" value={summaryMetrics.newApplications} tone="amber" />
              </div>
              <div className="hrm-grid hrm-dashboard-grid">
                <RecentApplicationsPanel
                  applications={overallMetrics.applications}
                  applicationLinks={isHrmWorkspace ? undefined : []}
                  onOpenApplications={(vacancyType) => {
                    if (!isHrmWorkspace || vacancyType === "internship") {
                      navigate(ADMIN_ROUTES.applications.internship);
                      return;
                    }
                    openFilteredPanel("Permohonan Jawatan DBKU", "Permohonan", vacancyType);
                  }}
                  onReview={setReview}
                />
                <aside className="hrm-dashboard-side">
                  <DashboardChannelsPanel
                    title={isHrmWorkspace ? "Saluran pengambilan" : "Ringkasan bahagian"}
                    subtitle={
                      isHrmWorkspace
                        ? "Ringkasan jawatan DBKU dan latihan industri"
                        : `Permohonan yang dihantar kepada ${user?.department || "bahagian anda"}`
                    }
                    channels={(isHrmWorkspace ? dashboardTypes : dashboardTypes.filter((item) => item.type === "internship")).map((item) => ({
                      ...item,
                      metrics: dashboardMetrics[item.type],
                      onCreate: isHrmWorkspace && item.type === "job" ? () => openCreatePanel("Tambah Jawatan DBKU", item.type) : null,
                      onManage: isHrmWorkspace && item.type === "job" ? () => openFilteredPanel("Urus Jawatan DBKU", "Urus Jawatan", item.type) : null,
                      onViewApplications: isHrmWorkspace ? () => openFilteredPanel(item.applicationsLabel, "Permohonan", item.type) : null,
                    }))}
                  />
                  <StatusSummaryPanel applications={overallMetrics.applications} />
                </aside>
              </div>
            </>
          )}
          {panel === "advanced-create" && (
            <>
              <div className="hrm-heading">
                <div>
                  <h1 className="text-3xl font-bold text-slate-950">Siarkan peluang baharu</h1>
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
                  <h1 className="text-3xl font-bold text-slate-950">Senarai {activeManageOpportunityLabel}</h1>
                  <p>Semak semua iklan {activeManageOpportunityLabel.toLowerCase()} yang telah disiarkan.</p>
                </div>
                {isHrmWorkspace ? (
                  <button
                    className="hrm-primary"
                    type="button"
                    onClick={() => {
                      openCreatePanel(activeVacancyType === "internship" ? "Tambah Latihan Industri" : "Tambah Jawatan DBKU", activeVacancyType);
                    }}
                  >
                    <Icon>add_circle</Icon>Tambah {activeManageOpportunityLabel}
                  </button>
                ) : null}
              </div>
              <section className="hrm-card hrm-table-card">
                <div className="applicant-table-toolbar hrm-manage-toolbar">
                  <div className="applicant-table-controls hrm-manage-filters">
                    <label>
                      <span>Bulan</span>
                      <select value={jobMonthFilter} onChange={(event) => setJobMonthFilter(event.target.value)}>
                        <option value="all">Semua</option>
                        {monthFilterOptions.map((month) => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Tahun</span>
                      <select value={jobYearFilter} onChange={(event) => setJobYearFilter(event.target.value)}>
                        <option value="all">Semua</option>
                        {jobYearOptions.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Status</span>
                      <select value={jobStatusFilter} onChange={(event) => setJobStatusFilter(event.target.value)}>
                        {jobStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.value === "all" ? "Semua" : option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="hrm-filter-reset" type="button" onClick={resetJobFilters}>
                      Set semula
                    </button>
                  </div>
                </div>
                <JobManagementTable
                  jobs={filteredJobs}
                  applications={applications}
                  emptyMessage={
                    activeMetrics.jobs.length && isJobFilterActive
                      ? `Tiada ${activeManageOpportunityLabel.toLowerCase()} dengan filter ini.`
                      : ""
                  }
                  itemLabel={activeManageOpportunityLabel.toLowerCase()}
                  onDelete={isHrmWorkspace ? requestDeleteJob : null}
                  onEdit={isHrmWorkspace ? openJobEdit : null}
                  onView={openJobView}
                />
              </section>
            </>
          )}
          {panel === "applications" && (
            <>
              <div className="hrm-heading">
                <div>
                  <h1 className="text-3xl font-bold text-slate-950">Permohonan {activeOpportunityLabel}</h1>
                  <p>
                    Pilih calon yang memenuhi keperluan {activeOpportunityLabel.toLowerCase()} dengan lebih cepat.
                  </p>
                </div>
              </div>
              <section className="hrm-card hrm-table-card">
                {activeVacancyType !== "internship" ? (
                  <header>
                    <div>
                      <h2>Permohonan {activeOpportunityLabel}</h2>
                      <p>{filteredApplications.length} permohonan direkodkan</p>
                    </div>
                  </header>
                ) : null}
                {activeVacancyType === "internship" ? (
                  <InternshipApplicationsPanel
                    applications={filteredApplications}
                    isHrmWorkspace={isHrmWorkspace}
                    onView={(application) => navigate(`${ADMIN_ROUTES.applications.internship}/${application.id}`)}
                  />
                ) : (
                  <ApplicationTable
                    applications={filteredApplications}
                    onReview={setReview}
                  />
                )}
              </section>
            </>
          )}
          {panel === "application-detail" && (
            <InternshipApplicationDetailPage
              application={selectedApplication}
              isHrmWorkspace={isHrmWorkspace}
              loading={loading}
              onBack={() => navigate(ADMIN_ROUTES.applications.internship)}
              onReview={async (id, status, options) => {
                await setReview(id, status, options);
                navigate(ADMIN_ROUTES.applications.internship);
              }}
              onSaveAssessment={saveHrmAssessment}
              onDepartmentDecisionSubmitted={() => navigate(ADMIN_ROUTES.applications.internship)}
              onSaveDepartmentDecision={saveDepartmentDecision}
              onDeleteOrganizationFeedbackDocument={deleteOrganizationFeedbackDocument}
              onOrganizationFeedbackSent={() => navigate(ADMIN_ROUTES.applications.internship)}
              onSaveOrganizationFeedbackDocument={saveOrganizationFeedbackDocument}
              onSendOrganizationFeedbackToApplicant={sendOrganizationFeedbackToApplicant}
              user={user}
            />
          )}
        </section>
        {jobModalMode && selectedJob ? (
          <JobActionModal
            form={jobActionForm}
            job={selectedJob}
            mode={jobModalMode}
            onChange={(field, value) => setJobActionForm((current) => ({ ...current, [field]: value }))}
            onClose={closeJobModal}
            onSave={saveJobEdit}
            saving={jobActionSaving}
          />
        ) : null}
        {jobDeleteTarget ? (
          <JobDeleteModal
            job={jobDeleteTarget}
            onCancel={() => setJobDeleteTarget(null)}
            onConfirm={confirmDeleteJob}
            saving={jobActionSaving}
          />
        ) : null}
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
function RecentApplicationsPanel({ applications, applicationLinks = dashboardTypes, onOpenApplications, onReview }) {
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const yearOptions = useMemo(() => {
    const years = new Set(
      applications
        .map((application) => getApplicationDateParts(application).year)
        .filter(Boolean),
    );
    return Array.from(years).sort((first, second) => Number(second) - Number(first));
  }, [applications]);
  const recentApplications = useMemo(
    () => buildRecentApplicationsView(applications, {
      month: monthFilter,
      page: currentPage,
      pageSize: 5,
      year: yearFilter,
    }),
    [applications, currentPage, monthFilter, yearFilter],
  );
  const updateMonthFilter = (value) => {
    setMonthFilter(value);
    setCurrentPage(1);
  };
  const updateYearFilter = (value) => {
    setYearFilter(value);
    setCurrentPage(1);
  };

  return (
    <section className="hrm-card hrm-table-card hrm-recent-card">
      <header>
        <div>
          <h2>Permohonan terkini</h2>
        </div>
        <div className="hrm-recent-tools">
          <label>
            <span>Bulan</span>
            <select value={monthFilter} onChange={(event) => updateMonthFilter(event.target.value)}>
              <option value="all">Semua</option>
              {monthFilterOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Tahun</span>
            <select value={yearFilter} onChange={(event) => updateYearFilter(event.target.value)}>
              <option value="all">Semua</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <div className="hrm-card-actions">
            {applicationLinks.map((link) => (
              <button key={link.type} onClick={() => onOpenApplications(link.type)} type="button">
                {link.label} <Icon>chevron_right</Icon>
              </button>
            ))}
          </div>
        </div>
      </header>
      <ApplicationTable applications={recentApplications.visibleApplications} onReview={onReview} compact />
      <footer className="hrm-recent-pagination">
        <span>
          {recentApplications.total
            ? `Memaparkan ${recentApplications.visibleStart}-${recentApplications.visibleEnd} daripada ${recentApplications.total} permohonan`
            : "Tiada permohonan untuk paparan ini."}
        </span>
        <div>
          <button
            type="button"
            aria-label="Halaman sebelumnya"
            disabled={recentApplications.activePage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            &lt;
          </button>
          <strong>{recentApplications.activePage} / {recentApplications.totalPages}</strong>
          <button
            type="button"
            aria-label="Halaman seterusnya"
            disabled={recentApplications.activePage === recentApplications.totalPages}
            onClick={() => setCurrentPage((page) => Math.min(recentApplications.totalPages, page + 1))}
          >
            &gt;
          </button>
        </div>
      </footer>
    </section>
  );
}
function DashboardChannelsPanel({ channels, subtitle = "Ringkasan jawatan DBKU dan latihan industri", title = "Saluran pengambilan" }) {
  return (
    <section className="hrm-card hrm-channel-card">
      <header>
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </header>
      <div className="hrm-channel-list">
        {channels.map((channel) => (
          <article key={channel.type}>
            <div>
              <span>{channel.label}</span>
            </div>
            <dl>
              <div>
                <dt>Permohonan</dt>
                <dd>{channel.metrics?.total || 0}</dd>
              </div>
              <div>
                <dt>Baharu</dt>
                <dd>{channel.metrics?.new || 0}</dd>
              </div>
              <div>
                <dt>Pendek</dt>
                <dd>{channel.metrics?.shortlist || 0}</dd>
              </div>
            </dl>
            <footer>
              {channel.onCreate ? (
                <button className="primary" onClick={channel.onCreate} type="button">
                  <Icon>add_circle</Icon>Tambah
                </button>
              ) : null}
              {channel.onManage ? <button onClick={channel.onManage} type="button">Urus</button> : null}
              {channel.onViewApplications ? <button onClick={channel.onViewApplications} type="button">Permohonan</button> : null}
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
function StatusSummaryPanel({ applications }) {
  return (
    <section className="hrm-card hrm-status-card">
      <header>
        <div>
          <h2>Status permohonan</h2>
          <p>Keadaan semasa untuk tindakan HRM</p>
        </div>
      </header>
      <div className="hrm-status-list">
        {applicationStatusKeys.map((status) => {
          const statusCount = applications.filter((app) => app.status === status).length;
          const statusPercent = applications.length ? Math.max(6, (statusCount / applications.length) * 100) : 0;
          return (
            <div key={status}>
              <span><Badge status={status} /></span>
              <i><b style={{ width: `${statusPercent}%` }} /></i>
              <strong>{statusCount}</strong>
            </div>
          );
        })}
      </div>
      <footer>
        <Icon>history</Icon> Dikemas kini langsung
      </footer>
    </section>
  );
}
function JobManagementTable({ jobs, applications, emptyMessage = "", itemLabel = "jawatan", onDelete, onEdit, onView }) {
  const rowsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(jobs.length / rowsPerPage));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * rowsPerPage;
  const visibleJobs = jobs.slice(startIndex, startIndex + rowsPerPage);
  const visibleStart = jobs.length ? startIndex + 1 : 0;
  const visibleEnd = Math.min(startIndex + rowsPerPage, jobs.length);

  if (!jobs.length)
    return <p className="hrm-empty">{emptyMessage || `Belum ada ${itemLabel} disiarkan.`}</p>;

  return (
    <>
    <div className="hrm-table-wrap">
      <table className="hrm-job-management-table">
        <thead>
          <tr>
            <th>Bil.</th>
            <th>Tajuk jawatan</th>
            <th>Tarikh siar</th>
            <th>Tarikh tutup</th>
            <th>Pemohon</th>
            <th>Status</th>
            <th>Tindakan</th>
          </tr>
        </thead>
        <tbody>
          {visibleJobs.map((job, index) => {
            const applicantCount = applications.filter(
              (application) => application.vacancy === job.id,
            ).length;
            const isOpen = getJobDisplayStatus(job) === "active";
            const statusText = getJobStatusText(job);
            return (
              <tr key={job.id}>
                <td>{startIndex + index + 1}</td>
                <td>{job.title || "—"}</td>
                <td>{dateValue(job.created_at)}</td>
                <td>{dateValue(job.closing_date)}</td>
                <td>{applicantCount}</td>
                <td>
                  <span className={`hrm-badge ${isOpen ? "green" : "slate"}`}>
                    {statusText}
                  </span>
                </td>
                <td>
                  <div className="hrm-actions hrm-job-actions">
                    <button className="view" type="button" aria-label="Lihat" title="Lihat" onClick={() => onView(job)}>
                      <Icon>visibility</Icon>
                    </button>
                    {onEdit ? (
                      <button className="edit" type="button" aria-label="Kemaskini" title="Kemaskini" onClick={() => onEdit(job)}>
                        <Icon>edit</Icon>
                      </button>
                    ) : null}
                    {onDelete ? (
                      <button className="delete" type="button" aria-label="Padam" title="Padam" onClick={() => onDelete(job)}>
                        <Icon>delete</Icon>
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    <footer className="hrm-pagination hrm-job-management-pagination">
      <span>
        Memaparkan {visibleStart}-{visibleEnd} daripada {jobs.length} rekod
      </span>
      <div>
        <button
          type="button"
          aria-label="Halaman sebelumnya"
          disabled={activePage === 1}
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
        >
          &lt;
        </button>
        <strong>{activePage} / {totalPages}</strong>
        <button
          type="button"
          aria-label="Halaman seterusnya"
          disabled={activePage === totalPages}
          onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
        >
          &gt;
        </button>
      </div>
    </footer>
    </>
  );
}
function JobActionModal({ form, job, mode, onChange, onClose, onSave, saving }) {
  const isEdit = mode === "edit";
  const isOpen = job.is_open ?? job.status === "open";

  return (
    <div className="hrm-modal-backdrop" role="presentation">
      <section className="hrm-job-modal" role="dialog" aria-modal="true" aria-labelledby={isEdit ? "job-action-mode" : "job-action-title"}>
        <header>
          <div>
            <span className="hrm-eyebrow" id={isEdit ? "job-action-mode" : undefined}>{isEdit ? "EDIT IKLAN" : "BUTIRAN IKLAN"}</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Tutup">×</button>
        </header>

        {isEdit ? (
          <form className="hrm-job-modal-form" onSubmit={onSave}>
            <label>Tajuk jawatan<input required value={form.title || ""} onChange={(event) => onChange("title", event.target.value)} /></label>
            <label>Bahagian<select required value={form.division || ""} onChange={(event) => onChange("division", event.target.value)}><option value="">Sila pilih</option>{dbkuDepartments.map((division) => <option key={division.code} value={division.name}>{division.name} ({division.code})</option>)}</select></label>
            <label>Jabatan<input required value={form.department || ""} onChange={(event) => onChange("department", event.target.value)} /></label>
            <label>Lokasi<input value={form.location || ""} onChange={(event) => onChange("location", event.target.value)} /></label>
            <div className="hrm-form-two">
              <label>Taraf jawatan<select value={form.employment_type || ""} onChange={(event) => onChange("employment_type", event.target.value)}><option value="">Pilih jenis</option><option>Tetap</option><option>Kontrak</option></select></label>
              <label>Status<select value={form.status || "open"} onChange={(event) => onChange("status", event.target.value)}><option value="open">Aktif</option><option value="closed">Ditutup</option><option value="draft">Draf</option><option value="archived">Arkib</option></select></label>
            </div>
            <label>Tarikh tutup<input type="date" value={form.closing_date || ""} onChange={(event) => onChange("closing_date", event.target.value)} /></label>
            <footer>
              <button className="hrm-secondary" type="button" onClick={onClose}>Batal</button>
              <button className="hrm-primary" type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</button>
            </footer>
          </form>
        ) : (
          <div className="hrm-job-modal-details hrm-job-preview">
            <h2 id="job-action-title">{job.title}</h2>
            <div className="market-detail-department">{job.department || "Dewan Bandaraya Kuching Utara"}</div>
            <div className="market-detail-meta">
              <span><Icon>work</Icon>Taraf jawatan: {job.employment_type || "—"}</span>
              <span><Icon>apartment</Icon>Bahagian: {job.division || "—"}</span>
              <span><Icon>location_on</Icon>{job.location || "—"}</span>
              <span><Icon>event</Icon>Tarikh tutup: {dateValue(job.closing_date)}</span>
            </div>
            <div className="market-detail-document">
              <span>Untuk mengetahui lebih lanjut, sila klik di sini:</span>
              {job.official_document ? (
                <a href={job.official_document_view_url || job.official_document} target="_blank" rel="noreferrer">
                  Muat turun dokumen
                </a>
              ) : (
                <strong>Dokumen belum tersedia</strong>
              )}
            </div>
            <div className="hrm-preview-status">
              <span className={`hrm-badge ${isOpen ? "green" : "slate"}`}>{isOpen ? "Aktif" : "Ditutup"}</span>
              <small>Disiarkan {dateValue(job.created_at)}</small>
            </div>
            <footer>
              <button className="hrm-primary" type="button" onClick={onClose}>Tutup</button>
            </footer>
          </div>
        )}
      </section>
    </div>
  );
}
function JobDeleteModal({ job, onCancel, onConfirm, saving }) {
  return (
    <div className="hrm-modal-backdrop" role="presentation">
      <section className="hrm-job-modal hrm-delete-modal" role="dialog" aria-modal="true" aria-labelledby="job-delete-title">
        <header>
          <div>
            <span className="hrm-eyebrow">PADAM IKLAN</span>
            <h2 id="job-delete-title">Padam iklan jawatan?</h2>
          </div>
          <button type="button" onClick={onCancel} aria-label="Tutup">×</button>
        </header>
        <div className="hrm-job-modal-details">
          <p className="hrm-delete-message">
            Adakah anda pasti mahu memadam iklan <strong>{job.title}</strong>? Tindakan ini tidak boleh dibuat asal.
          </p>
          <footer>
            <button className="hrm-secondary" type="button" onClick={onCancel} disabled={saving}>Batal</button>
            <button className="hrm-danger" type="button" onClick={onConfirm} disabled={saving}>
              {saving ? "Memadam..." : "Padam iklan"}
            </button>
          </footer>
        </div>
      </section>
    </div>
  );
}
function getApplicationDateValue(application) {
  return application?.submitted_at || application?.created_at || "";
}
function getApplicationDateParts(application) {
  const value = getApplicationDateValue(application);
  if (!value) return { month: "", year: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { month: "", year: "" };
  return {
    month: String(date.getMonth() + 1),
    year: String(date.getFullYear()),
  };
}
function formatReferenceNo(application) {
  const referenceNo = String(application?.reference_no || "").trim();
  if (!referenceNo) return "Belum dijana";
  if (referenceNo.startsWith("PK.")) return referenceNo;

  const legacyMatch = referenceNo.match(/^DBKU-CAR-(\d+)$/i);
  if (!legacyMatch) return referenceNo;

  const applicationDate = new Date(getApplicationDateValue(application));
  const year = Number.isNaN(applicationDate.getTime()) ? new Date().getFullYear() : applicationDate.getFullYear();
  const sequence = Number.parseInt(legacyMatch[1], 10);
  return `PK.${year}-${String(sequence || 1).padStart(4, "0").slice(-4)}`;
}
function getInternshipStudentInfo(application) {
  return application?.profile_data?.student_info || {};
}
function getInternshipInstitution(application) {
  return getInternshipStudentInfo(application).institution || "Belum diisi";
}
function getInternshipStudentName(application) {
  const studentInfo = getInternshipStudentInfo(application);
  return studentInfo.name || application?.applicant_name || "Belum diisi";
}
function getInternshipStudentIdentityNo(application) {
  const studentInfo = getInternshipStudentInfo(application);
  return studentInfo.icNo || studentInfo.identificationNumber || application?.applicant_detail?.mykad_number || "Belum diisi";
}
function getInternshipProgram(application) {
  return getInternshipStudentInfo(application).program || "Belum diisi";
}
function getInternshipPlacementDepartment(application) {
  const department =
    application?.assigned_department ||
    getSavedDepartmentDecision(application).department ||
    application?.profile_data?.internship_vacancy?.division ||
    application?.vacancy_detail?.division ||
    "Belum ditetapkan";
  return String(department).replace(/\s*\([^)]+\)\s*$/, "");
}
function getFirstAvailableDateValue(...values) {
  return values.find((value) => String(value || "").trim()) || "";
}
function getInternshipPeriod(application) {
  const studentInfo = getInternshipStudentInfo(application);
  const startDate = getFirstAvailableDateValue(
    studentInfo.trainingStartDate,
    studentInfo.training_start_date,
    studentInfo.internshipStartDate,
    studentInfo.internship_start_date,
    studentInfo.practicalStartDate,
  );
  const endDate = getFirstAvailableDateValue(
    studentInfo.trainingEndDate,
    studentInfo.training_end_date,
    studentInfo.internshipEndDate,
    studentInfo.internship_end_date,
    studentInfo.practicalEndDate,
  );

  if (startDate && endDate) return `${dateValue(startDate)} - ${dateValue(endDate)}`;
  return studentInfo.trainingPeriod || studentInfo.internshipPeriod || "Belum ditetapkan";
}
function formatOrganizationFeedbackFileSize(size) {
  const numericSize = Number(size);
  if (!Number.isFinite(numericSize) || numericSize <= 0) return "";
  if (numericSize < 1024) return `${numericSize} B`;
  if (numericSize < 1024 * 1024) return `${(numericSize / 1024).toFixed(1)} KB`;
  return `${(numericSize / (1024 * 1024)).toFixed(1)} MB`;
}
function getOrganizationFeedbackDocuments(application) {
  const documents = application?.document_files?.organizationFeedbackDocuments;
  if (Array.isArray(documents) && documents.length) {
    return documents.map((document, index) => ({
      id: document.id || String(index + 1),
      name: document.name || "Dokumen maklumbalas organisasi",
      url: document.url || "",
      size: document.size || 0,
      sizeLabel: document.size_label || document.sizeLabel || formatOrganizationFeedbackFileSize(document.size),
      uploadedAt: document.uploaded_at || document.uploadedAt || "",
    }));
  }

  const legacyDocument = application?.document_files?.organizationFeedbackDocument;
  if (!legacyDocument?.url) return [];

  return [{
    id: "legacy",
    name: legacyDocument.name || application?.profile_data?.organization_feedback?.file_name || "Dokumen maklumbalas organisasi",
    url: legacyDocument.url,
    size: legacyDocument.size || 0,
    sizeLabel:
      legacyDocument.size_label
      || legacyDocument.sizeLabel
      || application?.profile_data?.organization_feedback?.file_size
      || formatOrganizationFeedbackFileSize(legacyDocument.size),
    uploadedAt: legacyDocument.uploaded_at || legacyDocument.uploadedAt || "",
  }];
}
function getOrganizationFeedbackRelease(application) {
  const release = application?.profile_data?.organization_feedback_release;
  return release && typeof release === "object" ? release : {};
}
function getOrganizationFeedbackPeriodValue(application) {
  const releasePeriod = String(getOrganizationFeedbackRelease(application).internship_period || "").trim();
  if (releasePeriod) return releasePeriod;
  const period = getInternshipPeriod(application);
  return period === "Belum ditetapkan" ? "" : period;
}
function getOrganizationFeedbackReportValue(application, field) {
  const release = getOrganizationFeedbackRelease(application);
  const fallback = organizationFeedbackReportDefaults[field] || "";
  return String(release[`report_${field}`] || fallback).trim();
}
function getOrganizationFeedbackConfirmationDate(application) {
  const release = getOrganizationFeedbackRelease(application);
  const fallback = organizationFeedbackReportDefaults.confirmationDate;
  return String(release.confirmation_date || fallback).trim();
}
function InstitutionSearchFilter({ onChange, options, value }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const visibleOptions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return query
      ? options.filter((option) => option.toLowerCase().includes(query))
      : options;
  }, [options, searchTerm]);
  const selectedLabel = value === "all" ? "Semua" : value;

  const chooseInstitution = (nextValue) => {
    onChange(nextValue);
    setSearchTerm("");
    setIsOpen(false);
  };

  return (
    <div
      className="hrm-institution-filter"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
          setSearchTerm("");
        }
      }}
    >
      <button
        className="hrm-institution-filter-trigger"
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{selectedLabel}</span>
        <Icon>expand_more</Icon>
      </button>
      {isOpen ? (
        <div className="hrm-institution-filter-menu" role="listbox" aria-label="Senarai institusi">
          <input
            type="search"
            value={searchTerm}
            placeholder="Cari institusi"
            autoComplete="off"
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <div>
            <button
              className={value === "all" ? "active" : ""}
              type="button"
              role="option"
              aria-selected={value === "all"}
              onClick={() => chooseInstitution("all")}
            >
              Semua
            </button>
            {visibleOptions.length ? (
              visibleOptions.map((institution) => (
                <button
                  className={value === institution ? "active" : ""}
                  key={institution}
                  type="button"
                  role="option"
                  aria-selected={value === institution}
                  onClick={() => chooseInstitution(institution)}
                >
                  {institution}
                </button>
              ))
            ) : (
              <p>Tiada institusi dijumpai.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
function InternshipApplicationsPanel({ applications, isHrmWorkspace, onView }) {
  const rowsPerPage = 5;
  const [institutionFilter, setInstitutionFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const institutionOptions = useMemo(() => {
    const institutions = new Set(
      applications
        .map((application) => getInternshipInstitution(application))
        .filter((institution) => institution && institution !== "Belum diisi"),
    );
    return Array.from(institutions).sort((first, second) => first.localeCompare(second));
  }, [applications]);
  const yearOptions = useMemo(() => {
    const years = new Set(
      applications
        .map((application) => getApplicationDateParts(application).year)
        .filter(Boolean),
    );
    return Array.from(years).sort((first, second) => Number(second) - Number(first));
  }, [applications]);
  const statusOptions = useMemo(() => {
    const statuses = new Set(applications.map((application) => getInternshipApplicationDisplayStatus(application, isHrmWorkspace)));
    return Array.from(statuses);
  }, [applications, isHrmWorkspace]);
  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const institution = getInternshipInstitution(application);
      const applicationDate = getApplicationDateParts(application);
      const displayStatus = getInternshipApplicationDisplayStatus(application, isHrmWorkspace);
      return (
        (institutionFilter === "all" || institution === institutionFilter) &&
        (monthFilter === "all" || applicationDate.month === monthFilter) &&
        (yearFilter === "all" || applicationDate.year === yearFilter) &&
        (statusFilter === "all" || displayStatus === statusFilter)
      );
    });
  }, [applications, institutionFilter, isHrmWorkspace, monthFilter, statusFilter, yearFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / rowsPerPage));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * rowsPerPage;
  const visibleApplications = filteredApplications.slice(startIndex, startIndex + rowsPerPage);
  const visibleStart = filteredApplications.length ? startIndex + 1 : 0;
  const visibleEnd = Math.min(startIndex + rowsPerPage, filteredApplications.length);

  const resetFilters = () => {
    setInstitutionFilter("all");
    setMonthFilter("all");
    setYearFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  return (
    <section className="hrm-internship-applications-card">
      <div className="applicant-table-toolbar hrm-internship-toolbar">
        <div className="applicant-table-controls hrm-internship-filters">
          <div className="hrm-internship-filter-field">
            <span>Nama Institusi</span>
            <InstitutionSearchFilter
              options={institutionOptions}
              value={institutionFilter}
              onChange={(nextInstitution) => {
                setInstitutionFilter(nextInstitution);
                setCurrentPage(1);
              }}
            />
          </div>
          <label>
            <span>Bulan</span>
            <select
              value={monthFilter}
              onChange={(event) => {
                setMonthFilter(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Semua</option>
              {monthFilterOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Tahun</span>
            <select
              value={yearFilter}
              onChange={(event) => {
                setYearFilter(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Semua</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Semua</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusLabel[status] || status}
                </option>
              ))}
            </select>
          </label>
          <button className="hrm-filter-reset" type="button" onClick={resetFilters}>
            Set semula
          </button>
        </div>
      </div>
      <div className="applicant-applications-table-wrap">
        <table className="applicant-applications-table hrm-internship-applications-table">
          <thead>
            <tr>
              <th>No. Rujukan</th>
              <th>Nama Calon</th>
              <th>Nama Institusi</th>
              <th>Tarikh</th>
              <th>Status</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {visibleApplications.length ? (
              visibleApplications.map((application) => {
                const displayStatus = getInternshipApplicationDisplayStatus(application, isHrmWorkspace);
                const showHrmNewBadge = isHrmWorkspace && isHrmPendingDepartmentDecisionApplication(application);
                return (
                  <tr key={application.id}>
                    <td>
                      <div className="hrm-reference-cell">
                        {showHrmNewBadge ? <Badge status="hrm_department_new" /> : null}
                        <span>{formatReferenceNo(application)}</span>
                      </div>
                    </td>
                    <td className="hrm-internship-candidate-name">{application.applicant_name || "Pemohon"}</td>
                    <td>{getInternshipInstitution(application)}</td>
                    <td>{dateValue(getApplicationDateValue(application))}</td>
                    <td>
                      <Badge status={displayStatus} />
                    </td>
                    <td>
                      <div className="hrm-actions hrm-internship-actions">
                        <button className="view" type="button" aria-label="Lihat" title="Lihat" onClick={() => onView(application)}>
                          <Icon>visibility</Icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="applicant-table-empty" colSpan="6">
                  Tiada permohonan latihan industri ditemui.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <footer className="applicant-table-pagination">
        <span>
          Memaparkan {visibleStart}-{visibleEnd} daripada {filteredApplications.length} permohonan
        </span>
        <div>
          <button
            type="button"
            aria-label="Halaman sebelumnya"
            disabled={activePage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            &lt;
          </button>
          <strong>{activePage} / {totalPages}</strong>
          <button
            type="button"
            aria-label="Halaman seterusnya"
            disabled={activePage === totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          >
            &gt;
          </button>
        </div>
      </footer>
    </section>
  );
}
function getSavedHrmAssessment(application) {
  return application?.profile_data?.hrm_assessment || {};
}
function buildHrmAssessmentPayload(application, values) {
  const studentInfo = getInternshipStudentInfo(application);
  return {
    cgpa: studentInfo.cgpa || "",
    decision: values.decision || "",
    education_level: values.educationLevel || "",
    institution: studentInfo.institution || "",
    specialization: studentInfo.program || "",
    updated_at: new Date().toISOString(),
  };
}
function HrmInternshipAssessmentTab({ application, onReview, onSaveAssessment }) {
  const studentInfo = getInternshipStudentInfo(application);
  const savedAssessment = getSavedHrmAssessment(application);
  const [decision, setDecision] = useState(savedAssessment.decision || "");
  const [educationLevel, setEducationLevel] = useState(savedAssessment.education_level || savedAssessment.educationLevel || "");
  const [assignedDepartment, setAssignedDepartment] = useState(application?.assigned_department || "");
  const [isSavingAssessment, setIsSavingAssessment] = useState(false);
  const isFinal = application ? ["shortlisted", "rejected"].includes(application.status) : false;
  const isAssignedToDepartment = Boolean(application?.assigned_department);
  const isAssessmentLocked = isFinal || isAssignedToDepartment;
  const decisions = ["Layak", "Tidak Layak", "Tidak Lengkap"];
  const educationLevels = ["Ijazah", "Diploma", "STPM", "Matrikulasi", "SPM / SPMV"];
  const departmentAssignmentOptions = dbkuDepartments
    .filter((department) => department.code !== "HRM")
    .map((department) => `${department.name} (${department.code})`);
  const saveAssessment = async (values) => {
    if (!application || !onSaveAssessment) return false;

    setIsSavingAssessment(true);
    try {
      await onSaveAssessment(application, buildHrmAssessmentPayload(application, values));
      return true;
    } catch {
      return false;
    } finally {
      setIsSavingAssessment(false);
    }
  };
  const chooseDecision = (item) => {
    if (isAssessmentLocked) return;
    const nextDecision = decision === item ? "" : item;
    setDecision(nextDecision);
  };
  const chooseEducationLevel = (item) => {
    if (isAssessmentLocked) return;
    const nextEducationLevel = educationLevel === item ? "" : item;
    setEducationLevel(nextEducationLevel);
  };
  const reviewWithAssessment = async (status, nextDecision = decision) => {
    if (!application || isAssessmentLocked) return;

    setDecision(nextDecision);
    const isSaved = await saveAssessment({ decision: nextDecision, educationLevel });
    if (!isSaved) return;
    await onReview(
      application.id,
      status,
      status === "shortlisted" ? { assigned_department: assignedDepartment } : {},
    );
  };

  return (
    <div className="hrm-assessment-panel">
      <div className="hrm-assessment-form" aria-label="Borang semakan HRM">
        <h3>UNTUK KEGUNAAN BAHAGIAN PENGURUSAN SUMBER MANUSIA, DBKU</h3>
        <div className="hrm-assessment-grid">
          <section className="hrm-assessment-left">
            <p>Tandakan (/) pada ruangan yang berkenaan.</p>
            <div className="hrm-assessment-options">
              <div>
                <strong>i. Keputusan</strong>
                {decisions.map((item) => (
                  <label key={item}>
                    <span>{item}</span>
                    <input
                      checked={decision === item}
                      disabled={isAssessmentLocked}
                      type="checkbox"
                      onChange={() => chooseDecision(item)}
                    />
                  </label>
                ))}
              </div>
              <div>
                <strong>ii. Tahap Pendidikan</strong>
                {educationLevels.map((item) => (
                  <label key={item}>
                    <span>{item}</span>
                    <input
                      checked={educationLevel === item}
                      disabled={isAssessmentLocked}
                      type="checkbox"
                      onChange={() => chooseEducationLevel(item)}
                    />
                  </label>
                ))}
              </div>
            </div>
          </section>
          <section className="hrm-assessment-right">
            <strong>iii. Keputusan Pendidikan Tinggi</strong>
            <dl>
              <div>
                <dt>Institusi</dt>
                <dd>{studentInfo.institution || ""}</dd>
              </div>
              <div>
                <dt>Pengkhususan</dt>
                <dd>{studentInfo.program || ""}</dd>
              </div>
              <div>
                <dt>CGPA</dt>
                <dd>{studentInfo.cgpa || ""}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
      <label className="hrm-assignment-target">
        <span>Hantar kepada bahagian</span>
        <select disabled={isAssessmentLocked} value={assignedDepartment} onChange={(event) => setAssignedDepartment(event.target.value)}>
          <option value="">Sila pilih bahagian</option>
          {departmentAssignmentOptions.map((department) => (
            <option key={department} value={department}>{department}</option>
          ))}
        </select>
      </label>
      {!isAssessmentLocked ? (
        <footer className="hrm-application-detail-actions">
          <button
            className="hrm-primary"
            type="button"
            disabled={!application || isSavingAssessment || !assignedDepartment}
            onClick={() => reviewWithAssessment("shortlisted", "Layak")}
          >
            Hantar ke Bahagian
          </button>
          <button
            className="hrm-secondary"
            type="button"
            disabled={!application || isSavingAssessment}
            onClick={() => reviewWithAssessment("incomplete", "Tidak Lengkap")}
          >
            Tidak Lengkap
          </button>
          <button
            className="hrm-danger"
            type="button"
            disabled={!application || isSavingAssessment}
            onClick={() => reviewWithAssessment("rejected", "Tidak Layak")}
          >
            Tidak Layak
          </button>
        </footer>
      ) : null}
    </div>
  );
}
function getSavedDepartmentDecision(application) {
  return application?.profile_data?.department_decision || {};
}
function buildDepartmentDecisionPayload(application, user, values) {
  const savedDecision = getSavedDepartmentDecision(application);
  return {
    ...savedDecision,
    department: application?.assigned_department || user?.department || "",
    recommendation: values.recommendation || "",
    remarks: values.remarks || "",
    submitted_at: new Date().toISOString(),
    submitted_by: user?.full_name || user?.name || user?.email || "",
  };
}
function DepartmentDecisionConfirmModal({ isSaving, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-5" role="presentation">
      <section className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="department-decision-confirm-message">
        <div className="px-6 py-5">
          <p id="department-decision-confirm-message" className="text-sm leading-6 text-slate-600">
            Anda yakin mahu menghantar keputusan bahagian ini kepada HRM?
          </p>
          <footer className="mt-6 flex justify-end gap-3">
            <button className="rounded-md border border-slate-300 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70" type="button" onClick={onCancel} disabled={isSaving}>
              Tidak
            </button>
            <button className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70" type="button" onClick={onConfirm} disabled={isSaving}>
              {isSaving ? "Menghantar..." : "Ya"}
            </button>
          </footer>
        </div>
      </section>
    </div>
  );
}
function OrganizationFeedbackSendConfirmModal({ isSaving, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-5" role="presentation">
      <section className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="organization-feedback-confirm-message">
        <div className="px-6 py-5">
          <p id="organization-feedback-confirm-message" className="text-sm leading-6 text-slate-600">
            Anda yakin mahu menghantar maklumbalas organisasi ini kepada pemohon?
          </p>
          <footer className="mt-6 flex justify-end gap-3">
            <button className="rounded-md border border-slate-300 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70" type="button" onClick={onCancel} disabled={isSaving}>
              Tidak
            </button>
            <button className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70" type="button" onClick={onConfirm} disabled={isSaving}>
              {isSaving ? "Menghantar..." : "Ya"}
            </button>
          </footer>
        </div>
      </section>
    </div>
  );
}
function DepartmentDecisionTab({ application, isReadOnly = false, onSaveDecision, onSubmitted, user }) {
  const savedDecision = getSavedDepartmentDecision(application);
  const [recommendation, setRecommendation] = useState(savedDecision.recommendation || "");
  const [remarks, setRemarks] = useState(savedDecision.remarks || "");
  const [message, setMessage] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isSubmitted = Boolean(savedDecision.submitted_at);
  const isLocked = isReadOnly || isSubmitted;
  const canSubmit = Boolean(!isLocked && recommendation && remarks.trim() && application && onSaveDecision);

  const requestSubmitDecision = () => {
    if (!canSubmit) {
      setMessage("Sila pilih syor dan isi ulasan sebelum hantar kepada HRM.");
      return;
    }
    setMessage("");
    setShowConfirmModal(true);
  };

  const submitDecision = async () => {
    setIsSaving(true);
    setMessage("");
    try {
      await onSaveDecision(application, buildDepartmentDecisionPayload(application, user, { recommendation, remarks }));
      setShowConfirmModal(false);
      onSubmitted?.();
    } catch (error) {
      setMessage(error.message || "Keputusan bahagian gagal dihantar.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="department-decision-panel">
      <div className="department-decision-form" aria-label="Borang keputusan bahagian">
        <label>
          <span>Syor Bahagian</span>
          <select
            disabled={isLocked}
            value={recommendation}
            onChange={(event) => setRecommendation(event.target.value)}
          >
            <option value="">Sila pilih</option>
            <option value="Terima">Terima</option>
            <option value="Tolak">Tolak</option>
          </select>
        </label>
        <label>
          <span>Ulasan <b>*</b></span>
          <textarea
            disabled={isLocked}
            placeholder="Masukkan ulasan bahagian untuk semakan HRM"
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
          />
        </label>
        <dl>
          <div>
            <dt>Bahagian</dt>
            <dd>{savedDecision.department || application?.assigned_department || user?.department || "Belum dihantar"}</dd>
          </div>
          <div>
            <dt>Tarikh Hantar</dt>
            <dd>{dateValue(savedDecision.submitted_at)}</dd>
          </div>
        </dl>
        {message ? <p className="department-decision-message">{message}</p> : null}
      </div>
      {!isLocked ? (
        <footer className="hrm-application-detail-actions">
          <button
            className="hrm-primary"
            type="button"
            disabled={isSaving || !canSubmit}
            onClick={requestSubmitDecision}
          >
            <Icon>check_circle</Icon>
            {isSaving ? "Menghantar..." : "Hantar ke HRM"}
          </button>
        </footer>
      ) : null}
      {showConfirmModal ? (
        <DepartmentDecisionConfirmModal
          isSaving={isSaving}
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={submitDecision}
        />
      ) : null}
    </div>
  );
}
function OrganizationFeedbackTab({ application, onDeleteDocument, onSaveDocument, onSendToApplicant, onSubmitted }) {
  const [feedbackDocuments, setFeedbackDocuments] = useState(() => getOrganizationFeedbackDocuments(application));
  const [feedbackInternshipPeriod, setFeedbackInternshipPeriod] = useState(() => getOrganizationFeedbackPeriodValue(application));
  const [feedbackReportDate, setFeedbackReportDate] = useState(() => getOrganizationFeedbackReportValue(application, "date"));
  const [feedbackReportTime, setFeedbackReportTime] = useState(() => getOrganizationFeedbackReportValue(application, "time"));
  const [feedbackReportPlace, setFeedbackReportPlace] = useState(() => getOrganizationFeedbackReportValue(application, "place"));
  const [feedbackConfirmationDate, setFeedbackConfirmationDate] = useState(() =>
    getOrganizationFeedbackConfirmationDate(application),
  );
  const [feedbackRelease, setFeedbackRelease] = useState(() => getOrganizationFeedbackRelease(application));
  const [fileInputKey, setFileInputKey] = useState(0);
  const feedbackFileInputRef = useRef(null);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingToApplicant, setIsSendingToApplicant] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState("");
  const [showSendConfirmModal, setShowSendConfirmModal] = useState(false);
  const studentName = getInternshipStudentName(application);
  const identityNo = getInternshipStudentIdentityNo(application);
  const program = getInternshipProgram(application);
  const placementDepartment = getInternshipPlacementDepartment(application);
  const isSentToApplicant = Boolean(feedbackRelease.sent_to_applicant_at);
  const isPdfFile = (file) => file?.type === "application/pdf" || file?.name?.toLowerCase().endsWith(".pdf");
  const isBusy = isSaving || isSendingToApplicant || Boolean(deletingDocumentId);

  const addDocumentRow = () => {
    if (isSentToApplicant) return;
    setMessage("");
    feedbackFileInputRef.current?.click();
  };

  const clearFeedbackInput = () => {
    setFileInputKey((current) => current + 1);
    if (feedbackFileInputRef.current) {
      feedbackFileInputRef.current.value = "";
    }
  };

  const selectFeedbackFile = (event) => {
    if (isSentToApplicant) return;
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) return;

    if (selectedFiles.some((file) => !isPdfFile(file))) {
      clearFeedbackInput();
      setMessage("Format fail mesti PDF sahaja.");
      return;
    }

    setMessage("");
    void uploadDocuments(selectedFiles);
  };

  const openFeedbackDocumentAction = (document) => {
    if (!document?.url) return;
    window.open(document.url, "_blank", "noreferrer");
  };

  const uploadDocuments = async (filesToUpload) => {
    if (isSentToApplicant) {
      setMessage("Maklumbalas organisasi telah dihantar kepada pemohon dan tidak boleh dikemaskini.");
      return;
    }
    const selectedFiles = Array.isArray(filesToUpload) ? filesToUpload.filter(Boolean) : [filesToUpload].filter(Boolean);
    if (!selectedFiles.length || !onSaveDocument) {
      setMessage("Sila pilih dokumen maklumbalas organisasi terlebih dahulu.");
      return;
    }
    if (selectedFiles.some((file) => !isPdfFile(file))) {
      setMessage("Format fail mesti PDF sahaja.");
      return;
    }

    setIsSaving(true);
    setMessage("");
    try {
      const updatedApplication = await onSaveDocument(application, selectedFiles);
      setFeedbackDocuments(getOrganizationFeedbackDocuments(updatedApplication || application));
      clearFeedbackInput();
      setMessage(
        selectedFiles.length > 1
          ? `${selectedFiles.length} dokumen maklumbalas organisasi telah dimuat naik.`
          : "Dokumen maklumbalas organisasi telah dimuat naik.",
      );
    } catch (error) {
      setMessage(error.message || "Dokumen maklumbalas organisasi gagal dimuat naik.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteFeedbackFile = async (document) => {
    if (!document?.id || !onDeleteDocument || isSentToApplicant) return;

    setDeletingDocumentId(document.id);
    setMessage("");
    try {
      const updatedApplication = await onDeleteDocument(application, document.id);
      setFeedbackDocuments(getOrganizationFeedbackDocuments(updatedApplication || application));
      setMessage("Dokumen maklumbalas organisasi telah dihapuskan.");
    } catch (error) {
      setMessage(error.message || "Dokumen maklumbalas organisasi gagal dihapuskan.");
    } finally {
      setDeletingDocumentId("");
    }
  };

  const removeDocumentRow = async (document) => {
    await deleteFeedbackFile(document);
  };
  const requestSendToApplicant = () => {
    const trimmedPeriod = feedbackInternshipPeriod.trim();
    if (isSentToApplicant) return;
    if (!trimmedPeriod) {
      setMessage("Sila isi tempoh latihan industri / praktikal sebelum hantar kepada pemohon.");
      return;
    }
    if (!feedbackDocuments.length) {
      setMessage("Sila tambah sekurang-kurangnya satu fail maklumbalas organisasi sebelum hantar kepada pemohon.");
      return;
    }
    setMessage("");
    setShowSendConfirmModal(true);
  };
  const sendToApplicant = async () => {
    if (!onSendToApplicant) return;

    setIsSendingToApplicant(true);
    setMessage("");
    try {
      const sentAt = new Date().toISOString();
      const updatedApplication = await onSendToApplicant(application, {
        internshipPeriod: feedbackInternshipPeriod.trim(),
        reportDate: feedbackReportDate.trim(),
        reportTime: feedbackReportTime.trim(),
        reportPlace: feedbackReportPlace.trim(),
        confirmationDate: feedbackConfirmationDate.trim(),
        sentAt,
      });
      setFeedbackRelease(getOrganizationFeedbackRelease(updatedApplication || application));
      setFeedbackDocuments(getOrganizationFeedbackDocuments(updatedApplication || application));
      setShowSendConfirmModal(false);
      setMessage("Maklumbalas organisasi telah dihantar kepada pemohon.");
      onSubmitted?.();
    } catch (error) {
      setMessage(error.message || "Maklumbalas organisasi gagal dihantar kepada pemohon.");
    } finally {
      setIsSendingToApplicant(false);
    }
  };

  return (
    <div className="organization-feedback-panel">
      <div className="organization-feedback-intro">
        <p>Dengan segala hormatnya perkara di atas adalah dirujuk.</p>
        <p>
          Sukacita dimaklumkan bahawa Dewan Bandaraya Kuching Utara tiada halangan untuk menerima pelajar tuan/puan
          bagi menjalani Latihan Industri / Praktikal seperti berikut:-
        </p>
      </div>
      <div className="organization-feedback-table-wrap">
        <table className="organization-feedback-table">
          <thead>
            <tr>
              <th>Nama Pelajar</th>
              <th>
                Tempoh Latihan Industri / Praktikal
                <span className="organization-feedback-required" aria-hidden="true">*</span>
              </th>
              <th>Program</th>
              <th>Bahagian Ditempatkan</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>{studentName}</strong>
                <span>No. Kad Pengenalan: {identityNo}</span>
              </td>
              <td>
                <input
                  aria-label="Tempoh latihan industri atau praktikal"
                  className="organization-feedback-period-input"
                  disabled={isSentToApplicant}
                  onChange={(event) => setFeedbackInternshipPeriod(event.target.value)}
                  placeholder="Contoh: 16 Mac 2026 - 29 Ogos 2026"
                  required
                  type="text"
                  value={feedbackInternshipPeriod}
                />
              </td>
              <td>{program}</td>
              <td>{placementDepartment}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <section className="organization-feedback-section" aria-label="Dokumen maklumbalas organisasi">
        <div className="organization-feedback-section-header">
          <div className="organization-feedback-section-title">
            <h3>
              Dokumen maklumbalas organisasi
              <span className="organization-feedback-required" aria-hidden="true">*</span>
            </h3>
            <p>Wajib muat naik sekurang-kurangnya 1 fail PDF untuk dihantar kepada pemohon. Saiz fail maksimum 15MB.</p>
          </div>
          <div className="organization-feedback-section-actions">
            <button
              className="organization-feedback-add"
              type="button"
              disabled={isBusy || isSentToApplicant}
              onClick={addDocumentRow}
            >
              <Icon>add_circle</Icon>
              <span>Tambah Dokumen</span>
            </button>
          </div>
        </div>
        {message ? <p className="organization-feedback-message">{message}</p> : null}
        <div className="organization-feedback-table-wrap">
          <table className="organization-feedback-document-table">
            <colgroup>
              <col className="organization-feedback-col-index" />
              <col className="organization-feedback-col-format" />
              <col />
              <col className="organization-feedback-col-actions" />
            </colgroup>
            <thead>
              <tr>
                <th>#</th>
                <th>Format</th>
                <th>Lampiran</th>
                <th>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {feedbackDocuments.length ? (
                feedbackDocuments.map((document, index) => (
                  <tr key={document.id || `${document.name}-${index}`}>
                    <td>{index + 1}</td>
                    <td>PDF</td>
                    <td>
                      <div className="organization-feedback-attachment-cell">
                        {document.url ? (
                          <a
                            className="organization-feedback-attachment-link"
                            href={document.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Icon>description</Icon>
                            <span>{document.name}</span>
                          </a>
                        ) : (
                          <p className="organization-feedback-empty">Tiada fail dipilih.</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="organization-feedback-row-actions">
                        <button
                          className="organization-feedback-icon-button organization-feedback-icon-button-view"
                          type="button"
                          disabled={isBusy || !document.url}
                          onClick={() => openFeedbackDocumentAction(document)}
                          aria-label="Lihat fail"
                          title="Lihat fail"
                        >
                          <Icon>visibility</Icon>
                        </button>
                        <button
                          className="organization-feedback-icon-button organization-feedback-icon-button-remove-file"
                          type="button"
                          disabled={isBusy || isSentToApplicant}
                          onClick={() => deleteFeedbackFile(document)}
                          aria-label="Buang fail"
                          title="Buang fail"
                        >
                          <Icon>delete</Icon>
                        </button>
                        <button
                          className="organization-feedback-row-delete"
                          type="button"
                          disabled={isBusy || isSentToApplicant}
                          onClick={() => removeDocumentRow(document)}
                        >
                          Padam baris
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="organization-feedback-empty-row">
                  <td colSpan={4}>--Tiada rekod--</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section className="organization-feedback-report-note" aria-label="Maklumat lapor diri">
        <p>Sehubungan itu, pelajar tuan/puan adalah diminta untuk melapor diri pada tarikh, masa dan tempat seperti berikut:-</p>
        <dl className="organization-feedback-report-details">
          <dt>Tarikh</dt>
          <dd>:</dd>
          <dd>
            <input
              className="organization-feedback-report-input"
              disabled={isSentToApplicant}
              onChange={(event) => setFeedbackReportDate(event.target.value)}
              type="text"
              value={feedbackReportDate}
            />
          </dd>
          <dt>Masa</dt>
          <dd>:</dd>
          <dd>
            <input
              className="organization-feedback-report-input"
              disabled={isSentToApplicant}
              onChange={(event) => setFeedbackReportTime(event.target.value)}
              type="text"
              value={feedbackReportTime}
            />
          </dd>
          <dt>Tempat</dt>
          <dd>:</dd>
          <dd>
            <textarea
              className="organization-feedback-report-input organization-feedback-report-textarea"
              disabled={isSentToApplicant}
              onChange={(event) => setFeedbackReportPlace(event.target.value)}
              rows={5}
              value={feedbackReportPlace}
            />
          </dd>
        </dl>
      </section>
      <section className="organization-feedback-confirmation-note" aria-label="Pengesahan bertulis">
        <p>
          Sila buat pengesahan secara bertulis <strong>(seperti di Lampiran II)</strong> kepada Dewan Bandaraya Kuching Utara
          sebelum atau pada{" "}
          <input
            aria-label="Tarikh akhir pengesahan bertulis"
            className="organization-feedback-inline-date-input"
            disabled={isSentToApplicant}
            onChange={(event) => setFeedbackConfirmationDate(event.target.value)}
            type="text"
            value={feedbackConfirmationDate}
          />
          . Sekiranya pihak kami tidak menerima sebarang maklumbalas selepas tarikh tersebut, maka kami beranggapan bahawa
          anda telah menolak tawaran tersebut. Sebarang surat-menyurat selepas tarikh tersebut tidak akan dilayan.
        </p>
        <p>Sekian. Terima kasih.</p>
      </section>
      <footer className="organization-feedback-send-actions">
        {isSentToApplicant ? (
          <p className="organization-feedback-sent-note">
            Maklumbalas organisasi telah dihantar kepada pemohon pada {dateValue(feedbackRelease.sent_to_applicant_at)}.
          </p>
        ) : null}
        <button
          className="hrm-primary organization-feedback-send"
          type="button"
          disabled={isBusy || isSentToApplicant}
          onClick={requestSendToApplicant}
        >
          {isSendingToApplicant ? "Menghantar..." : isSentToApplicant ? "Telah dihantar kepada pemohon" : "Hantar ke Pemohon"}
        </button>
      </footer>
      <input
        key={fileInputKey}
        ref={feedbackFileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="organization-feedback-hidden-input"
        multiple
        onChange={selectFeedbackFile}
      />
      {showSendConfirmModal ? (
        <OrganizationFeedbackSendConfirmModal
          isSaving={isSendingToApplicant}
          onCancel={() => setShowSendConfirmModal(false)}
          onConfirm={sendToApplicant}
        />
      ) : null}
    </div>
  );
}
function InternshipApplicationDetailPage({
  application,
  isHrmWorkspace,
  loading,
  onBack,
  onDepartmentDecisionSubmitted,
  onReview,
  onSaveAssessment,
  onSaveDepartmentDecision,
  onDeleteOrganizationFeedbackDocument,
  onOrganizationFeedbackSent,
  onSaveOrganizationFeedbackDocument,
  onSendOrganizationFeedbackToApplicant,
  user,
}) {
  const [activeTab, setActiveTab] = useState("Maklumat Peribadi Pemohon");
  const shouldShowDepartmentDecision = !isHrmWorkspace || Boolean(application?.assigned_department);
  const extraTabs = [
    ...(isHrmWorkspace ? [hrmReviewTab] : []),
    ...(shouldShowDepartmentDecision ? [departmentDecisionTab] : []),
    ...(isHrmWorkspace ? [organizationFeedbackTab] : []),
  ];

  return (
    <section className="hrm-application-detail-page">
      <InternshipApplicationReadOnlyPanel
        activeInfoTab={activeTab}
        application={application}
        backLabel="Kembali"
        className="hrm-application-direct-panel"
        error={!loading && !application ? "Permohonan tidak ditemui." : ""}
        extraTabs={extraTabs}
        loading={loading}
        maskAcceptedStatus={false}
        onBack={onBack}
        onTabChange={setActiveTab}
        renderExtraTabContent={(tab) =>
          tab === hrmReviewTab ? (
            <HrmInternshipAssessmentTab
              application={application}
              key={application?.id || "hrm-assessment"}
              onReview={onReview}
              onSaveAssessment={onSaveAssessment}
            />
          ) : tab === departmentDecisionTab ? (
            <DepartmentDecisionTab
              application={application}
              isReadOnly={isHrmWorkspace}
              key={application?.id || "department-decision"}
              onSaveDecision={onSaveDepartmentDecision}
              onSubmitted={onDepartmentDecisionSubmitted}
              user={user}
            />
          ) : tab === organizationFeedbackTab ? (
            <OrganizationFeedbackTab
              application={application}
              key={`${application?.id || "organization-feedback"}-${application?.updated_at || ""}`}
              onDeleteDocument={onDeleteOrganizationFeedbackDocument}
              onSaveDocument={onSaveOrganizationFeedbackDocument}
              onSendToApplicant={onSendOrganizationFeedbackToApplicant}
              onSubmitted={onOrganizationFeedbackSent}
            />
          ) : null
        }
      />
    </section>
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
                      Hantar ke Bahagian
                    </button>
                    <button
                      className="incomplete"
                      onClick={() => onReview(app.id, "incomplete")}
                      disabled={["shortlisted", "rejected"].includes(
                        app.status,
                      )}
                    >
                      Tidak Lengkap
                    </button>
                    <button
                      className="reject"
                      onClick={() => onReview(app.id, "rejected")}
                      disabled={["shortlisted", "rejected"].includes(
                        app.status,
                      )}
                    >
                      Tidak Layak
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
