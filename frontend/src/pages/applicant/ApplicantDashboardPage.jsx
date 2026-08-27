import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, getStoredUser } from "../../lib/authApi";
import { getApplicantApplicationBadgeCount, getApplicationRows } from "../../modules/applicant/applicationBadges";
import { APPLICANT_ROUTES } from "../../modules/applicant/applicantRoutes";
import { useApplicantSidebarState } from "../../modules/applicant/useApplicantSidebarState";
import { Icon } from "./ApplicantAuthShared";
import { ProfileContentHeader, ProfileSidebar } from "./ApplicantProfilePage";

function hasText(value) {
  return Boolean(String(value || "").trim());
}

function hasCompleteExperience(profileData) {
  const experience = profileData?.experience || {};
  const hasExperience = String(experience.hasExperience || "");
  const records = Array.isArray(experience.records) ? experience.records : [];
  const hasWorkRecord = records.some((record) =>
    hasText(record.title) &&
    hasText(record.careerLevel) &&
    hasText(record.organisation) &&
    Array.isArray(record.sectors) &&
    record.sectors.length > 0,
  );

  return hasText(experience.employmentStatus) && hasText(hasExperience) && (!hasExperience.startsWith("Ya") || hasWorkRecord);
}

function hasCompleteAcademic(profileData) {
  const records = Array.isArray(profileData?.academic?.records) ? profileData.academic.records : [];
  return records.some((record) => hasText(record.level) && hasText(record.institution));
}

function hasCompleteSkills(profileData) {
  const skills = profileData?.skills || {};
  const technicalSkills = Array.isArray(skills.skills) ? skills.skills : [];
  const languages = Array.isArray(skills.languages) ? skills.languages : [];
  const hasLanguage = languages.some((language) =>
    hasText(language.name) &&
    hasText(language.reading) &&
    hasText(language.speaking) &&
    hasText(language.writing),
  );

  return technicalSkills.length > 0 && hasLanguage;
}

function getProfileChecklist(user, profileData) {
  const personal = profileData?.personal || {};
  const details = personal.details || {};
  const displayName = personal.displayName || user?.full_name || user?.first_name;
  const email = personal.email || user?.email;

  return [
    { done: Boolean(displayName), label: "Nama penuh" },
    { done: Boolean(email), label: "Alamat e-mel" },
    { done: Boolean(details.identificationNumber || user?.mykad_number), label: "Nombor kad pengenalan" },
    { done: Boolean(details.birthDay && details.birthMonth && details.birthYear), label: "Tarikh lahir" },
    { done: Boolean(details.citizenship), label: "Kewarganegaraan" },
    { done: Boolean(details.gender), label: "Jantina" },
    { done: Boolean(details.hasHealthIssue), label: "Status kesihatan" },
    { done: Boolean(details.hasDisability), label: "Status ketidakupayaan" },
    { done: Boolean(details.address || user?.address), label: "Alamat" },
    { done: Boolean(details.latitude && details.longitude), label: "Lokasi alamat" },
    { done: Boolean(details.primaryPhone || user?.mobile_number), label: "Nombor telefon utama" },
    { done: Boolean(details.careerObjective), label: "Matlamat kerjaya" },
    { done: hasCompleteExperience(profileData), label: "Pengalaman" },
    { done: hasCompleteAcademic(profileData), label: "Akademik" },
    { done: hasCompleteSkills(profileData), label: "Kemahiran" },
  ];
}

export default function ApplicantDashboardPage() {
  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());
  const [applicationBadgeCount, setApplicationBadgeCount] = useState(0);
  const [profileData, setProfileData] = useState(null);
  const [sidebarOpen, toggleSidebar] = useApplicantSidebarState();
  const displayName = user?.full_name || user?.first_name || "Pemohon DBKU";
  const email = user?.email || "Belum dikemaskini";
  const checklist = useMemo(() => getProfileChecklist(user, profileData), [profileData, user]);
  const completedCount = checklist.filter((item) => item.done).length;
  const completionPercent = Math.round((completedCount / checklist.length) * 100);
  const completionLabel = completionPercent === 100 ? "Profil lengkap" : "Profil belum lengkap";

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true, state: { message: "Sila log masuk untuk melihat papan pemuka anda." } });
    } else if (user.role !== "applicant") {
      navigate("/", { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    if (!user || user.role !== "applicant") {
      return undefined;
    }

    let isMounted = true;
    apiRequest("/auth/profile-data/")
      .then((data) => {
        if (isMounted) {
          setProfileData(data);
        }
      })
      .catch(() => null);

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== "applicant") {
      return undefined;
    }

    const controller = new AbortController();
    let isMounted = true;

    apiRequest("/applications/", { signal: controller.signal })
      .then((data) => {
        if (isMounted) {
          setApplicationBadgeCount(getApplicantApplicationBadgeCount(getApplicationRows(data)));
        }
      })
      .catch(() => null);

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [user]);

  if (!user || user.role !== "applicant") {
    return null;
  }

  return (
    <div className={`applicant-profile-page ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      <ProfileSidebar
        applicationBadgeCount={applicationBadgeCount}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
      />
      <div className="profile-main-area">
        <ProfileContentHeader displayName={displayName} email={email} photoUrl={user.profile_photo_url} />
        <main className="profile-shell applicant-dashboard-shell">
          <div className="profile-heading applicant-dashboard-heading">
            <h1>Papan Pemuka</h1>
            <p>Pantau profil, permohonan dan peluang kerjaya anda dalam satu paparan.</p>
          </div>

          <section className="applicant-dashboard-guide">
            <div>
              <span className="dashboard-guide-icon">
                <Icon>person</Icon>
              </span>
              <h2>Lengkapkan profil anda</h2>
              <p>
                Profil yang lengkap membantu DBKU menyemak maklumat anda dengan lebih mudah sebelum permohonan diproses.
              </p>
              <Link to={APPLICANT_ROUTES.profile}>Lengkapkan Profil</Link>
            </div>

            <aside aria-label="Status kelengkapan profil">
              <strong>{completionPercent}%</strong>
              <span>{completionLabel}</span>
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

        </main>
      </div>
    </div>
  );
}
