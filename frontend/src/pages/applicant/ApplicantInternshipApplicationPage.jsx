import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredUser } from "../../lib/authApi";
import { useApplicantSidebarState } from "../../modules/applicant/useApplicantSidebarState";
import { Icon } from "./ApplicantAuthShared";
import { ApplicantAddressMap, ProfileContentHeader, ProfileSidebar } from "./ApplicantProfilePage";

const personalInfoTab = "Maklumat Peribadi Pemohon";
const infoTabs = [personalInfoTab, "Maklumat Akademik", "Dokumen Sokongan"];

const academicLevelOptions = [
  "Sijil",
  "Diploma",
  "Diploma Lanjutan",
  "Ijazah Sarjana Muda",
  "Ijazah Sarjana",
  "PhD / Doktor Falsafah",
  "Lain-lain",
];

const stateOptions = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Perak",
  "Perlis",
  "Pulau Pinang",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
  "WP Kuala Lumpur",
  "WP Labuan",
  "WP Putrajaya",
  "Lain-lain",
];

const raceOptions = ["Melayu", "Melanau", "Iban", "Bidayuh", "Cina", "India", "Lain-lain"];
const religionOptions = ["Islam", "Kristian", "Buddha", "Hindu", "Lain-lain"];
const citizenshipOptions = ["Warganegara", "Bukan Warganegara", "Penduduk Tetap"];
const maritalStatusOptions = ["Bujang", "Berkahwin", "Duda", "Janda"];
const yesNoOptions = ["Ya", "Tidak"];
const drivingLicenseOptions = ["Tiada", "B2", "B", "D", "DA", "E", "GDL", "PSV", "Lain-lain"];

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
  age: "",
  birthDate: "",
  birthPlace: "",
  citizenship: "",
  cgpa: "",
  currentYear: "",
  disability: "",
  drivingLicense: "",
  email: "",
  fatherBirthState: "",
  height: "",
  icNo: "",
  institution: "",
  maritalStatus: "",
  motherBirthState: "",
  name: "",
  phone: "",
  program: "",
  race: "",
  religion: "",
  resumeFile: "",
  semester: "",
  stateOfBirth: "",
  supervisorEmail: "",
  supervisorName: "",
  supervisorPhone: "",
  transcriptFile: "",
  universityLetterFile: "",
  weight: "",
  latitude: "",
  longitude: "",
});

const requiredFieldsByTab = {
  "Dokumen Sokongan": [
    ["resumeFile", "Resume"],
    ["universityLetterFile", "Surat Permohonan Universiti"],
    ["transcriptFile", "Transkrip / Keputusan Terkini"],
  ],
  "Maklumat Akademik": [
    ["institution", "Institusi Pengajian"],
    ["program", "Program / Kursus"],
    ["academicLevel", "Tahap Pengajian"],
    ["currentYear", "Tahun Pengajian"],
    ["semester", "Semester"],
    ["cgpa", "CGPA / Keputusan Terkini"],
  ],
  [personalInfoTab]: [
    ["name", "Nama"],
    ["icNo", "No. Kad Pengenalan Baru"],
    ["phone", "No. Telefon Bimbit/ Telefon Rumah"],
    ["address", "Alamat Surat Menyurat"],
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
    ["disability", "Kelainan Upaya"],
    ["drivingLicense", "Lesen Memandu"],
  ],
};

const getDraftStorageKey = (user) => `dbku_internship_student_info_manual_${user?.id || user?.email || "guest"}`;

function calculateAge(dateValue) {
  if (!dateValue) {
    return "";
  }

  const birthDate = new Date(dateValue);
  if (Number.isNaN(birthDate.getTime())) {
    return "";
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasBirthdayPassed =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hasBirthdayPassed) {
    age -= 1;
  }

  return age > 0 ? String(age) : "";
}

function compactAddress(studentInfo = {}) {
  if (studentInfo.address) {
    return studentInfo.address;
  }

  return [
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
  const birthDate = studentInfo.birthDate || studentInfo.dateOfBirth || "";

  return {
    ...defaults,
    ...studentInfo,
    academicLevel: studentInfo.academicLevel || studentInfo.qualification || "",
    address: compactAddress(studentInfo),
    birthDate,
    email: studentInfo.email || user?.email || "",
    icNo: String(studentInfo.icNo || "").replace(/\D/g, ""),
    name: String(studentInfo.name || user?.full_name || user?.first_name || "").toUpperCase(),
    phone: String(studentInfo.phone || studentInfo.address1Phone || "").replace(/\D/g, ""),
    age: studentInfo.age || calculateAge(birthDate),
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
  const [activeInfoTab, setActiveInfoTab] = useState(personalInfoTab);
  const [notice, setNotice] = useState("");
  const [noticeStatus, setNoticeStatus] = useState("success");
  const [validationErrors, setValidationErrors] = useState({});
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
    setValidationErrors((current) => {
      if (!current[field]) return current;
      const { [field]: _field, ...next } = current;
      return next;
    });
    setStudentInfo((current) => ({ ...current, [field]: event.target.value }));
  };

  const updateStudentName = (event) => {
    setNotice("");
    setValidationErrors((current) => {
      if (!current.name) return current;
      const { name: _name, ...next } = current;
      return next;
    });
    setStudentInfo((current) => ({ ...current, name: event.target.value.toUpperCase() }));
  };

  const updateBirthDate = (event) => {
    const birthDate = event.target.value;

    setNotice("");
    setValidationErrors((current) => {
      const next = { ...current };
      delete next.birthDate;
      delete next.age;
      return next;
    });
    setStudentInfo((current) => ({ ...current, birthDate, age: calculateAge(birthDate) }));
  };

  const updateNumericStudentInfo = (field) => (event) => {
    setNotice("");
    setValidationErrors((current) => {
      if (!current[field]) return current;
      const { [field]: _field, ...next } = current;
      return next;
    });
    setStudentInfo((current) => ({ ...current, [field]: event.target.value.replace(/\D/g, "") }));
  };

  const updateDecimalStudentInfo = (field) => (event) => {
    setNotice("");
    setValidationErrors((current) => {
      if (!current[field]) return current;
      const { [field]: _field, ...next } = current;
      return next;
    });
    setStudentInfo((current) => ({ ...current, [field]: event.target.value.replace(/[^0-9.]/g, "") }));
  };

  const updateAddressMapLocation = (location) => {
    setNotice("");
    setValidationErrors((current) => {
      const next = { ...current };
      delete next.address;
      delete next.location;
      return next;
    });
    setStudentInfo((current) => ({
      ...current,
      address: location.address ?? current.address,
      latitude: location.latitude ?? current.latitude,
      longitude: location.longitude ?? current.longitude,
    }));
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
    const errors = Object.fromEntries(
      requiredFieldsByTab[activeInfoTab]
        .filter(([field]) => !String(studentInfo[field] || "").trim())
        .map(([field]) => [field, "Wajib diisi."]),
    );

    if (activeInfoTab === personalInfoTab && (!studentInfo.latitude || !studentInfo.longitude)) {
      missingFields.push("Lokasi alamat pada map");
      errors.location = "Sila pilih lokasi alamat pada map.";
    }

    setValidationErrors(errors);

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

  const textInput = (field, props = {}) => (
    <input required value={studentInfo[field]} onChange={updateStudentInfo(field)} {...props} />
  );

  const selectInput = (field, options) => (
    <select required value={studentInfo[field]} onChange={updateStudentInfo(field)}>
      <option value="">Sila pilih</option>
      {options.map((option) => <option key={option}>{option}</option>)}
    </select>
  );

  const renderPersonalRow = (label, fieldContent, className = "") => (
    <tr className={className}>
      <th scope="row">{label}</th>
      <td>{fieldContent}</td>
    </tr>
  );

  const renderApplicantFields = () => (
    <div className="student-personal-table-wrap">
      <table className="student-personal-table">
        <tbody>
          {renderPersonalRow("Nama", <input required value={studentInfo.name} onChange={updateStudentName} />)}
          {renderPersonalRow("No. Kad Pengenalan Baru", <input required inputMode="numeric" maxLength={12} pattern="[0-9]*" value={studentInfo.icNo} onChange={updateNumericStudentInfo("icNo")} />)}
          {renderPersonalRow("No. Telefon Bimbit/ Telefon Rumah", <input required inputMode="numeric" pattern="[0-9]*" value={studentInfo.phone} onChange={updateNumericStudentInfo("phone")} />)}
          {renderPersonalRow(
            "Alamat Surat Menyurat",
            <ApplicantAddressMap
              address={studentInfo.address}
              addressError={validationErrors.address}
              latitude={studentInfo.latitude}
              locationError={validationErrors.location}
              longitude={studentInfo.longitude}
              onLocationChange={updateAddressMapLocation}
            />,
            "map-row",
          )}
          {renderPersonalRow("Alamat Emel", <input required type="email" value={studentInfo.email} onChange={updateStudentInfo("email")} />)}
          {renderPersonalRow("Umur", <input required inputMode="numeric" pattern="[0-9]*" value={studentInfo.age} onChange={updateNumericStudentInfo("age")} />)}
          {renderPersonalRow("Tarikh Lahir", <input required type="date" value={studentInfo.birthDate} onChange={updateBirthDate} />)}
          {renderPersonalRow("Tempat Lahir", textInput("birthPlace"))}
          {renderPersonalRow(
            <>
              Negeri Tempat Lahir:
              <span>i. Pemohon</span>
              <span>ii. Ibu</span>
              <span>iii. Bapa</span>
            </>,
            <div className="student-nested-fields">
              {selectInput("stateOfBirth", stateOptions)}
              {selectInput("motherBirthState", stateOptions)}
              {selectInput("fatherBirthState", stateOptions)}
            </div>,
            "nested-row",
          )}
          {renderPersonalRow("Bangsa", selectInput("race", raceOptions))}
          {renderPersonalRow("Agama", selectInput("religion", religionOptions))}
          {renderPersonalRow("Kewarganegaraan", selectInput("citizenship", citizenshipOptions))}
          {renderPersonalRow("Taraf Perkahwinan", selectInput("maritalStatus", maritalStatusOptions))}
          {renderPersonalRow("Tinggi", <input required inputMode="decimal" placeholder="cm" value={studentInfo.height} onChange={updateDecimalStudentInfo("height")} />)}
          {renderPersonalRow("Berat", <input required inputMode="decimal" placeholder="kg" value={studentInfo.weight} onChange={updateDecimalStudentInfo("weight")} />)}
          {renderPersonalRow("Kelainan Upaya (Ya/ Tidak)", selectInput("disability", yesNoOptions))}
          {renderPersonalRow("Lesen Memandu", selectInput("drivingLicense", drivingLicenseOptions))}
        </tbody>
      </table>
    </div>
  );

  const renderAcademicFields = () => (
    <div className="student-info-fields compact">
      <label className="wide">Institusi Pengajian<input value={studentInfo.institution} onChange={updateStudentInfo("institution")} /></label>
      <label className="wide">Program / Kursus<input value={studentInfo.program} onChange={updateStudentInfo("program")} /></label>
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

                  {activeInfoTab === personalInfoTab ? renderApplicantFields() : null}
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
