import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, getStoredUser } from "../../lib/authApi";
import { countryCallingCodes, defaultCountryCallingCode } from "../../lib/countryCallingCodes";
import { APPLICANT_ROUTES } from "../../modules/applicant/applicantRoutes";
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
  maritalStatus: "",
  motherBirthState: "",
  name: "",
  passportPhotoFile: "",
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
  totalSemesters: "",
  totalStudyYears: "",
  transcriptFile: "",
  universityLetterFile: "",
  weight: "",
  latitude: "",
  longitude: "",
});

const requiredFieldsByTab = {
  "Dokumen Sokongan": [
    ["universityLetterFile", "Surat rasmi daripada institusi / kolej / universiti"],
    ["transcriptFile", "Transkrip akademik terkini"],
    ["resumeFile", "Curriculum Vitae (CV)"],
    ["passportPhotoFile", "1 keping gambar berukuran passport"],
    ["bankAccountFile", "1 salinan muka depan akaun bank"],
  ],
  "Maklumat Akademik": [
    ["institution", "Institusi Pengajian"],
    ["program", "Program / Kursus"],
    ["academicLevel", "Tahap Pengajian"],
    ["totalStudyYears", "Jumlah Tahun Pengajian"],
    ["totalSemesters", "Jumlah Semester"],
    ["currentYear", "Tahun Pengajian Terkini"],
    ["semester", "Semester Terkini"],
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

function clearStudentInfoDraft(user) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(getDraftStorageKey(user));
  } catch {
    // Ignore storage cleanup failures; the submitted application remains in the backend.
  }
}

function isTabComplete(tab, studentInfo) {
  const requiredFields = requiredFieldsByTab[tab] || [];
  const hasRequiredFields = requiredFields.every(([field]) => String(studentInfo[field] || "").trim());
  const hasRequiredLocation = tab !== personalInfoTab || (studentInfo.latitude && studentInfo.longitude);

  return hasRequiredFields && hasRequiredLocation;
}

function getFirstIncompleteTab(studentInfo) {
  return infoTabs.find((tab) => !isTabComplete(tab, studentInfo)) || personalInfoTab;
}

function getMissingApplicationFields(studentInfo) {
  const missingFields = [];
  const errors = {};

  infoTabs.forEach((tab) => {
    (requiredFieldsByTab[tab] || []).forEach(([field, label]) => {
      if (!String(studentInfo[field] || "").trim()) {
        missingFields.push(`${tab}: ${label}`);
        errors[field] = "Wajib diisi.";
      }
    });
  });

  if (!studentInfo.latitude || !studentInfo.longitude) {
    missingFields.push(`${personalInfoTab}: Lokasi alamat pada map`);
    errors.location = "Sila pilih lokasi alamat pada map.";
  }

  return { errors, missingFields };
}

function getDocumentSummary(studentInfo) {
  return Object.fromEntries(
    documentFields.map((document) => {
      const fileName = studentInfo[document.field] || "";
      const fileUrl = studentInfo[`${document.field}Url`] || "";
      return [
        document.field,
        fileUrl
          ? {
              name: fileName,
              url: fileUrl,
            }
          : fileName,
      ];
    }),
  );
}

function buildApplicationProfileData(studentInfo, vacancy) {
  return {
    declaration: {
      accepted: true,
      accepted_at: new Date().toISOString(),
      text:
        "Saya dengan ini mengaku bahawa semua maklumat yang saya berikan adalah BENAR dan TEPAT. Saya juga bersetuju dan menerima bahawa sekiranya mana-mana daripada pengakuan ini didapati palsu atau tidak benar, pihak Dewan Bandaraya Kuching Utara berhak menarik balik keputusan tawaran dan menamatkan perkhidmatan saya dengan serta-merta tanpa apa-apa syarat",
    },
    documents: getDocumentSummary(studentInfo),
    internship_vacancy: vacancy
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

export default function ApplicantInternshipApplicationPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const savedDraft = loadStudentInfoDraft(user);
  const initialStudentInfo = normalizeStudentInfoDraft(savedDraft?.studentInfo || {}, user);
  const [sidebarOpen, toggleSidebar] = useApplicantSidebarState();
  const [activeInfoTab, setActiveInfoTab] = useState(() => getFirstIncompleteTab(initialStudentInfo));
  const [notice, setNotice] = useState("");
  const [noticeStatus, setNoticeStatus] = useState("success");
  const [validationErrors, setValidationErrors] = useState({});
  const documentInputRefs = useRef({});
  const [studentInfo, setStudentInfo] = useState(() => initialStudentInfo);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [internshipVacancy, setInternshipVacancy] = useState(null);
  const [internshipVacancyLoading, setInternshipVacancyLoading] = useState(true);
  const [submittedReferenceNo, setSubmittedReferenceNo] = useState("");
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

  useEffect(() => {
    if (user?.role !== "applicant") {
      return;
    }

    let isMounted = true;
    apiRequest("/jobs/?type=internship")
      .then((data) => {
        if (!isMounted) return;
        const vacancies = Array.isArray(data) ? data : data.results || [];
        setInternshipVacancy(vacancies[0] || null);
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
  }, [user?.id, user?.role]);

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

  const updateStudentValue = (field, value) => {
    setNotice("");
    setValidationErrors((current) => {
      if (!current[field]) return current;
      const { [field]: _field, ...next } = current;
      return next;
    });
    setStudentInfo((current) => ({ ...current, [field]: value }));
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
      address: location.address ? dedupeAddressText(location.address) : current.address,
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
    const reader = new FileReader();
    reader.onload = () => {
      setStudentInfo((current) => ({
        ...current,
        [field]: file.name,
        [`${field}Url`]: String(reader.result || ""),
      }));
    };
    reader.onerror = () => {
      setNoticeStatus("error");
      setNotice("Fail tidak dapat dibaca. Sila pilih fail semula.");
    };
    reader.readAsDataURL(file);
  };

  const clearDocument = (field) => {
    setNotice("");
    setStudentInfo((current) => ({ ...current, [field]: "", [`${field}Url`]: "" }));

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

  const handleSubmitApplication = async () => {
    setNotice("");

    if (!declarationAccepted) {
      setNoticeStatus("error");
      setNotice("Sila tandakan perakuan pemohon sebelum menghantar permohonan.");
      return;
    }

    const { errors, missingFields } = getMissingApplicationFields(studentInfo);
    setValidationErrors(errors);

    if (missingFields.length) {
      setNoticeStatus("error");
      setActiveInfoTab(getFirstIncompleteTab(studentInfo));
      setNotice(`Sila lengkapkan: ${missingFields.join(", ")}.`);
      return;
    }

    if (internshipVacancyLoading) {
      setNoticeStatus("error");
      setNotice("Sila tunggu sebentar sementara peluang latihan industri dimuatkan.");
      return;
    }

    if (!internshipVacancy) {
      setNoticeStatus("error");
      setNotice("Tiada peluang latihan industri aktif ditemui untuk menerima permohonan ini.");
      return;
    }

    setIsSubmittingApplication(true);
    try {
      const applicationsData = await apiRequest("/applications/?type=internship");
      const applications = Array.isArray(applicationsData) ? applicationsData : applicationsData.results || [];
      const existingApplication = applications.find((application) => Number(application.vacancy) === Number(internshipVacancy.id));
      const payload = {
        cover_letter: "Permohonan Latihan Industri DBKU",
        profile_data: buildApplicationProfileData(studentInfo, internshipVacancy),
        vacancy: internshipVacancy.id,
      };
      const application = existingApplication
        ? await apiRequest(`/applications/${existingApplication.id}/`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await apiRequest("/applications/", {
            method: "POST",
            body: JSON.stringify(payload),
          });
      const submittedApplication = application.status === "submitted"
        ? application
        : await apiRequest(`/applications/${application.id}/submit/`, { method: "POST" });

      setNoticeStatus("success");
      setNotice(`Permohonan ${submittedApplication.reference_no} telah dihantar kepada HRM.`);
      clearStudentInfoDraft(user);
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

  const exitApplicationForm = () => {
    navigate(APPLICANT_ROUTES.applications);
  };

  const closeSubmitSuccessPopup = () => {
    setSubmittedReferenceNo("");
    navigate(APPLICANT_ROUTES.applications);
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
          {renderPersonalRow("No. Telefon Bimbit/ Telefon Rumah", <InternshipPhoneInput value={studentInfo.phone} onChange={updatePhoneNumber} />)}
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
            <input value={studentInfo.supervisorName} onChange={updateStudentInfo("supervisorName")} />,
          )}
          {renderPersonalRow(
            "Emel Penyelaras Program",
            <input type="email" value={studentInfo.supervisorEmail} onChange={updateStudentInfo("supervisorEmail")} />,
          )}
          {renderPersonalRow(
            "No. Telefon Penyelaras Program",
            <InternshipPhoneInput value={studentInfo.supervisorPhone} onChange={(value) => updateStudentValue("supervisorPhone", value)} />,
          )}
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

  const nextInfoTab = infoTabs[infoTabs.indexOf(activeInfoTab) + 1] || null;
  const applicationMissingFields = getMissingApplicationFields(studentInfo).missingFields;
  const isApplicationReadyToSubmit = declarationAccepted && !applicationMissingFields.length;

  return (
    <div className={`applicant-profile-page ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      <ProfileSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div className="profile-main-area">
        <ProfileContentHeader displayName={displayName} email={email} photoUrl={user.profile_photo_url} />
        <main className="profile-shell internship-application-shell">
          <section className="student-info-panel" aria-label="Maklumat permohonan latihan industri">
            <header className="student-info-titlebar">
              <h1>Permohonan Latihan Industri</h1>
              <button className="student-info-back" type="button" onClick={exitApplicationForm}>
                <Icon>arrow_back</Icon>
                Kembali
              </button>
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
                    {activeInfoTab === "Dokumen Sokongan" ? (
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
    </div>
  );
}
