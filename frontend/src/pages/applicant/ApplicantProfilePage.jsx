import { useCallback, useEffect, useRef, useState } from "react";
import { getCities, getPostcodes, getStates } from "malaysia-postcodes";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { clearAuthSession, fetchAuthenticatedBlob, getStoredUser, updateCurrentUser } from "../../lib/authApi";
import { Icon } from "./ApplicantAuthShared";

const sidebarNavItems = [
  { icon: "stars", label: "Padanan Kerja", to: "/jobs" },
  { icon: "search", label: "Cari Kerja", to: "/jobs" },
  { icon: "work_history", label: "Kerja Saya", href: "#applications" },
  { icon: "person", label: "Profil", to: "/profile" },
  { icon: "more_horiz", label: "Lagi", href: "#more" },
];

const emptyProfileCards = [
  {
    icon: "history",
    title: "Pengalaman",
    body: "Tambah pengalaman kerja, latihan industri atau projek berkaitan.",
  },
  {
    icon: "school",
    title: "Pendidikan",
    body: "Masukkan kelayakan akademik supaya permohonan lebih lengkap.",
  },
  {
    icon: "psychology",
    title: "Kemahiran",
    body: "Senaraikan kemahiran teknikal, bahasa dan sijil profesional anda.",
  },
];

const defaultPersonalDetails = {
  identificationNumber: "",
  birthDay: "",
  birthMonth: "",
  birthYear: "",
  race: "",
  citizenship: "",
  gender: "",
  hasHealthIssue: "",
  hasDisability: "",
  state: "",
  city: "",
  postcode: "",
  address: "",
  primaryPhone: "",
  secondaryPhone: "",
  resumeFile: "",
  videoResumeFile: "",
  linkedIn: "",
};

const defaultJobPreferences = {
  careerObjective: "",
  isLookingForJob: "Ya",
  preferredJobs: [],
};

const careerLevelOptions = [
  { value: "Bukan Eksekutif", label: "Bukan Eksekutif" },
  { value: "Fresh / Entry Level", label: "Fresh / Entry Level" },
  { value: "Eksekutif Biasa", label: "Eksekutif Biasa" },
  { value: "Eksekutif Kanan", label: "Eksekutif Kanan" },
  { value: "Pengurus", label: "Pengurus" },
  { value: "Pengurus Kanan", label: "Pengurus Kanan" },
  { value: "Pengurusan Tertinggi", label: "Pengurusan Tertinggi" },
];

// Semua bahagian industri MSIC 2008 (DOSM), iaitu klasifikasi industri rasmi Malaysia.
const sectorOptions = [
  ["01", "Pengeluaran tanaman dan ternakan, pemburuan dan aktiviti perkhidmatan berkaitan"], ["02", "Perhutanan dan pembalakan"], ["03", "Perikanan dan akuakultur"], ["05", "Perlombongan batu arang dan lignit"], ["06", "Pengekstrakan petroleum mentah dan gas asli"], ["07", "Perlombongan bijih besi"], ["08", "Perlombongan dan pengkuarian lain"], ["09", "Aktiviti sokongan perkhidmatan perlombongan"],
  ["10", "Pembuatan produk makanan"], ["11", "Pembuatan minuman"], ["12", "Pembuatan produk tembakau"], ["13", "Pembuatan tekstil"], ["14", "Pembuatan pakaian"], ["15", "Pembuatan produk kulit dan barangan berkaitan"], ["16", "Pembuatan kayu dan produk kayu dan gabus, kecuali perabot; pembuatan bagi artikel jerami dan bahan-bahan anyaman"], ["17", "Pembuatan kertas dan produk kertas"], ["18", "Percetakan dan penerbitan semula media rakaman"], ["19", "Pembuatan kok dan produk petroleum bertapis"], ["20", "Pembuatan kimia dan produk kimia"], ["21", "Pembuatan produk farmaseutikal asas, kimia perubatan dan botani"], ["22", "Pembuatan produk getah dan plastik"], ["23", "Pembuatan produk galian bukan logam lain"], ["24", "Pembuatan logam asas"], ["25", "Pembuatan produk logam, kecuali mesin dan kelengkapan"], ["26", "Pembuatan komputer, produk elektronik dan optikal"], ["27", "Pembuatan kelengkapan elektrik"], ["28", "Pembuatan jentera dan peralatan t.t.t.l."], ["29", "Pembuatan kenderaan bermotor, treler dan semi treler"], ["30", "Pembuatan kelengkapan pengangkutan lain"], ["31", "Pembuatan perabot"], ["32", "Pembuatan lain"], ["33", "Pembaikan dan pemasangan jentera dan kelengkapan"],
  ["35", "Bekalan elektrik, gas, wap dan pendingin udara"], ["36", "Penakungan, perawatan dan bekalan air"], ["37", "Pembetungan"], ["38", "Aktiviti pengumpulan, rawatan dan pelupusan sisa; pemulihan semula bahan"], ["39", "Aktiviti pemulihan dan lain-lain perkhidmatan pengurusan sisa"], ["41", "Pembinaan bangunan"], ["42", "Kejuruteraan awam"], ["43", "Aktiviti pembinaan pertukangan khas"], ["45", "Perdagangan borong dan runcit dan pembaikan kenderaan bermotor dan motosikal"], ["46", "Perdagangan borong kecuali kenderaan bermotor dan motosikal"], ["47", "Perdagangan runcit kecuali kenderaan bermotor dan motosikal"], ["49", "Pengangkutan darat dan pengangkutan melalui saliran paip"], ["50", "Pengangkutan air"], ["51", "Pengangkutan udara"], ["52", "Penggudangan dan aktiviti sokongan untuk pengangkutan"], ["53", "Perkhidmatan pos dan kurier"], ["55", "Penginapan"], ["56", "Aktiviti perkhidmatan makanan dan minuman"],
  ["58", "Aktiviti penerbitan"], ["59", "Aktiviti penerbitan wayang gambar, video dan program televisyen, rakaman bunyi dan penerbitan muzik"], ["60", "Aktiviti pemprograman dan penyiaran"], ["61", "Telekomunikasi"], ["62", "Pengaturcaraan komputer, perundingan dan aktiviti yang berkaitan"], ["63", "Aktiviti perkhidmatan maklumat"], ["64", "Aktiviti perkhidmatan kewangan, kecuali insurans/takaful dan tabungan pencen"], ["65", "Insurans/takaful, insurans/takaful semula dan tabungan pencen, kecuali keselamatan sosial berwajib"], ["66", "Aktiviti sokongan kepada perkhidmatan kewangan dan aktiviti insurans/takaful"], ["68", "Aktiviti hartanah"], ["69", "Aktiviti guaman dan perakaunan"], ["70", "Aktiviti ibu pejabat; aktiviti perundingan pengurusan"], ["71", "Aktiviti arkitek dan kejuruteraan; ujian teknikal dan analisis"], ["72", "Penyelidikan dan pembangunan saintifik"], ["73", "Pengiklanan dan penyelidikan pasaran"], ["74", "Perkhidmatan profesional, saintifik dan teknikal lain"], ["75", "Aktiviti veterinar"], ["77", "Aktiviti sewaan dan pajakan"], ["78", "Aktiviti pekerjaan"], ["79", "Agensi pengembaraan, operator pelancongan, khidmat penempahan dan aktiviti berkaitan"], ["80", "Aktiviti keselamatan dan penyiasatan"], ["81", "Aktiviti perkhidmatan bangunan dan landskap"], ["82", "Aktiviti pengurusan pejabat, sokongan pejabat dan sokongan perniagaan lain"],
  ["84", "Pentadbiran awam dan pertahanan; keselamatan sosial wajib"], ["85", "Pendidikan"], ["86", "Aktiviti kesihatan kemanusiaan"], ["87", "Aktiviti rumah penjagaan"], ["88", "Aktiviti kerja sosial tanpa penginapan"], ["90", "Aktiviti kesenian, hiburan dan kreatif"], ["91", "Aktiviti perpustakaan, arkib, muzium dan kebudayaan lain"], ["92", "Aktiviti perjudian dan pertaruhan"], ["93", "Aktiviti sukan dan aktiviti hiburan dan rekreasi"], ["94", "Aktiviti keahlian organisasi"], ["95", "Pembaikan komputer dan barangan persendirian dan isi rumah"], ["96", "Aktiviti perkhidmatan persendirian lain"], ["97", "Aktiviti isi rumah sebagai majikan bagi personel domestik"], ["98", "Aktiviti mengeluarkan barangan dan perkhidmatan yang tidak dapat dibezakan oleh isi rumah persendirian untuk kegunaan sendiri"], ["99", "Aktiviti badan dan pertubuhan luar wilayah"],
].map(([, sector]) => ({ value: sector, label: sector }));

const defaultSkillSuggestions = [
  "ABAP",
  "AJAX",
  "APL",
  "ASP.NET",
  "Adapt to changes in technological development plans",
  "Analyse software specifications",
  "Ansible",
  "Apache Maven",
  "Assembly (computer programming)",
  "COBOL",
  "CSS",
  "C#",
  "C++",
  "Computer programming",
  "Design user interface",
  "Develop software prototype",
  "Implement front-end website design",
  "Java (computer programming)",
  "JavaScript",
  "JSSS",
  "MATLAB",
  "ML (computer programming)",
  "Microsoft Visual C++",
  "Object-oriented modelling",
  "PHP",
  "Python (computer programming)",
  "R",
  "Use object-oriented programming",
  "Visual Studio .NET",
  "Web programming",
];

const recommendedJobTitles = [
  "Pembangun laman web",
  "Pembangun perisian",
  "Jurutera perisian",
  "Pembangun aplikasi mudah alih",
  "Penganalisis sistem",
  "Penganalisis data",
  "Saintis data",
  "Pereka UI/UX",
  "Pereka laman web",
  "Pentadbir pangkalan data",
  "Juruteknik komputer",
  "Pegawai teknologi maklumat",
  "Pentadbir rangkaian",
  "Jurutera rangkaian",
  "Pakar keselamatan siber",
  "Penguji perisian",
  "Pegawai sokongan teknikal",
  "Pengurus projek IT",
  "Eksekutif pemasaran digital",
  "Eksekutif pentadbiran",
  "Pembantu tadbir",
  "Pegawai khidmat pelanggan",
  "Eksekutif sumber manusia",
  "Akauntan",
  "Pembantu akaun",
  "Jurutera awam",
  "Jurutera mekanikal",
  "Jurutera elektrik",
  "Pegawai perancang bandar",
  "Pembantu perancang bandar",
  "Pegawai landskap",
  "Pembantu penguat kuasa",
  "Pegawai kesihatan persekitaran",
  "Penolong pegawai tadbir",
  "Kerani operasi",
].map((title) => ({ value: title, label: title }));

const employmentStatusOptions = ["Tetap", "Sementara", "Sambilan", "Kontrak", "Perantisan", "Latihan Industri", "Bekerja sendiri"];
const workTimeOptions = ["Waktu Biasa", "Syif 3 Masa", "Syif 2 Masa", "Waktu Fleksibel", "Syif Malam", "HIBRID"];
const salaryRangeOptions = [
  "< 1,200",
  "1,200 - 1,499",
  "1,500 - 1,999",
  "2,000 - 2,499",
  "2,500 - 2,999",
  "3,000 - 3,499",
  "3,500 - 3,999",
  "4,000 - 4,999",
  "5,000 - 5,999",
  "6,000 - 7,999",
  "8,000 - 9,999",
  "10,000 - 12,999",
  "13,000 - 15,999",
  "> 16,000",
];
const distanceOptions = ["+ 0 km", "+ 1 km", "+ 5 km", "+ 10 km", "+ 20 km", "+ 30 km", "+ 50 km", "+ 80 km", "+ 200 km"];

const birthMonths = [
  "Januari",
  "Februari",
  "Mac",
  "April",
  "Mei",
  "Jun",
  "Julai",
  "Ogos",
  "September",
  "Oktober",
  "November",
  "Disember",
];

const stateLabelOverrides = {
  "Wp Kuala Lumpur": "Wilayah Persekutuan Kuala Lumpur",
  "Wp Labuan": "Wilayah Persekutuan Labuan",
  "Wp Putrajaya": "Wilayah Persekutuan Putrajaya",
};

const toSelectOptions = (items) => items.map((item) => ({ value: item, label: stateLabelOverrides[item] || item }));

const stateOptions = toSelectOptions(getStates());

function formatApplicantName(name) {
  return String(name || "").toUpperCase();
}

function getFileNameFromUrl(url) {
  if (!url) {
    return "";
  }

  try {
    const { pathname } = new URL(url);
    return decodeURIComponent(pathname.split("/").filter(Boolean).pop() || "Foto profil");
  } catch {
    return "Foto profil";
  }
}

function getPersistentProfilePhotoUrl(profile) {
  const profilePhotoUrl = profile?.profilePhotoUrl || "";

  return profilePhotoUrl && !profilePhotoUrl.startsWith("blob:") ? profilePhotoUrl : "";
}

function getPersistentDocumentUrl(url) {
  return url && !url.startsWith("blob:") ? url : "";
}

function getPersonalProfileStorageKey(user) {
  return `dbku-applicant-personal-profile:${user?.email || user?.full_name || "default"}`;
}

function getJobPreferencesStorageKey(user) {
  return `dbku-applicant-job-preferences:${user?.email || user?.full_name || "default"}`;
}

function getSavedPersonalProfile(user) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const savedProfile = window.localStorage.getItem(getPersonalProfileStorageKey(user));
    return savedProfile ? JSON.parse(savedProfile) : null;
  } catch {
    return null;
  }
}

function getSavedJobPreferences(user) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const savedPreferences = window.localStorage.getItem(getJobPreferencesStorageKey(user));
    return savedPreferences ? JSON.parse(savedPreferences) : null;
  } catch {
    return null;
  }
}

function getPersonalProfileDefaults(displayName, email) {
  return {
    details: defaultPersonalDetails,
    displayName,
    email,
    profilePhotoFile: null,
    profilePhotoFileName: "",
    profilePhotoPreviewUrl: "",
    profilePhotoUrl: "",
    resumeUploadFile: null,
    resumeFileUrl: "",
    videoResumeUploadFile: null,
    videoResumeFileUrl: "",
    references: [],
  };
}

function createLocalId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createEmptyPreferredJob() {
  return {
    careerLevel: "",
    city: "",
    distance: "+ 200 km",
    employmentStatuses: [],
    expectedSalary: "",
    hasRelatedExperience: false,
    id: createLocalId(),
    sectors: [],
    skills: [],
    state: "",
    title: "",
    workTimes: [],
  };
}

function normalizeReference(reference) {
  return {
    employerName: reference?.employerName || reference?.organisation || "",
    email: reference?.email || "",
    id: reference?.id || createLocalId(),
    name: reference?.name || "",
    phone: reference?.phone || "",
    position: reference?.position || reference?.relationship || "",
  };
}

function normalizePersonalProfile(profile, displayName, email) {
  const defaults = getPersonalProfileDefaults(displayName, email);
  const storedProfile = { ...(profile || {}) };
  const persistentProfilePhotoUrl = getPersistentProfilePhotoUrl(profile);
  delete storedProfile.profilePhoto;
  delete storedProfile.profilePhotoPreviewUrl;
  delete storedProfile.profilePhotoStorageKey;
  const resumeFileUrl = getPersistentDocumentUrl(profile?.resumeFileUrl);
  const videoResumeFileUrl = getPersistentDocumentUrl(profile?.videoResumeFileUrl);

  return {
    ...defaults,
    ...storedProfile,
    details: {
      ...defaults.details,
      ...(profile?.details || {}),
      resumeFile: resumeFileUrl ? profile?.details?.resumeFile || getFileNameFromUrl(resumeFileUrl) : "",
      videoResumeFile: videoResumeFileUrl ? profile?.details?.videoResumeFile || getFileNameFromUrl(videoResumeFileUrl) : "",
    },
    displayName: formatApplicantName(storedProfile.displayName || defaults.displayName),
    profilePhotoFile: null,
    profilePhotoFileName: persistentProfilePhotoUrl
      ? profile?.profilePhotoFileName || getFileNameFromUrl(persistentProfilePhotoUrl)
      : "",
    profilePhotoPreviewUrl: persistentProfilePhotoUrl,
    profilePhotoUrl: persistentProfilePhotoUrl,
    resumeUploadFile: null,
    resumeFileUrl,
    videoResumeUploadFile: null,
    videoResumeFileUrl,
    references: Array.isArray(profile?.references) ? profile.references.map(normalizeReference) : defaults.references,
  };
}

function normalizePreferredJob(job) {
  const employmentStatuses = Array.isArray(job?.employmentStatuses)
    ? job.employmentStatuses
    : job?.employmentType
      ? [job.employmentType]
      : [];

  return {
    ...createEmptyPreferredJob(),
    ...(job || {}),
    employmentStatuses,
    id: job?.id || createLocalId(),
    sectors: Array.isArray(job?.sectors) ? job.sectors : [],
    skills: Array.isArray(job?.skills) ? job.skills : [],
    workTimes: Array.isArray(job?.workTimes) ? job.workTimes : [],
  };
}

function normalizeJobPreferences(preferences) {
  return {
    ...defaultJobPreferences,
    ...(preferences || {}),
    preferredJobs: Array.isArray(preferences?.preferredJobs)
      ? preferences.preferredJobs.map(normalizePreferredJob)
      : defaultJobPreferences.preferredJobs,
  };
}

function getComparablePersonalProfile(profile) {
  const comparableProfile = {
    details: profile?.details || defaultPersonalDetails,
    displayName: profile?.displayName || "",
    email: profile?.email || "",
    profilePhotoFileName: profile?.profilePhotoFileName || "",
    profilePhotoUrl: profile?.profilePhotoUrl || "",
    resumeFileUrl: profile?.resumeFileUrl || "",
    videoResumeFileUrl: profile?.videoResumeFileUrl || "",
    references: profile?.references || [],
  };

  return JSON.stringify(comparableProfile);
}

function getComparableJobPreferences(preferences) {
  return JSON.stringify({
    careerObjective: preferences?.careerObjective || "",
    isLookingForJob: preferences?.isLookingForJob || "",
    preferredJobs: preferences?.preferredJobs || [],
  });
}

async function saveJobPreferences(user, preferences) {
  const normalizedPreferences = normalizeJobPreferences(preferences);

  if (typeof window === "undefined") {
    return normalizedPreferences;
  }

  try {
    window.localStorage.setItem(getJobPreferencesStorageKey(user), JSON.stringify(normalizedPreferences));
  } catch {
    // Keep the in-memory state even if browser storage is full or unavailable.
  }

  return normalizedPreferences;
}

async function savePersonalProfile(user, profile) {
  if (typeof window === "undefined") {
    return profile;
  }

  const formData = new FormData();

  formData.append("first_name", profile.displayName);
  formData.append("email", profile.email);
  formData.append("mykad_number", profile.details.identificationNumber);
  formData.append("mobile_number", profile.details.primaryPhone);
  formData.append("address", profile.details.address);

  if (profile.profilePhotoFile && profile.profilePhotoFileName) {
    formData.append("profile_photo", profile.profilePhotoFile);
  } else if (!profile.profilePhotoFileName) {
    formData.append("remove_profile_photo", "true");
  }

  if (profile.resumeUploadFile && profile.details.resumeFile) {
    formData.append("resume_file", profile.resumeUploadFile);
  } else if (!profile.details.resumeFile) {
    formData.append("remove_resume_file", "true");
  }

  if (profile.videoResumeUploadFile && profile.details.videoResumeFile) {
    formData.append("video_resume_file", profile.videoResumeUploadFile);
  } else if (!profile.details.videoResumeFile) {
    formData.append("remove_video_resume_file", "true");
  }

  const updatedUser = await updateCurrentUser(formData);
  const profilePhotoUrl = updatedUser.profile_photo_url || "";
  const resumeFileUrl = updatedUser.resume_file_url || "";
  const videoResumeFileUrl = updatedUser.video_resume_file_url || "";
  const serializableProfile = {
    ...profile,
    profilePhotoUrl,
    resumeFileUrl,
    videoResumeFileUrl,
  };

  delete serializableProfile.profilePhoto;
  delete serializableProfile.profilePhotoFile;
  delete serializableProfile.profilePhotoPreviewUrl;
  delete serializableProfile.resumeUploadFile;
  delete serializableProfile.videoResumeUploadFile;

  try {
    window.localStorage.setItem(getPersonalProfileStorageKey(user), JSON.stringify(serializableProfile));
  } catch {
    // Keep the in-memory state even if browser storage is full or unavailable.
  }

  return {
    ...serializableProfile,
    profilePhotoFile: null,
    profilePhotoPreviewUrl: profilePhotoUrl,
    resumeUploadFile: null,
    videoResumeUploadFile: null,
  };
}

function getBirthDateFromIdentificationNumber(identificationNumber) {
  const digits = identificationNumber.replace(/\D/g, "");

  if (digits.length < 6) {
    return { birthDay: "", birthMonth: "", birthYear: "" };
  }

  const yearPart = Number(digits.slice(0, 2));
  const monthIndex = Number(digits.slice(2, 4)) - 1;
  const day = Number(digits.slice(4, 6));
  const currentYear = new Date().getFullYear();
  const currentYearPart = currentYear % 100;
  const fullYear = yearPart <= currentYearPart ? 2000 + yearPart : 1900 + yearPart;
  const parsedDate = new Date(fullYear, monthIndex, day);
  const isValidDate =
    parsedDate.getFullYear() === fullYear &&
    parsedDate.getMonth() === monthIndex &&
    parsedDate.getDate() === day;

  if (!isValidDate) {
    return { birthDay: "", birthMonth: "", birthYear: "" };
  }

  return {
    birthDay: String(day).padStart(2, "0"),
    birthMonth: birthMonths[monthIndex],
    birthYear: String(fullYear),
  };
}

function ProfileFormRow({ label, children }) {
  return (
    <div className="personal-form-row">
      <div className="personal-form-section-label">{label}</div>
      <div className="personal-form-fields">{children}</div>
    </div>
  );
}

function InfoHelper({ body, title }) {
  return (
    <span className="personal-info-helper" tabIndex={0} aria-label={`${title}. ${body}`}>
      i
      <span className="personal-info-tooltip" role="tooltip">
        <strong>{title}</strong>
        <span>{body}</span>
      </span>
    </span>
  );
}

function PersonalField({ children, error, hint, info, label, optional = false }) {
  return (
    <label className={`personal-field ${error ? "has-error" : ""}`}>
      <span>
        {label}
        {optional ? <em> (tidak wajib)</em> : "*"}
        {info ? <InfoHelper title={label} body={info} /> : null}
      </span>
      {children}
      {error ? <small className="personal-field-error">{error}</small> : null}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function PersonalSelect({ onChange, options, placeholder, searchable = false, searchPlaceholder = "Carian", value }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label || placeholder;
  const visibleOptions = searchable
    ? options.filter((option) => option.label.toLowerCase().includes(searchTerm.trim().toLowerCase()))
    : options;

  const handleSelect = (selectedValue) => {
    onChange({ target: { value: selectedValue } });
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div
      className={`personal-select-wrap ${isOpen ? "open" : ""}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        type="button"
        className={`personal-select-button ${value ? "" : "placeholder"}`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{selectedLabel}</span>
        <Icon>{isOpen ? "expand_less" : "expand_more"}</Icon>
      </button>
      {isOpen ? (
        <div className="personal-select-menu" role="listbox">
          {searchable ? (
            <label className="personal-select-search">
              <Icon>search</Icon>
              <input
                type="text"
                value={searchTerm}
                placeholder={searchPlaceholder}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
          ) : null}
          <div className="personal-select-options">
            {visibleOptions.length > 0 ? (
              visibleOptions.map((option) => (
                <button
                  type="button"
                  className={option.value === value ? "selected" : ""}
                  key={option.value || option.label}
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => handleSelect(option.value)}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="personal-select-empty">Tiada pilihan dijumpai</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PersonalMultiSelect({ error, onChange, options, placeholder, selectedLabel, value }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const selectRef = useRef(null);
  const visibleOptions = options.filter((option) => option.label.toLowerCase().includes(searchTerm.trim().toLowerCase()));
  const selectedValues = Array.isArray(value) ? value : [];

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleOutsidePointerDown = (event) => {
      if (!selectRef.current?.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleOutsidePointerDown);
    return () => document.removeEventListener("mousedown", handleOutsidePointerDown);
  }, [isOpen]);

  const toggleOption = (selectedValue) => {
    const nextValues = selectedValues.includes(selectedValue)
      ? selectedValues.filter((item) => item !== selectedValue)
      : [...selectedValues, selectedValue];

    onChange(nextValues);
  };

  const removeOption = (selectedValue) => {
    onChange(selectedValues.filter((item) => item !== selectedValue));
  };

  return (
    <div className={`job-multi-select ${error ? "has-error" : ""}`}>
      <div
        ref={selectRef}
        className={`personal-select-wrap ${isOpen ? "open" : ""}`}
      >
        <button
          type="button"
          className={`personal-select-button ${selectedValues.length ? "" : "placeholder"}`}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
        >
          <span>{selectedValues.length ? `${selectedValues.length} sektor dipilih` : placeholder}</span>
          <Icon>{isOpen ? "expand_less" : "expand_more"}</Icon>
        </button>
        {isOpen ? (
          <div className="personal-select-menu job-multi-select-menu" role="listbox" aria-multiselectable="true">
            <label className="personal-select-search">
              <Icon>search</Icon>
              <input
                type="text"
                value={searchTerm}
                placeholder="Carian"
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <div className="job-multi-select-options">
              {visibleOptions.length > 0 ? (
                visibleOptions.map((option) => (
                  <label key={option.value}>
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(option.value)}
                      onChange={() => toggleOption(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))
              ) : (
                <div className="personal-select-empty">Tiada pilihan dijumpai</div>
              )}
            </div>
            <div className="job-multi-select-footer">
              <button
                type="button"
                className="personal-primary-button"
                onClick={() => {
                  setIsOpen(false);
                  setSearchTerm("");
                }}
              >
                Selesai
              </button>
            </div>
          </div>
        ) : null}
      </div>
      {error ? <small className="personal-field-error">{error}</small> : null}
      {selectedValues.length ? (
        <div className="job-selected-list">
          <strong>
            {selectedLabel} ({selectedValues.length})
          </strong>
          <div>
            {selectedValues.map((selectedValue) => (
              <button type="button" key={selectedValue} onClick={() => removeOption(selectedValue)}>
                <span>{selectedValue}</span>
                <Icon>cancel</Icon>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function JobTitleAutocomplete({ error, onChange, value }) {
  const [isOpen, setIsOpen] = useState(false);
  const query = value.trim().toLowerCase();
  const visibleSuggestions = recommendedJobTitles
    .filter((option) => !query || option.label.toLowerCase().includes(query))
    .slice(0, 8);

  const selectSuggestion = (selectedValue) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  return (
    <div
      className={`job-title-autocomplete ${error ? "has-error" : ""}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <div className="job-search-input">
        <Icon>search</Icon>
        <input
          type="text"
          value={value}
          placeholder="Contoh. Pembangun laman web"
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>
      {isOpen ? (
        <div className="job-title-suggestions">
          <strong>Cadangan pekerjaan</strong>
          {visibleSuggestions.length ? (
            <div>
              {visibleSuggestions.map((option) => (
                <button type="button" key={option.value} onMouseDown={(event) => event.preventDefault()} onClick={() => selectSuggestion(option.value)}>
                  <Icon>work</Icon>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <p>Tiada cadangan dijumpai. Anda boleh terus gunakan tajuk yang ditaip.</p>
          )}
        </div>
      ) : null}
      <small>Sila masukkan dan pilih pekerjaan yang paling hampir yang anda cari.</small>
    </div>
  );
}

function PersonalRadioGroup({ error, label, name, onChange, options, value }) {
  return (
    <fieldset className={`personal-radio-group ${error ? "has-error" : ""}`}>
      <legend>{label}*</legend>
      <div>
        {options.map((option) => (
          <label key={option}>
            <input type="radio" name={name} value={option} checked={value === option} onChange={onChange} />
            <span>{option}</span>
          </label>
        ))}
      </div>
      {error ? <small className="personal-field-error">{error}</small> : null}
    </fieldset>
  );
}

function ChoicePillGroup({ error, label, multiple = false, onChange, options, optional = false, value }) {
  const selectedValues = multiple ? (Array.isArray(value) ? value : []) : [value].filter(Boolean);

  const toggleOption = (option) => {
    if (multiple) {
      onChange(
        selectedValues.includes(option)
          ? selectedValues.filter((item) => item !== option)
          : [...selectedValues, option],
      );
      return;
    }

    onChange(option);
  };

  return (
    <fieldset className={`job-choice-group ${error ? "has-error" : ""}`}>
      <legend>
        {label}
        {optional ? <em> (tidak wajib)</em> : "*"}
      </legend>
      <div>
        {options.map((option) => (
          <button
            type="button"
            className={selectedValues.includes(option) ? "selected" : ""}
            key={option}
            onClick={() => toggleOption(option)}
          >
            {selectedValues.includes(option) ? <Icon>check</Icon> : null}
            {option}
          </button>
        ))}
      </div>
      {error ? <small className="personal-field-error">{error}</small> : null}
    </fieldset>
  );
}

function ProfileContentHeader({ displayName, email, photoUrl }) {
  const navigate = useNavigate();
  const profileInitial = displayName?.charAt(0) || email?.charAt(0) || "P";
  const profileChip = photoUrl ? <img src={photoUrl} alt="" /> : profileInitial;

  const handleLogout = () => {
    clearAuthSession();
    navigate("/login");
  };

  return (
    <header className="profile-content-header">
      <div>
        <p>Selamat datang</p>
        <strong>{displayName}</strong>
      </div>
      <div className="profile-actions">
        <button type="button" className="profile-icon-button" aria-label="Notifikasi">
          <Icon>notifications</Icon>
        </button>
        <details className="profile-account-menu">
          <summary className="profile-account-trigger" aria-label="Menu profil">
            <span className="profile-user-chip">{profileChip}</span>
            <Icon>expand_more</Icon>
          </summary>
          <div className="profile-account-dropdown">
            <div className="profile-account-card-head">
              <span className="profile-user-chip">{profileChip}</span>
              <span>
                <strong>{displayName}</strong>
                <em>{email || "Akaun pemohon"}</em>
              </span>
            </div>
            <button type="button" className="profile-logout-button" onClick={handleLogout}>
              <Icon>logout</Icon>
              Log Keluar
            </button>
          </div>
        </details>
      </div>
    </header>
  );
}

function ProfileSidebar({ isOpen, onToggle }) {
  return (
    <aside className={`profile-sidebar ${isOpen ? "open" : "collapsed"}`} aria-label="Navigasi pemohon">
      <div className="profile-sidebar-head">
        {isOpen ? (
          <Link className="profile-sidebar-brand" to="/">
            <span className="brand-mark">
              <img src="/logo-dbku.png" alt="Logo DBKU" />
            </span>
            <span>
              <strong>Portal Kerjaya DBKU</strong>
            </span>
          </Link>
        ) : null}
        <button
          type="button"
          className="profile-sidebar-toggle"
          aria-label={isOpen ? "Kecilkan sidebar" : "Buka sidebar"}
          onClick={onToggle}
          title={isOpen ? "Kecilkan sidebar" : "Buka sidebar"}
        >
          <Icon>menu</Icon>
        </button>
      </div>

      <nav className="profile-main-nav">
        {sidebarNavItems.map((item) => (
          item.to ? (
            <NavLink
              to={item.to}
              className={({ isActive }) => (isActive ? "active" : undefined)}
              key={item.label}
              title={!isOpen ? item.label : undefined}
            >
              <span className="profile-section-icon">
                <Icon>{item.icon}</Icon>
              </span>
              {isOpen ? <strong>{item.label}</strong> : <span className="sr-only">{item.label}</span>}
            </NavLink>
          ) : (
            <a href={item.href} key={item.label} title={!isOpen ? item.label : undefined}>
              <span className="profile-section-icon">
                <Icon>{item.icon}</Icon>
              </span>
              {isOpen ? <strong>{item.label}</strong> : <span className="sr-only">{item.label}</span>}
            </a>
          )
        ))}
      </nav>
    </aside>
  );
}

function ProfileCard({ children, id, isEditing = false, onEdit, title }) {
  return (
    <section className={`profile-content-card ${isEditing ? "is-editing" : ""}`} id={id}>
      <header>
        <h2>{title}</h2>
        <button type="button" className={isEditing ? "profile-close-edit-button" : "profile-edit-button"} onClick={onEdit}>
          {isEditing ? null : <Icon>edit</Icon>}
          {isEditing ? "Tutup" : "Kemaskini"}
        </button>
      </header>
      {children}
    </section>
  );
}

function ProfileDownloadLinks({ resumeUrl, videoUrl }) {
  const [openingFile, setOpeningFile] = useState("");
  const [openError, setOpenError] = useState("");

  if (!resumeUrl && !videoUrl) {
    return null;
  }

  async function openBlobInNewTab(url, fileType) {
    const newTab = window.open("about:blank", "_blank");

    if (!newTab) {
      setOpenError("Tab baru tidak dapat dibuka. Sila benarkan pop-up untuk portal ini.");
      return;
    }

    newTab.opener = null;
    setOpenError("");
    setOpeningFile(fileType);

    try {
      const blob = await fetchAuthenticatedBlob(url);
      const blobUrl = URL.createObjectURL(blob);
      newTab.location.href = blobUrl;
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (error) {
      newTab.close();
      setOpenError(error.message || "Fail tidak dapat dibuka. Sila cuba lagi.");
    } finally {
      setOpeningFile("");
    }
  }

  return (
    <div className="profile-download-links" aria-label="Fail profil">
      {resumeUrl ? (
        <button type="button" onClick={() => openBlobInNewTab(resumeUrl, "resume")} disabled={openingFile === "resume"}>
          <Icon>description</Icon>
          <span>{openingFile === "resume" ? "Membuka Resume..." : "Muat Turun Resume (PDF)"}</span>
        </button>
      ) : null}
      {videoUrl ? (
        <button type="button" onClick={() => openBlobInNewTab(videoUrl, "video")} disabled={openingFile === "video"}>
          <Icon>movie</Icon>
          <span>{openingFile === "video" ? "Membuka Video..." : "Muat Turun Video (MP4)"}</span>
        </button>
      ) : null}
      {openError ? <small>{openError}</small> : null}
    </div>
  );
}

function PersonalInformationForm({ onDraftChange, onSave, profileData, saveRequestKey }) {
  const photoInputRef = useRef(null);
  const resumeInputRef = useRef(null);
  const handledSaveRequestRef = useRef(saveRequestKey);
  const videoResumeInputRef = useRef(null);
  const [formValues, setFormValues] = useState(profileData.details);
  const [formDisplayName, setFormDisplayName] = useState(profileData.displayName);
  const [formEmail, setFormEmail] = useState(profileData.email);
  const [profilePhotoFile, setProfilePhotoFile] = useState(profileData.profilePhotoFile);
  const [profilePhotoFileName, setProfilePhotoFileName] = useState(profileData.profilePhotoFileName);
  const [profilePhotoPreviewUrl, setProfilePhotoPreviewUrl] = useState(profileData.profilePhotoPreviewUrl);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(profileData.profilePhotoUrl);
  const [photoError, setPhotoError] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [resumeFileUrl, setResumeFileUrl] = useState(profileData.resumeFileUrl);
  const [resumeUploadFile, setResumeUploadFile] = useState(profileData.resumeUploadFile);
  const [saveError, setSaveError] = useState("");
  const [videoResumeError, setVideoResumeError] = useState("");
  const [videoResumeFileUrl, setVideoResumeFileUrl] = useState(profileData.videoResumeFileUrl);
  const [videoResumeUploadFile, setVideoResumeUploadFile] = useState(profileData.videoResumeUploadFile);
  const [references, setReferences] = useState(profileData.references);
  const [validationErrors, setValidationErrors] = useState({});

  const updateDisplayName = (event) => {
    setFormDisplayName(formatApplicantName(event.target.value));
  };

  const updateField = (field) => (event) => {
    setFormValues((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const updateState = (event) => {
    setFormValues((current) => ({
      ...current,
      state: event.target.value,
      city: "",
      postcode: "",
    }));
  };

  const updateCity = (event) => {
    setFormValues((current) => ({
      ...current,
      city: event.target.value,
      postcode: "",
    }));
  };

  const handleIdentificationNumberChange = (event) => {
    const identificationNumber = event.target.value.replace(/\D/g, "").slice(0, 12);
    const birthDate = getBirthDateFromIdentificationNumber(identificationNumber);

    setFormValues((current) => ({
      ...current,
      identificationNumber,
      ...birthDate,
    }));
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setPhotoError("Sila pilih fail .jpg atau .png sahaja.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError("Saiz fail maksimum ialah 5MB.");
      event.target.value = "";
      return;
    }

    if (profilePhotoPreviewUrl) {
      URL.revokeObjectURL(profilePhotoPreviewUrl);
    }

    setProfilePhotoFileName(file.name);
    setProfilePhotoFile(file);
    setProfilePhotoUrl("");
    setProfilePhotoPreviewUrl(URL.createObjectURL(file));
    setPhotoError("");
  };

  const clearProfilePhoto = () => {
    if (profilePhotoPreviewUrl) {
      URL.revokeObjectURL(profilePhotoPreviewUrl);
    }

    setProfilePhotoFile(null);
    setProfilePhotoFileName("");
    setProfilePhotoPreviewUrl("");
    setProfilePhotoUrl("");
    setPhotoError("");
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  const handleDocumentUpload = ({ allowedTypes, errorMessage, field, setError }) => (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setError(errorMessage);
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Saiz fail maksimum ialah 5MB.");
      event.target.value = "";
      return;
    }

    setFormValues((current) => ({
      ...current,
      [field]: file.name,
    }));

    if (field === "resumeFile") {
      setResumeUploadFile(file);
      setResumeFileUrl("");
    }

    if (field === "videoResumeFile") {
      setVideoResumeUploadFile(file);
      setVideoResumeFileUrl("");
    }

    setError("");
    event.target.value = "";
  };

  const clearDocumentUpload = (field) => {
    setFormValues((current) => ({
      ...current,
      [field]: "",
    }));

    if (field === "resumeFile") {
      setResumeUploadFile(null);
      setResumeFileUrl("");
    }

    if (field === "videoResumeFile") {
      setVideoResumeUploadFile(null);
      setVideoResumeFileUrl("");
    }
  };

  const addReference = () => {
    setReferences((current) => [
      ...current,
      {
        employerName: "",
        email: "",
        id: createLocalId(),
        name: "",
        phone: "",
        position: "",
      },
    ]);
  };

  const updateReference = (id, field) => (event) => {
    setReferences((current) =>
      current.map((reference) =>
        reference.id === id
          ? {
              ...reference,
              [field]: event.target.value,
            }
          : reference,
      ),
    );
  };

  const removeReference = (id) => {
    setReferences((current) => current.filter((reference) => reference.id !== id));
  };

  const validatePersonalProfile = useCallback(() => {
    const errors = {};
    const requiredFields = [
      ["displayName", formDisplayName],
      ["identificationNumber", formValues.identificationNumber],
      ["birthDay", formValues.birthDay],
      ["birthMonth", formValues.birthMonth],
      ["birthYear", formValues.birthYear],
      ["citizenship", formValues.citizenship],
      ["gender", formValues.gender],
      ["hasHealthIssue", formValues.hasHealthIssue],
      ["hasDisability", formValues.hasDisability],
      ["state", formValues.state],
      ["city", formValues.city],
      ["postcode", formValues.postcode],
      ["address", formValues.address],
      ["email", formEmail],
      ["primaryPhone", formValues.primaryPhone],
    ];

    requiredFields.forEach(([field, value]) => {
      if (!String(value || "").trim()) {
        errors[field] = "Wajib diisi.";
      }
    });

    if (formValues.identificationNumber && formValues.identificationNumber.length !== 12) {
      errors.identificationNumber = "Masukkan 12 digit nombor kad pengenalan.";
    }

    references.forEach((reference) => {
      ["name", "employerName", "position", "phone", "email"].forEach((field) => {
        if (!String(reference[field] || "").trim()) {
          errors[`reference-${reference.id}-${field}`] = "Wajib diisi.";
        }
      });
    });

    return errors;
  }, [formDisplayName, formEmail, formValues, references]);

  const getCurrentDraft = useCallback(
    () => ({
      details: formValues,
      displayName: formDisplayName,
      email: formEmail,
      profilePhotoFile,
      profilePhotoFileName,
      profilePhotoPreviewUrl,
      profilePhotoUrl,
      resumeFileUrl,
      resumeUploadFile,
      references,
      videoResumeFileUrl,
      videoResumeUploadFile,
    }),
    [
      formEmail,
      formDisplayName,
      formValues,
      profilePhotoFile,
      profilePhotoFileName,
      profilePhotoPreviewUrl,
      profilePhotoUrl,
      resumeFileUrl,
      resumeUploadFile,
      references,
      videoResumeFileUrl,
      videoResumeUploadFile,
    ],
  );

  const handleSave = useCallback(async () => {
    const errors = validatePersonalProfile();
    setValidationErrors(errors);
    setSaveError("");

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      await onSave(getCurrentDraft());
    } catch (error) {
      setSaveError(error.message || "Maklumat peribadi tidak dapat disimpan. Sila cuba lagi.");
    }
  }, [getCurrentDraft, onSave, validatePersonalProfile]);

  useEffect(() => {
    const draft = getCurrentDraft();
    const isDirty = getComparablePersonalProfile(draft) !== getComparablePersonalProfile(profileData);

    onDraftChange(draft, isDirty);
  }, [getCurrentDraft, onDraftChange, profileData]);

  useEffect(() => {
    if (saveRequestKey > 0 && saveRequestKey !== handledSaveRequestRef.current) {
      handledSaveRequestRef.current = saveRequestKey;
      handleSave();
    }
  }, [handleSave, saveRequestKey]);

  const cityOptions = formValues.state ? toSelectOptions(getCities(formValues.state)) : [];
  const postcodeOptions =
    formValues.state && formValues.city ? toSelectOptions(getPostcodes(formValues.state, formValues.city)) : [];

  return (
    <div className="personal-edit-panel" aria-label="Kemaskini maklumat peribadi">
      <form className="personal-edit-form">
        <ProfileFormRow label="Foto Profil">
          <div className="personal-photo-upload">
            <div className="personal-photo-preview" aria-hidden="true">
              {profilePhotoPreviewUrl ? <img src={profilePhotoPreviewUrl} alt="" /> : formDisplayName.charAt(0)}
            </div>
            <div>
              <strong>
                Muat naik foto profil anda <em>(tidak wajib)</em>
              </strong>
              <p>Saiz yang disyorkan: 512x512 pixels</p>
              <p>Saiz fail maksimum: 5MB</p>
              <p>Disyorkan: .jpg dan .png sahaja</p>
              <div className="personal-button-row">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  className="sr-only"
                  onChange={handlePhotoUpload}
                />
                <button type="button" className="personal-primary-button" onClick={() => photoInputRef.current?.click()}>
                  Muat Naik
                </button>
                <button type="button" className="personal-outline-button" onClick={clearProfilePhoto}>
                  Padam
                </button>
              </div>
              {photoError ? <small className="personal-upload-error">{photoError}</small> : null}
              {profilePhotoFileName ? <small>{profilePhotoFileName}</small> : null}
            </div>
          </div>
        </ProfileFormRow>

        <ProfileFormRow label="Maklumat Peribadi">
          <PersonalField label="Nama Penuh" error={validationErrors.displayName}>
            <input type="text" value={formDisplayName} onChange={updateDisplayName} />
          </PersonalField>
          <PersonalField label="Nombor Kad Pengenalan" error={validationErrors.identificationNumber}>
            <input
              type="text"
              value={formValues.identificationNumber}
              placeholder="Masukkan tanpa '-'"
              inputMode="numeric"
              maxLength={12}
              onChange={handleIdentificationNumberChange}
            />
          </PersonalField>
          <div
            className={`personal-date-group ${
              validationErrors.birthDay || validationErrors.birthMonth || validationErrors.birthYear ? "has-error" : ""
            }`}
          >
            <span>
              Tarikh Lahir*
              <InfoHelper
                title="Tarikh Lahir"
                body="Tarikh lahir anda ditetapkan berdasarkan nombor kad pengenalan anda."
              />
            </span>
            <div>
              <label>
                Hari
                <input type="text" value={formValues.birthDay} readOnly />
              </label>
              <label>
                Bulan
                <input type="text" value={formValues.birthMonth} readOnly />
              </label>
              <label>
                Tahun
                <input type="text" value={formValues.birthYear} readOnly />
              </label>
            </div>
            {validationErrors.birthDay || validationErrors.birthMonth || validationErrors.birthYear ? (
              <small className="personal-field-error">Wajib diisi melalui nombor kad pengenalan yang sah.</small>
            ) : null}
          </div>
          <PersonalField label="Bangsa" optional>
            <PersonalSelect
              value={formValues.race}
              placeholder="Pilih bangsa"
              onChange={updateField("race")}
              options={[
                { value: "Bumiputera Sabah", label: "Bumiputera Sabah" },
                { value: "Bumiputera Sarawak", label: "Bumiputera Sarawak" },
                { value: "Cina", label: "Cina" },
                { value: "India", label: "India" },
                { value: "Lain-Lain", label: "Lain-Lain" },
                { value: "Melayu", label: "Melayu" },
              ]}
            />
          </PersonalField>
          <PersonalRadioGroup
            label="Kewarganegaraan"
            name="citizenship"
            error={validationErrors.citizenship}
            onChange={updateField("citizenship")}
            options={["Malaysia", "Penduduk tetap"]}
            value={formValues.citizenship}
          />
          <PersonalRadioGroup
            label="Jantina"
            name="gender"
            error={validationErrors.gender}
            onChange={updateField("gender")}
            options={["Perempuan", "Lelaki"]}
            value={formValues.gender}
          />
        </ProfileFormRow>

        <ProfileFormRow label="Aksesibiliti dan Kesihatan">
          <div className="personal-helper-copy">
            Maklumat kesihatan anda adalah sulit dan tidak akan dikongsikan dengan majikan. Pencari kerja bertanggungjawab
            untuk memaklumkan maklumat kesihatan anda kepada majikan.
          </div>
          <PersonalRadioGroup
            label="Adakah anda mempunyai sebarang masalah kesihatan?"
            name="health"
            error={validationErrors.hasHealthIssue}
            onChange={updateField("hasHealthIssue")}
            options={["Ya", "Tidak"]}
            value={formValues.hasHealthIssue}
          />
          <PersonalRadioGroup
            label="Adakah anda mempunyai sebarang ketidakupayaan?"
            name="disability"
            error={validationErrors.hasDisability}
            onChange={updateField("hasDisability")}
            options={["Ya", "Tidak"]}
            value={formValues.hasDisability}
          />
        </ProfileFormRow>

        <ProfileFormRow label="Alamat">
          <PersonalField label="Negeri" error={validationErrors.state}>
            <PersonalSelect
              value={formValues.state}
              placeholder="Pilih negeri"
              searchable
              onChange={updateState}
              options={stateOptions}
            />
          </PersonalField>
          <PersonalField label="Bandar" error={validationErrors.city}>
            <PersonalSelect
              value={formValues.city}
              placeholder={formValues.state ? "Pilih bandar" : "Pilih negeri dahulu"}
              searchable
              onChange={updateCity}
              options={cityOptions}
            />
          </PersonalField>
          <PersonalField label="Poskod" error={validationErrors.postcode}>
            <PersonalSelect
              value={formValues.postcode}
              placeholder={formValues.city ? "Pilih poskod" : "Pilih bandar dahulu"}
              searchable
              onChange={updateField("postcode")}
              options={postcodeOptions}
            />
          </PersonalField>
          <PersonalField label="Alamat" error={validationErrors.address}>
            <textarea value={formValues.address} rows={4} onChange={updateField("address")} />
          </PersonalField>
        </ProfileFormRow>

        <ProfileFormRow label="Butiran Hubungan">
          <PersonalField
            label="Alamat E-mel"
            error={validationErrors.email}
            info="Alamat e-mel ini digunakan untuk log masuk dan makluman permohonan anda."
          >
            <input type="email" value={formEmail} onChange={(event) => setFormEmail(event.target.value)} />
          </PersonalField>
          <PersonalField label="Nombor Telefon Bimbit Utama" error={validationErrors.primaryPhone}>
            <input type="tel" value={formValues.primaryPhone} onChange={updateField("primaryPhone")} />
          </PersonalField>
          <PersonalField label="Nombor Telefon Bimbit Lain" optional>
            <input
              type="tel"
              placeholder="Contoh. 0123456789"
              value={formValues.secondaryPhone}
              onChange={updateField("secondaryPhone")}
            />
          </PersonalField>
        </ProfileFormRow>

        <ProfileFormRow label="Resume">
          <div className="personal-profile-tip">
            <header>
              <span>
                <Icon>emoji_objects</Icon>
              </span>
              <strong>Tingkatkan ketampakan profil anda.</strong>
              <button type="button" aria-label="Tutup tip">
                <Icon>remove</Icon>
              </button>
            </header>
            <p>
              Ketengahkan bakat anda dan tingkatkan profil anda - muat naik resume dan video resume anda untuk menarik
              perhatian majikan.
            </p>
          </div>
          <PersonalField label="Muat naik resume anda" optional hint="Word atau PDF sahaja (maksimum 5MB)">
            <input
              ref={resumeInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={handleDocumentUpload({
                allowedTypes: [
                  "application/pdf",
                  "application/msword",
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ],
                errorMessage: "Sila pilih fail Word atau PDF sahaja.",
                field: "resumeFile",
                setError: setResumeError,
              })}
            />
            <button
              type="button"
              className="personal-primary-button personal-upload-button"
              onClick={() => resumeInputRef.current?.click()}
            >
              Muat Naik
            </button>
            {resumeError ? <small className="personal-upload-error">{resumeError}</small> : null}
          </PersonalField>
          {formValues.resumeFile ? (
            <div className="personal-file-card">
              <span>
                <Icon>description</Icon>
              </span>
              <strong>{formValues.resumeFile}</strong>
              <button type="button" className="personal-outline-button" onClick={() => clearDocumentUpload("resumeFile")}>
                Padam Fail
              </button>
            </div>
          ) : null}
          <PersonalField label="Muat naik resume video anda" optional hint=".mp4 sahaja (maksimum 5MB)">
            <input
              ref={videoResumeInputRef}
              type="file"
              accept=".mp4,video/mp4"
              className="sr-only"
              onChange={handleDocumentUpload({
                allowedTypes: ["video/mp4"],
                errorMessage: "Sila pilih fail .mp4 sahaja.",
                field: "videoResumeFile",
                setError: setVideoResumeError,
              })}
            />
            <button
              type="button"
              className="personal-primary-button personal-upload-button"
              onClick={() => videoResumeInputRef.current?.click()}
            >
              Muat Naik
            </button>
            {videoResumeError ? <small className="personal-upload-error">{videoResumeError}</small> : null}
          </PersonalField>
          {formValues.videoResumeFile ? (
            <div className="personal-file-card">
              <span>
                <Icon>movie</Icon>
              </span>
              <strong>{formValues.videoResumeFile}</strong>
              <button
                type="button"
                className="personal-outline-button"
                onClick={() => clearDocumentUpload("videoResumeFile")}
              >
                Padam Fail
              </button>
            </div>
          ) : null}
          <PersonalField label="LinkedIn" optional hint="Isikan pautan URL ke profil LinkedIn anda.">
            <input type="url" value={formValues.linkedIn} onChange={updateField("linkedIn")} />
          </PersonalField>
        </ProfileFormRow>

        <ProfileFormRow label="Rujukan">
          <div className="personal-reference-copy">
            <strong>
              Tambah rujukan anda <em>(tidak wajib)</em>
            </strong>
            <p>Kukuhkan permohonan kerja anda dengan sertakan sokongan daripada majikan atau mentor anda yang terdahulu.</p>
            <button type="button" className="personal-add-reference" onClick={addReference}>
              <Icon>add_circle</Icon>
              Tambah Rujukan
            </button>
          </div>
          {references.map((reference, index) => (
            <div className="personal-reference-card" key={reference.id}>
              <strong>Rujukan{references.length > 1 ? ` ${index + 1}` : ""}</strong>
              <div className="personal-reference-fields">
                <PersonalField label="Nama Rujukan" error={validationErrors[`reference-${reference.id}-name`]}>
                  <input
                    type="text"
                    value={reference.name}
                    placeholder="Contoh. Ali bin Abdullah"
                    onChange={updateReference(reference.id, "name")}
                  />
                </PersonalField>
                <PersonalField label="Nama Majikan Rujukan" error={validationErrors[`reference-${reference.id}-employerName`]}>
                  <input
                    type="text"
                    value={reference.employerName}
                    placeholder="Contoh. Syarikat ABC Sdn. Bhd."
                    onChange={updateReference(reference.id, "employerName")}
                  />
                </PersonalField>
                <PersonalField label="Jawatan Rujukan" error={validationErrors[`reference-${reference.id}-position`]}>
                  <input
                    type="text"
                    value={reference.position}
                    placeholder="Contoh. Ketua Jabatan Kejuruteraan"
                    onChange={updateReference(reference.id, "position")}
                  />
                </PersonalField>
                <PersonalField label="Nombor Hubungan Rujukan" error={validationErrors[`reference-${reference.id}-phone`]}>
                  <input
                    type="tel"
                    value={reference.phone}
                    placeholder="Contoh. 0123456789"
                    onChange={updateReference(reference.id, "phone")}
                  />
                </PersonalField>
                <PersonalField label="Alamat E-mel Rujukan" error={validationErrors[`reference-${reference.id}-email`]}>
                  <input
                    type="email"
                    value={reference.email}
                    placeholder="Contoh. example@example.com"
                    onChange={updateReference(reference.id, "email")}
                  />
                </PersonalField>
                <div className="personal-reference-actions">
                  <button type="button" className="personal-outline-button" onClick={() => removeReference(reference.id)}>
                    Padam
                  </button>
                </div>
              </div>
            </div>
          ))}
        </ProfileFormRow>

        <div className="personal-submit-row">
          {saveError ? <small className="personal-save-error">{saveError}</small> : null}
          <button type="button" className="personal-save-button" onClick={handleSave}>
            <Icon>save</Icon>
            Simpan dan Teruskan
          </button>
        </div>
      </form>
    </div>
  );
}

function JobPreferencesSummary({ preferences }) {
  const hasCareerObjective = Boolean(preferences.careerObjective.trim());
  const hasPreferredJobs = preferences.preferredJobs.length > 0;

  if (!hasCareerObjective && !hasPreferredJobs) {
    return (
      <div className="profile-empty-row">
        <span>
          <Icon>tune</Icon>
        </span>
        <p>Tetapkan matlamat kerjaya, keterlihatan profil dan pilihan pekerjaan yang anda minati.</p>
      </div>
    );
  }

  return (
    <div className="job-preference-summary">
      <div className="job-preference-status">
        <span>
          <Icon>{preferences.isLookingForJob === "Ya" ? "visibility" : "visibility_off"}</Icon>
        </span>
        <div>
          <strong>{preferences.isLookingForJob === "Ya" ? "Sedang mencari pekerjaan" : "Tidak mencari pekerjaan"}</strong>
          <p>
            {preferences.isLookingForJob === "Ya"
              ? "Profil anda boleh dipadankan dengan kekosongan yang sesuai."
              : "Profil anda tidak akan berada dalam senarai padanan kekosongan majikan."}
          </p>
        </div>
      </div>
      {hasCareerObjective ? <p className="job-preference-objective">{preferences.careerObjective}</p> : null}
      {hasPreferredJobs ? (
        <div className="job-preference-card-list">
          {preferences.preferredJobs.map((job) => (
            <article className="job-preference-card" key={job.id}>
              <strong>{job.title}</strong>
              <span>{job.careerLevel || "Tahap kerjaya belum dipilih"}</span>
              <span>
                {job.employmentStatuses?.length
                  ? job.employmentStatuses.join(", ")
                  : "Status pekerjaan belum dipilih"}
              </span>
              {job.expectedSalary ? <span>Gaji dijangka: RM {job.expectedSalary}</span> : null}
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function JobPreferencesForm({ onDraftChange, onSave, preferencesData, saveRequestKey }) {
  const handledSaveRequestRef = useRef(saveRequestKey);
  const [careerObjective, setCareerObjective] = useState(preferencesData.careerObjective);
  const [expandedPreferredJobId, setExpandedPreferredJobId] = useState(preferencesData.preferredJobs[0]?.id || null);
  const [isLookingForJob, setIsLookingForJob] = useState(preferencesData.isLookingForJob);
  const [preferredJobs, setPreferredJobs] = useState(preferencesData.preferredJobs);
  const [saveError, setSaveError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  const updatePreferredJob = (id, field) => (event) => {
    updatePreferredJobValue(id, field, event.target.value);
  };

  const updatePreferredJobValue = (id, field, value) => {
    setPreferredJobs((current) =>
      current.map((job) =>
        job.id === id
          ? {
              ...job,
              [field]: value,
              ...(field === "state" ? { city: "" } : {}),
            }
          : job,
      ),
    );
  };

  const addSkillToJob = (id, skill) => {
    const normalizedSkill = skill.trim();

    if (!normalizedSkill) {
      return;
    }

    setPreferredJobs((current) =>
      current.map((job) =>
        job.id === id && !job.skills.includes(normalizedSkill)
          ? {
              ...job,
              skills: [...job.skills, normalizedSkill],
            }
          : job,
      ),
    );
  };

  const removeSkillFromJob = (id, skill) => {
    setPreferredJobs((current) =>
      current.map((job) =>
        job.id === id
          ? {
              ...job,
              skills: job.skills.filter((item) => item !== skill),
            }
          : job,
      ),
    );
  };

  const addPreferredJob = () => {
    const newJob = createEmptyPreferredJob();

    setPreferredJobs((current) => [...current, newJob]);
    setExpandedPreferredJobId(newJob.id);
  };

  const removePreferredJob = (id) => {
    setPreferredJobs((current) => current.filter((job) => job.id !== id));
    setExpandedPreferredJobId((current) => (current === id ? null : current));
  };

  const validateJobPreferences = useCallback(() => {
    const errors = {};

    if (!isLookingForJob) {
      errors.isLookingForJob = "Wajib diisi.";
    }

    if (!careerObjective.trim()) {
      errors.careerObjective = "Wajib diisi.";
    }

    if (preferredJobs.length === 0) {
      errors.preferredJobs = "Tambah sekurang-kurangnya satu pilihan pekerjaan.";
    }

    preferredJobs.forEach((job) => {
      ["title", "careerLevel", "expectedSalary"].forEach((field) => {
        if (!String(job[field] || "").trim()) {
          errors[`preferred-job-${job.id}-${field}`] = "Wajib diisi.";
        }
      });

      [
        ["sectors", job.sectors],
        ["skills", job.skills],
        ["employmentStatuses", job.employmentStatuses],
        ["workTimes", job.workTimes],
      ].forEach(([field, values]) => {
        if (!Array.isArray(values) || values.length === 0) {
          errors[`preferred-job-${job.id}-${field}`] = "Wajib diisi.";
        }
      });
    });

    return errors;
  }, [careerObjective, isLookingForJob, preferredJobs]);

  const getCurrentDraft = useCallback(
    () => ({
      careerObjective,
      isLookingForJob,
      preferredJobs,
    }),
    [careerObjective, isLookingForJob, preferredJobs],
  );

  const handleSave = useCallback(async () => {
    const errors = validateJobPreferences();
    setValidationErrors(errors);
    setSaveError("");

    if (Object.keys(errors).length > 0) {
      const invalidJob = preferredJobs.find((job) =>
        Object.keys(errors).some((field) => field.startsWith(`preferred-job-${job.id}-`)),
      );

      if (invalidJob) {
        setExpandedPreferredJobId(invalidJob.id);
      }

      return;
    }

    try {
      await onSave(getCurrentDraft());
    } catch (error) {
      setSaveError(error.message || "Pilihan pekerjaan tidak dapat disimpan. Sila cuba lagi.");
    }
  }, [getCurrentDraft, onSave, preferredJobs, validateJobPreferences]);

  useEffect(() => {
    const draft = getCurrentDraft();
    const isDirty = getComparableJobPreferences(draft) !== getComparableJobPreferences(preferencesData);

    onDraftChange(draft, isDirty);
  }, [getCurrentDraft, onDraftChange, preferencesData]);

  useEffect(() => {
    if (saveRequestKey > 0 && saveRequestKey !== handledSaveRequestRef.current) {
      handledSaveRequestRef.current = saveRequestKey;
      handleSave();
    }
  }, [handleSave, saveRequestKey]);

  return (
    <div className="personal-edit-panel" aria-label="Kemaskini pilihan pekerjaan">
      <form className="personal-edit-form">
        <ProfileFormRow label="Keterlihatan Profil">
          <PersonalRadioGroup
            label="Adakah anda sedang mencari pekerjaan?"
            name="job-search-status"
            error={validationErrors.isLookingForJob}
            onChange={(event) => setIsLookingForJob(event.target.value)}
            options={["Ya", "Tidak"]}
            value={isLookingForJob}
          />
          <p className="job-preference-note">
            Jika anda memilih 'Tidak', profil anda tidak akan berada dalam senarai padanan kekosongan oleh majikan.
          </p>
        </ProfileFormRow>

        <ProfileFormRow label="Matlamat Kerjaya">
          <PersonalField label="Matlamat kerjaya" error={validationErrors.careerObjective}>
            <textarea
              value={careerObjective}
              rows={8}
              onChange={(event) => setCareerObjective(event.target.value)}
            />
          </PersonalField>
        </ProfileFormRow>

        <ProfileFormRow label="Pilihan Pekerjaan">
          <div className="personal-reference-copy">
            <strong>Tambahkan pilihan pekerjaan anda*</strong>
            <p>Tambah dalam profesion pilihan anda untuk mendapatkan hasil padanan kerja yang lebih baik.</p>
          </div>
          {validationErrors.preferredJobs ? (
            <small className="personal-field-error">{validationErrors.preferredJobs}</small>
          ) : null}
          {preferredJobs.map((job) => (
            expandedPreferredJobId !== job.id ? (
              <article className="job-preference-card" key={job.id}>
                <strong>{job.title || "Pilihan pekerjaan belum lengkap"}</strong>
                <span>{job.careerLevel || "Tahap kerjaya belum dipilih"}</span>
                <span>
                  {job.employmentStatuses.length ? job.employmentStatuses.join(", ") : "Status pekerjaan belum dipilih"}
                </span>
                <div className="job-preference-card-actions">
                  <button type="button" className="personal-primary-button" onClick={() => setExpandedPreferredJobId(job.id)}>
                    Kemaskini
                  </button>
                  <button type="button" className="personal-outline-button" onClick={() => removePreferredJob(job.id)}>
                    Padam
                  </button>
                </div>
              </article>
            ) : (
            <div className="job-preference-edit-card" key={job.id}>
              <PersonalField label="Pilihan Pekerjaan" error={validationErrors[`preferred-job-${job.id}-title`]}>
                <JobTitleAutocomplete
                  value={job.title}
                  error={validationErrors[`preferred-job-${job.id}-title`]}
                  onChange={(value) => updatePreferredJobValue(job.id, "title", value)}
                />
              </PersonalField>

              <label className="job-checkbox-row">
                <input
                  type="checkbox"
                  checked={job.hasRelatedExperience}
                  onChange={(event) => updatePreferredJobValue(job.id, "hasRelatedExperience", event.target.checked)}
                />
                <span>Saya mempunyai pengalaman berkaitan kerja ini</span>
              </label>

              <PersonalField label="Taraf Jawatan Pilihan" error={validationErrors[`preferred-job-${job.id}-careerLevel`]}>
                <PersonalSelect
                  value={job.careerLevel}
                  placeholder="Pilih tahap kerjaya"
                  onChange={updatePreferredJob(job.id, "careerLevel")}
                  options={careerLevelOptions}
                />
              </PersonalField>

              <div className="personal-field">
                <span>Sektor Pilihan*</span>
                <PersonalMultiSelect
                  value={job.sectors}
                  placeholder="Pilih satu atau lebih"
                  selectedLabel="Sektor Pilihan Ditambah"
                  error={validationErrors[`preferred-job-${job.id}-sectors`]}
                  options={sectorOptions}
                  onChange={(values) => updatePreferredJobValue(job.id, "sectors", values)}
                />
              </div>

              <PersonalField label="Kemahiran Berkaitan" error={validationErrors[`preferred-job-${job.id}-skills`]}>
                <div className="job-search-input">
                  <Icon>search</Icon>
                  <input
                    type="text"
                    placeholder="Contoh. Perform market research"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addSkillToJob(job.id, event.currentTarget.value);
                        event.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
                <small>Anda boleh membuat penambahan kemahiran yang anda miliki secara manual.</small>
              </PersonalField>

              {job.skills.length ? (
                <div className="job-selected-list">
                  <strong>Kemahiran Anda ({job.skills.length})</strong>
                  <div>
                    {job.skills.map((skill) => (
                      <button type="button" key={skill} onClick={() => removeSkillFromJob(job.id, skill)}>
                        <span>{skill}</span>
                        <Icon>cancel</Icon>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="job-suggested-skills">
                <strong>Berikut adalah kemahiran yang dicadangkan berdasarkan pilihan pekerjaan anda.</strong>
                <div>
                  {defaultSkillSuggestions
                    .filter((skill) => !job.skills.includes(skill))
                    .map((skill) => (
                      <button type="button" key={skill} onClick={() => addSkillToJob(job.id, skill)}>
                        <Icon>add</Icon>
                        {skill}
                      </button>
                    ))}
                </div>
              </div>

              <ChoicePillGroup
                label="Status Pilihan Pekerjaan"
                multiple
                error={validationErrors[`preferred-job-${job.id}-employmentStatuses`]}
                value={job.employmentStatuses}
                options={employmentStatusOptions}
                onChange={(values) => updatePreferredJobValue(job.id, "employmentStatuses", values)}
              />

              <ChoicePillGroup
                label="Pilihan Waktu Bekerja"
                multiple
                error={validationErrors[`preferred-job-${job.id}-workTimes`]}
                value={job.workTimes}
                options={workTimeOptions}
                onChange={(values) => updatePreferredJobValue(job.id, "workTimes", values)}
              />

              <ChoicePillGroup
                label="Gaji Yang Dijangkakan (MYR)"
                error={validationErrors[`preferred-job-${job.id}-expectedSalary`]}
                value={job.expectedSalary}
                options={salaryRangeOptions}
                onChange={(value) => updatePreferredJobValue(job.id, "expectedSalary", value)}
              />

              <PersonalField label="Negeri" optional>
                <PersonalSelect
                  value={job.state}
                  placeholder="Pilih negeri"
                  searchable
                  onChange={updatePreferredJob(job.id, "state")}
                  options={stateOptions}
                />
              </PersonalField>

              <PersonalField label="Bandar" optional>
                <PersonalSelect
                  value={job.city}
                  placeholder={job.state ? "Pilih bandar" : "Pilih negeri dahulu"}
                  searchable
                  onChange={updatePreferredJob(job.id, "city")}
                  options={job.state ? toSelectOptions(getCities(job.state)) : []}
                />
              </PersonalField>

              <PersonalField label="Jarak" optional>
                <PersonalSelect
                  value={job.distance}
                  placeholder="Pilih jarak"
                  onChange={updatePreferredJob(job.id, "distance")}
                  options={toSelectOptions(distanceOptions)}
                />
              </PersonalField>

              <div className="job-preference-edit-actions">
                <button type="button" className="personal-primary-button" onClick={() => setExpandedPreferredJobId(null)}>
                  Selesai
                </button>
                <button type="button" className="personal-outline-button" onClick={() => removePreferredJob(job.id)}>
                  Padam
                </button>
              </div>
            </div>
            )
          ))}
          <button type="button" className="personal-add-reference job-preference-add-button" onClick={addPreferredJob}>
            <Icon>add_circle</Icon>
            Tambah Pilihan Pekerjaan Lain
          </button>
        </ProfileFormRow>

        <div className="personal-submit-row">
          {saveError ? <small className="personal-save-error">{saveError}</small> : null}
          <button type="button" className="personal-save-button" onClick={handleSave}>
            <Icon>save</Icon>
            Simpan dan Teruskan
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ApplicantProfilePage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingSection, setEditingSection] = useState(null);
  const [isPersonalCloseDialogOpen, setIsPersonalCloseDialogOpen] = useState(false);
  const [isJobPreferencesCloseDialogOpen, setIsJobPreferencesCloseDialogOpen] = useState(false);
  const [isPersonalDraftDirty, setIsPersonalDraftDirty] = useState(false);
  const [isJobPreferencesDraftDirty, setIsJobPreferencesDraftDirty] = useState(false);
  const [personalDraft, setPersonalDraft] = useState(null);
  const [personalSaveRequestKey, setPersonalSaveRequestKey] = useState(0);
  const [jobPreferencesSaveRequestKey, setJobPreferencesSaveRequestKey] = useState(0);
  const displayName = user?.full_name || user?.first_name || "Pemohon DBKU";
  const email = user?.email || "Belum dikemaskini";
  const [personalProfile, setPersonalProfile] = useState(() => {
    const savedProfile = getSavedPersonalProfile(user);
    const profilePhotoUrl = savedProfile?.profilePhotoUrl || user?.profile_photo_url || "";
    const resumeFileUrl = savedProfile?.resumeFileUrl || user?.resume_file_url || "";
    const videoResumeFileUrl = savedProfile?.videoResumeFileUrl || user?.video_resume_file_url || "";

    return normalizePersonalProfile(
      {
        ...savedProfile,
        details: {
          ...(savedProfile?.details || {}),
          resumeFile: savedProfile?.details?.resumeFile || getFileNameFromUrl(resumeFileUrl),
          videoResumeFile: savedProfile?.details?.videoResumeFile || getFileNameFromUrl(videoResumeFileUrl),
        },
        profilePhotoFileName: savedProfile?.profilePhotoFileName || getFileNameFromUrl(profilePhotoUrl),
        profilePhotoUrl,
        resumeFileUrl,
        videoResumeFileUrl,
      },
      displayName,
      email,
    );
  });
  const [jobPreferences, setJobPreferences] = useState(() => normalizeJobPreferences(getSavedJobPreferences(user)));
  const profileDisplayName = personalProfile.displayName || displayName;
  const profileEmail = personalProfile.email || email;

  const handleSavePersonalProfile = async (profile) => {
    const savedProfile = await savePersonalProfile(user, profile);

    if (profile.profilePhotoPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(profile.profilePhotoPreviewUrl);
    }

    setPersonalProfile(savedProfile);
    setEditingSection(null);
    setIsPersonalDraftDirty(false);
    setIsPersonalCloseDialogOpen(false);
    setPersonalDraft(null);
  };

  const handlePersonalDraftChange = useCallback((draft, isDirty) => {
    setPersonalDraft(draft);
    setIsPersonalDraftDirty(isDirty);
  }, []);

  const handleSaveJobPreferences = async (preferences) => {
    const savedPreferences = await saveJobPreferences(user, preferences);

    setJobPreferences(savedPreferences);
    setEditingSection(null);
    setIsJobPreferencesDraftDirty(false);
    setIsJobPreferencesCloseDialogOpen(false);
  };

  const handleJobPreferencesDraftChange = useCallback((draft, isDirty) => {
    setIsJobPreferencesDraftDirty(isDirty);
  }, []);

  const handlePersonalEditToggle = () => {
    if (editingSection !== "personal") {
      if (editingSection === "jobPreferences" && isJobPreferencesDraftDirty) {
        setIsJobPreferencesCloseDialogOpen(true);
        return;
      }

      setEditingSection("personal");
      return;
    }

    if (isPersonalDraftDirty) {
      setIsPersonalCloseDialogOpen(true);
      return;
    }

    setEditingSection(null);
  };

  const handleJobPreferencesEditToggle = () => {
    if (editingSection !== "jobPreferences") {
      if (editingSection === "personal" && isPersonalDraftDirty) {
        setIsPersonalCloseDialogOpen(true);
        return;
      }

      setEditingSection("jobPreferences");
      return;
    }

    if (isJobPreferencesDraftDirty) {
      setIsJobPreferencesCloseDialogOpen(true);
      return;
    }

    setEditingSection(null);
  };

  const discardPersonalDraft = () => {
    if (personalDraft?.profilePhotoPreviewUrl && personalDraft.profilePhotoPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(personalDraft.profilePhotoPreviewUrl);
    }

    setIsPersonalCloseDialogOpen(false);
    setIsPersonalDraftDirty(false);
    setPersonalDraft(null);
    setEditingSection(null);
  };

  const savePersonalDraftFromDialog = () => {
    setIsPersonalCloseDialogOpen(false);
    setPersonalSaveRequestKey((current) => current + 1);
  };

  const discardJobPreferencesDraft = () => {
    setIsJobPreferencesCloseDialogOpen(false);
    setIsJobPreferencesDraftDirty(false);
    setEditingSection(null);
  };

  const saveJobPreferencesDraftFromDialog = () => {
    setIsJobPreferencesCloseDialogOpen(false);
    setJobPreferencesSaveRequestKey((current) => current + 1);
  };

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true, state: { message: "Sila log masuk untuk melihat profil anda." } });
    }
  }, [navigate, user]);

  if (!user) {
    return null;
  }

  return (
    <div className={`applicant-profile-page ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      <ProfileSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((current) => !current)} />
      <div className="profile-main-area">
        <ProfileContentHeader
          displayName={profileDisplayName}
          email={profileEmail}
          photoUrl={personalProfile.profilePhotoPreviewUrl}
        />
        <main className="profile-shell">
          <div className="profile-heading">
            <h1>Profil Saya</h1>
            <p>Lengkapkan profil sebelum menghantar permohonan kerja kosong atau latihan industri DBKU.</p>
          </div>

          <div className="profile-layout">
            <div className="profile-content">
              <ProfileCard
                id="profile-section-1"
                isEditing={editingSection === "personal"}
                title="Maklumat Peribadi"
                onEdit={handlePersonalEditToggle}
              >
                {editingSection === "personal" ? (
                  <PersonalInformationForm
                    onDraftChange={handlePersonalDraftChange}
                    profileData={personalProfile}
                    onSave={handleSavePersonalProfile}
                    saveRequestKey={personalSaveRequestKey}
                  />
                ) : (
                  <div className="profile-personal-row">
                    <div className="profile-avatar" aria-hidden="true">
                      {personalProfile.profilePhotoPreviewUrl ? (
                        <img src={personalProfile.profilePhotoPreviewUrl} alt="" />
                      ) : (
                        profileDisplayName.charAt(0)
                      )}
                    </div>
                    <div className="profile-personal-copy">
                      <h3>{profileDisplayName}</h3>
                      <p>{profileEmail}</p>
                    </div>
                    <ProfileDownloadLinks
                      resumeUrl={personalProfile.resumeFileUrl}
                      videoUrl={personalProfile.videoResumeFileUrl}
                    />
                  </div>
                )}
              </ProfileCard>

              <ProfileCard
                id="profile-section-2"
                isEditing={editingSection === "jobPreferences"}
                title="Pilihan Pekerjaan"
                onEdit={handleJobPreferencesEditToggle}
              >
                {editingSection === "jobPreferences" ? (
                  <JobPreferencesForm
                    onDraftChange={handleJobPreferencesDraftChange}
                    preferencesData={jobPreferences}
                    onSave={handleSaveJobPreferences}
                    saveRequestKey={jobPreferencesSaveRequestKey}
                  />
                ) : (
                  <JobPreferencesSummary preferences={jobPreferences} />
                )}
              </ProfileCard>

              {emptyProfileCards.map((card, index) => (
                <ProfileCard id={`profile-section-${index + 3}`} title={card.title} key={card.title}>
                  <div className="profile-empty-row">
                    <span>
                      <Icon>{card.icon}</Icon>
                    </span>
                    <p>{card.body}</p>
                  </div>
                </ProfileCard>
              ))}
            </div>
          </div>
        </main>
      </div>
      {isPersonalCloseDialogOpen ? (
        <div className="profile-confirm-overlay" role="presentation">
          <section className="profile-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-close-title">
            <h2 id="profile-close-title">Perubahan belum disimpan</h2>
            <p>Anda ada membuat kemaskini pada Maklumat Peribadi. Pilih Simpan untuk menyimpan perubahan atau Buang untuk membuang perubahan.</p>
            <div>
              <button type="button" className="profile-confirm-secondary" onClick={discardPersonalDraft}>
                Buang
              </button>
              <button type="button" className="profile-confirm-primary" onClick={savePersonalDraftFromDialog}>
                Simpan
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {isJobPreferencesCloseDialogOpen ? (
        <div className="profile-confirm-overlay" role="presentation">
          <section className="profile-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="job-preferences-close-title">
            <h2 id="job-preferences-close-title">Perubahan belum disimpan</h2>
            <p>
              Anda ada membuat kemaskini pada Pilihan Pekerjaan. Pilih Simpan untuk menyimpan perubahan atau Buang untuk
              membuang perubahan.
            </p>
            <div>
              <button type="button" className="profile-confirm-secondary" onClick={discardJobPreferencesDraft}>
                Buang
              </button>
              <button type="button" className="profile-confirm-primary" onClick={saveJobPreferencesDraftFromDialog}>
                Simpan
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
