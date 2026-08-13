import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiRequest, getStoredUser } from "../../lib/authApi";
import { APPLICANT_ROUTES } from "../../modules/applicant/applicantRoutes";
import { useApplicantSidebarState } from "../../modules/applicant/useApplicantSidebarState";
import { Icon } from "./ApplicantAuthShared";
import { ApplicantAddressMap, ProfileContentHeader, ProfileSidebar } from "./ApplicantProfilePage";

const personalInfoTab = "Maklumat Peribadi Pemohon";
const infoTabs = [personalInfoTab, "Maklumat Akademik", "Dokumen Sokongan"];

const statusLabels = {
  draft: "Draf",
  rejected: "Tidak berjaya",
  screening: "Dalam semakan",
  shortlisted: "Disenarai pendek",
  submitted: "Dihantar",
  withdrawn: "Ditarik balik",
};

const documentFields = [
  { field: "universityLetterFile", label: "Surat rasmi daripada institusi / kolej / universiti" },
  { field: "transcriptFile", label: "Transkrip akademik terkini" },
  { field: "resumeFile", label: <i>Curriculum Vitae (CV)</i> },
  { field: "passportPhotoFile", label: "1 keping gambar berukuran passport" },
  { field: "bankAccountFile", label: "1 salinan muka depan akaun bank" },
];

const personalRows = [
  ["name", "Nama"],
  ["icNo", "No. Kad Pengenalan Baru"],
  ["phone", "No. Telefon Bimbit/ Telefon Rumah"],
  ["email", "Alamat Emel"],
  ["age", "Umur"],
  ["birthDate", "Tarikh Lahir"],
  ["birthPlace", "Tempat Lahir"],
  ["stateOfBirth", "Negeri Tempat Lahir Pemohon"],
  ["motherBirthState", "Negeri Tempat Lahir Ibu"],
  ["fatherBirthState", "Negeri Tempat Lahir Bapa"],
  ["race", "Bangsa"],
  ["religion", "Agama"],
  ["citizenship", "Kewarganegaraan"],
  ["maritalStatus", "Taraf Perkahwinan"],
  ["height", "Tinggi"],
  ["weight", "Berat"],
  ["disability", "Kelainan Upaya (Ya/ Tidak)"],
  ["drivingLicense", "Lesen Memandu"],
];

const academicRows = [
  ["institution", "Institusi Pengajian"],
  ["program", "Program / Kursus"],
  ["academicLevel", "Tahap Pengajian"],
  ["totalStudyYears", "Jumlah Tahun Pengajian"],
  ["totalSemesters", "Jumlah Semester"],
  ["currentYear", "Tahun Pengajian Terkini"],
  ["semester", "Semester Terkini"],
  ["cgpa", "CGPA / Keputusan Terkini"],
  ["supervisorName", "Nama Penyelaras Program"],
  ["supervisorEmail", "Emel Penyelaras Program"],
  ["supervisorPhone", "No. Telefon Penyelaras Program"],
];

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ms-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getApplicationDate(application) {
  return application?.submitted_at || application?.created_at || "";
}

function displayValue(value) {
  const cleanValue = String(value || "").trim();
  return cleanValue || "-";
}

function renderReadOnlyRow(key, label, value, className = "") {
  return (
    <tr className={className} key={key}>
      <th scope="row">{label}</th>
      <td>
        <span className="student-readonly-value">{displayValue(value)}</span>
      </td>
    </tr>
  );
}

export default function ApplicantApplicationViewPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [user] = useState(() => getStoredUser());
  const [sidebarOpen, toggleSidebar] = useApplicantSidebarState();
  const [activeInfoTab, setActiveInfoTab] = useState(personalInfoTab);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const displayName = user?.full_name || user?.first_name || "Pemohon DBKU";
  const email = user?.email || "Belum dikemaskini";
  const profileData = application?.profile_data || {};
  const studentInfo = profileData.student_info || {};
  const documents = profileData.documents || {};
  const vacancy = application?.vacancy_detail || {};
  const status = application?.status || "draft";

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true, state: { message: "Sila log masuk untuk melihat permohonan anda." } });
    } else if (user.role !== "applicant") {
      navigate("/", { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    if (!user || user.role !== "applicant" || !applicationId) return undefined;

    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setLoading(true);
      setError("");
      apiRequest(`/applications/${applicationId}/`, { signal: controller.signal })
        .then((data) => {
          if (isMounted) setApplication(data);
        })
        .catch((requestError) => {
          if (!isMounted) return;
          const message = requestError.name === "AbortError"
            ? "Permohonan mengambil masa terlalu lama untuk dimuatkan. Sila cuba semula."
            : requestError.message || "Permohonan tidak dapat dimuatkan.";
          setError(message);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }, 0);

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [applicationId, user]);

  const exitApplicationView = () => {
    navigate(APPLICANT_ROUTES.applications);
  };

  const renderPersonalFields = () => (
    <div className="student-personal-table-wrap">
      <table className="student-personal-table student-readonly-table">
        <tbody>
          {personalRows.slice(0, 3).map(([field, label]) => renderReadOnlyRow(field, label, studentInfo[field]))}
          <tr className="map-row">
            <th scope="row">Alamat Surat Menyurat</th>
            <td>
              <ApplicantAddressMap
                address={studentInfo.address}
                latitude={studentInfo.latitude}
                longitude={studentInfo.longitude}
                onLocationChange={() => {}}
                readOnly
              />
            </td>
          </tr>
          {personalRows.slice(3).map(([field, label]) => renderReadOnlyRow(field, label, studentInfo[field]))}
        </tbody>
      </table>
    </div>
  );

  const renderAcademicFields = () => (
    <div className="student-personal-table-wrap">
      <table className="student-personal-table student-readonly-table">
        <tbody>
          {academicRows.map(([field, label]) => renderReadOnlyRow(field, label, studentInfo[field]))}
        </tbody>
      </table>
    </div>
  );

  const renderDocumentFields = () => (
    <div className="student-personal-table-wrap">
      <table className="student-personal-table student-readonly-table">
        <tbody>
          {documentFields.map((document) => renderReadOnlyRow(
            document.field,
            document.label,
            documents[document.field] || studentInfo[document.field],
          ))}
        </tbody>
      </table>
    </div>
  );

  if (!user || user.role !== "applicant") {
    return null;
  }

  return (
    <div className={`applicant-profile-page ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      <ProfileSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div className="profile-main-area">
        <ProfileContentHeader displayName={displayName} email={email} photoUrl={user.profile_photo_url} />
        <main className="profile-shell internship-application-shell">
          <section className="student-info-panel student-readonly-panel" aria-label="Paparan permohonan latihan industri">
            <header className="student-info-titlebar">
              <h1>Permohonan Latihan Industri</h1>
              <button className="student-info-back" type="button" onClick={exitApplicationView}>
                <Icon>arrow_back</Icon>
                Kembali
              </button>
            </header>

            <div className="student-info-workspace">
              <div className="student-info-content">
                {loading ? <p className="student-info-notice">Memuatkan permohonan...</p> : null}
                {error ? <p className="student-info-notice error">{error}</p> : null}
                {!loading && application ? (
                  <>
                    <section className="student-readonly-summary" aria-label="Ringkasan permohonan">
                      <div>
                        <span>No. Rujukan</span>
                        <strong>{application.reference_no || "-"}</strong>
                      </div>
                      <div>
                        <span>Permohonan</span>
                        <strong>{vacancy.title || "Permohonan DBKU"}</strong>
                      </div>
                      <div>
                        <span>Tarikh</span>
                        <strong>{formatDate(getApplicationDate(application))}</strong>
                      </div>
                      <div>
                        <span>Status</span>
                        <strong className={`applicant-status-pill ${status}`}>{statusLabels[status] || status}</strong>
                      </div>
                    </section>

                    <nav className="student-info-tabs" aria-label="Bahagian permohonan latihan industri">
                      {infoTabs.map((tab) => (
                        <button
                          className={activeInfoTab === tab ? "active" : ""}
                          key={tab}
                          type="button"
                          onClick={() => setActiveInfoTab(tab)}
                        >
                          {tab}
                        </button>
                      ))}
                    </nav>

                    <section className="student-info-form">
                      <h2>{activeInfoTab}</h2>
                      {activeInfoTab === personalInfoTab ? renderPersonalFields() : null}
                      {activeInfoTab === "Maklumat Akademik" ? renderAcademicFields() : null}
                      {activeInfoTab === "Dokumen Sokongan" ? renderDocumentFields() : null}
                    </section>
                  </>
                ) : null}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
