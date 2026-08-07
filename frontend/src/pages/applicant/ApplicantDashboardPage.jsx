import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getStoredUser } from "../../lib/authApi";
import { APPLICANT_ROUTES } from "../../modules/applicant/applicantRoutes";
import { Icon } from "./ApplicantAuthShared";
import { ProfileContentHeader, ProfileSidebar } from "./ApplicantProfilePage";

function getProfileChecklist(user) {
  return [
    { done: Boolean(user?.full_name || user?.first_name), label: "Nama penuh" },
    { done: Boolean(user?.email), label: "Alamat e-mel" },
    { done: Boolean(user?.mykad_number), label: "Nombor kad pengenalan" },
    { done: Boolean(user?.mobile_number), label: "Nombor telefon" },
    { done: Boolean(user?.profile_photo_url), label: "Foto profil" },
    { done: Boolean(user?.resume_file_url), label: "Resume" },
  ];
}

export default function ApplicantDashboardPage() {
  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const displayName = user?.full_name || user?.first_name || "Pemohon DBKU";
  const email = user?.email || "Belum dikemaskini";
  const checklist = useMemo(() => getProfileChecklist(user), [user]);
  const completedCount = checklist.filter((item) => item.done).length;
  const completionPercent = Math.round((completedCount / checklist.length) * 100);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true, state: { message: "Sila log masuk untuk melihat dashboard anda." } });
    } else if (user.role !== "applicant") {
      navigate("/", { replace: true });
    }
  }, [navigate, user]);

  if (!user || user.role !== "applicant") {
    return null;
  }

  return (
    <div className={`applicant-profile-page ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      <ProfileSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((current) => !current)} />
      <div className="profile-main-area">
        <ProfileContentHeader displayName={displayName} email={email} photoUrl={user.profile_photo_url} />
        <main className="profile-shell applicant-dashboard-shell">
          <div className="profile-heading">
            <span className="applicant-page-icon">
              <Icon>dashboard</Icon>
            </span>
            <h1>Dashboard</h1>
            <p>Pantau profil, permohonan dan peluang kerjaya anda dalam satu paparan.</p>
          </div>

          <section className="applicant-dashboard-guide">
            <div>
              <span className="dashboard-guide-icon">
                <Icon>person_check</Icon>
              </span>
              <h2>Lengkapkan profil anda</h2>
              <p>
                Profil yang lengkap membantu DBKU menyemak maklumat anda dengan lebih mudah sebelum permohonan diproses.
              </p>
              <Link to={APPLICANT_ROUTES.profile}>Lengkapkan Profil</Link>
            </div>

            <aside aria-label="Status kelengkapan profil">
              <strong>{completionPercent}%</strong>
              <span>Profil lengkap</span>
              <div className="dashboard-progress-track">
                <span style={{ width: `${completionPercent}%` }} />
              </div>
            </aside>
          </section>

          <section className="applicant-dashboard-grid">
            <article>
              <span><Icon>assignment</Icon></span>
              <strong>Permohonan Saya</strong>
              <p>Semak status permohonan kerja kosong dan latihan industri.</p>
              <Link to={APPLICANT_ROUTES.applications}>Lihat Permohonan</Link>
            </article>
            <article>
              <span><Icon>search</Icon></span>
              <strong>Cari Kerja</strong>
              <p>Lihat kekosongan jawatan DBKU yang sedang dibuka.</p>
              <Link to={APPLICANT_ROUTES.jobs}>Cari Kerja</Link>
            </article>
            <article>
              <span><Icon>school</Icon></span>
              <strong>Latihan Industri</strong>
              <p>Mohon latihan industri dan sambung draf permohonan anda.</p>
              <Link to={APPLICANT_ROUTES.internships}>Mohon Latihan Industri</Link>
            </article>
          </section>

          <section className="applicant-dashboard-checklist">
            <h2>Senarai semak profil</h2>
            <div>
              {checklist.map((item) => (
                <span className={item.done ? "complete" : ""} key={item.label}>
                  <Icon>{item.done ? "check_circle" : "radio_button_unchecked"}</Icon>
                  {item.label}
                </span>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
