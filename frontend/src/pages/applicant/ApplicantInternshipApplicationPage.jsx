import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredUser } from "../../lib/authApi";
import { useApplicantSidebarState } from "../../modules/applicant/useApplicantSidebarState";
import { Icon } from "./ApplicantAuthShared";
import { ProfileContentHeader, ProfileSidebar } from "./ApplicantProfilePage";

const infoTabs = ["Maklumat Pemohon", "Maklumat Akademik", "Dokumen Sokongan"];

const academicLevelOptions = [
  "Sijil",
  "Diploma",
  "Diploma Lanjutan",
  "Ijazah Sarjana Muda",
  "Ijazah Sarjana",
  "PhD / Doktor Falsafah",
  "Lain-lain",
];

const documentFields = [
  {
    accept: ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    field: "resumeFile",
    hint: "PDF, DOC atau DOCX",
    label: "Resume",
  },
  {
    accept: ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    field: "universityLetterFile",
    hint: "Surat rasmi universiti / surat penempatan",
    label: "Surat Permohonan Universiti",
  },
  {
    accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
    field: "transcriptFile",
    hint: "PDF, JPG atau PNG",
    label: "Transkrip / Keputusan Terkini",
  },
];

const getDefaultStudentInfo = () => ({
  academicLevel: "",
  address: "",
  cgpa: "",
  currentYear: "",
  email: "",
  icNo: "",
  institution: "",
  name: "",
  phone: "",
  program: "",
  resumeFile: "",
  semester: "",
  supervisorEmail: "",
  supervisorName: "",
  supervisorPhone: "",
  transcriptFile: "",
  universityLetterFile: "",
});

const requiredFieldsByTab = {
  "Dokumen Sokongan": [
    ["resumeFile", "Resume"],
    ["universityLetterFile", "Surat Permohonan Universiti"],
    ["transcriptFile", "Transkrip / Keputusan Terkini"],
  ],
  "Maklumat Akademik": [
    ["academicLevel", "Tahap Pengajian"],
    ["currentYear", "Tahun Pengajian"],
    ["semester", "Semester"],
    ["cgpa", "CGPA / Keputusan Terkini"],
  ],
  "Maklumat Pemohon": [
    ["name", "Nama"],
    ["icNo", "No. Kad Pengenalan"],
    ["email", "Alamat E-mel"],
    ["phone", "No. Telefon"],
    ["address", "Alamat Surat Menyurat"],
    ["institution", "Institusi Pengajian"],
    ["program", "Program / Kursus"],
  ],
};

const getDraftStorageKey = (user) => `dbku_internship_student_info_manual_${user?.id || user?.email || "guest"}`;

function compactAddress(studentInfo = {}) {
  return [
    studentInfo.address,
    studentInfo.address1Line1,
    studentInfo.address1Line2,
    studentInfo.address1Line3,
    studentInfo.address1Postcode,
    studentInfo.address1City,
    studentInfo.address1State,
  ]
    .filter(Boolean)
    .join(", ");
}

function normalizeStudentInfoDraft(studentInfo = {}, user = null) {
  const defaults = getDefaultStudentInfo();

  return {
    ...defaults,
    ...studentInfo,
    academicLevel: studentInfo.academicLevel || studentInfo.qualification || "",
    address: compactAddress(studentInfo),
    email: studentInfo.email || user?.email || "",
    icNo: String(studentInfo.icNo || "").replace(/\D/g, ""),
    name: String(studentInfo.name || user?.full_name || user?.first_name || "").toUpperCase(),
    phone: String(studentInfo.phone || studentInfo.address1Phone || "").replace(/\D/g, ""),
  };
}

function loadStudentInfoDraft(user) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const saved = window.localStorage.getItem(getDraftStorageKey(user));
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveStudentInfoDraft(user, payload) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(getDraftStorageKey(user), JSON.stringify(payload));
  } catch {
    // Browser storage may be unavailable or full; keep the current in-memory state.
  }
}

export default function ApplicantInternshipApplicationPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const savedDraft = loadStudentInfoDraft(user);
  const [sidebarOpen, toggleSidebar] = useApplicantSidebarState();
  const [activeInfoTab, setActiveInfoTab] = useState("Maklumat Pemohon");
  const [notice, setNotice] = useState("");
  const [noticeStatus, setNoticeStatus] = useState("success");
  const documentInputRefs = useRef({});
  const [studentInfo, setStudentInfo] = useState(() => normalizeStudentInfoDraft(savedDraft?.studentInfo || {}, user));
  const displayName = user?.full_name || user?.first_name || "Pemohon DBKU";
  const email = user?.email || "Belum dikemaskini";

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true, state: { message: "Sila log masuk untuk memohon latihan industri." } });
    } else if (user.role !== "applicant") {
      navigate("/", { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    if (user?.role === "applicant") {
      saveStudentInfoDraft(user, {
        savedAt: new Date().toISOString(),
        studentInfo,
      });
    }
  }, [studentInfo, user]);

  if (!user || user.role !== "applicant") {
    return null;
  }

  const updateStudentInfo = (field) => (event) => {
    setNotice("");
    setStudentInfo((current) => ({ ...current, [field]: event.target.value }));
  };

  const updateStudentName = (event) => {
    setNotice("");
    setStudentInfo((current) => ({ ...current, name: event.target.value.toUpperCase() }));
  };

  const updateNumericStudentInfo = (field) => (event) => {
    setNotice("");
    setStudentInfo((current) => ({ ...current, [field]: event.target.value.replace(/\D/g, "") }));
  };

  const updateDocument = (field) => (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setNotice("");
    setStudentInfo((current) => ({ ...current, [field]: file.name }));
  };

  const clearDocument = (field) => {
    setNotice("");
    setStudentInfo((current) => ({ ...current, [field]: "" }));

    if (documentInputRefs.current[field]) {
      documentInputRefs.current[field].value = "";
    }
  };

  const handleUpdate = (event) => {
    event.preventDefault();

    const missingFields = requiredFieldsByTab[activeInfoTab]
      .filter(([field]) => !String(studentInfo[field] || "").trim())
      .map(([, label]) => label);

    if (missingFields.length) {
      setNoticeStatus("error");
      setNotice(`Sila lengkapkan: ${missingFields.join(", ")}.`);
      return;
    }

    setNoticeStatus("success");
    setNotice(`${activeInfoTab} telah dikemas kini untuk draf permohonan latihan industri.`);
  };

  const openInfoTab = (tab) => {
    setNotice("");
    setActiveInfoTab(tab);
  };

  const renderApplicantFields = () => (
    <div className="student-info-fields compact">
      <label className="wide">Nama<input value={studentInfo.name} onChange={updateStudentName} /></label>
      <label>No. Kad Pengenalan<input inputMode="numeric" maxLength={12} pattern="[0-9]*" value={studentInfo.icNo} onChange={updateNumericStudentInfo("icNo")} /></label>
      <label>Alamat E-mel<input type="email" value={studentInfo.email} onChange={updateStudentInfo("email")} /></label>
      <label>No. Telefon<input inputMode="numeric" pattern="[0-9]*" value={studentInfo.phone} onChange={updateNumericStudentInfo("phone")} /></label>
      <label className="wide">Alamat Surat Menyurat<textarea rows="3" value={studentInfo.address} onChange={updateStudentInfo("address")} /></label>
      <label className="wide">Institusi Pengajian<input value={studentInfo.institution} onChange={updateStudentInfo("institution")} /></label>
      <label className="wide">Program / Kursus<input value={studentInfo.program} onChange={updateStudentInfo("program")} /></label>
    </div>
  );

  const renderAcademicFields = () => (
    <div className="student-info-fields compact">
      <label>Tahap Pengajian
        <select value={studentInfo.academicLevel} onChange={updateStudentInfo("academicLevel")}>
          <option value="">Sila pilih</option>
          {academicLevelOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
      </label>
      <label>Tahun Pengajian<input placeholder="Contoh: Tahun 3" value={studentInfo.currentYear} onChange={updateStudentInfo("currentYear")} /></label>
      <label>Semester<input placeholder="Contoh: Semester 5" value={studentInfo.semester} onChange={updateStudentInfo("semester")} /></label>
      <label>CGPA / Keputusan Terkini<input placeholder="Contoh: 3.45" value={studentInfo.cgpa} onChange={updateStudentInfo("cgpa")} /></label>
      <label className="wide">Nama Penyelia / Penyelaras Universiti <em>(tidak wajib)</em><input value={studentInfo.supervisorName} onChange={updateStudentInfo("supervisorName")} /></label>
      <label>Emel Penyelia <em>(tidak wajib)</em><input type="email" value={studentInfo.supervisorEmail} onChange={updateStudentInfo("supervisorEmail")} /></label>
      <label>No. Telefon Penyelia <em>(tidak wajib)</em><input inputMode="numeric" pattern="[0-9]*" value={studentInfo.supervisorPhone} onChange={updateNumericStudentInfo("supervisorPhone")} /></label>
    </div>
  );

  const renderDocumentFields = () => (
    <div className="student-document-grid">
      {documentFields.map((document) => (
        <section className="student-document-card" key={document.field}>
          <input
            ref={(element) => {
              documentInputRefs.current[document.field] = element;
            }}
            accept={document.accept}
            type="file"
            onChange={updateDocument(document.field)}
          />
          <div>
            <Icon>{studentInfo[document.field] ? "task" : "upload_file"}</Icon>
            <strong>{document.label}</strong>
            <span>{studentInfo[document.field] || document.hint}</span>
          </div>
          <div className="student-document-actions">
            <button type="button" onClick={() => documentInputRefs.current[document.field]?.click()}>
              <Icon>upload_file</Icon>
              Muat Naik
            </button>
            <button disabled={!studentInfo[document.field]} type="button" onClick={() => clearDocument(document.field)}>
              <Icon>delete</Icon>
              Padam
            </button>
          </div>
        </section>
      ))}
    </div>
  );

  const nextInfoTab = infoTabs[infoTabs.indexOf(activeInfoTab) + 1] || null;

  return (
    <div className={`applicant-profile-page ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      <ProfileSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div className="profile-main-area">
        <ProfileContentHeader displayName={displayName} email={email} photoUrl={user.profile_photo_url} />
        <main className="profile-shell internship-application-shell">
          <section className="student-info-panel" aria-label="Maklumat permohonan latihan industri">
            <header className="student-info-titlebar">
              <h1>Permohonan Latihan Industri</h1>
            </header>

            <div className="student-info-workspace">
              <div className="student-info-content">
                <nav className="student-info-tabs" aria-label="Bahagian permohonan latihan industri">
                  {infoTabs.map((tab) => (
                    <button
                      className={activeInfoTab === tab ? "active" : ""}
                      key={tab}
                      type="button"
                      onClick={() => openInfoTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>

                <form className="student-info-form" onSubmit={handleUpdate}>
                  <h2>{activeInfoTab}</h2>
                  {notice ? <p className={`student-info-notice ${noticeStatus}`}>{notice}</p> : null}

                  {activeInfoTab === "Maklumat Pemohon" ? renderApplicantFields() : null}
                  {activeInfoTab === "Maklumat Akademik" ? renderAcademicFields() : null}
                  {activeInfoTab === "Dokumen Sokongan" ? renderDocumentFields() : null}

                  <div className="student-info-actions">
                    <button className="student-info-update" type="submit">Kemas Kini</button>
                    {nextInfoTab ? (
                      <button className="student-info-next" type="button" onClick={() => openInfoTab(nextInfoTab)}>
                        Seterusnya
                        <Icon>arrow_forward</Icon>
                      </button>
                    ) : null}
                  </div>
                </form>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
