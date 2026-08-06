import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, getStoredUser } from "../../lib/authApi";
import { APPLICANT_ROUTES } from "../../modules/applicant/applicantRoutes";
import { getSavedVacancies, removeSavedVacancy } from "../../modules/applicant/savedVacancies";
import { Icon } from "./ApplicantAuthShared";
import { ProfileContentHeader, ProfileSidebar } from "./ApplicantProfilePage";

const statusLabels = {
  draft: "Draf",
  rejected: "Tidak berjaya",
  screening: "Dalam semakan",
  shortlisted: "Disenarai pendek",
  submitted: "Dihantar",
  withdrawn: "Ditarik balik",
};

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ms-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
    <div className="applicant-list-grid">
      {applications.map((application) => {
        const vacancy = application.vacancy_detail || {};
        return (
          <article className="applicant-list-card" key={application.id}>
            <div>
              <span className={`applicant-status-pill ${application.status || "draft"}`}>
                {statusLabels[application.status] || application.status || "Draf"}
              </span>
              <h2>{vacancy.title || "Jawatan DBKU"}</h2>
              <p>{vacancy.department || vacancy.division || "Dewan Bandaraya Kuching Utara"}</p>
            </div>
            <dl>
              <div>
                <dt>No. rujukan</dt>
                <dd>{application.reference_no || "-"}</dd>
              </div>
              <div>
                <dt>Tarikh hantar</dt>
                <dd>{formatDate(application.submitted_at || application.created_at)}</dd>
              </div>
            </dl>
          </article>
        );
      })}
    </div>
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
  const selectedVacancy = useMemo(
    () => vacancies.find((item) => item.id === selectedId) ?? vacancies[0] ?? null,
    [selectedId, vacancies],
  );

  useEffect(() => {
    if (!vacancies.length) {
      setSelectedId(null);
      return;
    }

    if (!vacancies.some((item) => item.id === selectedId)) {
      setSelectedId(vacancies[0].id);
    }
  }, [selectedId, vacancies]);

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [applications, setApplications] = useState([]);
  const [savedVacancies, setSavedVacancies] = useState(() => getSavedVacancies(user));
  const [loading, setLoading] = useState(page === "applications");
  const [error, setError] = useState("");
  const displayName = user?.full_name || user?.first_name || "Pemohon DBKU";
  const email = user?.email || "Belum dikemaskini";
  const isApplicationsPage = page === "applications";

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
    return loadApplications();
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
      <ProfileSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((current) => !current)} />
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
            <ApplicationList applications={applications} loading={loading} />
          ) : (
            <SavedVacancyList vacancies={savedVacancies} onRemove={handleRemoveSavedVacancy} />
          )}
        </main>
      </div>
    </div>
  );
}
