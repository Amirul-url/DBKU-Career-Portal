import { useEffect, useState } from "react";
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
const infoTabs = [personalInfoTab, "Maklumat Akademik", "Dokumen Sokongan"];
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

function getApplicantVisibleStatus(status, maskAcceptedStatus = true, application = null) {
  if (status === "shortlisted" && hasAcceptedDepartmentRecommendation(application)) return "shortlisted";
  if (isPendingDepartmentReview(application)) return "screening";
  if (application?.assigned_department && hasSubmittedDepartmentDecision(application) && status === "shortlisted") return "screening";
  return maskAcceptedStatus && status === "accepted" ? "screening" : status;
}

function hasApplicantAgreedToOffer(application) {
  return application?.profile_data?.applicant_confirmation?.status === "agreed";
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

function getReadOnlyStatusLabel(status, maskAcceptedStatus, application = null) {
  if (hasApplicantAgreedToOffer(application)) {
    const lifecycleStatus = getApplicantAgreedInternshipStatus(application);
    return applicantInternshipLifecycleStatusLabels[lifecycleStatus] || "Pengesahan Dihantar";
  }
  if (!maskAcceptedStatus && status === "accepted") return "Diterima";
  const visibleStatus = getApplicantVisibleStatus(status, maskAcceptedStatus, application);
  return statusLabels[visibleStatus] || visibleStatus;
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

function ApplicantConfirmationSendConfirmModal({ isSaving, onCancel, onConfirm }) {
  return (
    <div className="profile-confirm-overlay" role="presentation">
      <section
        className="profile-confirm-dialog applicant-confirmation-send-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="applicant-confirmation-send-title"
      >
        <h2 id="applicant-confirmation-send-title">Hantar pengesahan?</h2>
        <p>Anda yakin mahu menghantar pengesahan penerimaan tawaran ini?</p>
        <div>
          <button className="profile-confirm-secondary" disabled={isSaving} onClick={onCancel} type="button">
            Tidak
          </button>
          <button className="profile-confirm-primary" disabled={isSaving} onClick={onConfirm} type="button">
            {isSaving ? "Menghantar..." : "Ya"}
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
  }));
  const [fileInputKey, setFileInputKey] = useState(0);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const isAgreed = confirmationState.isAgreed;
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
    if (isAgreed) return;
    if (!selectedFiles.length) {
      setMessage("Sila muat naik sekurang-kurangnya satu dokumen pengesahan sebelum hantar.");
      return;
    }
    setMessage("");
    setShowConfirmModal(true);
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
          <div className="organization-feedback-section-actions">
            <label className="organization-feedback-add">
              <Icon>upload_file</Icon>
              <span>Muat Naik Dokumen</span>
              <input
                key={fileInputKey}
                accept="application/pdf,.pdf"
                className="organization-feedback-hidden-input"
                disabled={isAgreed || isSaving}
                multiple
                name="applicantConfirmationDocuments"
                onChange={selectConfirmationFiles}
                type="file"
              />
            </label>
          </div>
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
                        {!isAgreed ? (
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

      <section className="applicant-confirmation-statement" aria-label="Pengesahan penerimaan tawaran">
        <p>
          Dengan ini, saya mengesahkan penerimaan tawaran menjalani latihan industri di Dewan Bandaraya Kuching Utara (DBKU) seperti yang dinyatakan.
        </p>
        <p>Sekian, terima kasih atas perhatian dan kerjasama pihak puan.</p>
      </section>

      <footer className="organization-feedback-send-actions">
        {isAgreed ? <p className="organization-feedback-sent-note">Pengesahan penerimaan tawaran telah dihantar.</p> : null}
        <button
          className="hrm-primary organization-feedback-send"
          disabled={isAgreed || isSaving || !selectedFiles.length}
          onClick={requestSubmitConfirmation}
          type="button"
        >
          {isSaving ? "Menghantar..." : isAgreed ? "Telah dihantar" : <span>Hantar</span>}
        </button>
      </footer>

      {showConfirmModal ? (
        <ApplicantConfirmationSendConfirmModal
          isSaving={isSaving}
          onCancel={() => setShowConfirmModal(false)}
          onConfirm={submitConfirmation}
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
  tabGroups = [],
}) {
  const profileData = application?.profile_data || {};
  const studentInfo = profileData.student_info || {};
  const documents = {
    ...(profileData.documents || {}),
    ...(application?.document_files || {}),
  };
  const vacancy = application?.vacancy_detail || {};
  const status = application?.status || "draft";
  const visibleStatus = hasApplicantAgreedToOffer(application)
    ? getApplicantAgreedInternshipStatus(application)
    : getApplicantVisibleStatus(status, maskAcceptedStatus, application);
  const panelTabs = [...infoTabs, ...extraTabs];
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
      type="button"
      onClick={() => onTabChange(tab)}
    >
      {tab}
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
                    {getReadOnlyStatusLabel(status, maskAcceptedStatus, application)}
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

              <nav
                className={`student-info-tabs${groupedTabs.length ? " student-info-tabs-grouped" : ""}`}
                aria-label="Bahagian permohonan latihan industri"
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
          if ((data.status || "draft") === "draft") {
            navigate(APPLICANT_ROUTES.internshipApplication, { replace: true });
            return;
          }
          setApplication(data);
          if (requestedInfoTab === hrmDecisionTab && hasHrmFinalRejectionDecision(data)) {
            setActiveInfoTab(hrmDecisionTab);
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
