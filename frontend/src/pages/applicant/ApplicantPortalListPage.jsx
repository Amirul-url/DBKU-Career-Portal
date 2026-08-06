import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, getStoredUser } from "../../lib/authApi";
import { APPLICANT_ROUTES } from "../../modules/applicant/applicantRoutes";
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

export default function ApplicantPortalListPage({ page }) {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(page === "applications");
  const [error, setError] = useState("");
  const displayName = user?.full_name || user?.first_name || "Pemohon DBKU";
  const email = user?.email || "Belum dikemaskini";
  const isApplicationsPage = page === "applications";

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true, state: { message: "Sila log masuk untuk melihat maklumat anda." } });
    } else if (user.role !== "applicant") {
      navigate("/", { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    if (!user || user.role !== "applicant" || !isApplicationsPage) return undefined;

    let isMounted = true;
    setLoading(true);
    setError("");
    apiRequest("/applications/")
      .then((data) => {
        if (isMounted) setApplications(Array.isArray(data) ? data : []);
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.message || "Permohonan tidak dapat dimuatkan.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isApplicationsPage, user]);

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

          {error ? <p className="applicant-list-error">{error}</p> : null}
          {isApplicationsPage ? (
            <ApplicationList applications={applications} loading={loading} />
          ) : (
            <EmptyState
              actionLabel="Cari kerja"
              actionTo={APPLICANT_ROUTES.jobs}
              icon="bookmark"
              title="Tiada senarai simpan lagi"
              message="Gunakan butang Simpan pada butiran jawatan untuk menyimpan peluang yang ingin dilihat semula."
            />
          )}
        </main>
      </div>
    </div>
  );
}
