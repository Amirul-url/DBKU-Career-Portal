import { Fragment, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { apiRequest, getStoredUser, resolveMediaUrl } from "../../lib/authApi";
import { countryCallingCodes, defaultCountryCallingCode } from "../../lib/countryCallingCodes";
import { APPLICANT_ROUTES } from "../../modules/applicant/applicantRoutes";
import { useApplicantSidebarState } from "../../modules/applicant/useApplicantSidebarState";
import {
  getApplicantAgreedInternshipStatus,
  internshipLifecycleStatusLabels,
} from "../../modules/internship/internshipLifecycleStatus";
import {
  hrmFinalRejectionMessage,
  normalizeHrmFinalRejectionRemarks,
} from "../../modules/internship/internshipDecisionCopy";
import { Icon } from "./ApplicantAuthShared";
import { ApplicantAddressMap, ProfileContentHeader, ProfileSidebar } from "./ApplicantProfilePage";

const personalInfoTab = "Maklumat Peribadi Pemohon";
const academicInfoTab = "Maklumat Akademik";
const documentSupportTab = "Dokumen Sokongan";
const infoTabs = [personalInfoTab, academicInfoTab, documentSupportTab];
const jobSpmTab = "MAKLUMAT PEPERIKSAAN SPM/SC/MCE/SPM(V) MENGIKUT SISTEM TERBUKA/ UNIFIED EXAMINATION CERTIFICATE (UEC) ATAU SETARAF (SILA KEMUKAKAN SEMUA MATA PELAJARAN YANG DIAMBIL)";
const jobBmJulyTab = "BM KERTAS JULAI/ STPM/ UNIVERSITI ATAU SETARAF";
const jobMathJulyTab = "PEPERIKSAAN MATEMATIK KERTAS JULAI";
const jobStpmTab = "PEPERIKSAAN STPM/ STAM/ STP/ HSC/ SIJIL MATRIKULASI";
const jobHigherEducationTab = "KELULUSAN PENGAJIAN TINGGI (PHD/ MASTER/ IJAZAH/ DIPLOMA/ SIJIL)";
const jobLanguageSkillsTab = "PENGETAHUAN DAN KEMAHIRAN BAHASA";
const jobComputerSkillsTab = "MAKLUMAT KEMAHIRAN KOMPUTER";
const jobWorkExperienceTab = "PENGALAMAN BEKERJA";
const jobReferencesTab = "RUJUKAN";
const jobDeclarationTab = "PERAKUAN PEMOHON";
const readOnlyJobInfoTabs = [
  personalInfoTab,
  jobSpmTab,
  jobBmJulyTab,
  jobMathJulyTab,
  jobStpmTab,
  jobHigherEducationTab,
  jobLanguageSkillsTab,
  jobComputerSkillsTab,
  jobWorkExperienceTab,
  jobReferencesTab,
  documentSupportTab,
  jobDeclarationTab,
];
const organizationFeedbackTab = "Maklumbalas Organisasi";
const applicantConfirmationTab = "Pengesahan Pemohon";
const hrmDecisionTab = "Keputusan Permohonan";
const organizationFeedbackReportDefaults = {
  date: "",
  time: "8.00 pagi",
  place:
    "Unit Pengurusan Latihan\nBahagian Pengurusan Sumber Manusia\nTingkat 3, Bangunan Dewan Bandaraya Kuching Utara\nBukit Siol, Jalan Semariang, Petra Jaya\n93050 Kuching, SARAWAK",
  confirmationDate: "",
};
const applicantInternshipLifecycleStatusLabels = {
  applicant_agreed: "Pengesahan Dihantar",
  internship_active: internshipLifecycleStatusLabels.internship_active,
  internship_completed: internshipLifecycleStatusLabels.internship_completed,
};
const jobTabShortLabels = {
  [personalInfoTab]: "Peribadi",
  [jobSpmTab]: "SPM/UEC",
  [jobBmJulyTab]: "BM Julai/STPM",
  [jobMathJulyTab]: "Matematik Julai",
  [jobStpmTab]: "STPM/STAM",
  [jobHigherEducationTab]: "Pengajian Tinggi",
  [jobLanguageSkillsTab]: "Bahasa",
  [jobComputerSkillsTab]: "Komputer",
  [jobWorkExperienceTab]: "Pengalaman",
  [jobReferencesTab]: "Rujukan",
  [documentSupportTab]: "Dokumen",
  [jobDeclarationTab]: "Perakuan",
};
const jobSkillLevelOptions = ["Baik", "Sederhana", "Lemah"];
const jobComputerLevelOptions = ["Sangat Mahir", "Mahir", "Sederhana", "Tidak Mahir"];
const jobSpmSubjectRowCount = 12;
const jobStpmSubjectRowCount = 5;
const jobHigherEducationRowCount = 2;
const jobWorkExperienceRowCount = 5;
const jobReferenceRowCount = 2;
const jobDeclarationText = "Saya dengan ini mengaku bahawa semua maklumat yang saya berikan adalah BENAR dan TEPAT. Saya juga bersetuju dan menerima bahawa sekiranya mana-mana daripada pengakuan ini didapati palsu atau tidak benar, pihak Dewan Bandaraya Kuching Utara berhak menarik balik keputusan tawaran dan menamatkan perkhidmatan saya dengan serta-merta tanpa apa-apa syarat.";

function isSameJobChoice(value, option) {
  return String(value || "").trim().toUpperCase() === String(option || "").trim().toUpperCase();
}

const statusLabels = {
  draft: "Draf",
  incomplete: "Tidak Lengkap",
  rejected: "Ditolak",
  accepted: "Dalam semakan",
  offered: "Pengesahan Pemohon",
  screening: "Dalam semakan",
  shortlisted: "Disenarai pendek",
  submitted: "Dihantar",
  withdrawn: "Ditarik balik",
};

function getApplicantVisibleStatus(status, maskAcceptedStatus = true, application = null) {
  if (status === "accepted" && hasOrganizationFeedbackBeenSent(application) && !hasApplicantAgreedToOffer(application)) return "offered";
  if (status === "shortlisted" && hasAcceptedDepartmentRecommendation(application)) return "shortlisted";
  if (isPendingDepartmentReview(application)) return "screening";
  if (application?.assigned_department && hasSubmittedDepartmentDecision(application) && status === "shortlisted") return "screening";
  return maskAcceptedStatus && status === "accepted" ? "screening" : status;
}

function hasApplicantAgreedToOffer(application) {
  return application?.profile_data?.applicant_confirmation?.status === "agreed";
}

function hasApplicantRejectedOffer(application) {
  return application?.profile_data?.applicant_confirmation?.status === "rejected";
}

function hasSubmittedDepartmentDecision(application) {
  return Boolean(application?.profile_data?.department_decision?.submitted_at);
}

function hasAcceptedDepartmentRecommendation(application) {
  const recommendation = application?.profile_data?.department_decision?.recommendation || "";
  return hasSubmittedDepartmentDecision(application) && String(recommendation).toLowerCase() === "terima";
}

function isPendingDepartmentReview(application) {
  return Boolean(application?.assigned_department && !hasSubmittedDepartmentDecision(application));
}

function getReadOnlyStatusLabel(status, maskAcceptedStatus, application = null, statusLabelOverrides = {}) {
  if (hasApplicantAgreedToOffer(application)) {
    const lifecycleStatus = getApplicantAgreedInternshipStatus(application);
    return statusLabelOverrides[lifecycleStatus] || applicantInternshipLifecycleStatusLabels[lifecycleStatus] || "Pengesahan Dihantar";
  }
  if (hasApplicantRejectedOffer(application)) return statusLabelOverrides.applicant_offer_rejected || "Tolak Tawaran";
  const visibleStatus = getApplicantVisibleStatus(status, maskAcceptedStatus, application);
  return statusLabelOverrides[visibleStatus] || statusLabels[visibleStatus] || visibleStatus;
}

function getOrganizationFeedbackRelease(application) {
  const release = application?.profile_data?.organization_feedback_release;
  return release && typeof release === "object" ? release : {};
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

function hasOrganizationFeedbackBeenSent(application) {
  return Boolean(getOrganizationFeedbackRelease(application).sent_to_applicant_at);
}

function getSavedHrmFinalDecision(application) {
  const decision = application?.profile_data?.hrm_final_decision;
  return decision && typeof decision === "object" ? decision : {};
}

function hasHrmFinalRejectionDecision(application) {
  const decision = getSavedHrmFinalDecision(application);
  return (application?.status || "") === "rejected" && (decision.decision === "Tolak" || Boolean(decision.remarks));
}

const documentFields = [
  { field: "universityLetterFile", label: "Surat rasmi daripada institusi / kolej / universiti" },
  { field: "transcriptFile", label: "Transkrip akademik terkini" },
  { field: "resumeFile", label: <i>Curriculum Vitae (CV)</i> },
  { field: "passportPhotoFile", label: "1 keping gambar berukuran passport" },
  { field: "bankAccountFile", label: "1 salinan muka depan akaun bank" },
];
const jobDocumentFields = documentFields.filter(
  (document) => !["universityLetterFile", "transcriptFile"].includes(document.field),
);

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

function isJobApplicationDetail(application) {
  return application?.vacancy_type === "job"
    || application?.type === "job"
    || application?.vacancy_detail?.vacancy_type === "job";
}

const getJobTabCode = (index) => `(${String.fromCharCode(65 + index)})`;

function getReadOnlyJobTabLabel(tab, index) {
  return `${getJobTabCode(index)} ${jobTabShortLabels[tab] || tab}`;
}

function getReadOnlyJobInfoHeading(tab, index) {
  return `${getJobTabCode(index)} ${tab.toUpperCase()}`;
}

function getRows(value, count, fallback) {
  const rows = Array.isArray(value) ? value : [];
  return Array.from({ length: count }, (_, index) => ({ ...fallback, ...(rows[index] || {}) }));
}

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

function getPassportPhotoDocument(documents, studentInfo) {
  return normalizeDocumentFile(
    documents.passportPhotoFile,
    studentInfo.passportPhotoFile,
    studentInfo.passportPhotoFileUrl,
  );
}

function renderReadOnlyPassportPhoto(documents, studentInfo) {
  const passportPhoto = getPassportPhotoDocument(documents, studentInfo);
  const hasPreview = Boolean(passportPhoto.url);

  return (
    <section className="student-info-photo-card student-info-photo-card-readonly" aria-label="Gambar pasport pemohon">
      <div className="student-passport-upload student-passport-upload-readonly">
        {hasPreview ? (
          <img src={passportPhoto.url} alt="Gambar pasport pemohon" />
        ) : (
          <span>
            <Icon>image</Icon>
            <b>
              Gambar<br />pasport
            </b>
            <small>3.5 cm x 5.0 cm</small>
          </span>
        )}
      </div>
    </section>
  );
}

function renderReadOnlyJobApplicationInstructions() {
  return (
    <section className="student-job-application-instructions" aria-label="Arahan permohonan jawatan kosong">
      <table className="student-job-instructions-table">
        <thead>
          <tr>
            <th colSpan={2}>SILA BACA ARAHAN DI BAWAH DENGAN TELITI</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1.</td>
            <td>Pemohon hendaklah membaca iklan jawatan yang dipohon dengan teliti.</td>
          </tr>
          <tr>
            <td>2.</td>
            <td>Hanya pemohon yang memenuhi syarat-syarat yang dikehendaki sahaja akan dipertimbangkan.</td>
          </tr>
          <tr>
            <td>3.</td>
            <td>Gunakan <strong>HURUF BESAR</strong> sahaja. Tuliskan <strong>TB</strong> pada ruangan yang tidak berkenaan.</td>
          </tr>
          <tr>
            <td>4.</td>
            <td>Borang ini hendaklah diisi dengan lengkap dan dihantar sebelum atau pada tarikh akhir iklan.</td>
          </tr>
          <tr>
            <td>5.</td>
            <td>Permohonan yang tidak lengkap, tidak memenuhi syarat atau diterima selepas tarikh iklan ditutup akan ditolak.</td>
          </tr>
          <tr>
            <td>6.</td>
            <td>
              Pemohon yang sedang berkhidmat dengan Kerajaan/ Badan Berkanun/ Pihak Berkuasa Tempatan hendaklah
              menghantar permohonan melalui Ketua Jabatan masing-masing dengan melampirkan Laporan Penilaian
              Prestasi yang terkini serta penyata perkhidmatan yang disahkan.
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
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
        aria-label={`Lihat ${file.name}`}
        className="organization-feedback-icon-button organization-feedback-icon-button-view"
        disabled={!file.url && !file.isLegacyNameOnly}
        onClick={() => openDocumentFile(file)}
        title="Lihat fail"
        type="button"
      >
        <Icon>visibility</Icon>
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

function getApplicantConfirmationDocuments(application) {
  const documents = application?.document_files?.applicantConfirmationDocuments;
  if (!Array.isArray(documents)) return [];
  return documents.map((document, index) => ({
    id: document.id || String(index + 1),
    name: document.name || "Dokumen pengesahan pemohon",
    url: resolveMediaUrl(document.url || ""),
  }));
}

function getApplicantConfirmationSubmittedAt(application) {
  return application?.profile_data?.applicant_confirmation?.submitted_at || "";
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

function ApplicantOrganizationFeedbackTab({ application, onNext }) {
  const [feedbackRelease] = useState(() => getOrganizationFeedbackRelease(application));
  const [feedbackDocuments] = useState(() => getOrganizationFeedbackDocuments(application));
  const [feedbackReportDate] = useState(() => getOrganizationFeedbackReportValue(application, "date"));
  const [feedbackReportTime] = useState(() => getOrganizationFeedbackReportValue(application, "time"));
  const [feedbackReportPlace] = useState(() => getOrganizationFeedbackReportValue(application, "place"));
  const [feedbackConfirmationDate] = useState(() => getOrganizationFeedbackConfirmationDate(application));
  const internshipPeriod = feedbackRelease.internship_period || "Belum ditetapkan";
  const studentName = getInternshipStudentName(application);
  const identityNo = getInternshipStudentIdentityNo(application);
  const program = getInternshipProgram(application);
  const placementDepartment = getApplicantFeedbackPlacementDepartment(application);

  return (
    <div className="organization-feedback-panel applicant-organization-feedback-panel">
      <div className="organization-feedback-intro">
        <p>Dengan segala hormatnya perkara di atas adalah dirujuk.</p>
        <p>
          Sukacita dimaklumkan bahawa Dewan Bandaraya Kuching Utara tiada halangan untuk menerima anda bagi menjalani Latihan Industri / Praktikal seperti berikut:-
        </p>
      </div>
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

      <section className="organization-feedback-report-note applicant-organization-report-note" aria-label="Maklumat lapor diri">
        <p>Maklumat lapor diri adalah seperti berikut:</p>
        <dl className="organization-feedback-report-details">
          <dt>Tarikh</dt>
          <dd>:</dd>
          <dd>{feedbackReportDate}</dd>
          <dt>Masa</dt>
          <dd>:</dd>
          <dd>{feedbackReportTime}</dd>
          <dt>Tempat</dt>
          <dd>:</dd>
          <dd>
            {feedbackReportPlace.split("\n").map((line, index) => (
              <span key={`${line}-${index}`}>{line}</span>
            ))}
          </dd>
        </dl>
      </section>

      <section className="organization-feedback-confirmation-note" aria-label="Pengesahan bertulis">
        <p>
          Sila buat pengesahan secara bertulis <strong>(seperti di Lampiran II)</strong>, kemudian sila muat naik dokumen
          pengesahan tersebut kepada Dewan Bandaraya Kuching Utara dan sebelum atau pada{" "}
          <span className="organization-feedback-confirmation-date">{feedbackConfirmationDate}</span>. Sekiranya pihak kami tidak
          menerima sebarang maklumbalas selepas tarikh tersebut, maka kami beranggapan bahawa anda telah menolak tawaran
          tersebut. Sebarang surat-menyurat selepas tarikh tersebut tidak akan dilayan.
        </p>
        <p>Sekian. Terima kasih.</p>
      </section>

      <div className="organization-feedback-table-wrap applicant-organization-document-wrap">
        <p className="applicant-organization-download-note">
          Sila muat turun dokumen maklumbalas organisasi di bawah.
        </p>
        <table className="organization-feedback-document-table applicant-organization-document-table">
          <colgroup>
            <col className="organization-feedback-col-index" />
            <col className="organization-feedback-col-format" />
            <col />
            <col className="organization-feedback-col-actions applicant-organization-document-actions-col" />
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
                <tr key={`organizationFeedbackDocument-${document.id || index}`}>
                  <td>{index + 1}</td>
                  <td>PDF</td>
                  <td>
                    <a
                      className="organization-feedback-attachment-link"
                      href={document.url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      aria-disabled={!document.url}
                      onClick={(event) => {
                        if (!document.url) event.preventDefault();
                      }}
                    >
                      <Icon>description</Icon>
                      <span>{document.name}</span>
                    </a>
                  </td>
                  <td>
                    <div className="organization-feedback-row-actions applicant-organization-document-actions">
                      <button
                        aria-label={`Lihat ${document.name}`}
                        className="organization-feedback-icon-button organization-feedback-icon-button-view"
                        disabled={!document.url}
                        type="button"
                        onClick={() => openDocumentFile(document)}
                        title="Lihat fail"
                      >
                        <Icon>visibility</Icon>
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
      <footer className="organization-feedback-send-actions applicant-organization-next-actions">
        <button className="hrm-primary organization-feedback-send" type="button" onClick={onNext}>
          Seterusnya
        </button>
      </footer>
    </div>
  );
}

function ApplicantConfirmationSendConfirmModal({
  confirmLabel = "Ya",
  isSaving,
  message = "Anda yakin mahu menghantar pengesahan penerimaan tawaran ini?",
  onCancel,
  onConfirm,
  title = "Hantar pengesahan?",
}) {
  return (
    <div className="profile-confirm-overlay" role="presentation">
      <section
        className="profile-confirm-dialog applicant-confirmation-send-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="applicant-confirmation-send-title"
      >
        <h2 id="applicant-confirmation-send-title">{title}</h2>
        <p>{message}</p>
        <div>
          <button className="profile-confirm-secondary" disabled={isSaving} onClick={onCancel} type="button">
            Tidak
          </button>
          <button className="profile-confirm-primary" disabled={isSaving} onClick={onConfirm} type="button">
            {isSaving ? "Menghantar..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function ApplicantConfirmationTab({ application, onConfirmed }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [confirmationState, setConfirmationState] = useState(() => ({
    isAgreed: hasApplicantAgreedToOffer(application),
    documents: getApplicantConfirmationDocuments(application),
    submittedAt: getApplicantConfirmationSubmittedAt(application),
  }));
  const [fileInputKey, setFileInputKey] = useState(0);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const isAgreed = confirmationState.isAgreed;
  const isRejected = hasApplicantRejectedOffer(application);
  const hasResponded = isAgreed || isRejected;
  const confirmationSubmittedDate = formatDate(confirmationState.submittedAt);
  const documents = isAgreed
    ? confirmationState.documents
    : selectedFiles.map((file, index) => ({ file, id: `${file.name}-${index}`, name: file.name, url: "" }));
  const isPdfFile = (file) => file?.type === "application/pdf" || file?.name?.toLowerCase().endsWith(".pdf");

  const selectConfirmationFiles = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    if (files.some((file) => !isPdfFile(file))) {
      setFileInputKey((current) => current + 1);
      setMessage("Format fail mesti PDF sahaja.");
      return;
    }
    setMessage("");
    setSelectedFiles((current) => [...current, ...files]);
    setFileInputKey((current) => current + 1);
  };

  const requestSubmitConfirmation = () => {
    if (hasResponded) return;
    if (!selectedFiles.length) {
      setMessage("Sila muat naik sekurang-kurangnya satu dokumen pengesahan sebelum hantar.");
      return;
    }
    setMessage("");
    setShowConfirmModal(true);
  };

  const requestRejectConfirmation = () => {
    if (hasResponded) return;
    setMessage("");
    setShowRejectModal(true);
  };

  function removeConfirmationFile(index) {
    setSelectedFiles((current) => current.filter((_file, fileIndex) => fileIndex !== index));
    setMessage("");
  }

  const submitConfirmation = async () => {
    const payload = new FormData();
    selectedFiles.forEach((file) => {
      payload.append("applicantConfirmationDocuments", file);
    });

    setIsSaving(true);
    setMessage("");
    try {
      const updatedApplication = await apiRequest(`/applications/${application.id}/confirm-offer/`, {
        method: "POST",
        body: payload,
      });
      setConfirmationState({
        isAgreed: hasApplicantAgreedToOffer(updatedApplication),
        documents: getApplicantConfirmationDocuments(updatedApplication),
        submittedAt: getApplicantConfirmationSubmittedAt(updatedApplication),
      });
      setSelectedFiles([]);
      setFileInputKey((current) => current + 1);
      setShowConfirmModal(false);
      setMessage("Pengesahan penerimaan tawaran telah dihantar.");
      onConfirmed?.(updatedApplication);
    } catch (error) {
      setMessage(error.message || "Pengesahan penerimaan tawaran gagal dihantar.");
    } finally {
      setIsSaving(false);
    }
  };

  const rejectConfirmation = async () => {
    setIsSaving(true);
    setMessage("");
    try {
      const updatedApplication = await apiRequest(`/applications/${application.id}/reject-offer/`, {
        method: "POST",
      });
      setShowRejectModal(false);
      setMessage("Penolakan tawaran telah dihantar.");
      onConfirmed?.(updatedApplication);
    } catch (error) {
      setMessage(error.message || "Penolakan tawaran gagal dihantar.");
    } finally {
      setIsSaving(false);
    }
  };

  const openConfirmationDocument = (document) => {
    if (document?.url) {
      openDocumentFile(document);
      return;
    }
    if (!document?.file || typeof window === "undefined") return;

    const previewUrl = URL.createObjectURL(document.file);
    window.open(previewUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(previewUrl), 1000);
  };

  return (
    <div className="applicant-confirmation-panel">
      <section className="organization-feedback-section" aria-label="Dokumen pengesahan pemohon">
        <div className="organization-feedback-section-header">
          <div className="organization-feedback-section-title">
            <h3>
              Dokumen pengesahan pemohon
              <span className="organization-feedback-required" aria-hidden="true">*</span>
            </h3>
            <p>Wajib muat naik sekurang-kurangnya satu dokumen pengesahan penerimaan tawaran dalam format PDF.</p>
          </div>
          {!hasResponded ? (
            <div className="organization-feedback-section-actions">
              <label className="organization-feedback-add">
                <Icon>upload_file</Icon>
                <span>Muat Naik Dokumen</span>
                <input
                  key={fileInputKey}
                  accept="application/pdf,.pdf"
                  className="organization-feedback-hidden-input"
                  disabled={isSaving}
                  multiple
                  name="applicantConfirmationDocuments"
                  onChange={selectConfirmationFiles}
                  type="file"
                />
              </label>
            </div>
          ) : null}
        </div>
        {message ? <p className="organization-feedback-message">{message}</p> : null}
        <div className="organization-feedback-table-wrap">
          <table className="organization-feedback-document-table applicant-confirmation-document-table">
            <colgroup>
              <col className="organization-feedback-col-index" />
              <col className="organization-feedback-col-format" />
              <col />
              <col className="organization-feedback-col-actions applicant-organization-document-actions-col" />
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
              {documents.length ? (
                documents.map((document, index) => (
                  <tr key={document.id || `${document.name}-${index}`}>
                    <td>{index + 1}</td>
                    <td>PDF</td>
                    <td>
                      {document.url ? (
                        <a className="organization-feedback-attachment-link" href={document.url} target="_blank" rel="noreferrer">
                          <Icon>description</Icon>
                          <span>{document.name}</span>
                        </a>
                      ) : (
                        <span className="organization-feedback-attachment-link applicant-confirmation-local-file">
                          <Icon>description</Icon>
                          <span>{document.name}</span>
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="organization-feedback-row-actions applicant-organization-document-actions">
                        <button
                          aria-label={`Lihat ${document.name}`}
                          className="organization-feedback-icon-button organization-feedback-icon-button-view"
                          disabled={!document.url && !document.file}
                          onClick={() => openConfirmationDocument(document)}
                          title="Lihat fail"
                          type="button"
                        >
                          <Icon>visibility</Icon>
                        </button>
                        {!hasResponded ? (
                          <button
                            aria-label={`Buang ${document.name}`}
                            className="organization-feedback-icon-button organization-feedback-icon-button-remove-file"
                            disabled={isSaving}
                            onClick={() => removeConfirmationFile(index)}
                            title="Buang fail"
                            type="button"
                          >
                            <Icon>delete</Icon>
                          </button>
                        ) : null}
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

      <footer className="organization-feedback-send-actions">
        {isAgreed ? (
          <p className="organization-feedback-sent-note">
            {confirmationState.submittedAt ? (
              <>Pengesahan penerimaan tawaran telah dihantar pada {confirmationSubmittedDate}.</>
            ) : (
              "Pengesahan penerimaan tawaran telah dihantar."
            )}
          </p>
        ) : null}
        {isRejected ? <p className="organization-feedback-sent-note">Penolakan tawaran telah dihantar.</p> : null}
        {!hasResponded ? (
          <button
            className="hrm-danger organization-feedback-send"
            disabled={isSaving}
            onClick={requestRejectConfirmation}
            type="button"
          >
            Tolak Tawaran
          </button>
        ) : null}
        <button
          className="hrm-primary organization-feedback-send"
          disabled={hasResponded || isSaving || !selectedFiles.length}
          onClick={requestSubmitConfirmation}
          type="button"
        >
          {isSaving ? "Menghantar..." : hasResponded ? "Telah dihantar" : <span>Hantar</span>}
        </button>
      </footer>

      {showConfirmModal ? (
        <ApplicantConfirmationSendConfirmModal
          isSaving={isSaving}
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={submitConfirmation}
        />
      ) : null}
      {showRejectModal ? (
        <ApplicantConfirmationSendConfirmModal
          confirmLabel="Ya, Tolak"
          isSaving={isSaving}
          message="Anda yakin mahu menolak tawaran latihan industri ini?"
          onCancel={() => setShowRejectModal(false)}
          onConfirm={rejectConfirmation}
          title="Tolak tawaran?"
        />
      ) : null}
    </div>
  );
}

function ApplicantHrmDecisionTab({ application }) {
  const finalDecision = getSavedHrmFinalDecision(application);
  const decisionMessage = normalizeHrmFinalRejectionRemarks(finalDecision.remarks || hrmFinalRejectionMessage);

  return (
    <div className="applicant-confirmation-panel applicant-hrm-decision-panel">
      <section className="applicant-confirmation-statement" aria-label="Alasan keputusan permohonan">
        {decisionMessage.split("\n\n").map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </section>
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
  statusLabelOverrides = {},
  tabGroups = [],
}) {
  const profileData = application?.profile_data || {};
  const studentInfo = profileData.student_info || {};
  const documents = {
    ...(profileData.documents || {}),
    ...(application?.document_files || {}),
  };
  const vacancy = application?.vacancy_detail || {};
  const isJobApplication = isJobApplicationDetail(application);
  const status = application?.status || "draft";
  const visibleStatus = hasApplicantAgreedToOffer(application)
    ? getApplicantAgreedInternshipStatus(application)
    : getApplicantVisibleStatus(status, maskAcceptedStatus, application);
  const panelTabs = isJobApplication ? readOnlyJobInfoTabs : [...infoTabs, ...extraTabs];
  const panelTitle = isJobApplication ? `Nama Jawatan Yang Dipohon: ${vacancy.title || "Jawatan DBKU"}` : "Permohonan Latihan Industri";
  const activeInfoHeading = isJobApplication
    ? getReadOnlyJobInfoHeading(activeInfoTab, readOnlyJobInfoTabs.indexOf(activeInfoTab))
    : activeInfoTab;
  const currentDocumentFields = isJobApplication ? jobDocumentFields : documentFields;
  const groupedTabs = tabGroups
    .map((group) => ({
      ...group,
      tabs: (group.tabs || []).filter((tab) => panelTabs.includes(tab)),
    }))
    .filter((group) => group.tabs.length);

  const renderTabButton = (tab) => (
    <button
      className={activeInfoTab === tab ? "active" : ""}
      key={tab}
      title={isJobApplication ? getReadOnlyJobInfoHeading(tab, readOnlyJobInfoTabs.indexOf(tab)) : undefined}
      type="button"
      onClick={() => onTabChange(tab)}
    >
      {isJobApplication ? getReadOnlyJobTabLabel(tab, readOnlyJobInfoTabs.indexOf(tab)) : tab}
    </button>
  );

  const renderPersonalFields = () => (
    <>
      {renderReadOnlyPassportPhoto(documents, studentInfo)}
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
    </>
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
          {currentDocumentFields.map((document) => renderDocumentRow(document, documents, studentInfo))}
        </tbody>
      </table>
    </div>
  );

  const renderReadOnlyJobField = (label, value) => (
    <div className="student-job-readonly-field">
      <span className="student-job-readonly-field-label">{label}</span>
      <span className="student-job-readonly-field-separator" aria-hidden="true">:</span>
      {renderJobValue(value)}
    </div>
  );

  const renderJobValue = (value) => <span className="student-readonly-value">{displayValue(value)}</span>;

  const renderJobHeading = (colSpan, note = null) => (
    <thead>
      <tr>
        <th className="student-job-spm-heading" colSpan={colSpan}>
          {activeInfoHeading}
          {note ? <span className="student-job-heading-note">{note}</span> : null}
        </th>
      </tr>
    </thead>
  );

  const renderJobPersonalFields = () => (
    <>
      <div className="student-job-photo-guidance-row">
        {renderReadOnlyJobApplicationInstructions()}
        {renderReadOnlyPassportPhoto(documents, studentInfo)}
      </div>
      <div className="student-personal-table-wrap">
        <table className="student-personal-table student-readonly-table">
          <thead>
            <tr className="student-personal-section-heading">
              <th colSpan={2}>{activeInfoHeading}</th>
            </tr>
          </thead>
          <tbody>
            {renderReadOnlyRow("salutation", "Gelaran (Encik/ Puan/ Cik)", studentInfo.salutation)}
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
    </>
  );

  const renderJobSpmFields = () => {
    const rows = getRows(studentInfo.jobSpmSubjects, jobSpmSubjectRowCount, { grade: "", subject: "" });
    return (
      <div className="student-job-spm-table-wrap">
        <table className="student-job-spm-table">
          {renderJobHeading(4)}
          <tbody>
            <tr>
              <td colSpan={3}>
                {renderReadOnlyJobField("Sekolah", studentInfo.jobSpmSchool)}
              </td>
              <td className="hrm-use-cell" rowSpan={3}>UNTUK KEGUNAAN URUSETIA (BHG HRM)</td>
            </tr>
            <tr>
              <td colSpan={3}>
                {renderReadOnlyJobField("Tahun", studentInfo.jobSpmYear)}
              </td>
            </tr>
            <tr>
              <td colSpan={3}>
                {renderReadOnlyJobField("Nama Peperiksaan", studentInfo.jobSpmExamName)}
              </td>
            </tr>
            <tr><th>Bil</th><th>Mata Pelajaran</th><th>Gred</th><th>Semakan</th></tr>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{renderJobValue(row.subject)}</td>
                <td>{renderJobValue(row.grade)}</td>
                <td className="hrm-check-cell" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderJobBmJulyFields = () => (
    <div className="student-job-spm-table-wrap">
      <table className="student-job-spm-table student-job-compact-table student-job-bm-july-table">
        <colgroup>
          <col />
          <col />
          <col />
          <col />
        </colgroup>
        {renderJobHeading(4)}
        <tbody>
          <tr><td colSpan={2}>Tahun</td><td colSpan={2}>{renderJobValue(studentInfo.jobBmJulyYear)}</td></tr>
          <tr><td colSpan={2}>Nama Peperiksaan</td><td colSpan={2}>{renderJobValue(studentInfo.jobBmJulyExamName)}</td></tr>
          <tr>
            <td>Keputusan Gred</td>
            <td>{renderJobValue(studentInfo.jobBmJulyGradeDecision)}</td>
            <td>Ujian Lisan</td>
            <td>{renderJobValue(studentInfo.jobBmJulyOralExam)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const renderJobMathJulyFields = () => (
    <div className="student-job-spm-table-wrap">
      <table className="student-job-spm-table student-job-compact-table">
        {renderJobHeading(2)}
        <tbody>
          <tr><td>Tahun</td><td>{renderJobValue(studentInfo.jobMathJulyYear)}</td></tr>
          <tr><td>Keputusan Gred</td><td>{renderJobValue(studentInfo.jobMathJulyGradeDecision)}</td></tr>
        </tbody>
      </table>
    </div>
  );

  const renderJobStpmFields = () => {
    const rows = getRows(studentInfo.jobStpmSubjects, jobStpmSubjectRowCount, { grade: "", subject: "" });
    return (
      <div className="student-job-spm-table-wrap">
        <table className="student-job-spm-table student-job-stpm-table">
          {renderJobHeading(3)}
          <tbody>
            <tr>
              <td colSpan={3}>
                {renderReadOnlyJobField("Sekolah", studentInfo.jobStpmSchool)}
              </td>
            </tr>
            <tr>
              <td colSpan={3}>
                {renderReadOnlyJobField("Tahun", studentInfo.jobStpmYear)}
              </td>
            </tr>
            <tr>
              <td colSpan={3}>
                {renderReadOnlyJobField("Nama Peperiksaan", studentInfo.jobStpmExamName)}
              </td>
            </tr>
            <tr><th>Bil</th><th>Mata Pelajaran</th><th>Gred</th></tr>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{renderJobValue(row.subject)}</td>
                <td>{renderJobValue(row.grade)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderJobHigherEducationFields = () => {
    const rows = getRows(studentInfo.jobHigherEducationQualifications, jobHigherEducationRowCount, {
      certificateName: "",
      cgpa: "",
      completionDate: "",
      entryDate: "",
      institution: "",
      specialization: "",
    });
    return (
      <div className="student-job-spm-table-wrap">
        {rows.map((row, index) => (
          <table className="student-job-spm-table student-job-higher-education-table" key={index}>
            <colgroup>
              <col />
              <col />
              <col />
              <col />
            </colgroup>
            {index === 0 ? renderJobHeading(4, "(Sila lengkapkan maklumat kelulusan pendidikan tinggi jika jawatan yang dipohon memerlukan kelayakan tersebut. Jika tidak, ruangan ini hendaklah dikosongkan.)") : null}
            <tbody>
              <tr><td>Nama Sijil</td><td>{renderJobValue(row.certificateName)}</td><td>Tarikh Masuk</td><td>{renderJobValue(row.entryDate)}</td></tr>
              <tr><td>CGPA</td><td>{renderJobValue(row.cgpa)}</td><td>Tarikh Tamat Pengajian</td><td>{renderJobValue(row.completionDate)}</td></tr>
              <tr><td>Institusi</td><td colSpan={3}>{renderJobValue(row.institution)}</td></tr>
              <tr><td>Pengkhususan</td><td colSpan={3}>{renderJobValue(row.specialization)}</td></tr>
            </tbody>
          </table>
        ))}
      </div>
    );
  };

  const renderJobLanguageSkillsFields = () => {
    const rows = Array.isArray(studentInfo.jobLanguageSkillRows) ? studentInfo.jobLanguageSkillRows : [];
    return (
      <div className="student-job-spm-table-wrap">
        <table className="student-job-spm-table student-job-language-table">
          <thead>
            <tr>
              <th className="student-job-spm-heading" colSpan={5}>
                {activeInfoHeading}
                <span className="student-job-heading-note">(Sila tandakan (/) di petak yang berkenaan)</span>
              </th>
            </tr>
            <tr className="student-job-language-column-row">
              <th>Bahasa:</th>
              <th>Kelancaran</th>
              {jobSkillLevelOptions.map((option) => <th key={option}>{option}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <Fragment key={index}>
                <tr>
                  <td rowSpan={2}>
                    {row.required ? (
                      row.language
                    ) : (
                      <span className="student-job-other-language">
                        <span className="student-job-other-language-label">Bahasa Lain:</span>
                        <span className="student-job-other-language-input">{renderJobValue(row.language)}</span>
                      </span>
                    )}
                  </td>
                  <td className="student-job-fluency-cell">Pertuturan</td>
                  {jobSkillLevelOptions.map((option) => <td className="student-job-radio-table-cell" key={option}>{isSameJobChoice(row.speaking, option) ? "/" : ""}</td>)}
                </tr>
                <tr>
                  <td className="student-job-fluency-cell">Penulisan</td>
                  {jobSkillLevelOptions.map((option) => <td className="student-job-radio-table-cell" key={option}>{isSameJobChoice(row.writing, option) ? "/" : ""}</td>)}
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderJobComputerSkillsFields = () => {
    const rows = getRows(studentInfo.jobComputerSkillRows, 5, { level: "", softwareName: "" });
    return (
      <div className="student-job-spm-table-wrap">
        <table className="student-job-spm-table student-job-computer-table">
          <thead>
            <tr>
              <th className="student-job-spm-heading" colSpan={5}>
                {activeInfoHeading}
                <span className="student-job-heading-note">(Sila tandakan (/) di petak yang berkenaan)</span>
              </th>
            </tr>
            <tr>
              <th rowSpan={2}>Nama Perisian</th>
              <th colSpan={4}>Tahap Kemahiran</th>
            </tr>
            <tr>{jobComputerLevelOptions.map((option) => <th key={option}>{option}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>{renderJobValue(row.softwareName)}</td>
                {jobComputerLevelOptions.map((option) => <td className="student-job-radio-table-cell" key={option}>{isSameJobChoice(row.level, option) ? "/" : ""}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderJobWorkExperienceFields = () => {
    const rows = getRows(studentInfo.jobWorkExperienceRows, jobWorkExperienceRowCount, {
      duration: "",
      employerAddress: "",
      jobTitle: "",
      netSalary: "",
      periodFrom: "",
      periodTo: "",
    });
    return (
      <div className="student-job-spm-table-wrap">
        <table className="student-job-spm-table student-job-work-experience-table">
          <colgroup>
            <col className="student-job-work-employer-col" />
            <col className="student-job-work-title-col" />
            <col className="student-job-work-salary-col" />
            <col className="student-job-work-date-col" />
            <col className="student-job-work-date-col" />
            <col className="student-job-work-duration-col" />
          </colgroup>
          <thead>
            <tr>
              <th className="student-job-spm-heading" colSpan={6}>{activeInfoHeading}</th>
            </tr>
            <tr><th rowSpan={2}>Nama &amp; Alamat Majikan</th><th rowSpan={2}>Nama Jawatan</th><th rowSpan={2}>Gaji Bersih Sebulan</th><th colSpan={2}>Tempoh Bekerja</th><th rowSpan={2}>Tempoh</th></tr>
            <tr><th>Dari</th><th>Hingga</th></tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>{renderJobValue(row.employerAddress)}</td>
                <td>{renderJobValue(row.jobTitle)}</td>
                <td>{renderJobValue(row.netSalary)}</td>
                <td>{renderJobValue(row.periodFrom)}</td>
                <td>{renderJobValue(row.periodTo)}</td>
                <td>{renderJobValue(row.duration)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderJobReferencesFields = () => {
    const rows = getRows(studentInfo.jobReferenceRows, jobReferenceRowCount, {
      address: "",
      employer: "",
      name: "",
      occupation: "",
      phone: "",
    });
    const referenceLine = (row, field, label) => (
      <label className="student-job-reference-line">
        <span>{label}</span>
        <b aria-hidden="true">:</b>
        {renderJobValue(row[field])}
      </label>
    );

    return (
      <div className="student-job-spm-table-wrap">
        <table className="student-job-spm-table student-job-references-table">
          <thead>
            <tr>
              <th className="student-job-spm-heading" colSpan={2}>
                <span className="student-job-reference-heading-title">
                  {activeInfoHeading}
                </span>
                <span className="student-job-heading-note">
                  (Sila berikan maklumat dua orang penama yang bukan ahli keluarga/ saudara-mara, yang dapat memberi keterangan dan pengesahan berkenaan maklumat diri anda)
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {rows.map((row, index) => (
                <td key={index}>
                  <div className="student-job-reference-card">
                    <span className="student-job-reference-number">{index + 1}.</span>
                    <div className="student-job-reference-fields">
                      {referenceLine(row, "name", "Nama")}
                      {referenceLine(row, "address", "Alamat")}
                      {referenceLine(row, "occupation", "Pekerjaan")}
                      {referenceLine(row, "employer", "Majikan")}
                      {referenceLine(row, "phone", "No. Telefon")}
                    </div>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderJobDeclarationFields = () => {
    const declarationLine = (field, label) => (
      <label className="student-job-declaration-line">
        <span>{label}</span>
        <b aria-hidden="true">:</b>
        {renderJobValue(studentInfo[field])}
      </label>
    );
    return (
      <div className="student-job-spm-table-wrap">
        <table className="student-job-spm-table student-job-declaration-table">
          {renderJobHeading(1)}
          <tbody>
            <tr>
              <td>
                <p className="student-job-declaration-copy">
                  {jobDeclarationText.split("BENAR dan TEPAT")[0]}<strong>BENAR</strong> dan <strong>TEPAT</strong>{jobDeclarationText.split("BENAR dan TEPAT")[1]}
                </p>
                <div className="student-job-declaration-fields">
                  {declarationLine("jobDeclarationName", "Nama")}
                  {declarationLine("jobDeclarationIcNo", "No. Kad Pengenalan")}
                  {declarationLine("jobDeclarationDate", "Tarikh")}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderJobActiveTabContent = () => (
    <>
      {activeInfoTab === personalInfoTab ? renderJobPersonalFields() : null}
      {activeInfoTab === jobSpmTab ? renderJobSpmFields() : null}
      {activeInfoTab === jobBmJulyTab ? renderJobBmJulyFields() : null}
      {activeInfoTab === jobMathJulyTab ? renderJobMathJulyFields() : null}
      {activeInfoTab === jobStpmTab ? renderJobStpmFields() : null}
      {activeInfoTab === jobHigherEducationTab ? renderJobHigherEducationFields() : null}
      {activeInfoTab === jobLanguageSkillsTab ? renderJobLanguageSkillsFields() : null}
      {activeInfoTab === jobComputerSkillsTab ? renderJobComputerSkillsFields() : null}
      {activeInfoTab === jobWorkExperienceTab ? renderJobWorkExperienceFields() : null}
      {activeInfoTab === jobReferencesTab ? renderJobReferencesFields() : null}
      {activeInfoTab === documentSupportTab ? renderDocumentFields() : null}
      {activeInfoTab === jobDeclarationTab ? renderJobDeclarationFields() : null}
    </>
  );

  return (
    <section
      className={`student-info-panel student-readonly-panel ${className}`}
      aria-label={isJobApplication ? "Paparan permohonan jawatan kosong" : "Paparan permohonan latihan industri"}
    >
      <header className="student-info-titlebar">
        <h1>{panelTitle}</h1>
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
              {!isJobApplication ? (
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
                      {getReadOnlyStatusLabel(status, maskAcceptedStatus, application, statusLabelOverrides)}
                    </strong>
                  </div>
                </section>
              ) : null}
              {status === "incomplete" ? (
                <div className="student-readonly-actions">
                  <Link
                    className="applicant-table-action"
                    to={isJobApplication ? APPLICANT_ROUTES.jobApplicationEdit(application.id) : APPLICANT_ROUTES.internshipApplicationEdit(application.id)}
                  >
                    <Icon>edit</Icon>
                    Kemaskini Permohonan
                  </Link>
                </div>
              ) : null}

              <nav
                className={`student-info-tabs${isJobApplication ? " job-application-tabs" : ""}${groupedTabs.length ? " student-info-tabs-grouped" : ""}`}
                aria-label={isJobApplication ? "Bahagian permohonan jawatan kosong" : "Bahagian permohonan latihan industri"}
              >
                {groupedTabs.length
                  ? groupedTabs.map((group) => (
                      <div className="student-info-tab-group" key={group.label}>
                        <span className="student-info-tab-group-label">{group.label}</span>
                        <div className="student-info-tab-group-items">{group.tabs.map(renderTabButton)}</div>
                      </div>
                    ))
                  : panelTabs.map(renderTabButton)}
              </nav>

              <section className="student-info-form">
                {!isJobApplication ? <h2>{activeInfoHeading}</h2> : null}
                {isJobApplication ? renderJobActiveTabContent() : (
                  <>
                    {activeInfoTab === personalInfoTab ? renderPersonalFields() : null}
                    {activeInfoTab === academicInfoTab ? renderAcademicFields() : null}
                    {activeInfoTab === documentSupportTab ? renderDocumentFields() : null}
                    {!infoTabs.includes(activeInfoTab) && renderExtraTabContent ? renderExtraTabContent(activeInfoTab) : null}
                  </>
                )}
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
  const [searchParams] = useSearchParams();
  const requestedInfoTab = searchParams.get("tab") || "";
  const [user] = useState(() => getStoredUser());
  const [sidebarOpen, toggleSidebar] = useApplicantSidebarState();
  const [activeInfoTab, setActiveInfoTab] = useState(personalInfoTab);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const displayName = user?.full_name || user?.first_name || "Pemohon DBKU";
  const email = user?.email || "Belum dikemaskini";
  const organizationFeedbackSent = hasOrganizationFeedbackBeenSent(application);
  const applicantExtraTabs = [
    ...(hasHrmFinalRejectionDecision(application) ? [hrmDecisionTab] : []),
    ...(organizationFeedbackSent ? [organizationFeedbackTab, applicantConfirmationTab] : []),
  ];

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
          const isJobDetail = isJobApplicationDetail(data);
          if ((data.status || "draft") === "draft") {
            navigate(isJobDetail ? APPLICANT_ROUTES.jobApplicationEdit(data.id) : APPLICANT_ROUTES.internshipApplication, { replace: true });
            return;
          }
          setApplication(data);
          if (isJobDetail && readOnlyJobInfoTabs.includes(requestedInfoTab)) {
            setActiveInfoTab(requestedInfoTab);
          } else if (isJobDetail) {
            setActiveInfoTab(personalInfoTab);
          } else if (requestedInfoTab === hrmDecisionTab && hasHrmFinalRejectionDecision(data)) {
            setActiveInfoTab(hrmDecisionTab);
          } else if (requestedInfoTab === organizationFeedbackTab && hasOrganizationFeedbackBeenSent(data)) {
            setActiveInfoTab(organizationFeedbackTab);
          } else {
            setActiveInfoTab(personalInfoTab);
          }
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
  }, [applicationId, navigate, requestedInfoTab, user]);

  const exitApplicationView = () => {
    navigate(APPLICANT_ROUTES.applications);
  };

  function handleApplicantConfirmationSent(updatedApplication) {
    setApplication(updatedApplication);
    navigate(APPLICANT_ROUTES.applications);
  }

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
            extraTabs={applicantExtraTabs}
            loading={loading}
            maskAcceptedStatus={!organizationFeedbackSent}
            onBack={exitApplicationView}
            onTabChange={setActiveInfoTab}
            renderExtraTabContent={(tab) =>
              tab === hrmDecisionTab ? (
                <ApplicantHrmDecisionTab application={application} />
              ) : tab === organizationFeedbackTab ? (
                <ApplicantOrganizationFeedbackTab application={application} onNext={() => setActiveInfoTab(applicantConfirmationTab)} />
              ) : tab === applicantConfirmationTab ? (
                <ApplicantConfirmationTab application={application} onConfirmed={handleApplicantConfirmationSent} />
              ) : null
            }
          />
        </main>
      </div>
    </div>
  );
}
