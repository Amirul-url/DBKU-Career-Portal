import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiRequest, getStoredUser } from "../../lib/authApi";
import { countryCallingCodes, defaultCountryCallingCode } from "../../lib/countryCallingCodes";
import { APPLICANT_ROUTES } from "../../modules/applicant/applicantRoutes";
import { useApplicantSidebarState } from "../../modules/applicant/useApplicantSidebarState";
import { Icon } from "./ApplicantAuthShared";
import { ApplicantAddressMap, ProfileContentHeader, ProfileSidebar } from "./ApplicantProfilePage";

const personalInfoTab = "Maklumat Peribadi Pemohon";
const academicInfoTab = "Maklumat Akademik";
const documentSupportTab = "Dokumen Sokongan";
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
const internshipInfoTabs = [personalInfoTab, academicInfoTab, documentSupportTab];
const internshipRequiredInfoTabs = [personalInfoTab, academicInfoTab, documentSupportTab];
const jobInfoTabs = [
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
  jobDeclarationTab,
  documentSupportTab,
];
const jobSpmSubjectRowCount = 12;
const minimumJobSpmSubjectRows = 3;
const jobStpmSubjectRowCount = 5;
const minimumJobStpmSubjectRows = 3;
const jobHigherEducationRowCount = 2;
const jobHigherEducationRequiredFields = [
  ["certificateName", "Nama Sijil"],
  ["entryDate", "Tarikh Masuk"],
  ["cgpa", "CGPA"],
  ["completionDate", "Tarikh Tamat Pengajian"],
  ["institution", "Institusi"],
  ["specialization", "Pengkhususan"],
];
const jobComputerSkillRowCount = 5;
const minimumJobComputerSkillRows = 2;
const jobSkillLevelOptions = ["Baik", "Sederhana", "Lemah"];
const jobComputerLevelOptions = ["Sangat Mahir", "Mahir", "Sederhana", "Tidak Mahir"];
const getDefaultJobLanguageSkillRows = () => [
  { language: "Bahasa Malaysia", required: true, speaking: "", writing: "" },
  { language: "Bahasa Inggeris", required: true, speaking: "", writing: "" },
  { language: "", required: false, speaking: "", writing: "" },
  { language: "", required: false, speaking: "", writing: "" },
  { language: "", required: false, speaking: "", writing: "" },
];
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
  [jobDeclarationTab]: "Perakuan",
  [documentSupportTab]: "Dokumen",
};
const editableApplicationStatuses = new Set(["draft", "incomplete"]);

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
const salutationOptions = ["Encik", "Puan", "Cik"];
const citizenshipOptions = ["Warganegara", "Bukan Warganegara", "Penduduk Tetap"];
const maritalStatusOptions = ["Bujang", "Berkahwin", "Duda", "Janda"];
const yesNoOptions = ["Ya", "Tidak"];
const drivingLicenseOptions = ["Tiada", "B2", "B", "D", "DA", "E", "GDL", "PSV", "Lain-lain"];
const countriesByLongestCode = [...countryCallingCodes].sort(
  (first, second) =>
    second.code.replace(/\D/g, "").length - first.code.replace(/\D/g, "").length ||
    first.name.localeCompare(second.name),
);

const institutionOptions = [
  "Universiti Malaya (UM)",
  "Universiti Sains Malaysia (USM)",
  "Universiti Kebangsaan Malaysia (UKM)",
  "Universiti Putra Malaysia (UPM)",
  "Universiti Teknologi Malaysia (UTM)",
  "Universiti Islam Antarabangsa Malaysia (UIAM / IIUM)",
  "Universiti Malaysia Sarawak (UNIMAS)",
  "Universiti Malaysia Sabah (UMS)",
  "Universiti Sains Islam Malaysia (USIM)",
  "Universiti Teknologi MARA (UiTM)",
  "Universiti Sultan Zainal Abidin (UniSZA)",
  "Universiti Utara Malaysia (UUM)",
  "Universiti Pendidikan Sultan Idris (UPSI)",
  "Universiti Malaysia Terengganu (UMT)",
  "Universiti Malaysia Kelantan (UMK)",
  "Universiti Pertahanan Nasional Malaysia (UPNM)",
  "Universiti Tun Hussein Onn Malaysia (UTHM)",
  "Universiti Teknikal Malaysia Melaka (UTeM)",
  "Universiti Malaysia Perlis (UniMAP)",
  "Universiti Malaysia Pahang Al-Sultan Abdullah (UMPSA)",
  "Politeknik Ungku Omar",
  "Politeknik Sultan Salahuddin Abdul Aziz Shah",
  "Politeknik Ibrahim Sultan",
  "Politeknik Sultan Azlan Shah",
  "Politeknik Sultan Haji Ahmad Shah",
  "Politeknik Kota Bharu",
  "Politeknik Kuching Sarawak",
  "Politeknik Port Dickson",
  "Politeknik Kota Kinabalu",
  "Politeknik Seberang Perai",
  "Politeknik Melaka",
  "Politeknik Kuala Terengganu",
  "Politeknik Merlimau",
  "Politeknik Sultan Mizan Zainal Abidin",
  "Politeknik Tuanku Sultanah Bahiyah",
  "Politeknik Sultan Abdul Halim Mu'adzam Shah",
  "Politeknik Tuanku Syed Sirajuddin",
  "Politeknik Muadzam Shah",
  "Politeknik Mukah",
  "Politeknik Balik Pulau",
  "Politeknik Jeli",
  "Politeknik Nilai",
  "Politeknik Banting",
  "Politeknik Mersing",
  "Politeknik Hulu Terengganu",
  "Politeknik Sandakan",
  "Politeknik METrO Kuala Lumpur",
  "Politeknik METrO Johor Bahru",
  "Politeknik METrO Betong",
  "Politeknik METrO Kuantan",
  "Politeknik METrO Tasek Gelugor",
  "Kolej Profesional MARA",
  "Kolej Poly-Tech MARA (KPTM)",
  "German-Malaysian Institute (GMI)",
  "Malaysia-Japan International Institute of Technology (MJIIT)",
  "AIMST University",
  "Albukhary International University (AIU)",
  "Al-Madinah International University (MEDIU)",
  "Al-Sultan Abdullah Ahmad Shah Quranic University of Pahang (UniPSAS)",
  "Asia e University (AeU)",
  "Asia Metropolitan University (AMU)",
  "Asia Pacific University of Technology and Innovation (APU)",
  "Asia School of Business (ASB)",
  "Binary University of Management & Entrepreneurship",
  "City University Malaysia",
  "Curtin University Malaysia",
  "DRB-HICOM University of Automotive Malaysia",
  "Heriot-Watt University Malaysia",
  "HELP University",
  "IMU University",
  "INCEIF University",
  "Infrastructure University Kuala Lumpur (IUKL)",
  "INTI International University",
  "International University of Malaya-Wales (IUMW)",
  "KPJ Healthcare University",
  "Kuala Lumpur University of Science and Technology (KLUST)",
  "Limkokwing University of Creative Technology",
  "Lincoln University College",
  "MAHSA University",
  "Malaysia University of Science and Technology (MUST)",
  "Management and Science University (MSU)",
  "Manipal University College Malaysia (MUCM)",
  "Monash University Malaysia",
  "Multimedia University (MMU)",
  "Newcastle University Medicine Malaysia (NUMed)",
  "Nilai University",
  "Open University Malaysia (OUM)",
  "Perdana University",
  "Petronas University of Technology (UTP)",
  "Quest International University (QIU)",
  "Raffles University",
  "RCSI & UCD Malaysia Campus (RUMC)",
  "SEGi University",
  "Sunway University",
  "Swinburne University of Technology Sarawak Campus",
  "Taylor's University",
  "Tunku Abdul Rahman University of Management and Technology (TAR UMT)",
  "Universiti Tunku Abdul Rahman (UTAR)",
  "Tun Abdul Razak University (UNIRAZAK)",
  "UCSI University",
  "UNITAR International University",
  "Universiti Kuala Lumpur (UniKL)",
  "University of Cyberjaya",
  "University of Nottingham Malaysia",
  "University of Reading Malaysia",
  "University of Southampton Malaysia",
  "Wawasan Open University (WOU)",
  "Xiamen University Malaysia",
  "BERJAYA University College",
  "Brickfields Asia College (BAC)",
  "First City University College",
  "Han Chiang University College of Communication",
  "i-CATS University College",
  "International University College of Technology Twintech (IUCTT)",
  "KDU University College / UOW Malaysia",
  "Kolej Universiti Islam Antarabangsa Selangor / Universiti Islam Selangor (UIS)",
  "Kolej Universiti Islam Melaka (KUIM)",
  "Kolej Universiti Poly-Tech MARA (KUPTM)",
  "Kolej Universiti Tunku Abdul Rahman",
  "Linton University College",
  "Methodist College Kuala Lumpur (MCKL)",
  "New Era University College",
  "Peninsula College",
  "Southern University College",
  "Sunway College",
  "Tunku Abdul Rahman University College",
  "UOW Malaysia KDU",
  "Lain-lain / Institusi tidak tersenarai",
].sort((first, second) => first.localeCompare(second));

const documentFields = [
  {
    accept: ".pdf,application/pdf",
    field: "universityLetterFile",
    hint: "PDF",
    label: "Surat rasmi daripada institusi / kolej / universiti",
  },
  {
    accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
    field: "transcriptFile",
    hint: "PDF, JPG atau PNG",
    label: "Transkrip akademik terkini",
  },
  {
    accept: ".pdf,application/pdf",
    field: "resumeFile",
    hint: "PDF",
    label: <i>Curriculum Vitae (CV)</i>,
  },
  {
    accept: ".jpg,.jpeg,.png,image/jpeg,image/png",
    field: "passportPhotoFile",
    hint: "JPG atau PNG",
    label: "1 keping gambar berukuran passport",
  },
  {
    accept: ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
    field: "bankAccountFile",
    hint: "PDF, JPG atau PNG",
    label: "1 salinan muka depan akaun bank",
  },
];

const getDefaultStudentInfo = () => ({
  academicLevel: "",
  address: "",
  age: "",
  birthDate: "",
  birthPlace: "",
  bankAccountFile: "",
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
  jobBmJulyExamName: "",
  jobBmJulyGradeDecision: "",
  jobBmJulyDetails: "",
  jobBmJulyOralExam: "",
  jobBmJulyYear: "",
  jobComputerSkills: "",
  jobDeclaration: "",
  jobHigherEducationQualifications: Array.from({ length: jobHigherEducationRowCount }, () => ({
    certificateName: "",
    cgpa: "",
    completionDate: "",
    entryDate: "",
    institution: "",
    specialization: "",
  })),
  jobLanguageSkills: "",
  jobLanguageSkillRows: getDefaultJobLanguageSkillRows(),
  jobComputerSkillRows: Array.from({ length: jobComputerSkillRowCount }, () => ({ level: "", softwareName: "" })),
  jobMathJulyGradeDecision: "",
  jobMathJulyDetails: "",
  jobMathJulyYear: "",
  jobReferences: "",
  jobSpmDetails: "",
  jobSpmExamName: "",
  jobSpmSchool: "",
  jobSpmSubjects: Array.from({ length: jobSpmSubjectRowCount }, () => ({ grade: "", subject: "" })),
  jobSpmYear: "",
  jobStpmDetails: "",
  jobStpmExamName: "",
  jobStpmSchool: "",
  jobStpmSubjects: Array.from({ length: jobStpmSubjectRowCount }, () => ({ grade: "", subject: "" })),
  jobStpmYear: "",
  jobWorkExperience: "",
  maritalStatus: "",
  motherBirthState: "",
  name: "",
  passportPhotoFile: "",
  phone: "",
  program: "",
  race: "",
  religion: "",
  resumeFile: "",
  salutation: "",
  semester: "",
  stateOfBirth: "",
  supervisorEmail: "",
  supervisorName: "",
  supervisorPhone: "",
  totalSemesters: "",
  totalStudyYears: "",
  transcriptFile: "",
  universityLetterFile: "",
  weight: "",
  latitude: "",
  longitude: "",
});

const requiredFieldsByTab = {
  [documentSupportTab]: [
    ["universityLetterFile", "Surat rasmi daripada institusi / kolej / universiti"],
    ["transcriptFile", "Transkrip akademik terkini"],
    ["resumeFile", "Curriculum Vitae (CV)"],
    ["passportPhotoFile", "1 keping gambar berukuran passport"],
    ["bankAccountFile", "1 salinan muka depan akaun bank"],
  ],
  [academicInfoTab]: [
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
  ],
  [jobSpmTab]: [
    ["jobSpmSchool", "Sekolah"],
    ["jobSpmYear", "Tahun"],
    ["jobSpmExamName", "Nama Peperiksaan"],
  ],
  [jobBmJulyTab]: [
    ["jobBmJulyYear", "Tahun"],
    ["jobBmJulyExamName", "Nama Peperiksaan"],
    ["jobBmJulyGradeDecision", "Keputusan Gred"],
    ["jobBmJulyOralExam", "Ujian Lisan"],
  ],
  [jobMathJulyTab]: [
    ["jobMathJulyYear", "Tahun"],
    ["jobMathJulyGradeDecision", "Keputusan Gred"],
  ],
  [jobStpmTab]: [
    ["jobStpmSchool", "Sekolah"],
    ["jobStpmYear", "Tahun"],
    ["jobStpmExamName", "Nama Peperiksaan"],
  ],
  [jobHigherEducationTab]: [],
  [jobLanguageSkillsTab]: [],
  [jobComputerSkillsTab]: [],
  [jobWorkExperienceTab]: [
    ["jobWorkExperience", "Pengalaman Bekerja"],
  ],
  [jobReferencesTab]: [
    ["jobReferences", "Rujukan"],
  ],
  [jobDeclarationTab]: [
    ["jobDeclaration", "Perakuan Pemohon"],
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

const getInternshipDraftStorageKey = (user) => `dbku_internship_student_info_manual_${user?.id || user?.email || "guest"}`;
const getJobDraftStorageKey = (user) => `dbku_job_application_student_info_manual_${user?.id || user?.email || "guest"}`;
const getDraftStorageKey = (user, applicationType = "internship") =>
  applicationType === "job" ? getJobDraftStorageKey(user) : getInternshipDraftStorageKey(user);

function getCountryKey(country) {
  return `${country.iso}-${country.code}`;
}

function splitPhoneNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const matchedCountry = countriesByLongestCode.find((country) => {
    const countryDigits = country.code.replace(/\D/g, "");
    return digits.startsWith(countryDigits);
  });

  if (matchedCountry) {
    return {
      country: matchedCountry,
      localNumber: digits.slice(matchedCountry.code.replace(/\D/g, "").length),
    };
  }

  return { country: defaultCountryCallingCode, localNumber: digits.replace(/^0+/, "") };
}

function combinePhoneNumber(countryCode, localNumber) {
  const cleanLocalNumber = String(localNumber || "").replace(/\D/g, "").replace(/^0+/, "");
  if (!cleanLocalNumber) return "";
  return `${String(countryCode || "").replace(/\D/g, "")}${cleanLocalNumber}`;
}

function dedupeAddressText(value) {
  const parts = String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const cleanParts = parts.filter((part, index) => {
    if (index === 0) return true;
    return part.toLowerCase() !== parts[index - 1].toLowerCase();
  });

  return cleanParts.join(", ");
}

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
    return dedupeAddressText(studentInfo.address);
  }

  return dedupeAddressText([
    studentInfo.address1Line1,
    studentInfo.address1Line2,
    studentInfo.address1Line3,
    studentInfo.address1Postcode,
    studentInfo.address1City,
    studentInfo.address1State,
  ]
    .filter(Boolean)
    .join(", "));
}

function InternshipPhoneInput({ onChange, value }) {
  const initialPhone = splitPhoneNumber(value);
  const [selectedCountry, setSelectedCountry] = useState(initialPhone.country);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const countryDigits = selectedCountry.code.replace(/\D/g, "");
  const valueDigits = String(value || "").replace(/\D/g, "");
  const localNumber =
    countryDigits && valueDigits.startsWith(countryDigits)
      ? valueDigits.slice(countryDigits.length)
      : splitPhoneNumber(value).localNumber;
  const filteredCountries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return countryCallingCodes;

    const queryDigits = query.replace(/\D/g, "");
    return countryCallingCodes.filter((country) => {
      const countryDigitsForSearch = country.code.replace(/\D/g, "");
      return (
        country.name.toLowerCase().includes(query) ||
        country.iso.toLowerCase().includes(query) ||
        country.code.includes(query) ||
        (queryDigits && countryDigitsForSearch.includes(queryDigits))
      );
    });
  }, [searchTerm]);

  function updatePhone(nextCountry, nextLocalNumber) {
    setSelectedCountry(nextCountry);
    onChange(combinePhoneNumber(nextCountry.code, nextLocalNumber));
  }

  function chooseCountry(nextCountry) {
    setSearchTerm("");
    setIsOpen(false);
    updatePhone(nextCountry, localNumber);
  }

  return (
    <div
      className="student-phone-grid"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
          setSearchTerm("");
        }
      }}
    >
      <div className="student-phone-country">
        <button
          type="button"
          className="student-phone-code"
          aria-label="Pilih kod negara telefon"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span>{selectedCountry.code}</span>
          <Icon>expand_more</Icon>
        </button>
        {isOpen ? (
          <div className="student-phone-menu" role="listbox" aria-label="Senarai kod negara">
            <input
              type="search"
              className="student-phone-search"
              value={searchTerm}
              placeholder="Cari negara atau kod"
              autoComplete="off"
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <div className="student-phone-options">
              {filteredCountries.length ? (
                filteredCountries.map((country) => (
                  <button
                    type="button"
                    key={getCountryKey(country)}
                    className={getCountryKey(country) === getCountryKey(selectedCountry) ? "active" : ""}
                    role="option"
                    aria-selected={getCountryKey(country) === getCountryKey(selectedCountry)}
                    onClick={() => chooseCountry(country)}
                  >
                    <span>{country.name}</span>
                    <strong>{country.code}</strong>
                  </button>
                ))
              ) : (
                <div className="student-phone-empty">Tiada kod negara dijumpai.</div>
              )}
            </div>
          </div>
        ) : null}
      </div>
      <input
        required
        type="tel"
        inputMode="tel"
        value={localNumber}
        placeholder="cth. 175151829"
        autoComplete="off"
        onChange={(event) => updatePhone(selectedCountry, event.target.value)}
      />
    </div>
  );
}

function InstitutionSearchSelect({ onChange, value }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const filteredInstitutions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return institutionOptions;

    return institutionOptions.filter((institution) => institution.toLowerCase().includes(query));
  }, [searchTerm]);

  function chooseInstitution(institution) {
    setIsOpen(false);
    setSearchTerm("");
    onChange(institution);
  }

  return (
    <div
      className={`student-search-select ${isOpen ? "open" : ""}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
          setSearchTerm("");
        }
      }}
    >
      <button
        type="button"
        className="student-search-select-trigger"
        aria-expanded={isOpen}
        aria-label="Pilih institusi pengajian"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>{value || "Sila pilih institusi"}</span>
        <Icon>expand_more</Icon>
      </button>
      {isOpen ? (
        <div className="student-search-select-menu">
          <div className="student-search-select-search">
            <input
              type="search"
              value={searchTerm}
              placeholder="Cari institusi awam atau swasta"
              autoComplete="off"
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <Icon>search</Icon>
          </div>
          <div className="student-search-select-options">
            {filteredInstitutions.length ? (
              filteredInstitutions.map((institution) => (
                <button
                  type="button"
                  key={institution}
                  className={value === institution ? "selected" : ""}
                  onClick={() => chooseInstitution(institution)}
                >
                  {institution}
                </button>
              ))
            ) : (
              <p>Tiada institusi dijumpai.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function normalizeJobTableValue(value) {
  return String(value || "").toUpperCase();
}

function getJobSpmSubjects(studentInfo = {}) {
  const sourceRows = Array.isArray(studentInfo.jobSpmSubjects) ? studentInfo.jobSpmSubjects : [];

  return Array.from({ length: jobSpmSubjectRowCount }, (_, index) => {
    const row = sourceRows[index] || {};
    return {
      grade: normalizeJobTableValue(row.grade),
      subject: normalizeJobTableValue(row.subject),
    };
  });
}

function getJobStpmSubjects(studentInfo = {}) {
  const sourceRows = Array.isArray(studentInfo.jobStpmSubjects) ? studentInfo.jobStpmSubjects : [];

  return Array.from({ length: jobStpmSubjectRowCount }, (_, index) => {
    const row = sourceRows[index] || {};
    return {
      grade: normalizeJobTableValue(row.grade),
      subject: normalizeJobTableValue(row.subject),
    };
  });
}

function getJobHigherEducationQualifications(studentInfo = {}) {
  const sourceRows = Array.isArray(studentInfo.jobHigherEducationQualifications)
    ? studentInfo.jobHigherEducationQualifications
    : [];

  return Array.from({ length: jobHigherEducationRowCount }, (_, index) => {
    const row = sourceRows[index] || {};
    return {
      certificateName: normalizeJobTableValue(row.certificateName),
      cgpa: normalizeJobTableValue(row.cgpa),
      completionDate: normalizeJobTableValue(row.completionDate),
      entryDate: normalizeJobTableValue(row.entryDate),
      institution: normalizeJobTableValue(row.institution),
      specialization: normalizeJobTableValue(row.specialization),
    };
  });
}

function getJobLanguageSkillRows(studentInfo = {}) {
  const sourceRows = Array.isArray(studentInfo.jobLanguageSkillRows) ? studentInfo.jobLanguageSkillRows : [];
  const defaults = getDefaultJobLanguageSkillRows();

  return defaults.map((defaultRow, index) => {
    const row = sourceRows[index] || {};
    const isRequired = Boolean(defaultRow.required);
    const language = isRequired ? defaultRow.language : normalizeJobTableValue(row.language || defaultRow.language);

    return {
      language,
      required: isRequired,
      speaking: normalizeJobTableValue(row.speaking),
      writing: normalizeJobTableValue(row.writing),
    };
  });
}

function getJobComputerSkillRows(studentInfo = {}) {
  const sourceRows = Array.isArray(studentInfo.jobComputerSkillRows) ? studentInfo.jobComputerSkillRows : [];

  return Array.from({ length: jobComputerSkillRowCount }, (_, index) => {
    const row = sourceRows[index] || {};
    return {
      level: normalizeJobTableValue(row.level),
      softwareName: normalizeJobTableValue(row.softwareName),
    };
  });
}

function buildJobBmJulySummary(studentInfo = {}) {
  return [
    ["Tahun", studentInfo.jobBmJulyYear],
    ["Nama Peperiksaan", studentInfo.jobBmJulyExamName],
    ["Keputusan Gred", studentInfo.jobBmJulyGradeDecision],
    ["Ujian Lisan", studentInfo.jobBmJulyOralExam],
  ]
    .filter(([, value]) => String(value || "").trim())
    .map(([label, value]) => `${label}: ${normalizeJobTableValue(value)}`)
    .join("\n");
}

function buildJobMathJulySummary(studentInfo = {}) {
  return [
    ["Tahun", studentInfo.jobMathJulyYear],
    ["Keputusan Gred", studentInfo.jobMathJulyGradeDecision],
  ]
    .filter(([, value]) => String(value || "").trim())
    .map(([label, value]) => `${label}: ${normalizeJobTableValue(value)}`)
    .join("\n");
}

function buildJobLanguageSkillsSummary(studentInfo = {}) {
  return getJobLanguageSkillRows(studentInfo)
    .filter((row) => row.language.trim() || row.speaking.trim() || row.writing.trim())
    .map((row) => `${row.language || "BAHASA LAIN"}: PERTUTURAN ${row.speaking || "-"}, PENULISAN ${row.writing || "-"}`)
    .join("\n");
}

function buildJobComputerSkillsSummary(studentInfo = {}) {
  return getJobComputerSkillRows(studentInfo)
    .filter((row) => row.softwareName.trim() || row.level.trim())
    .map((row, index) => `${index + 1}. ${row.softwareName || "-"} - ${row.level || "-"}`)
    .join("\n");
}

function buildJobSpmSubjectSummary(studentInfo = {}) {
  return getJobSpmSubjects(studentInfo)
    .filter((row) => row.subject.trim() && row.grade.trim())
    .map((row, index) => `${index + 1}. ${row.subject} - ${row.grade}`)
    .join("\n");
}

function buildJobStpmSubjectSummary(studentInfo = {}) {
  return getJobStpmSubjects(studentInfo)
    .filter((row) => row.subject.trim() && row.grade.trim())
    .map((row, index) => `${index + 1}. ${row.subject} - ${row.grade}`)
    .join("\n");
}

function getJobSpmValidation(studentInfo = {}) {
  const rows = getJobSpmSubjects(studentInfo);
  const completedRows = rows.filter((row) => row.subject.trim() && row.grade.trim());
  const partialRows = rows
    .map((row, index) => ({ ...row, rowNumber: index + 1 }))
    .filter((row) => (row.subject.trim() && !row.grade.trim()) || (!row.subject.trim() && row.grade.trim()))
    .map((row) => row.rowNumber);
  const missingFields = [];
  const errors = {};

  if (completedRows.length < minimumJobSpmSubjectRows) {
    missingFields.push(`Sekurang-kurangnya ${minimumJobSpmSubjectRows} mata pelajaran bersama gred`);
    errors.jobSpmSubjects = `Isi sekurang-kurangnya ${minimumJobSpmSubjectRows} mata pelajaran bersama gred.`;
  }

  if (partialRows.length) {
    missingFields.push(`Lengkapkan Mata Pelajaran dan Gred pada baris ${partialRows.join(", ")}`);
    errors.jobSpmSubjects = "Lengkapkan pasangan Mata Pelajaran dan Gred.";
  }

  return { completedRows, errors, missingFields, partialRows };
}

function getJobStpmValidation(studentInfo = {}) {
  const rows = getJobStpmSubjects(studentInfo);
  const completedRows = rows.filter((row) => row.subject.trim() && row.grade.trim());
  const partialRows = rows
    .map((row, index) => ({ ...row, rowNumber: index + 1 }))
    .filter((row) => (row.subject.trim() && !row.grade.trim()) || (!row.subject.trim() && row.grade.trim()))
    .map((row) => row.rowNumber);
  const missingFields = [];
  const errors = {};

  if (completedRows.length < minimumJobStpmSubjectRows) {
    missingFields.push(`Sekurang-kurangnya ${minimumJobStpmSubjectRows} mata pelajaran bersama gred`);
    errors.jobStpmSubjects = `Isi sekurang-kurangnya ${minimumJobStpmSubjectRows} mata pelajaran bersama gred.`;
  }

  if (partialRows.length) {
    missingFields.push(`Lengkapkan Mata Pelajaran dan Gred pada baris ${partialRows.join(", ")}`);
    errors.jobStpmSubjects = "Lengkapkan pasangan Mata Pelajaran dan Gred.";
  }

  return { completedRows, errors, missingFields, partialRows };
}

function getJobHigherEducationValidation(studentInfo = {}) {
  const rows = getJobHigherEducationQualifications(studentInfo);
  const missingCells = rows.flatMap((row, rowIndex) => (
    jobHigherEducationRequiredFields
      .filter(([field]) => !String(row[field] || "").trim())
      .map(([, label]) => `${label} ${rowIndex + 1}`)
  ));
  const missingFields = [];
  const errors = {};

  if (missingCells.length) {
    missingFields.push("Semua maklumat Kelulusan Pengajian Tinggi wajib diisi");
    errors.jobHigherEducationQualifications = `Lengkapkan: ${missingCells.join(", ")}.`;
  }

  return { errors, missingCells, missingFields };
}

function getJobLanguageSkillsValidation(studentInfo = {}) {
  const rows = getJobLanguageSkillRows(studentInfo);
  const missingRequiredRows = rows.filter((row) => row.required && (!row.speaking || !row.writing));
  const partialOtherRows = rows
    .filter((row) => !row.required)
    .map((row, index) => ({ ...row, rowNumber: index + 1 }))
    .filter((row) => row.language.trim() && (!row.speaking || !row.writing))
    .map((row) => row.rowNumber);
  const missingFields = [];
  const errors = {};

  if (missingRequiredRows.length) {
    missingFields.push("Bahasa Malaysia dan Bahasa Inggeris wajib lengkap untuk Pertuturan dan Penulisan");
    errors.jobLanguageSkillRows = "Lengkapkan Pertuturan dan Penulisan untuk Bahasa Malaysia dan Bahasa Inggeris.";
  }

  if (partialOtherRows.length) {
    missingFields.push(`Lengkapkan Pertuturan dan Penulisan pada Bahasa Lain ${partialOtherRows.join(", ")}`);
    errors.jobLanguageSkillRows = "Lengkapkan tahap kemahiran Bahasa Lain yang diisi.";
  }

  return { errors, missingFields, missingRequiredRows, partialOtherRows };
}

function getJobComputerSkillsValidation(studentInfo = {}) {
  const rows = getJobComputerSkillRows(studentInfo);
  const completedRows = rows.filter((row) => row.softwareName.trim() && row.level.trim());
  const partialRows = rows
    .map((row, index) => ({ ...row, rowNumber: index + 1 }))
    .filter((row) => (row.softwareName.trim() && !row.level.trim()) || (!row.softwareName.trim() && row.level.trim()))
    .map((row) => row.rowNumber);
  const missingFields = [];
  const errors = {};

  if (completedRows.length < minimumJobComputerSkillRows) {
    missingFields.push(`Sekurang-kurangnya ${minimumJobComputerSkillRows} nama perisian bersama tahap kemahiran`);
    errors.jobComputerSkillRows = `Isi sekurang-kurangnya ${minimumJobComputerSkillRows} nama perisian bersama tahap kemahiran.`;
  }

  if (partialRows.length) {
    missingFields.push(`Lengkapkan Nama Perisian dan Tahap Kemahiran pada baris ${partialRows.join(", ")}`);
    errors.jobComputerSkillRows = "Lengkapkan pasangan Nama Perisian dan Tahap Kemahiran.";
  }

  return { completedRows, errors, missingFields, partialRows };
}

function isJobSpmTabComplete(studentInfo = {}) {
  const hasRequiredFields = (requiredFieldsByTab[jobSpmTab] || [])
    .every(([field]) => String(studentInfo[field] || "").trim());
  const validation = getJobSpmValidation(studentInfo);

  return hasRequiredFields && validation.missingFields.length === 0;
}

function isJobStpmTabComplete(studentInfo = {}) {
  const hasRequiredFields = (requiredFieldsByTab[jobStpmTab] || [])
    .every(([field]) => String(studentInfo[field] || "").trim());
  const validation = getJobStpmValidation(studentInfo);

  return hasRequiredFields && validation.missingFields.length === 0;
}

function isJobHigherEducationTabComplete(studentInfo = {}) {
  return getJobHigherEducationValidation(studentInfo).missingFields.length === 0;
}

function isJobLanguageSkillsTabComplete(studentInfo = {}) {
  return getJobLanguageSkillsValidation(studentInfo).missingFields.length === 0;
}

function isJobComputerSkillsTabComplete(studentInfo = {}) {
  return getJobComputerSkillsValidation(studentInfo).missingFields.length === 0;
}

function normalizeStudentInfoDraft(studentInfo = {}, user = null) {
  const defaults = getDefaultStudentInfo();
  const birthDate = studentInfo.birthDate || studentInfo.dateOfBirth || "";
  const normalizedJobSpmSubjects = getJobSpmSubjects(studentInfo);
  const normalizedJobStpmSubjects = getJobStpmSubjects(studentInfo);
  const normalizedJobHigherEducationQualifications = getJobHigherEducationQualifications(studentInfo);
  const normalizedJobLanguageSkillRows = getJobLanguageSkillRows(studentInfo);
  const normalizedJobComputerSkillRows = getJobComputerSkillRows(studentInfo);

  return {
    ...defaults,
    ...studentInfo,
    academicLevel: studentInfo.academicLevel || studentInfo.qualification || "",
    address: compactAddress(studentInfo),
    birthDate,
    email: studentInfo.email || user?.email || "",
    icNo: String(studentInfo.icNo || "").replace(/\D/g, ""),
    jobBmJulyDetails: studentInfo.jobBmJulyDetails || buildJobBmJulySummary(studentInfo),
    jobBmJulyExamName: normalizeJobTableValue(studentInfo.jobBmJulyExamName),
    jobBmJulyGradeDecision: normalizeJobTableValue(studentInfo.jobBmJulyGradeDecision),
    jobBmJulyOralExam: normalizeJobTableValue(studentInfo.jobBmJulyOralExam),
    jobBmJulyYear: normalizeJobTableValue(studentInfo.jobBmJulyYear),
    jobComputerSkillRows: normalizedJobComputerSkillRows,
    jobComputerSkills: studentInfo.jobComputerSkills || buildJobComputerSkillsSummary({ ...studentInfo, jobComputerSkillRows: normalizedJobComputerSkillRows }),
    jobHigherEducationQualifications: normalizedJobHigherEducationQualifications,
    jobLanguageSkillRows: normalizedJobLanguageSkillRows,
    jobLanguageSkills: studentInfo.jobLanguageSkills || buildJobLanguageSkillsSummary({ ...studentInfo, jobLanguageSkillRows: normalizedJobLanguageSkillRows }),
    jobMathJulyDetails: studentInfo.jobMathJulyDetails || buildJobMathJulySummary(studentInfo),
    jobMathJulyGradeDecision: normalizeJobTableValue(studentInfo.jobMathJulyGradeDecision),
    jobMathJulyYear: normalizeJobTableValue(studentInfo.jobMathJulyYear),
    jobSpmDetails: studentInfo.jobSpmDetails || buildJobSpmSubjectSummary({ ...studentInfo, jobSpmSubjects: normalizedJobSpmSubjects }),
    jobSpmExamName: normalizeJobTableValue(studentInfo.jobSpmExamName),
    jobSpmSchool: normalizeJobTableValue(studentInfo.jobSpmSchool),
    jobSpmSubjects: normalizedJobSpmSubjects,
    jobSpmYear: normalizeJobTableValue(studentInfo.jobSpmYear),
    jobStpmDetails: studentInfo.jobStpmDetails || buildJobStpmSubjectSummary({ ...studentInfo, jobStpmSubjects: normalizedJobStpmSubjects }),
    jobStpmExamName: normalizeJobTableValue(studentInfo.jobStpmExamName),
    jobStpmSchool: normalizeJobTableValue(studentInfo.jobStpmSchool),
    jobStpmSubjects: normalizedJobStpmSubjects,
    jobStpmYear: normalizeJobTableValue(studentInfo.jobStpmYear),
    name: String(studentInfo.name || user?.full_name || user?.first_name || "").toUpperCase(),
    phone: String(studentInfo.phone || studentInfo.address1Phone || "").replace(/\D/g, ""),
    age: studentInfo.age || calculateAge(birthDate),
  };
}

function getDraftStudentInfo(studentInfo = {}) {
  const draftStudentInfo = { ...studentInfo };
  documentFields.forEach(({ field }) => {
    delete draftStudentInfo[field];
  });
  return draftStudentInfo;
}

function loadStudentInfoDraft(user, applicationType = "internship") {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const saved = window.localStorage.getItem(getDraftStorageKey(user, applicationType));
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveStudentInfoDraft(user, payload, applicationType = "internship") {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(getDraftStorageKey(user, applicationType), JSON.stringify(payload));
  } catch {
    // Browser storage may be unavailable or full; keep the current in-memory state.
  }
}

function clearStudentInfoDraft(user, applicationType = "internship") {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(getDraftStorageKey(user, applicationType));
  } catch {
    // Ignore storage cleanup failures; the submitted application remains in the backend.
  }
}

function isTabComplete(tab, studentInfo) {
  if (tab === jobSpmTab) return isJobSpmTabComplete(studentInfo);
  if (tab === jobStpmTab) return isJobStpmTabComplete(studentInfo);
  if (tab === jobHigherEducationTab) return isJobHigherEducationTabComplete(studentInfo);
  if (tab === jobLanguageSkillsTab) return isJobLanguageSkillsTabComplete(studentInfo);
  if (tab === jobComputerSkillsTab) return isJobComputerSkillsTabComplete(studentInfo);

  const requiredFields = requiredFieldsByTab[tab] || [];
  const hasRequiredFields = requiredFields.every(([field]) => String(studentInfo[field] || "").trim());
  const hasRequiredLocation = tab !== personalInfoTab || (studentInfo.latitude && studentInfo.longitude);

  return hasRequiredFields && hasRequiredLocation;
}

function getFirstIncompleteTab(studentInfo, requiredTabs = internshipRequiredInfoTabs) {
  return requiredTabs.find((tab) => !isTabComplete(tab, studentInfo)) || personalInfoTab;
}

function getMissingApplicationFields(studentInfo, requiredTabs = internshipRequiredInfoTabs) {
  const missingFields = [];
  const errors = {};

  requiredTabs.forEach((tab) => {
    (requiredFieldsByTab[tab] || []).forEach(([field, label]) => {
      if (!String(studentInfo[field] || "").trim()) {
        missingFields.push(`${tab}: ${label}`);
        errors[field] = "Wajib diisi.";
      }
    });

    if (tab === jobSpmTab) {
      const jobSpmValidation = getJobSpmValidation(studentInfo);
      missingFields.push(...jobSpmValidation.missingFields.map((field) => `${tab}: ${field}`));
      Object.assign(errors, jobSpmValidation.errors);
    }

    if (tab === jobStpmTab) {
      const jobStpmValidation = getJobStpmValidation(studentInfo);
      missingFields.push(...jobStpmValidation.missingFields.map((field) => `${tab}: ${field}`));
      Object.assign(errors, jobStpmValidation.errors);
    }

    if (tab === jobHigherEducationTab) {
      const jobHigherEducationValidation = getJobHigherEducationValidation(studentInfo);
      missingFields.push(...jobHigherEducationValidation.missingFields.map((field) => `${tab}: ${field}`));
      Object.assign(errors, jobHigherEducationValidation.errors);
    }

    if (tab === jobLanguageSkillsTab) {
      const jobLanguageValidation = getJobLanguageSkillsValidation(studentInfo);
      missingFields.push(...jobLanguageValidation.missingFields.map((field) => `${tab}: ${field}`));
      Object.assign(errors, jobLanguageValidation.errors);
    }

    if (tab === jobComputerSkillsTab) {
      const jobComputerValidation = getJobComputerSkillsValidation(studentInfo);
      missingFields.push(...jobComputerValidation.missingFields.map((field) => `${tab}: ${field}`));
      Object.assign(errors, jobComputerValidation.errors);
    }
  });

  if (!studentInfo.latitude || !studentInfo.longitude) {
    missingFields.push(`${personalInfoTab}: Lokasi alamat pada map`);
    errors.location = "Sila pilih lokasi alamat pada map.";
  }

  return { errors, missingFields };
}

function RequiredMarker() {
  return <span className="student-required-marker" aria-hidden="true">*</span>;
}

function renderRequiredLabel(label, required = true) {
  return (
    <>
      {label}
      {required ? <RequiredMarker /> : null}
    </>
  );
}

function getDocumentSummary(studentInfo) {
  return Object.fromEntries(
    documentFields.map((document) => {
      const fileName = studentInfo[document.field] || "";
      return [document.field, fileName];
    }),
  );
}

function buildApplicationPayload(studentInfo, vacancy, documentFiles, applicationType = "internship") {
  const payload = new FormData();
  payload.append("cover_letter", applicationType === "job" ? "Permohonan Jawatan Kosong DBKU" : "Permohonan Latihan Industri DBKU");
  payload.append("profile_data", JSON.stringify(buildApplicationProfileData(studentInfo, vacancy, applicationType)));
  payload.append("vacancy", vacancy.id);

  documentFields.forEach((document) => {
    const uploadedFile = documentFiles[document.field];
    if (uploadedFile) {
      payload.append(document.field, uploadedFile);
    }
  });

  return payload;
}

function buildApplicationProfileData(studentInfo, vacancy, applicationType = "internship") {
  return {
    application_type: applicationType,
    declaration: {
      accepted: true,
      accepted_at: new Date().toISOString(),
      text:
        "Saya dengan ini mengaku bahawa semua maklumat yang saya berikan adalah BENAR dan TEPAT. Saya juga bersetuju dan menerima bahawa sekiranya mana-mana daripada pengakuan ini didapati palsu atau tidak benar, pihak Dewan Bandaraya Kuching Utara berhak menarik balik keputusan tawaran dan menamatkan perkhidmatan saya dengan serta-merta tanpa apa-apa syarat",
    },
    documents: getDocumentSummary(studentInfo),
    job_vacancy: applicationType === "job" && vacancy
      ? {
          id: vacancy.id,
          department: vacancy.department,
          division: vacancy.division,
          title: vacancy.title,
        }
      : null,
    internship_vacancy: applicationType === "internship" && vacancy
      ? {
          id: vacancy.id,
          department: vacancy.department,
          division: vacancy.division,
          title: vacancy.title,
        }
      : null,
    student_info: studentInfo,
  };
}

export default function ApplicantInternshipApplicationPage({ applicationType = "internship" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = getStoredUser();
  const editApplicationId = searchParams.get("application") || "";
  const selectedVacancyId = searchParams.get("vacancy") || "";
  const isStartingNewApplication = searchParams.get("new") === "1";
  const isJobApplication = applicationType === "job";
  const applicationTypeQuery = isJobApplication ? "job" : "internship";
  const applicationTitle = isJobApplication ? "Permohonan Jawatan Kosong DBKU" : "Permohonan Latihan Industri";
  const applicationNoticeNoun = isJobApplication ? "permohonan jawatan kosong" : "permohonan latihan industri";
  const applicationOpportunityNoun = isJobApplication ? "jawatan kosong" : "peluang latihan industri";
  const currentInfoTabs = isJobApplication ? jobInfoTabs : internshipInfoTabs;
  const currentRequiredInfoTabs = isJobApplication ? jobInfoTabs : internshipRequiredInfoTabs;
  const [savedDraft] = useState(() => loadStudentInfoDraft(user, applicationType));
  const activeSavedDraft = isStartingNewApplication ? null : savedDraft;
  const applicantRole = user?.role || "";
  const applicantDraftDefaults = useMemo(
    () => ({
      email: user?.email || "",
      first_name: user?.first_name || "",
      full_name: user?.full_name || "",
    }),
    [user?.email, user?.first_name, user?.full_name],
  );
  const initialStudentInfo = normalizeStudentInfoDraft(activeSavedDraft?.studentInfo || {}, applicantDraftDefaults);
  const [sidebarOpen, toggleSidebar] = useApplicantSidebarState();
  const [activeInfoTab, setActiveInfoTab] = useState(() => (
    isJobApplication ? personalInfoTab : getFirstIncompleteTab(initialStudentInfo, currentRequiredInfoTabs)
  ));
  const [notice, setNotice] = useState("");
  const [noticeStatus, setNoticeStatus] = useState("success");
  const [validationErrors, setValidationErrors] = useState({});
  const documentInputRefs = useRef({});
  const passportPhotoPreviewUrlRef = useRef("");
  const [studentInfo, setStudentInfo] = useState(() => initialStudentInfo);
  const [documentFiles, setDocumentFiles] = useState({});
  const [passportPhotoPreviewUrl, setPassportPhotoPreviewUrl] = useState("");
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [internshipVacancy, setInternshipVacancy] = useState(null);
  const [internshipVacancyLoading, setInternshipVacancyLoading] = useState(true);
  const [editableApplication, setEditableApplication] = useState(null);
  const [submittedReferenceNo, setSubmittedReferenceNo] = useState("");
  const [showSaveDraftDialog, setShowSaveDraftDialog] = useState(false);
  const selectedJobTitle = isJobApplication ? String(internshipVacancy?.title || "").trim() : "";
  const applicationPageTitle = selectedJobTitle
    ? `Nama Jawatan Yang Dipohon: ${selectedJobTitle}`
    : applicationTitle;
  const jobUppercasePersonalFields = new Set([
    "salutation",
    "address",
    "birthPlace",
    "stateOfBirth",
    "motherBirthState",
    "fatherBirthState",
    "race",
    "religion",
    "citizenship",
    "maritalStatus",
    "disability",
    "drivingLicense",
  ]);
  const normalizeJobPersonalValue = (field, value) =>
    isJobApplication && jobUppercasePersonalFields.has(field)
      ? String(value || "").toUpperCase()
      : value;
  const normalizeJobPersonalInfo = (info) => {
    if (!isJobApplication) {
      return info;
    }

    const next = { ...info };
    jobUppercasePersonalFields.forEach((field) => {
      next[field] = normalizeJobPersonalValue(field, next[field]);
    });
    return next;
  };
  const displayName = user?.full_name || user?.first_name || "Pemohon DBKU";
  const email = user?.email || "Belum dikemaskini";

  const clearPassportPhotoPreview = () => {
    if (passportPhotoPreviewUrlRef.current) {
      URL.revokeObjectURL(passportPhotoPreviewUrlRef.current);
    }
    passportPhotoPreviewUrlRef.current = "";
    setPassportPhotoPreviewUrl("");
  };

  const updatePassportPhotoPreview = (file) => {
    if (passportPhotoPreviewUrlRef.current) {
      URL.revokeObjectURL(passportPhotoPreviewUrlRef.current);
    }
    const previewUrl = URL.createObjectURL(file);
    passportPhotoPreviewUrlRef.current = previewUrl;
    setPassportPhotoPreviewUrl(previewUrl);
  };

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true, state: { message: `Sila log masuk untuk memohon ${isJobApplication ? "jawatan kosong" : "latihan industri"}.` } });
    } else if (user.role !== "applicant") {
      navigate("/", { replace: true });
    }
  }, [isJobApplication, navigate, user]);

  useEffect(() => {
    if (user?.role !== "applicant") {
      return;
    }

    let isMounted = true;
    apiRequest(`/jobs/?type=${applicationTypeQuery}`)
      .then((data) => {
        if (!isMounted) return;
        const vacancies = Array.isArray(data) ? data : data.results || [];
        const selectedVacancy = selectedVacancyId
          ? vacancies.find((vacancy) => String(vacancy.id) === String(selectedVacancyId))
          : null;
        setInternshipVacancy(selectedVacancy || vacancies[0] || null);
      })
      .catch(() => {
        if (isMounted) setInternshipVacancy(null);
      })
      .finally(() => {
        if (isMounted) setInternshipVacancyLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [applicationTypeQuery, selectedVacancyId, user?.id, user?.role]);

  useEffect(() => {
    if (applicantRole !== "applicant" || (activeSavedDraft?.studentInfo && !editApplicationId)) {
      return;
    }

    let isMounted = true;
    apiRequest(`/applications/?type=${applicationTypeQuery}`)
      .then((data) => {
        if (!isMounted) return;
        const applications = Array.isArray(data) ? data : data.results || [];
        const draftApplication = applications.find((application) => {
          const status = application.status || "draft";
          if (!editableApplicationStatuses.has(status)) return false;
          return editApplicationId ? String(application.id) === String(editApplicationId) : true;
        });
        const draftStudentInfo = draftApplication?.profile_data?.student_info;
        if (!draftStudentInfo) return;

        const nextStudentInfo = normalizeStudentInfoDraft(draftStudentInfo, applicantDraftDefaults);
        setEditableApplication(draftApplication);
        if (draftApplication.vacancy_detail) {
          setInternshipVacancy(draftApplication.vacancy_detail);
        }
        setStudentInfo(nextStudentInfo);
        setActiveInfoTab(getFirstIncompleteTab(nextStudentInfo, currentRequiredInfoTabs));
        if ((draftApplication.status || "draft") === "incomplete") {
          setNoticeStatus("error");
          setNotice("Permohonan ini ditanda Tidak Lengkap. Sila kemaskini maklumat atau dokumen dan hantar semula.");
        }
      })
      .catch(() => {
        // Keep the current form state if the server draft cannot be loaded.
      });

    return () => {
      isMounted = false;
    };
  }, [activeSavedDraft?.studentInfo, applicantDraftDefaults, applicantRole, applicationTypeQuery, editApplicationId]);

  useEffect(() => () => {
    if (passportPhotoPreviewUrlRef.current) {
      URL.revokeObjectURL(passportPhotoPreviewUrlRef.current);
    }
  }, []);

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
    setStudentInfo((current) => ({ ...current, [field]: normalizeJobPersonalValue(field, event.target.value) }));
  };

  const updateStudentValue = (field, value) => {
    setNotice("");
    setValidationErrors((current) => {
      if (!current[field]) return current;
      const { [field]: _field, ...next } = current;
      return next;
    });
    setStudentInfo((current) => ({ ...current, [field]: normalizeJobPersonalValue(field, value) }));
  };

  const clearValidationFields = (fields) => {
    setValidationErrors((current) => {
      const next = { ...current };
      fields.forEach((field) => {
        delete next[field];
      });
      return next;
    });
  };

  const updateJobSpmValue = (field) => (event) => {
    setNotice("");
    clearValidationFields([field]);
    setStudentInfo((current) => {
      const next = { ...current, [field]: normalizeJobTableValue(event.target.value) };
      return { ...next, jobSpmDetails: buildJobSpmSubjectSummary(next) };
    });
  };

  const updateJobBmJulyValue = (field) => (event) => {
    setNotice("");
    clearValidationFields([field]);
    setStudentInfo((current) => {
      const next = { ...current, [field]: normalizeJobTableValue(event.target.value) };
      return { ...next, jobBmJulyDetails: buildJobBmJulySummary(next) };
    });
  };

  const updateJobMathJulyValue = (field) => (event) => {
    setNotice("");
    clearValidationFields([field]);
    setStudentInfo((current) => {
      const next = { ...current, [field]: normalizeJobTableValue(event.target.value) };
      return { ...next, jobMathJulyDetails: buildJobMathJulySummary(next) };
    });
  };

  const updateJobStpmValue = (field) => (event) => {
    setNotice("");
    clearValidationFields([field]);
    setStudentInfo((current) => {
      const next = { ...current, [field]: normalizeJobTableValue(event.target.value) };
      return { ...next, jobStpmDetails: buildJobStpmSubjectSummary(next) };
    });
  };

  const updateJobSpmSubjectRow = (index, field) => (event) => {
    setNotice("");
    clearValidationFields(["jobSpmDetails", "jobSpmSubjects"]);
    setStudentInfo((current) => {
      const nextSubjects = getJobSpmSubjects(current).map((row, rowIndex) => (
        rowIndex === index ? { ...row, [field]: normalizeJobTableValue(event.target.value) } : row
      ));
      const next = { ...current, jobSpmSubjects: nextSubjects };
      return { ...next, jobSpmDetails: buildJobSpmSubjectSummary(next) };
    });
  };

  const updateJobStpmSubjectRow = (index, field) => (event) => {
    setNotice("");
    clearValidationFields(["jobStpmDetails", "jobStpmSubjects"]);
    setStudentInfo((current) => {
      const nextSubjects = getJobStpmSubjects(current).map((row, rowIndex) => (
        rowIndex === index ? { ...row, [field]: normalizeJobTableValue(event.target.value) } : row
      ));
      const next = { ...current, jobStpmSubjects: nextSubjects };
      return { ...next, jobStpmDetails: buildJobStpmSubjectSummary(next) };
    });
  };

  const updateJobHigherEducationRow = (index, field) => (event) => {
    setNotice("");
    clearValidationFields(["jobHigherEducationQualifications"]);
    setStudentInfo((current) => ({
      ...current,
      jobHigherEducationQualifications: getJobHigherEducationQualifications(current).map((row, rowIndex) => (
        rowIndex === index ? { ...row, [field]: normalizeJobTableValue(event.target.value) } : row
      )),
    }));
  };

  const updateJobLanguageSkillRow = (index, field) => (event) => {
    setNotice("");
    clearValidationFields(["jobLanguageSkills", "jobLanguageSkillRows"]);
    setStudentInfo((current) => {
      const nextRows = getJobLanguageSkillRows(current).map((row, rowIndex) => (
        rowIndex === index ? { ...row, [field]: normalizeJobTableValue(event.target.value) } : row
      ));
      const next = { ...current, jobLanguageSkillRows: nextRows };
      return { ...next, jobLanguageSkills: buildJobLanguageSkillsSummary(next) };
    });
  };

  const updateJobComputerSkillRow = (index, field) => (event) => {
    setNotice("");
    clearValidationFields(["jobComputerSkills", "jobComputerSkillRows"]);
    setStudentInfo((current) => {
      const nextRows = getJobComputerSkillRows(current).map((row, rowIndex) => (
        rowIndex === index ? { ...row, [field]: normalizeJobTableValue(event.target.value) } : row
      ));
      const next = { ...current, jobComputerSkillRows: nextRows };
      return { ...next, jobComputerSkills: buildJobComputerSkillsSummary(next) };
    });
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

  const updatePhoneNumber = (nextPhoneNumber) => {
    setNotice("");
    setValidationErrors((current) => {
      if (!current.phone) return current;
      const { phone: _phone, ...next } = current;
      return next;
    });
    setStudentInfo((current) => ({ ...current, phone: nextPhoneNumber }));
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
      address: location.address ? normalizeJobPersonalValue("address", dedupeAddressText(location.address)) : current.address,
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
    if (field === "passportPhotoFile") {
      updatePassportPhotoPreview(file);
    }
    setDocumentFiles((current) => ({ ...current, [field]: file }));
    setStudentInfo((current) => ({ ...current, [field]: file.name }));
  };

  const clearDocument = (field) => {
    setNotice("");
    if (field === "passportPhotoFile") {
      clearPassportPhotoPreview();
    }
    setDocumentFiles((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
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

    if (activeInfoTab === jobSpmTab) {
      const jobSpmValidation = getJobSpmValidation(studentInfo);
      missingFields.push(...jobSpmValidation.missingFields);
      Object.assign(errors, jobSpmValidation.errors);
    }

    if (activeInfoTab === jobStpmTab) {
      const jobStpmValidation = getJobStpmValidation(studentInfo);
      missingFields.push(...jobStpmValidation.missingFields);
      Object.assign(errors, jobStpmValidation.errors);
    }

    if (activeInfoTab === jobHigherEducationTab) {
      const jobHigherEducationValidation = getJobHigherEducationValidation(studentInfo);
      missingFields.push(...jobHigherEducationValidation.missingFields);
      Object.assign(errors, jobHigherEducationValidation.errors);
    }

    if (activeInfoTab === jobLanguageSkillsTab) {
      const jobLanguageValidation = getJobLanguageSkillsValidation(studentInfo);
      missingFields.push(...jobLanguageValidation.missingFields);
      Object.assign(errors, jobLanguageValidation.errors);
    }

    if (activeInfoTab === jobComputerSkillsTab) {
      const jobComputerValidation = getJobComputerSkillsValidation(studentInfo);
      missingFields.push(...jobComputerValidation.missingFields);
      Object.assign(errors, jobComputerValidation.errors);
    }

    setValidationErrors(errors);

    if (missingFields.length) {
      setNoticeStatus("error");
      setNotice(`Sila lengkapkan: ${missingFields.join(", ")}.`);
      return;
    }

    setNoticeStatus("success");
    if (isJobApplication && activeInfoTab === personalInfoTab) {
      setStudentInfo((current) => normalizeJobPersonalInfo(current));
    }
    setNotice(`${activeInfoTab} telah dikemas kini untuk draf ${applicationNoticeNoun}.`);
  };

  const handleSubmitApplication = async () => {
    setNotice("");

    if (!declarationAccepted) {
      setNoticeStatus("error");
      setNotice("Sila tandakan perakuan pemohon sebelum menghantar permohonan.");
      return;
    }

    const { errors, missingFields } = getMissingApplicationFields(studentInfo, currentRequiredInfoTabs);
    setValidationErrors(errors);

    if (missingFields.length) {
      setNoticeStatus("error");
      setActiveInfoTab(getFirstIncompleteTab(studentInfo, currentRequiredInfoTabs));
      setNotice(`Sila lengkapkan: ${missingFields.join(", ")}.`);
      return;
    }

    if (!editApplicationId && internshipVacancyLoading) {
      setNoticeStatus("error");
      setNotice(`Sila tunggu sebentar sementara ${applicationOpportunityNoun} dimuatkan.`);
      return;
    }

    setIsSubmittingApplication(true);
    try {
      const applicationsData = await apiRequest(`/applications/?type=${applicationTypeQuery}`);
      const applications = Array.isArray(applicationsData) ? applicationsData : applicationsData.results || [];
      const existingApplication = editableApplication
        || applications.find(
          (application) =>
            String(application.id) === String(editApplicationId)
            && editableApplicationStatuses.has(application.status || "draft"),
        )
        || applications.find(
          (application) =>
            Number(application.vacancy) === Number(internshipVacancy?.id)
            && editableApplicationStatuses.has(application.status || "draft"),
        );
      const targetVacancy = existingApplication?.vacancy_detail
        || internshipVacancy
        || (existingApplication?.vacancy ? { id: existingApplication.vacancy } : null);
      if (!targetVacancy?.id) {
        setNoticeStatus("error");
        setNotice(`Tiada ${applicationOpportunityNoun} aktif ditemui untuk menerima permohonan ini.`);
        return;
      }
      const normalizedStudentInfo = normalizeJobPersonalInfo(studentInfo);
      const payload = buildApplicationPayload(normalizedStudentInfo, targetVacancy, documentFiles, applicationType);
      const application = existingApplication
        ? await apiRequest(`/applications/${existingApplication.id}/`, {
            method: "PATCH",
            body: payload,
          })
        : await apiRequest("/applications/", {
            method: "POST",
            body: payload,
          });
      const submittedApplication = application.status === "submitted"
        ? application
        : await apiRequest(`/applications/${application.id}/submit/`, { method: "POST" });

      setNoticeStatus("success");
      setNotice(`Permohonan ${submittedApplication.reference_no} telah dihantar kepada HRM.`);
      clearStudentInfoDraft(user, applicationType);
      setSubmittedReferenceNo(submittedApplication.reference_no || "");
    } catch (error) {
      setNoticeStatus("error");
      setNotice(error.message || "Permohonan tidak dapat dihantar. Sila cuba semula.");
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  const openInfoTab = (tab) => {
    setNotice("");
    setActiveInfoTab(tab);
  };

  const requestExitApplicationForm = () => {
    setShowSaveDraftDialog(true);
  };

  const saveDraftAndExit = () => {
    saveStudentInfoDraft(user, {
      applicationType,
      purpose: isStartingNewApplication || savedDraft?.purpose === "new-application" ? "new-application" : "manual",
      savedAt: new Date().toISOString(),
      studentInfo: getDraftStudentInfo(normalizeJobPersonalInfo(studentInfo)),
      vacancy: internshipVacancy
        ? {
            id: internshipVacancy.id,
            department: internshipVacancy.department,
            division: internshipVacancy.division,
            title: internshipVacancy.title,
            vacancy_type: internshipVacancy.vacancy_type || applicationType,
          }
        : null,
      visibleInApplications: true,
    }, applicationType);
    setShowSaveDraftDialog(false);
    navigate(APPLICANT_ROUTES.applications);
  };

  const closeSubmitSuccessPopup = () => {
    setSubmittedReferenceNo("");
    navigate(APPLICANT_ROUTES.applications);
  };

  const textInput = (field, props = {}) => (
    <input required value={normalizeJobPersonalValue(field, studentInfo[field])} onChange={updateStudentInfo(field)} {...props} />
  );

  const selectPlaceholder = isJobApplication ? "SILA PILIH" : "Sila pilih";

  const selectInput = (field, options, required = true) => (
    <select required={required} value={normalizeJobPersonalValue(field, studentInfo[field])} onChange={updateStudentInfo(field)}>
      <option value="">{selectPlaceholder}</option>
      {options.map((option) => {
        const optionValue = normalizeJobPersonalValue(field, option);
        return <option key={option} value={optionValue}>{optionValue}</option>;
      })}
    </select>
  );

  const renderPersonalRow = (label, fieldContent, className = "", required = true) => (
    <tr className={className}>
      <th scope="row">{renderRequiredLabel(label, required)}</th>
      <td>{fieldContent}</td>
    </tr>
  );

  function renderPassportPhotoUpload() {
    return (
      <section className="student-info-photo-card" aria-label="Muat naik gambar pasport">
        <label className="student-passport-upload">
          <input
            ref={(element) => {
              documentInputRefs.current.passportPhotoFile = element;
            }}
            accept=".jpg, .jpeg, image/jpeg"
            className="student-passport-input"
            type="file"
            onChange={updateDocument("passportPhotoFile")}
          />
          {passportPhotoPreviewUrl ? (
            <img src={passportPhotoPreviewUrl} alt="Gambar pasport dimuat naik" />
          ) : (
            <span>
              <Icon>upload</Icon>
              <b>
                Muat Naik<br />gambar<br />pasport
              </b>
              <small>3.5 cm x 5.0 cm</small>
            </span>
          )}
        </label>
        <div className="student-passport-actions">
          <button type="button" onClick={() => documentInputRefs.current.passportPhotoFile?.click()}>
            <Icon>upload</Icon>
            Muat Naik
          </button>
          <button disabled={!studentInfo.passportPhotoFile} type="button" onClick={() => clearDocument("passportPhotoFile")}>
            <Icon>delete</Icon>
            Padam
          </button>
        </div>
        <p>
          <strong>Nota{renderRequiredLabel("", true)}</strong>
          <span>Sila pastikan gambar yang dimuatnaik adalah dalam format .jpg</span>
        </p>
      </section>
    );
  }

  function renderJobApplicationInstructions() {
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

  const renderApplicantFields = () => (
    <>
      {isJobApplication ? (
        <div className="student-job-photo-guidance-row">
          {renderJobApplicationInstructions()}
          {renderPassportPhotoUpload()}
        </div>
      ) : renderPassportPhotoUpload()}
      <div className="student-personal-table-wrap">
        <table className="student-personal-table">
          <thead>
            {isJobApplication ? (
              <tr className="student-personal-section-heading">
                <th colSpan={2}>{activeInfoHeading}</th>
              </tr>
            ) : null}
          </thead>
          <tbody>
            {isJobApplication ? renderPersonalRow(
              "Gelaran (Encik/ Puan/ Cik)",
              selectInput("salutation", salutationOptions),
            ) : null}
            {renderPersonalRow("Nama", <input required value={studentInfo.name} onChange={updateStudentName} />)}
            {renderPersonalRow("No. Kad Pengenalan Baru", <input required inputMode="numeric" maxLength={12} pattern="[0-9]*" value={studentInfo.icNo} onChange={updateNumericStudentInfo("icNo")} />)}
            {renderPersonalRow("No. Telefon Bimbit/ Telefon Rumah", <InternshipPhoneInput value={studentInfo.phone} onChange={updatePhoneNumber} />)}
            {renderPersonalRow(
              "Alamat Surat Menyurat",
              <ApplicantAddressMap
                address={normalizeJobPersonalValue("address", studentInfo.address)}
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
    </>
  );

  const renderAcademicFields = () => (
    <div className="student-personal-table-wrap">
      <table className="student-personal-table">
        <tbody>
          {renderPersonalRow(
            "Institusi Pengajian",
            <InstitutionSearchSelect value={studentInfo.institution} onChange={(value) => updateStudentValue("institution", value)} />,
          )}
          {renderPersonalRow("Program / Kursus", <input required value={studentInfo.program} onChange={updateStudentInfo("program")} />)}
          {renderPersonalRow(
            "Tahap Pengajian",
            <select required value={studentInfo.academicLevel} onChange={updateStudentInfo("academicLevel")}>
              <option value="">Sila pilih</option>
              {academicLevelOptions.map((option) => <option key={option}>{option}</option>)}
            </select>,
          )}
          {renderPersonalRow("Jumlah Tahun Pengajian", <input required inputMode="numeric" pattern="[0-9]*" placeholder="Contoh: 4" value={studentInfo.totalStudyYears} onChange={updateNumericStudentInfo("totalStudyYears")} />)}
          {renderPersonalRow("Jumlah Semester", <input required inputMode="numeric" pattern="[0-9]*" placeholder="Contoh: 8" value={studentInfo.totalSemesters} onChange={updateNumericStudentInfo("totalSemesters")} />)}
          {renderPersonalRow("Tahun Pengajian Terkini", <input required placeholder="Contoh: Tahun 3" value={studentInfo.currentYear} onChange={updateStudentInfo("currentYear")} />)}
          {renderPersonalRow("Semester Terkini", <input required placeholder="Contoh: Semester 5" value={studentInfo.semester} onChange={updateStudentInfo("semester")} />)}
          {renderPersonalRow("CGPA / Keputusan Terkini", <input required placeholder="Contoh: 3.45" value={studentInfo.cgpa} onChange={updateStudentInfo("cgpa")} />)}
          {renderPersonalRow(
            "Nama Penyelaras Program",
            <input required value={studentInfo.supervisorName} onChange={updateStudentInfo("supervisorName")} />,
          )}
          {renderPersonalRow(
            "Emel Penyelaras Program",
            <input required type="email" value={studentInfo.supervisorEmail} onChange={updateStudentInfo("supervisorEmail")} />,
          )}
          {renderPersonalRow(
            "No. Telefon Penyelaras Program",
            <InternshipPhoneInput value={studentInfo.supervisorPhone} onChange={(value) => updateStudentValue("supervisorPhone", value)} />,
          )}
        </tbody>
      </table>
    </div>
  );

  const renderJobSimpleSection = (field, placeholder) => (
    <div className="student-personal-table-wrap">
      <table className="student-personal-table">
        <tbody>
          {renderPersonalRow(
            activeInfoTab,
            <textarea
              required
              rows={8}
              placeholder={placeholder}
              value={studentInfo[field]}
              onChange={updateStudentInfo(field)}
            />,
          )}
        </tbody>
      </table>
    </div>
  );

  const renderJobSpmSection = () => (
    <div className="student-job-spm-table-wrap">
      <table className="student-job-spm-table">
        <thead>
          <tr>
            <th className="student-job-spm-heading" colSpan={4}>{activeInfoHeading}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={3}>
              <label>
                <span>{renderJobRequiredTableLabel("Sekolah")} :</span>
                <input required value={studentInfo.jobSpmSchool} onChange={updateJobSpmValue("jobSpmSchool")} />
              </label>
            </td>
            <td className="hrm-use-cell" rowSpan={3}>
              UNTUK KEGUNAAN URUSETIA (BHG HRM)
            </td>
          </tr>
          <tr>
            <td colSpan={3}>
              <label>
                <span>{renderJobRequiredTableLabel("Tahun")} :</span>
                <input required value={studentInfo.jobSpmYear} onChange={updateJobSpmValue("jobSpmYear")} />
              </label>
            </td>
          </tr>
          <tr>
            <td colSpan={3}>
              <label>
                <span>{renderJobRequiredTableLabel("Nama Peperiksaan")}</span>
                <input required value={studentInfo.jobSpmExamName} onChange={updateJobSpmValue("jobSpmExamName")} />
              </label>
            </td>
          </tr>
          <tr>
            <th>Bil</th>
            <th>{renderJobRequiredTableLabel("Mata Pelajaran")}</th>
            <th>{renderJobRequiredTableLabel("Gred")}</th>
            <th>Semakan</th>
          </tr>
          {getJobSpmSubjects(studentInfo).map((row, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>
                <input
                  aria-label={`Mata Pelajaran ${index + 1}`}
                  value={row.subject}
                  onChange={updateJobSpmSubjectRow(index, "subject")}
                />
              </td>
              <td>
                <input
                  aria-label={`Gred ${index + 1}`}
                  value={row.grade}
                  onChange={updateJobSpmSubjectRow(index, "grade")}
                />
              </td>
              <td className="hrm-check-cell" aria-label={`Semakan ${index + 1}`} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderJobBmJulySection = () => (
    <div className="student-job-spm-table-wrap">
      <table className="student-job-spm-table student-job-compact-table student-job-bm-july-table">
        <colgroup>
          <col />
          <col />
          <col />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th className="student-job-spm-heading" colSpan={4}>{activeInfoHeading}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={2}>{renderJobRequiredTableLabel("Tahun")}</td>
            <td colSpan={2}>
              <input required value={studentInfo.jobBmJulyYear} onChange={updateJobBmJulyValue("jobBmJulyYear")} />
            </td>
          </tr>
          <tr>
            <td colSpan={2}>{renderJobRequiredTableLabel("Nama Peperiksaan")}</td>
            <td colSpan={2}>
              <input required value={studentInfo.jobBmJulyExamName} onChange={updateJobBmJulyValue("jobBmJulyExamName")} />
            </td>
          </tr>
          <tr>
            <td>{renderJobRequiredTableLabel("Keputusan Gred")}</td>
            <td>
              <input required value={studentInfo.jobBmJulyGradeDecision} onChange={updateJobBmJulyValue("jobBmJulyGradeDecision")} />
            </td>
            <td>{renderJobRequiredTableLabel("Ujian Lisan")}</td>
            <td>
              <input required value={studentInfo.jobBmJulyOralExam} onChange={updateJobBmJulyValue("jobBmJulyOralExam")} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const renderJobMathJulySection = () => (
    <div className="student-job-spm-table-wrap">
      <table className="student-job-spm-table student-job-compact-table">
        <thead>
          <tr>
            <th className="student-job-spm-heading" colSpan={2}>{activeInfoHeading}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{renderJobRequiredTableLabel("Tahun")}</td>
            <td>
              <input required value={studentInfo.jobMathJulyYear} onChange={updateJobMathJulyValue("jobMathJulyYear")} />
            </td>
          </tr>
          <tr>
            <td>{renderJobRequiredTableLabel("Keputusan Gred")}</td>
            <td>
              <input required value={studentInfo.jobMathJulyGradeDecision} onChange={updateJobMathJulyValue("jobMathJulyGradeDecision")} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const renderJobStpmSection = () => (
    <div className="student-job-spm-table-wrap">
      <table className="student-job-spm-table student-job-stpm-table">
        <thead>
          <tr>
            <th className="student-job-spm-heading" colSpan={3}>{activeInfoHeading}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={3}>
              <label>
                <span>{renderJobRequiredTableLabel("Sekolah")}</span>
                <input required value={studentInfo.jobStpmSchool} onChange={updateJobStpmValue("jobStpmSchool")} />
              </label>
            </td>
          </tr>
          <tr>
            <td colSpan={3}>
              <label>
                <span>{renderJobRequiredTableLabel("Tahun")}</span>
                <input required value={studentInfo.jobStpmYear} onChange={updateJobStpmValue("jobStpmYear")} />
              </label>
            </td>
          </tr>
          <tr>
            <td colSpan={3}>
              <label>
                <span>{renderJobRequiredTableLabel("Nama Peperiksaan")}</span>
                <input required value={studentInfo.jobStpmExamName} onChange={updateJobStpmValue("jobStpmExamName")} />
              </label>
            </td>
          </tr>
          <tr>
            <th>Bil</th>
            <th>{renderJobRequiredTableLabel("Mata Pelajaran")}</th>
            <th>{renderJobRequiredTableLabel("Gred")}</th>
          </tr>
          {getJobStpmSubjects(studentInfo).map((row, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>
                <input
                  aria-label={`Mata Pelajaran STPM ${index + 1}`}
                  value={row.subject}
                  onChange={updateJobStpmSubjectRow(index, "subject")}
                />
              </td>
              <td>
                <input
                  aria-label={`Gred STPM ${index + 1}`}
                  value={row.grade}
                  onChange={updateJobStpmSubjectRow(index, "grade")}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderJobRequiredTableLabel = (label) => (
    <>
      {label}
      <RequiredMarker />
    </>
  );

  const renderJobHigherEducationSection = () => (
    <div className="student-job-spm-table-wrap">
      {getJobHigherEducationQualifications(studentInfo).map((row, index) => (
        <table className="student-job-spm-table student-job-higher-education-table" key={index}>
          <colgroup>
            <col />
            <col />
            <col />
            <col />
          </colgroup>
          {index === 0 ? (
            <thead>
              <tr>
                <th className="student-job-spm-heading" colSpan={4}>
                  {activeInfoHeading}
                  <span className="student-job-heading-note">
                    (Sila lengkapkan maklumat kelulusan pendidikan tinggi jika jawatan yang dipohon memerlukan kelayakan tersebut. Jika tidak, ruangan ini hendaklah dikosongkan.)
                  </span>
                </th>
              </tr>
            </thead>
          ) : null}
          <tbody>
            <tr>
              <td>{renderJobRequiredTableLabel("Nama Sijil")}</td>
              <td>
                <input required value={row.certificateName} onChange={updateJobHigherEducationRow(index, "certificateName")} />
              </td>
              <td>{renderJobRequiredTableLabel("Tarikh Masuk")}</td>
              <td>
                <input required value={row.entryDate} onChange={updateJobHigherEducationRow(index, "entryDate")} />
              </td>
            </tr>
            <tr>
              <td>{renderJobRequiredTableLabel("CGPA")}</td>
              <td>
                <input required value={row.cgpa} onChange={updateJobHigherEducationRow(index, "cgpa")} />
              </td>
              <td>{renderJobRequiredTableLabel("Tarikh Tamat Pengajian")}</td>
              <td>
                <input required value={row.completionDate} onChange={updateJobHigherEducationRow(index, "completionDate")} />
              </td>
            </tr>
            <tr>
              <td>{renderJobRequiredTableLabel("Institusi")}</td>
              <td colSpan={3}>
                <input required value={row.institution} onChange={updateJobHigherEducationRow(index, "institution")} />
              </td>
            </tr>
            <tr>
              <td>{renderJobRequiredTableLabel("Pengkhususan")}</td>
              <td colSpan={3}>
                <input required value={row.specialization} onChange={updateJobHigherEducationRow(index, "specialization")} />
              </td>
            </tr>
          </tbody>
        </table>
      ))}
      {validationErrors.jobHigherEducationQualifications ? (
        <p className="student-field-error">{validationErrors.jobHigherEducationQualifications}</p>
      ) : null}
    </div>
  );

  const renderJobLanguageLevelCell = (row, index, field, option, onChange) => {
    const normalizedOption = normalizeJobTableValue(option);

    return (
      <td key={option}>
        <label className="student-job-radio-cell">
          <input
            aria-label={`${row.language || "Bahasa Lain"} ${field} ${option}`}
            checked={row[field] === normalizedOption}
            name={`job-language-${index}-${field}`}
            type="radio"
            value={normalizedOption}
            onChange={onChange}
          />
          <span>/</span>
        </label>
      </td>
    );
  };

  const renderJobLanguageSkillsSection = () => (
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
          {getJobLanguageSkillRows(studentInfo).map((row, index) => (
            <Fragment key={index}>
              <tr>
                <td rowSpan={2}>
                  {row.required ? (
                    <>
                      {row.language}
                      <RequiredMarker />
                    </>
                  ) : (
                    <label className="student-job-other-language">
                      <span className="student-job-other-language-label">Bahasa Lain:</span>
                      <input
                        aria-label={`Bahasa Lain ${index - 1}`}
                        className="student-job-other-language-input"
                        value={row.language}
                        onChange={updateJobLanguageSkillRow(index, "language")}
                      />
                    </label>
                  )}
                </td>
                <td className="student-job-fluency-cell">Pertuturan</td>
                {jobSkillLevelOptions.map((option) => renderJobLanguageLevelCell(row, index, "speaking", option, updateJobLanguageSkillRow(index, "speaking")))}
              </tr>
              <tr>
                <td className="student-job-fluency-cell">Penulisan</td>
                {jobSkillLevelOptions.map((option) => renderJobLanguageLevelCell(row, index, "writing", option, updateJobLanguageSkillRow(index, "writing")))}
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderJobComputerSkillsSection = () => (
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
            <th rowSpan={2}>
              Nama Perisian
              <RequiredMarker />
            </th>
            <th colSpan={4}>Tahap Kemahiran</th>
          </tr>
          <tr>
            {jobComputerLevelOptions.map((option) => <th key={option}>{option}</th>)}
          </tr>
        </thead>
        <tbody>
          {getJobComputerSkillRows(studentInfo).map((row, index) => (
            <tr key={index}>
              <td>
                <input
                  aria-label={`Nama Perisian ${index + 1}`}
                  value={row.softwareName}
                  onChange={updateJobComputerSkillRow(index, "softwareName")}
                />
              </td>
              {jobComputerLevelOptions.map((option) => {
                const normalizedOption = normalizeJobTableValue(option);

                return (
                  <td key={option}>
                    <label className="student-job-radio-cell">
                      <input
                        aria-label={`Tahap Kemahiran ${option} ${index + 1}`}
                        checked={row.level === normalizedOption}
                        name={`job-computer-${index}-level`}
                        type="radio"
                        value={normalizedOption}
                        onChange={updateJobComputerSkillRow(index, "level")}
                      />
                      <span>/</span>
                    </label>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderDocumentFields = () => (
    <>
      <div className="student-personal-table-wrap">
        <table className="student-personal-table">
          <tbody>
            {documentFields.map((document) => renderPersonalRow(
              document.label,
              <div className="student-document-table-cell">
                <input
                  ref={(element) => {
                    documentInputRefs.current[document.field] = element;
                  }}
                  accept={document.accept}
                  className="student-document-upload-input"
                  type="file"
                  onChange={updateDocument(document.field)}
                />
                <span className={studentInfo[document.field] ? "uploaded" : ""}>
                  {studentInfo[document.field] || document.hint}
                </span>
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
              </div>,
            ))}
          </tbody>
        </table>
      </div>

      <section className="student-declaration" aria-label="Perakuan pemohon">
        <label>
          <input
            checked={declarationAccepted}
            type="checkbox"
            onChange={(event) => setDeclarationAccepted(event.target.checked)}
          />
          <span>
            Saya dengan ini mengaku bahawa semua maklumat yang saya berikan adalah <strong>BENAR</strong> dan <strong>TEPAT</strong>. Saya juga bersetuju dan menerima bahawa sekiranya mana-mana daripada pengakuan ini didapati palsu atau tidak benar, pihak Dewan Bandaraya Kuching Utara berhak menarik balik keputusan tawaran dan menamatkan perkhidmatan saya dengan serta-merta tanpa apa-apa syarat
          </span>
        </label>
      </section>
    </>
  );

  const nextInfoTab = currentInfoTabs[currentInfoTabs.indexOf(activeInfoTab) + 1] || null;
  const getJobTabCode = (index) => `(${String.fromCharCode(65 + index)})`;
  const getInfoTabLabel = (tab, index) => {
    if (!isJobApplication) return tab;
    return `${getJobTabCode(index)} ${jobTabShortLabels[tab] || tab}`;
  };
  const getJobInfoHeading = (tab, index) => `${getJobTabCode(index)} ${tab.toUpperCase()}`;
  const activeInfoHeading = isJobApplication
    ? getJobInfoHeading(activeInfoTab, currentInfoTabs.indexOf(activeInfoTab))
    : activeInfoTab;
  const renderInfoHeading = () => (
    <h2>{activeInfoHeading}</h2>
  );
  const requiredInfoTabsComplete = currentRequiredInfoTabs.every((tab) => isTabComplete(tab, studentInfo));
  const isApplicationReadyToSubmit = declarationAccepted && requiredInfoTabsComplete;

  return (
    <div className={`applicant-profile-page ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      <ProfileSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div className="profile-main-area">
        <ProfileContentHeader displayName={displayName} email={email} photoUrl={user.profile_photo_url} />
        <main className="profile-shell internship-application-shell">
          <section className="student-info-panel" aria-label="Maklumat permohonan latihan industri">
            <header className="student-info-titlebar">
              <h1>{applicationPageTitle}</h1>
              <button className="student-info-back" type="button" onClick={requestExitApplicationForm}>
                <Icon>arrow_back</Icon>
                Kembali
              </button>
            </header>

            <div className="student-info-workspace">
              <div className="student-info-content">
                <nav className={`student-info-tabs ${isJobApplication ? "job-application-tabs" : ""}`} aria-label="Bahagian permohonan latihan industri">
                  {currentInfoTabs.map((tab, index) => (
                    <button
                      className={activeInfoTab === tab ? "active" : ""}
                      key={tab}
                      title={isJobApplication ? getJobInfoHeading(tab, index) : undefined}
                      type="button"
                      onClick={() => openInfoTab(tab)}
                    >
                      {getInfoTabLabel(tab, index)}
                    </button>
                  ))}
                </nav>

                <form className="student-info-form" onSubmit={handleUpdate}>
                  {!isJobApplication ? renderInfoHeading() : null}
                  {notice ? <p className={`student-info-notice ${noticeStatus}`}>{notice}</p> : null}

                  {activeInfoTab === personalInfoTab ? renderApplicantFields() : null}
                  {activeInfoTab === jobSpmTab ? renderJobSpmSection() : null}
                  {activeInfoTab === jobBmJulyTab ? renderJobBmJulySection() : null}
                  {activeInfoTab === jobMathJulyTab ? renderJobMathJulySection() : null}
                  {activeInfoTab === jobStpmTab ? renderJobStpmSection() : null}
                  {activeInfoTab === academicInfoTab ? renderAcademicFields() : null}
                  {activeInfoTab === jobHigherEducationTab ? renderJobHigherEducationSection() : null}
                  {activeInfoTab === jobLanguageSkillsTab ? renderJobLanguageSkillsSection() : null}
                  {activeInfoTab === jobComputerSkillsTab ? renderJobComputerSkillsSection() : null}
                  {activeInfoTab === jobWorkExperienceTab ? renderJobSimpleSection("jobWorkExperience", "Masukkan pengalaman bekerja.") : null}
                  {activeInfoTab === jobReferencesTab ? renderJobSimpleSection("jobReferences", "Masukkan maklumat rujukan.") : null}
                  {activeInfoTab === jobDeclarationTab ? renderJobSimpleSection("jobDeclaration", "Masukkan perakuan pemohon.") : null}
                  {activeInfoTab === documentSupportTab ? renderDocumentFields() : null}

                  <div className="student-info-actions">
                    <button className="student-info-update" type="submit">Kemas Kini</button>
                    {nextInfoTab ? (
                      <button className="student-info-next" type="button" onClick={() => openInfoTab(nextInfoTab)}>
                        Seterusnya
                        <Icon>arrow_forward</Icon>
                      </button>
                    ) : null}
                    {activeInfoTab === documentSupportTab ? (
                      <button
                        className="student-info-submit"
                        disabled={!isApplicationReadyToSubmit || isSubmittingApplication}
                        type="button"
                        onClick={handleSubmitApplication}
                      >
                        {isSubmittingApplication ? "Menghantar..." : "Hantar Permohonan"}
                      </button>
                    ) : null}
                  </div>
                </form>
              </div>
            </div>
          </section>
        </main>
      </div>
      {submittedReferenceNo ? (
        <div className="student-submit-dialog-backdrop" role="presentation">
          <section
            aria-labelledby="student-submit-dialog-title"
            aria-modal="true"
            className="student-submit-dialog"
            role="dialog"
          >
            <h2 id="student-submit-dialog-title">Permohonan Berjaya Dihantar</h2>
            <p>Permohonan anda sudah berjaya dihantar.</p>
            <button type="button" onClick={closeSubmitSuccessPopup}>OK</button>
          </section>
        </div>
      ) : null}
      {showSaveDraftDialog ? (
        <div className="student-submit-dialog-backdrop" role="presentation">
          <section
            aria-label="Simpan draf"
            aria-modal="true"
            className="student-submit-dialog student-save-draft-dialog"
            role="dialog"
          >
            <p>Maklumat yang telah diisi akan disimpan sebagai draf dan dipaparkan dalam Permohonan Saya.</p>
            <div className="student-save-draft-actions">
              <button type="button" onClick={saveDraftAndExit}>Simpan draf</button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
