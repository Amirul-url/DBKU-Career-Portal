import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, getStoredUser } from "../../lib/authApi";
import { APPLICANT_ROUTES } from "../../modules/applicant/applicantRoutes";
import { getSavedVacancies, removeSavedVacancy } from "../../modules/applicant/savedVacancies";
import { useApplicantSidebarState } from "../../modules/applicant/useApplicantSidebarState";
import { Icon } from "./ApplicantAuthShared";
import { ProfileContentHeader, ProfileSidebar } from "./ApplicantProfilePage";

const statusLabels = {
  draft: "Draf",
  incomplete: "Tidak Lengkap",
  rejected: "Ditolak",
  screening: "Dalam semakan",
  shortlisted: "Disenarai pendek",
  submitted: "Dihantar",
  withdrawn: "Ditarik balik",
};

const getInternshipDraftStorageKey = (user) => `dbku_internship_student_info_manual_${user?.id || user?.email || "guest"}`;
const APPLICATIONS_PER_PAGE = 5;

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ms-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getApplicationDate(application) {
  return application.submitted_at || application.created_at || "";
}

function formatReferenceNo(application) {
  const referenceNo = String(application?.reference_no || "").trim();
  if (!referenceNo || application?.isLocalDraft) return "Belum dijana";
  if (referenceNo.startsWith("PK.")) return referenceNo;

  const legacyMatch = referenceNo.match(/^DBKU-CAR-(\d+)$/i);
  if (!legacyMatch) return referenceNo;

  const applicationDate = new Date(getApplicationDate(application));
  const year = Number.isNaN(applicationDate.getTime()) ? new Date().getFullYear() : applicationDate.getFullYear();
  const sequence = Number.parseInt(legacyMatch[1], 10);
  return `PK.${year}-${String(sequence || 1).padStart(4, "0").slice(-4)}`;
}

function getInternshipDraftApplication(user) {
  if (typeof window === "undefined" || !user) return null;

  try {
    const saved = window.localStorage.getItem(getInternshipDraftStorageKey(user));
    if (!saved) return null;

    const draft = JSON.parse(saved);
    return {
      id: "internship-draft",
      isLocalDraft: true,
      reference_no: "DRAF-LI",
      status: "draft",
      submitted_at: null,
      created_at: draft.savedAt || new Date().toISOString(),
      vacancy_detail: {
        department: "Latihan Industri",
        title: "Permohonan Latihan Industri DBKU",
        vacancy_type: "internship",
      },
    };
  } catch {
    return null;
  }
}

function isInternshipApplication(application) {
  const vacancy = application.vacancy_detail || application.vacancy || {};
  return application.vacancy_type === "internship"
    || application.type === "internship"
    || vacancy.vacancy_type === "internship"
    || vacancy.type === "Latihan Industri"
    || vacancy.category === "Latihan Industri";
}

function EmptyState({ actionLabel, actionTo, icon, message, title }) {
  return (
    <section className="applicant-list-empty">
      <span>
        <Icon>{icon}</Icon>
      </span>
      <h2>{title}</h2>
      <p>{message}</p>
      {actionTo ? <Link to={actionTo}>{actionLabel}</Link> : null}
    </section>
  );
}

function ApplicationList({ applications, loading }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);

  const statusOptions = useMemo(() => {
    const statuses = new Set(applications.map((application) => application.status || "draft"));
    return Array.from(statuses);
  }, [applications]);

  const filteredApplications = useMemo(() => {
    return applications
      .filter((application) => statusFilter === "all" || (application.status || "draft") === statusFilter)
      .sort((firstApplication, secondApplication) => {
        const firstTime = new Date(getApplicationDate(firstApplication)).getTime() || 0;
        const secondTime = new Date(getApplicationDate(secondApplication)).getTime() || 0;
        return sortOrder === "asc" ? firstTime - secondTime : secondTime - firstTime;
      });
  }, [applications, sortOrder, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / APPLICATIONS_PER_PAGE));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedApplications = useMemo(() => {
    const startIndex = (activePage - 1) * APPLICATIONS_PER_PAGE;
    return filteredApplications.slice(startIndex, startIndex + APPLICATIONS_PER_PAGE);
  }, [activePage, filteredApplications]);

  if (loading) {
    return <p className="applicant-list-status">Memuatkan permohonan...</p>;
  }

  if (!applications.length) {
    return (
      <EmptyState
        actionLabel="Cari kerja"
        actionTo={APPLICANT_ROUTES.jobs}
        icon="assignment"
        title="Tiada permohonan lagi"
        message="Permohonan yang dihantar akan dipaparkan di sini untuk semakan status."
      />
    );
  }

  return (
    <section className="applicant-applications-table-card">
      <div className="applicant-table-toolbar">
        <div>
          <h2>Senarai permohonan</h2>
          <p>Papar 5 permohonan setiap halaman.</p>
        </div>
        <div className="applicant-table-controls">
          <label>
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Semua status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status] || status}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Turutan</span>
            <select
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="desc">Permohonan baru</option>
              <option value="asc">Permohonan lama</option>
            </select>
          </label>
        </div>
      </div>

      <div className="applicant-applications-table-wrap">
        <table className="applicant-applications-table">
          <thead>
            <tr>
              <th>No. Rujukan</th>
              <th>Permohonan</th>
              <th>Tarikh</th>
              <th>Status</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {paginatedApplications.length ? (
              paginatedApplications.map((application) => {
                const vacancy = application.vacancy_detail || {};
                const status = application.status || "draft";
                const shouldContinueApplication = application.isLocalDraft || status === "draft" || status === "incomplete";
                const actionTarget = status === "incomplete"
                  ? APPLICANT_ROUTES.internshipApplicationEdit(application.id)
                  : APPLICANT_ROUTES.internshipApplication;
                return (
                  <tr key={application.id}>
                    <td>{formatReferenceNo(application)}</td>
                    <td>{vacancy.title || "Jawatan DBKU"}</td>
                    <td>{formatDate(getApplicationDate(application))}</td>
                    <td>
                      <span className={`applicant-status-pill ${status}`}>
                        {statusLabels[status] || status}
                      </span>
                    </td>
                    <td>
                      {shouldContinueApplication ? (
                        <Link className="applicant-table-action" to={actionTarget}>
                          {status === "incomplete" ? "Kemaskini" : "Teruskan"}
                        </Link>
                      ) : (
                        <Link className="applicant-table-action app-view-action" to={APPLICANT_ROUTES.applicationView(application.id)}>
                          <Icon>visibility</Icon>
                          Lihat
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="applicant-table-empty" colSpan="5">Tiada permohonan untuk status ini.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="applicant-table-pagination">
        <span>
          Halaman {activePage} daripada {totalPages}
        </span>
        <div>
          <button
            type="button"
            onClick={() => setCurrentPage(Math.max(1, activePage - 1))}
            disabled={activePage === 1}
            aria-label="Halaman sebelumnya"
          >
            &lt;
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(Math.min(totalPages, activePage + 1))}
            disabled={activePage === totalPages}
            aria-label="Halaman seterusnya"
          >
            &gt;
          </button>
        </div>
      </div>
    </section>
  );
}

function SavedVacancyCard({ onSelect, selected, vacancy }) {
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
        <strong className="market-job-title">{vacancy.title || "Jawatan DBKU"}</strong>
        <span className="market-job-dept">{vacancy.department || vacancy.organization || "Dewan Bandaraya Kuching Utara"}</span>
        <span className="market-job-location">{vacancy.location || "Dewan Bandaraya Kuching Utara"}</span>
        <span className="market-job-type">{vacancy.type || vacancy.category || "Jawatan"}, Waktu bekerja biasa</span>
        <small className="market-job-posted">{vacancy.posted || "Disimpan dalam senarai"}</small>
      </span>
    </button>
  );
}

function SavedVacancyList({ onRemove, vacancies }) {
  const [selectedId, setSelectedId] = useState(vacancies[0]?.id ?? null);
  const activeSelectedId = vacancies.some((item) => item.id === selectedId) ? selectedId : vacancies[0]?.id;
  const selectedVacancy = useMemo(
    () => vacancies.find((item) => item.id === activeSelectedId) ?? null,
    [activeSelectedId, vacancies],
  );

  if (!vacancies.length) {
    return (
      <EmptyState
        actionLabel="Cari kerja"
        actionTo={APPLICANT_ROUTES.jobs}
        icon="bookmark"
        title="Tiada senarai simpan lagi"
        message="Gunakan butang Simpan pada butiran jawatan untuk menyimpan peluang yang ingin dilihat semula."
      />
    );
  }

  return (
    <section className="saved-market-shell market-reference-shell">
      <p className="market-vacancy-count"><strong>{vacancies.length}</strong> Senarai Simpan</p>
      <section className="market-layout">
        <section className="market-results" aria-label="Senarai jawatan disimpan">
          <div className="market-job-list">
            {vacancies.map((vacancy) => (
              <SavedVacancyCard
                key={vacancy.id}
                vacancy={vacancy}
                selected={vacancy.id === selectedVacancy?.id}
                onSelect={() => setSelectedId(vacancy.id)}
              />
            ))}
          </div>
        </section>

        <aside className="market-detail" aria-label="Butiran jawatan disimpan">
          {selectedVacancy ? (
            <div className="market-detail-body">
              <h2>{selectedVacancy.title || "Jawatan DBKU"}</h2>
              <div className="market-detail-department">
                {selectedVacancy.organization || "Dewan Bandaraya Kuching Utara"}
              </div>

              <div className="market-detail-meta">
                <span>
                  <Icon>work</Icon>
                  Taraf jawatan: {selectedVacancy.type || selectedVacancy.category || "-"}
                </span>
                <span>
                  <Icon>apartment</Icon>
                  Bahagian: {selectedVacancy.department || "-"}
                </span>
                <span>
                  <Icon>location_on</Icon>
                  {selectedVacancy.location || "Dewan Bandaraya Kuching Utara"}
                </span>
                <span>
                  <Icon>event</Icon>
                  Tarikh tutup: {selectedVacancy.closing || "-"}
                </span>
              </div>

              <div className="market-detail-document">
                <span>Untuk mengetahui lebih lanjut, sila klik di sini:</span>
                {selectedVacancy.official_document ? (
                  <a
                    href={selectedVacancy.official_document_view_url || selectedVacancy.official_document}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Muat turun dokumen
                  </a>
                ) : (
                  <strong>Dokumen belum tersedia</strong>
                )}
              </div>

              <div className="market-detail-actions">
                <Link to={selectedVacancy.vacancy_type === "internship" ? APPLICANT_ROUTES.internships : APPLICANT_ROUTES.jobs}>
                  Mohon Sekarang
                </Link>
                <button className="saved" type="button" onClick={() => onRemove(selectedVacancy.id)}>
                  <Icon>bookmark_added</Icon>
                  Disimpan
                </button>
              </div>
            </div>
          ) : null}
        </aside>
      </section>
    </section>
  );
}

function getApplicationRows(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export default function ApplicantPortalListPage({ page }) {
  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());
  const [sidebarOpen, toggleSidebar] = useApplicantSidebarState();
  const [applications, setApplications] = useState([]);
  const [savedVacancies, setSavedVacancies] = useState(() => getSavedVacancies(user));
  const [loading, setLoading] = useState(page === "applications");
  const [error, setError] = useState("");
  const displayName = user?.full_name || user?.first_name || "Pemohon DBKU";
  const email = user?.email || "Belum dikemaskini";
  const isApplicationsPage = page === "applications";
  const localDraftApplication = useMemo(
    () => (isApplicationsPage ? getInternshipDraftApplication(user) : null),
    [isApplicationsPage, user],
  );
  const displayApplications = useMemo(() => {
    if (!isApplicationsPage || !localDraftApplication) return applications;

    const hasInternshipApplication = applications.some(isInternshipApplication);
    return hasInternshipApplication ? applications : [localDraftApplication, ...applications];
  }, [applications, isApplicationsPage, localDraftApplication]);

  const loadApplications = useCallback(() => {
    if (!user || user.role !== "applicant" || !isApplicationsPage) return undefined;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);
    let isMounted = true;

    setLoading(true);
    setError("");
    apiRequest("/applications/", { signal: controller.signal })
      .then((data) => {
        if (isMounted) setApplications(getApplicationRows(data));
      })
      .catch((requestError) => {
        if (!isMounted) return;
        const message = requestError.name === "AbortError"
          ? "Permohonan mengambil masa terlalu lama untuk dimuatkan. Sila cuba semula."
          : requestError.message || "Permohonan tidak dapat dimuatkan.";
        setError(message);
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [isApplicationsPage, user]);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true, state: { message: "Sila log masuk untuk melihat maklumat anda." } });
    } else if (user.role !== "applicant") {
      navigate("/", { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    let cleanup;
    const timeoutId = window.setTimeout(() => {
      cleanup = loadApplications();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      if (cleanup) cleanup();
    };
  }, [loadApplications]);

  const pageContent = useMemo(() => {
    if (isApplicationsPage) {
      return {
        description: "Semak status permohonan kerja kosong dan latihan industri anda.",
        icon: "assignment",
        title: "Permohonan Saya",
      };
    }

    return {
      description: "Jawatan yang anda simpan akan dipaparkan di sini.",
      icon: "bookmark",
      title: "Senarai Simpan",
    };
  }, [isApplicationsPage]);

  const handleRemoveSavedVacancy = (vacancyId) => {
    setSavedVacancies(removeSavedVacancy(user, vacancyId));
  };

  if (!user || user.role !== "applicant") {
    return null;
  }

  return (
    <div className={`applicant-profile-page ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      <ProfileSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div className="profile-main-area">
        <ProfileContentHeader displayName={displayName} email={email} photoUrl={user.profile_photo_url} />
        <main className="profile-shell applicant-list-shell">
          <div className="profile-heading">
            <span className="applicant-page-icon">
              <Icon>{pageContent.icon}</Icon>
            </span>
            <h1>{pageContent.title}</h1>
            <p>{pageContent.description}</p>
          </div>

          {error ? (
            <section className="applicant-list-error">
              <p>{error}</p>
              <button type="button" onClick={loadApplications}>Cuba semula</button>
            </section>
          ) : isApplicationsPage ? (
            <ApplicationList applications={displayApplications} loading={loading} />
          ) : (
            <SavedVacancyList vacancies={savedVacancies} onRemove={handleRemoveSavedVacancy} />
          )}
        </main>
      </div>
    </div>
  );
}
