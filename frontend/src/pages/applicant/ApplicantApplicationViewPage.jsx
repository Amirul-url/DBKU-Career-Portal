import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiRequest, getStoredUser, resolveMediaUrl } from "../../lib/authApi";
import { countryCallingCodes, defaultCountryCallingCode } from "../../lib/countryCallingCodes";
import { APPLICANT_ROUTES } from "../../modules/applicant/applicantRoutes";
import { useApplicantSidebarState } from "../../modules/applicant/useApplicantSidebarState";
import { Icon } from "./ApplicantAuthShared";
import { ApplicantAddressMap, ProfileContentHeader, ProfileSidebar } from "./ApplicantProfilePage";

const personalInfoTab = "Maklumat Peribadi Pemohon";
const infoTabs = [personalInfoTab, "Maklumat Akademik", "Dokumen Sokongan"];
const organizationFeedbackTab = "Maklumbalas Organisasi";

const statusLabels = {
  draft: "Draf",
  incomplete: "Tidak Lengkap",
  rejected: "Ditolak",
  accepted: "Dalam semakan",
  screening: "Dalam semakan",
  shortlisted: "Disenarai pendek",
  submitted: "Dihantar",
  withdrawn: "Ditarik balik",
};

function getApplicantVisibleStatus(status, maskAcceptedStatus = true) {
  return maskAcceptedStatus && status === "accepted" ? "screening" : status;
}

function getReadOnlyStatusLabel(status, maskAcceptedStatus) {
  if (!maskAcceptedStatus && status === "accepted") return "Diterima";
  return statusLabels[status] || status;
}

function getOrganizationFeedbackRelease(application) {
  const release = application?.profile_data?.organization_feedback_release;
  return release && typeof release === "object" ? release : {};
}

function hasOrganizationFeedbackBeenSent(application) {
  return Boolean(getOrganizationFeedbackRelease(application).sent_to_applicant_at);
}

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
];

const countriesByLongestCode = [...countryCallingCodes].sort(
  (first, second) =>
    second.code.replace(/\D/g, "").length - first.code.replace(/\D/g, "").length ||
    first.name.localeCompare(second.name),
);

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

function formatReferenceNo(application) {
  const referenceNo = String(application?.reference_no || "").trim();
  if (!referenceNo) return "-";
  if (referenceNo.startsWith("PK.")) return referenceNo;

  const legacyMatch = referenceNo.match(/^DBKU-CAR-(\d+)$/i);
  if (!legacyMatch) return referenceNo;

  const applicationDate = new Date(getApplicationDate(application));
  const year = Number.isNaN(applicationDate.getTime()) ? new Date().getFullYear() : applicationDate.getFullYear();
  const sequence = Number.parseInt(legacyMatch[1], 10);
  return `PK.${year}-${String(sequence || 1).padStart(4, "0").slice(-4)}`;
}

function splitPhoneNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) {
    return { countryCode: "", localNumber: "" };
  }

  const matchedCountry = countriesByLongestCode.find((country) => {
    const countryDigits = country.code.replace(/\D/g, "");
    return digits.startsWith(countryDigits) && digits.length > countryDigits.length;
  });

  const country = matchedCountry || defaultCountryCallingCode;
  const countryDigits = country.code.replace(/\D/g, "");
  const localNumber = matchedCountry ? digits.slice(countryDigits.length) : digits.replace(/^0+/, "");
  return {
    countryCode: country.code,
    localNumber,
  };
}

function splitDateParts(value) {
  const cleanValue = String(value || "").trim();
  const isoMatch = cleanValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return { day: isoMatch[3], month: isoMatch[2], year: isoMatch[1] };
  }

  const date = new Date(cleanValue);
  if (Number.isNaN(date.getTime())) {
    return { day: "", month: "", year: "" };
  }

  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: String(date.getMonth() + 1).padStart(2, "0"),
    year: String(date.getFullYear()),
  };
}

function displayValue(value) {
  const cleanValue = String(value || "").trim();
  return cleanValue || "-";
}

function getFileNameFromUrl(value) {
  if (!value || typeof value !== "string" || value.startsWith("data:")) {
    return "";
  }

  try {
    const url = new URL(value, window.location.origin);
    const fileName = url.pathname.split("/").filter(Boolean).pop();
    return fileName ? decodeURIComponent(fileName) : "";
  } catch {
    return value.split("/").filter(Boolean).pop() || "";
  }
}

function normalizeDocumentFile(primaryValue, fallbackValue = "", fallbackUrl = "") {
  const values = [primaryValue, fallbackValue].filter((value) => value !== undefined && value !== null && value !== "");

  for (const value of values) {
    if (typeof value === "object") {
      const rawUrl = value.url || value.file_url || value.fileUrl || value.dataUrl || value.data_url || "";
      const resolvedUrl = resolveMediaUrl(rawUrl || fallbackUrl);
      const name = value.name || value.file_name || value.fileName || getFileNameFromUrl(resolvedUrl) || displayValue(fallbackValue);
      return { isLegacyNameOnly: !resolvedUrl && name !== "-", name: displayValue(name), url: resolvedUrl };
    }

    const text = String(value || "").trim();
    if (!text) {
      continue;
    }

    const url = /^(https?:|blob:|data:|\/media\/|media\/)/i.test(text)
      ? resolveMediaUrl(text)
      : resolveMediaUrl(fallbackUrl);
    return { isLegacyNameOnly: !url, name: getFileNameFromUrl(text) || text, url };
  }

  const url = resolveMediaUrl(fallbackUrl);
  return { isLegacyNameOnly: false, name: getFileNameFromUrl(url) || "-", url };
}

function renderReadOnlyContentRow(key, label, content, className = "") {
  return (
    <tr className={className} key={key}>
      <th scope="row">{label}</th>
      <td>{content}</td>
    </tr>
  );
}

function renderReadOnlyRow(key, label, value, className = "") {
  return renderReadOnlyContentRow(
    key,
    label,
    <span className="student-readonly-value">{displayValue(value)}</span>,
    className,
  );
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getLegacyDocumentPreviewUrl(fileName) {
  const safeFileName = escapeHtml(displayValue(fileName));
  const html = `<!doctype html>
<html lang="ms">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeFileName}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; background: #f8fafc; color: #0f172a; }
    main { max-width: 720px; margin: 60px auto; border: 1px solid #bbf7d0; border-radius: 8px; background: #fff; padding: 28px; }
    h1 { margin: 0 0 12px; font-size: 24px; }
    p { margin: 8px 0; color: #425466; line-height: 1.6; }
    strong { color: #047857; }
  </style>
</head>
<body>
  <main>
    <h1>Fail belum tersedia</h1>
    <p>Nama fail: <strong>${safeFileName}</strong></p>
    <p>Rekod prototaip ini hanya menyimpan nama fail, bukan kandungan fail sebenar.</p>
    <p>Untuk buka dokumen sebenar, pemohon perlu muat naik semula fail tersebut pada permohonan baharu atau draf yang dikemaskini.</p>
  </main>
</body>
</html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

function openDocumentFile(file) {
  if ((!file?.url && !file?.isLegacyNameOnly) || typeof window === "undefined") {
    return;
  }

  window.open(file.url || getLegacyDocumentPreviewUrl(file.name), "_blank", "noopener,noreferrer");
}

function renderDocumentRow(document, documents, studentInfo) {
  const file = normalizeDocumentFile(
    documents[document.field],
    studentInfo[document.field],
    studentInfo[`${document.field}Url`],
  );

  return renderReadOnlyContentRow(
    document.field,
    document.label,
    <div className="student-readonly-document-cell">
      <span className={file.name !== "-" ? "student-readonly-value uploaded" : "student-readonly-value"}>
        {file.name}
      </span>
      <button
        className="app-view-action"
        disabled={!file.url && !file.isLegacyNameOnly}
        type="button"
        onClick={() => openDocumentFile(file)}
      >
        <Icon>visibility</Icon>
        Lihat
      </button>
    </div>,
  );
}

function getOrganizationFeedbackDocuments(application) {
  const documentFiles = application?.document_files || {};
  const documents = documentFiles.organizationFeedbackDocuments;
  if (Array.isArray(documents) && documents.length) {
    return documents.map((document, index) => ({
      id: document.id || String(index + 1),
      name: document.name || "Dokumen maklumbalas organisasi",
      url: resolveMediaUrl(document.url || ""),
    }));
  }

  const legacyDocument = documentFiles.organizationFeedbackDocument;
  if (!legacyDocument?.url) return [];

  return [{
    id: "legacy",
    name: legacyDocument.name || "Dokumen maklumbalas organisasi",
    url: resolveMediaUrl(legacyDocument.url || ""),
  }];
}

function getInternshipStudentInfo(application) {
  return application?.profile_data?.student_info || {};
}

function getInternshipStudentName(application) {
  const studentInfo = getInternshipStudentInfo(application);
  return studentInfo.name || application?.applicant_name || "Belum diisi";
}

function getInternshipStudentIdentityNo(application) {
  const studentInfo = getInternshipStudentInfo(application);
  return (
    studentInfo.icNo ||
    studentInfo.identificationNumber ||
    application?.applicant_detail?.mykad_number ||
    "Belum diisi"
  );
}

function getInternshipProgram(application) {
  return getInternshipStudentInfo(application).program || "Belum diisi";
}

function getApplicantFeedbackPlacementDepartment(application) {
  const department =
    application?.assigned_department ||
    application?.profile_data?.department_decision?.department ||
    application?.profile_data?.internship_vacancy?.division ||
    application?.vacancy_detail?.division ||
    "Belum ditetapkan";
  return String(department).replace(/\s*\([^)]+\)\s*$/, "");
}

function ApplicantOrganizationFeedbackTab({ application }) {
  const release = getOrganizationFeedbackRelease(application);
  const documents = getOrganizationFeedbackDocuments(application);
  const internshipPeriod = release.internship_period || "Belum ditetapkan";
  const studentName = getInternshipStudentName(application);
  const identityNo = getInternshipStudentIdentityNo(application);
  const program = getInternshipProgram(application);
  const placementDepartment = getApplicantFeedbackPlacementDepartment(application);

  return (
    <div className="organization-feedback-panel applicant-organization-feedback-panel">
      <div className="organization-feedback-table-wrap">
        <table className="organization-feedback-table applicant-organization-feedback-table">
          <thead>
            <tr>
              <th>Nama Pelajar</th>
              <th>Tempoh Latihan Industri / Praktikal</th>
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
              <td>{internshipPeriod}</td>
              <td>{program}</td>
              <td>{placementDepartment}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="student-personal-table-wrap applicant-organization-document-wrap">
        <p className="applicant-organization-download-note">Sila muat turun dokumen di bawah.</p>
        <table className="student-personal-table student-readonly-table">
          <tbody>
            {documents.length ? (
              documents.map((document, index) =>
                renderReadOnlyContentRow(
                  `organizationFeedbackDocument-${document.id || index}`,
                  `Dokumen ${index + 1}`,
                  <div className="student-readonly-document-cell">
                    <span className="student-readonly-value uploaded">{document.name}</span>
                    <button
                      className="app-view-action"
                      disabled={!document.url}
                      type="button"
                      onClick={() => openDocumentFile(document)}
                    >
                      <Icon>visibility</Icon>
                      Lihat
                    </button>
                  </div>,
                ),
              )
            ) : (
              renderReadOnlyRow("organizationFeedbackDocuments", "Dokumen", "Tiada dokumen maklumbalas organisasi.")
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderPhoneRow(key, label, value) {
  const phone = splitPhoneNumber(value);
  return renderReadOnlyContentRow(
    key,
    label,
    <div className="student-readonly-split two">
      <label>
        <span>Kod Negara</span>
        <strong>{displayValue(phone.countryCode)}</strong>
      </label>
      <label>
        <span>No. Telefon</span>
        <strong>{displayValue(phone.localNumber)}</strong>
      </label>
    </div>,
  );
}

function renderDateOfBirthRow(value) {
  const dateParts = splitDateParts(value);
  return renderReadOnlyContentRow(
    "birthDate",
    "Tarikh Lahir",
    <div className="student-readonly-split three">
      <label>
        <span>Hari</span>
        <strong>{displayValue(dateParts.day)}</strong>
      </label>
      <label>
        <span>Bulan</span>
        <strong>{displayValue(dateParts.month)}</strong>
      </label>
      <label>
        <span>Tahun</span>
        <strong>{displayValue(dateParts.year)}</strong>
      </label>
    </div>,
  );
}

export function InternshipApplicationReadOnlyPanel({
  activeInfoTab,
  application,
  backLabel = "Kembali",
  className = "",
  error = "",
  extraTabs = [],
  loading = false,
  maskAcceptedStatus = true,
  onBack,
  onTabChange,
  renderExtraTabContent,
}) {
  const profileData = application?.profile_data || {};
  const studentInfo = profileData.student_info || {};
  const documents = {
    ...(profileData.documents || {}),
    ...(application?.document_files || {}),
  };
  const vacancy = application?.vacancy_detail || {};
  const status = application?.status || "draft";
  const visibleStatus = getApplicantVisibleStatus(status, maskAcceptedStatus);
  const panelTabs = [...infoTabs, ...extraTabs];

  const renderPersonalFields = () => (
    <div className="student-personal-table-wrap">
      <table className="student-personal-table student-readonly-table">
        <tbody>
          {personalRows.slice(0, 2).map(([field, label]) => renderReadOnlyRow(field, label, studentInfo[field]))}
          {renderPhoneRow("phone", "No. Telefon Bimbit/ Telefon Rumah", studentInfo.phone)}
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
          {personalRows.slice(3, 5).map(([field, label]) => renderReadOnlyRow(field, label, studentInfo[field]))}
          {renderDateOfBirthRow(studentInfo.birthDate)}
          {personalRows.slice(6).map(([field, label]) => renderReadOnlyRow(field, label, studentInfo[field]))}
        </tbody>
      </table>
    </div>
  );

  const renderAcademicFields = () => (
    <div className="student-personal-table-wrap">
      <table className="student-personal-table student-readonly-table">
        <tbody>
          {academicRows.map(([field, label]) => renderReadOnlyRow(field, label, studentInfo[field]))}
          {renderPhoneRow("supervisorPhone", "No. Telefon Penyelaras Program", studentInfo.supervisorPhone)}
        </tbody>
      </table>
    </div>
  );

  const renderDocumentFields = () => (
    <div className="student-personal-table-wrap">
      <table className="student-personal-table student-readonly-table">
        <tbody>
          {documentFields.map((document) => renderDocumentRow(document, documents, studentInfo))}
        </tbody>
      </table>
    </div>
  );

  return (
    <section className={`student-info-panel student-readonly-panel ${className}`} aria-label="Paparan permohonan latihan industri">
      <header className="student-info-titlebar">
        <h1>Permohonan Latihan Industri</h1>
        <button className="student-info-back" type="button" onClick={onBack}>
          <Icon>arrow_back</Icon>
          {backLabel}
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
                  <strong>{formatReferenceNo(application)}</strong>
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
                  <strong className={`applicant-status-pill ${visibleStatus}`}>
                    {getReadOnlyStatusLabel(status, maskAcceptedStatus)}
                  </strong>
                </div>
              </section>
              {status === "incomplete" ? (
                <div className="student-readonly-actions">
                  <Link className="applicant-table-action" to={APPLICANT_ROUTES.internshipApplicationEdit(application.id)}>
                    <Icon>edit</Icon>
                    Kemaskini Permohonan
                  </Link>
                </div>
              ) : null}

              <nav className="student-info-tabs" aria-label="Bahagian permohonan latihan industri">
                {panelTabs.map((tab) => (
                  <button
                    className={activeInfoTab === tab ? "active" : ""}
                    key={tab}
                    type="button"
                    onClick={() => onTabChange(tab)}
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
                {!infoTabs.includes(activeInfoTab) && renderExtraTabContent ? renderExtraTabContent(activeInfoTab) : null}
              </section>
            </>
          ) : null}
        </div>
      </div>
    </section>
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
  const organizationFeedbackSent = hasOrganizationFeedbackBeenSent(application);

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
          if (!isMounted) return;
          if ((data.status || "draft") === "draft") {
            navigate(APPLICANT_ROUTES.internshipApplication, { replace: true });
            return;
          }
          setApplication(data);
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
  }, [applicationId, navigate, user]);

  const exitApplicationView = () => {
    navigate(APPLICANT_ROUTES.applications);
  };

  if (!user || user.role !== "applicant") {
    return null;
  }

  return (
    <div className={`applicant-profile-page ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      <ProfileSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div className="profile-main-area">
        <ProfileContentHeader displayName={displayName} email={email} photoUrl={user.profile_photo_url} />
        <main className="profile-shell internship-application-shell">
          <InternshipApplicationReadOnlyPanel
            activeInfoTab={activeInfoTab}
            application={application}
            error={error}
            extraTabs={organizationFeedbackSent ? [organizationFeedbackTab] : []}
            loading={loading}
            maskAcceptedStatus={!organizationFeedbackSent}
            onBack={exitApplicationView}
            onTabChange={setActiveInfoTab}
            renderExtraTabContent={(tab) =>
              tab === organizationFeedbackTab ? <ApplicantOrganizationFeedbackTab application={application} /> : null
            }
          />
        </main>
      </div>
    </div>
  );
}
