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
    title: "Akademik",
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
  isLookingForJob: "",
  preferredJobs: [],
};

const defaultExperienceProfile = { employmentStatus: "", hasExperience: "", startMonth: "", startYear: "", records: [] };
const defaultAcademicProfile = { records: [] };
const monthOptions = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
const yearOptions = Array.from({ length: 50 }, (_, index) => String(new Date().getFullYear() - index));
const academicLevelOptions = [
  "Sekolah Rendah atau Ke Bawah", "PMR / PT3 atau Yang Setaraf", "SPM / O Level / SKM Tahap 1 / SKM Tahap 2 / SKM Tahap 3 atau Yang Setaraf", "STPM / A Level atau Yang Setaraf", "Diploma / Diploma Lanjutan / Diploma Graduan Atasan / DVM / DKM Tahap 4 / DLKM Tahap 5", "Sarjana Muda atau Yang Setaraf", "Sarjana atau Yang Setaraf", "Doktor Falsafah (PhD) atau Yang Setaraf",
].map((level) => ({ value: level, label: level }));
const spmAcademicLevel = "SPM / O Level / SKM Tahap 1 / SKM Tahap 2 / SKM Tahap 3 atau Yang Setaraf";
const spmSubjectOptions = ["Bahasa Malaysia", "Bahasa Inggeris", "Matematik"];
const higherAcademicLevels = new Set([
  "Diploma / Diploma Lanjutan / Diploma Graduan Atasan / DVM / DKM Tahap 4 / DLKM Tahap 5",
  "Sarjana Muda atau Yang Setaraf", "Sarjana atau Yang Setaraf", "Doktor Falsafah (PhD) atau Yang Setaraf",
]);
// Berdasarkan kategori bidang pengajian dan pengkhususan Kod Pendidikan Nasional 2020 (NEC-2020), MQA.
const academicFieldOptions = [
  "Pendidikan", "Sains Pendidikan", "Pendidikan Awal Kanak-kanak", "Latihan Perguruan", "Seni", "Reka Bentuk", "Muzik dan Seni Persembahan", "Sastera", "Bahasa", "Sejarah dan Arkeologi", "Falsafah dan Etika", "Teologi dan Agama", "Sains Sosial dan Tingkah Laku", "Ekonomi", "Sains Politik dan Sivik", "Psikologi", "Sosiologi dan Pengajian Budaya", "Kewartawanan dan Pelaporan", "Perpustakaan, Maklumat dan Arkib", "Perniagaan dan Pentadbiran", "Perakaunan dan Percukaian", "Kewangan, Perbankan dan Insurans", "Pengurusan dan Pentadbiran", "Pemasaran dan Pengiklanan", "Kesetiausahaan dan Kerja Pejabat", "Perdagangan Borong dan Runcit", "Undang-undang", "Biologi dan Biokimia", "Alam Sekitar", "Sains Fizikal", "Kimia", "Sains Bumi", "Fizik", "Matematik", "Statistik", "Teknologi Maklumat dan Komunikasi", "Sains Komputer", "Pembangunan Perisian dan Aplikasi", "Pangkalan Data dan Rangkaian", "Kejuruteraan dan Teknologi Kejuruteraan", "Kejuruteraan Kimia dan Proses", "Teknologi Perlindungan Alam Sekitar", "Elektrik dan Tenaga", "Elektronik dan Automasi", "Mekanik dan Perdagangan Logam", "Kenderaan Bermotor, Kapal dan Pesawat Udara", "Pembuatan dan Pemprosesan", "Pemprosesan Makanan", "Tekstil, Pakaian, Kasut dan Kulit", "Bahan", "Seni Bina dan Perancangan Bandar", "Bangunan dan Kejuruteraan Awam", "Pertanian", "Pengeluaran Tanaman dan Ternakan", "Hortikultur", "Perhutanan", "Perikanan", "Veterinar", "Perubatan", "Pergigian", "Kejururawatan dan Penjagaan", "Diagnostik dan Teknologi Rawatan Perubatan", "Terapi dan Pemulihan", "Farmasi", "Kesihatan dan Keselamatan Pekerjaan", "Kerja Sosial dan Kaunseling", "Penjagaan Warga Emas dan Orang Kurang Upaya", "Penjagaan Kanak-kanak dan Belia", "Perkhidmatan Peribadi", "Hospitaliti dan Katering", "Pelancongan, Rekreasi dan Riadah", "Sukan", "Perkhidmatan Kebersihan", "Keselamatan dan Kesihatan", "Keselamatan Awam dan Ketenteraan", "Pengangkutan", "Logistik", "Program Antara Disiplin", "Bidang Tidak Diketahui",
].map((field) => ({ value: field, label: field })).sort((first, second) => first.label.localeCompare(second.label, "ms"));

function formatExperienceMonthYear(month, year) {
  return month && year ? `${month} ${year}` : "";
}

function formatExperienceDuration(record) {
  const startMonthIndex = monthOptions.indexOf(record.startMonth);
  const startYear = Number(record.startYear);
  const endMonthIndex = record.isCurrent ? new Date().getMonth() : monthOptions.indexOf(record.endMonth);
  const endYear = record.isCurrent ? new Date().getFullYear() : Number(record.endYear);

  if (startMonthIndex < 0 || !startYear || endMonthIndex < 0 || !endYear) return "";

  const totalMonths = (endYear - startYear) * 12 + endMonthIndex - startMonthIndex + 1;
  if (totalMonths <= 0) return "";

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  return [years ? `${years} tahun` : "", months ? `${months} bulan` : ""].filter(Boolean).join(" ");
}

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

const fallbackJobTitles = [
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

const countryCodes = `AF AX AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UM UY UZ VU VE VN VG VI WF EH YE ZM ZW`.split(" ");

const countryDisplayNames = typeof Intl.DisplayNames === "function"
  ? new Intl.DisplayNames(["ms"], { type: "region" })
  : null;

const countryOptions = countryCodes
  .map((code) => ({ value: countryDisplayNames?.of(code) || code, label: countryDisplayNames?.of(code) || code }))
  .sort((first, second) => first.label.localeCompare(second.label, "ms"));

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

function getProfileDraftStorageKey(user, section) {
  return `dbku-applicant-${section}-draft:${user?.email || user?.full_name || "default"}`;
}

function getSavedDraft(user, section) {
  try {
    const saved = window.localStorage.getItem(getProfileDraftStorageKey(user, section));
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

function saveDraft(user, section, draft) {
  try { window.localStorage.setItem(getProfileDraftStorageKey(user, section), JSON.stringify(draft)); } catch { /* retain in memory */ }
}

function clearDraft(user, section) {
  try { window.localStorage.removeItem(getProfileDraftStorageKey(user, section)); } catch { /* storage unavailable */ }
}

function getExperienceStorageKey(user) {
  return `dbku-applicant-experience:${user?.email || user?.full_name || "default"}`;
}

function getSavedExperienceProfile(user) {
  try {
    const saved = window.localStorage.getItem(getExperienceStorageKey(user));
    return saved ? { ...defaultExperienceProfile, ...JSON.parse(saved), records: Array.isArray(JSON.parse(saved).records) ? JSON.parse(saved).records : [] } : defaultExperienceProfile;
  } catch { return defaultExperienceProfile; }
}

function saveExperienceProfile(user, experience) {
  const normalized = { ...defaultExperienceProfile, ...experience };
  try { window.localStorage.setItem(getExperienceStorageKey(user), JSON.stringify(normalized)); } catch { /* retain local state */ }
  return normalized;
}

function getAcademicStorageKey(user) {
  return `dbku-applicant-academic:${user?.email || user?.full_name || "default"}`;
}

function getSavedAcademicProfile(user) {
  try {
    const saved = window.localStorage.getItem(getAcademicStorageKey(user));
    const profile = saved ? JSON.parse(saved) : defaultAcademicProfile;
    return { ...defaultAcademicProfile, ...profile, records: Array.isArray(profile.records) ? profile.records : [] };
  } catch { return defaultAcademicProfile; }
}

function saveAcademicProfile(user, academic) {
  const normalized = { ...defaultAcademicProfile, ...academic, records: Array.isArray(academic.records) ? academic.records : [] };
  try { window.localStorage.setItem(getAcademicStorageKey(user), JSON.stringify(normalized)); } catch { /* retain local state */ }
  return normalized;
}

function getSkillsStorageKey(user) {
  return `dbku-applicant-skills:${user?.email || user?.full_name || "default"}`;
}

function getSavedSkills(user) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(getSkillsStorageKey(user)) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}

function saveSkills(user, skills) {
  const normalized = Array.isArray(skills) ? skills : [];
  try { window.localStorage.setItem(getSkillsStorageKey(user), JSON.stringify(normalized)); } catch { /* retain local state */ }
  return normalized;
}

function isEmptyAcademicRecord(record) {
  return !record?.level && !record?.fieldOfStudy && !record?.specialization && !record?.institution && !record?.result
    && !record?.startMonth && !record?.startYear && !record?.endMonth && !record?.endYear && !record?.isStudying
    && !Object.values(record?.spmGrades || {}).some(Boolean);
}

function getComparableAcademicProfile(profile) {
  return JSON.stringify((profile?.records || []).filter((record) => !isEmptyAcademicRecord(record)).map((record) => ({
    level: record.level || "", fieldOfStudy: record.fieldOfStudy || "", specialization: record.specialization || "", institution: record.institution || "", country: record.country || "", result: record.result || "", spmGrades: record.spmGrades || {}, startMonth: record.startMonth || "", startYear: record.startYear || "", endMonth: record.endMonth || "", endYear: record.endYear || "", isStudying: Boolean(record.isStudying),
  })));
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
    expectedSalary: [],
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
  const expectedSalary = Array.isArray(job?.expectedSalary)
    ? job.expectedSalary
    : job?.expectedSalary
      ? [job.expectedSalary]
      : [];

  return {
    ...createEmptyPreferredJob(),
    ...(job || {}),
    employmentStatuses,
    expectedSalary,
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

function PersonalField({ children, error, hint, info, label, noIndicator = false, optional = false }) {
  return (
    <label className={`personal-field ${error ? "has-error" : ""}`}>
      <span>
        {label}
        {noIndicator ? null : optional ? <em> (tidak wajib)</em> : "*"}
        {info ? <InfoHelper title={label} body={info} /> : null}
      </span>
      {children}
      {error ? <small className="personal-field-error">{error}</small> : null}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function PersonalSelect({ disabled = false, onChange, options, placeholder, searchable = false, searchPlaceholder = "Carian", value }) {
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
        disabled={disabled}
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

function SkillAutocomplete({ onToggle, selectedSkills }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleOutsidePointerDown = (event) => {
      if (!autocompleteRef.current?.contains(event.target)) setIsOpen(false);
    };

    document.addEventListener("mousedown", handleOutsidePointerDown);
    return () => document.removeEventListener("mousedown", handleOutsidePointerDown);
  }, [isOpen]);

  useEffect(() => {
    const searchTerm = query.trim();
    if (searchTerm.length < 2) {
      return undefined;
    }

    const controller = new AbortController();
    const searchTimer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `https://ec.europa.eu/esco/api/search?text=${encodeURIComponent(searchTerm)}&type=skill&language=en&selectedVersion=v1.2.0&limit=12`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("ESCO search failed");
        const data = await response.json();
        const uniqueSkills = [...new Set((data._embedded?.results || []).map((result) => result.title).filter(Boolean))];
        setSuggestions(uniqueSkills);
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") setSuggestions([]);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(searchTimer);
    };
  }, [query]);

  const addTypedSkill = () => {
    const skill = query.trim();
    if (!skill) return;
    onToggle(skill);
    setQuery("");
    setIsOpen(false);
  };

  const selectSkill = (skill) => {
    onToggle(skill);
  };

  return (
    <div
      className="job-title-autocomplete"
      ref={autocompleteRef}
    >
      <div className="job-search-input">
        <Icon>search</Icon>
        <input
          type="text"
          value={query}
          placeholder="Contoh. Perform market research"
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTypedSkill();
            }
          }}
        />
      </div>
      {isOpen && query.trim().length >= 2 ? (
        <div className="job-title-suggestions">
          <strong>Cadangan kemahiran global</strong>
          {suggestions.length ? (
            <div className="job-multi-select-options">
              {suggestions.map((skill) => (
                <label key={skill}>
                  <input
                    type="checkbox"
                    checked={selectedSkills.includes(skill)}
                    onChange={() => selectSkill(skill)}
                  />
                  <span>{skill}</span>
                </label>
              ))}
            </div>
          ) : (
            <p>Tiada cadangan dijumpai. Tekan Enter untuk tambah kemahiran secara manual.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function JobTitleAutocomplete({ error, onChange, value }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mascoSuggestions, setMascoSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const query = value.trim();
  const fallbackSuggestions = fallbackJobTitles
    .filter((option) => !query || option.label.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 8);

  useEffect(() => {
    if (query.length < 2) {
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://prod-emasco.mohr.gov.my/portal/api/content/lookup?lang=MY&search=${encodeURIComponent(query)}&limit=15`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("MASCO lookup failed");
        const results = await response.json();
        setMascoSuggestions(results.map((job) => ({
          value: job.name.replace(/^\s*[\d-]+\s+/, "").trim(),
          label: job.name.replace(/^\s*[\d-]+\s+/, "").trim(),
        })));
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") setMascoSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const visibleSuggestions = query.length >= 2 ? mascoSuggestions : fallbackSuggestions;

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
          <strong>Cadangan pekerjaan Malaysia (MASCO)</strong>
          {isLoading ? <p>Mencari pekerjaan dalam senarai MASCO...</p> : visibleSuggestions.length ? (
            <div>
              {visibleSuggestions.map((option) => (
                <button type="button" key={option.value} onMouseDown={(event) => event.preventDefault()} onClick={() => selectSuggestion(option.value)}>
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
            Maklumat kesihatan anda adalah sulit dan tidak akan dikongsikan dengan DBKU. Pencari kerja bertanggungjawab
            untuk memaklumkan maklumat kesihatan anda kepada DBKU.
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
              perhatian DBKU.
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
            <p>Kukuhkan permohonan kerja anda dengan sertakan sokongan daripada DBKU atau mentor anda yang terdahulu.</p>
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
                <PersonalField label="Nama DBKU Rujukan" error={validationErrors[`reference-${reference.id}-employerName`]}>
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
              : "Profil anda tidak akan berada dalam senarai padanan kekosongan DBKU."}
          </p>
        </div>
      </div>
      {hasCareerObjective ? (
        <section className="job-preference-objective">
          <strong>Matlamat Kerjaya</strong>
          <p>{preferences.careerObjective}</p>
        </section>
      ) : null}
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
              {job.expectedSalary.length ? <span>Gaji dijangka: RM {job.expectedSalary.join(", ")}</span> : null}
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
      ["title", "careerLevel"].forEach((field) => {
        if (!String(job[field] || "").trim()) {
          errors[`preferred-job-${job.id}-${field}`] = "Wajib diisi.";
        }
      });

      if (!Array.isArray(job.expectedSalary) || job.expectedSalary.length === 0) {
        errors[`preferred-job-${job.id}-expectedSalary`] = "Wajib diisi.";
      }

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
            Jika anda memilih 'Tidak', profil anda tidak akan berada dalam senarai padanan kekosongan oleh DBKU.
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
                <SkillAutocomplete
                  selectedSkills={job.skills}
                  onToggle={(skill) => (
                    job.skills.includes(skill) ? removeSkillFromJob(job.id, skill) : addSkillToJob(job.id, skill)
                  )}
                />
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
                multiple
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

function ExperienceForm({ data, onDraftChange, onSave }) {
  const [form, setForm] = useState(data);
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const addRecord = () => setForm((current) => ({ ...current, records: [...current.records, { id: createLocalId(), title: "", careerLevel: "", organisation: "", country: "Malaysia", sectors: [], startMonth: "", startYear: "", endMonth: "", endYear: "", isCurrent: false, description: "", skills: [], salary: "" }] }));
  const toggleRecordSkill = (recordId, skill) => setForm((current) => ({
    ...current,
    records: current.records.map((record) => {
      if (record.id !== recordId) return record;
      const skills = Array.isArray(record.skills) ? record.skills : [];
      return { ...record, skills: skills.includes(skill) ? skills.filter((item) => item !== skill) : [...skills, skill] };
    }),
  }));
  useEffect(() => { onDraftChange(form); }, [form, onDraftChange]);

  return (
    <div className="personal-edit-panel experience-form">
      <ProfileFormRow label="Status Bekerja">
        <PersonalField label="Status pekerjaan semasa">
          <PersonalSelect value={form.employmentStatus} placeholder="Pilih status pekerjaan" options={toSelectOptions(["Bekerja", "Bekerja Sendiri", "Tidak Bekerja"])} onChange={update("employmentStatus")} />
        </PersonalField>
      </ProfileFormRow>
      <ProfileFormRow label="Pengalaman Kerja">
        <PersonalRadioGroup label="Adakah anda mempunyai pengalaman bekerja?" name="experience-status" value={form.hasExperience} options={["Ya, saya mula bekerja sejak:", "Tidak"]} onChange={update("hasExperience")} />
        {form.hasExperience.startsWith("Ya") ? <div className="experience-details">
          <strong>Tarikh mula <em>(tidak wajib)</em></strong>
          <div className="personal-date-group"><PersonalField label="Bulan"><PersonalSelect value={form.startMonth} placeholder="Pilih" options={toSelectOptions(monthOptions)} onChange={update("startMonth")} /></PersonalField><PersonalField label="Tahun"><PersonalSelect value={form.startYear} placeholder="Pilih" options={toSelectOptions(yearOptions)} onChange={update("startYear")} /></PersonalField></div>
          <strong>Tambah pengalaman kerja anda*</strong><p>Tingkatkan peluang anda dengan memaparkan pengalaman kerja terdahulu.</p>
          {form.records.map((record, index) => <div className="experience-record" key={record.id}>
            <strong>Pengalaman {index + 1}</strong>
            <PersonalField label="Pekerjaan"><JobTitleAutocomplete value={record.title} onChange={(value) => setForm((current) => ({ ...current, records: current.records.map((item) => item.id === record.id ? { ...item, title: value } : item) }))} /></PersonalField>
            <PersonalField label="Taraf Jawatan"><PersonalSelect value={record.careerLevel} placeholder="Pilih taraf jawatan" options={careerLevelOptions} onChange={(event) => setForm((current) => ({ ...current, records: current.records.map((item) => item.id === record.id ? { ...item, careerLevel: event.target.value } : item) }))} /></PersonalField>
            <PersonalField label="Syarikat"><input value={record.organisation} placeholder="Contoh. DBKU" onChange={(event) => setForm((current) => ({ ...current, records: current.records.map((item) => item.id === record.id ? { ...item, organisation: event.target.value } : item) }))} /></PersonalField>
            <PersonalField label="Negara" optional><PersonalSelect value={record.country} placeholder="Pilih negara" options={countryOptions} searchable searchPlaceholder="Cari negara" onChange={(event) => setForm((current) => ({ ...current, records: current.records.map((item) => item.id === record.id ? { ...item, country: event.target.value } : item) }))} /></PersonalField>
            <div className="personal-field"><span>Sektor*</span><PersonalMultiSelect value={record.sectors} placeholder="Pilih satu atau lebih" selectedLabel="Sektor Ditambah" options={sectorOptions} onChange={(values) => setForm((current) => ({ ...current, records: current.records.map((item) => item.id === record.id ? { ...item, sectors: values } : item) }))} /></div>
            <div className="experience-date-grid"><PersonalField label="Tarikh Mula - Bulan"><PersonalSelect value={record.startMonth} placeholder="Pilih" options={toSelectOptions(monthOptions)} onChange={(event) => setForm((current) => ({ ...current, records: current.records.map((item) => item.id === record.id ? { ...item, startMonth: event.target.value } : item) }))} /></PersonalField><PersonalField label="Tarikh Mula - Tahun"><PersonalSelect value={record.startYear} placeholder="Pilih" options={toSelectOptions(yearOptions)} onChange={(event) => setForm((current) => ({ ...current, records: current.records.map((item) => item.id === record.id ? { ...item, startYear: event.target.value } : item) }))} /></PersonalField><PersonalField label="Tarikh Akhir - Bulan"><PersonalSelect disabled={record.isCurrent} value={record.endMonth} placeholder="Pilih" options={toSelectOptions(monthOptions)} onChange={(event) => setForm((current) => ({ ...current, records: current.records.map((item) => item.id === record.id ? { ...item, endMonth: event.target.value } : item) }))} /></PersonalField><PersonalField label="Tarikh Akhir - Tahun"><PersonalSelect disabled={record.isCurrent} value={record.endYear} placeholder="Pilih" options={toSelectOptions(yearOptions)} onChange={(event) => setForm((current) => ({ ...current, records: current.records.map((item) => item.id === record.id ? { ...item, endYear: event.target.value } : item) }))} /></PersonalField></div>
            <label className="job-checkbox-row"><input type="checkbox" checked={record.isCurrent} onChange={(event) => setForm((current) => ({ ...current, records: current.records.map((item) => item.id === record.id ? { ...item, isCurrent: event.target.checked } : item) }))} /><span>Saya masih bekerja di sini</span></label>
            <PersonalField label="Deskripsi Jawatan" optional><textarea value={record.description} placeholder="Masukkan deskripsi tugas" onChange={(event) => setForm((current) => ({ ...current, records: current.records.map((item) => item.id === record.id ? { ...item, description: event.target.value } : item) }))} /></PersonalField>
            <PersonalField label="Kemahiran Berkaitan"><SkillAutocomplete selectedSkills={record.skills || []} onToggle={(skill) => toggleRecordSkill(record.id, skill)} /><small>Anda boleh membuat penambahan kemahiran yang anda miliki secara manual.</small></PersonalField>
            {(record.skills || []).length ? <div className="job-selected-list"><strong>Kemahiran Anda ({record.skills.length})</strong><div>{record.skills.map((skill) => <button type="button" key={skill} onClick={() => toggleRecordSkill(record.id, skill)}><span>{skill}</span><Icon>cancel</Icon></button>)}</div></div> : null}
            <PersonalField label="Purata Gaji (MYR)"><PersonalSelect value={record.salary} placeholder="Pilih purata gaji" options={toSelectOptions(salaryRangeOptions)} onChange={(event) => setForm((current) => ({ ...current, records: current.records.map((item) => item.id === record.id ? { ...item, salary: event.target.value } : item) }))} /></PersonalField>
            <button type="button" className="personal-outline-button" onClick={() => setForm((current) => ({ ...current, records: current.records.filter((item) => item.id !== record.id) }))}>Padam</button>
          </div>)}
          <button type="button" className="personal-add-reference" onClick={addRecord}><Icon>add_circle</Icon> Tambah Pengalaman</button>
        </div> : null}
      </ProfileFormRow>
      <div className="personal-submit-row"><button type="button" className="personal-save-button" onClick={() => onSave(form)}><Icon>save</Icon>Simpan dan Teruskan</button></div>
    </div>
  );
}

function ExperienceSummary({ data }) {
  if (!data.records.length) {
    return <div className="profile-empty-row"><span><Icon>history</Icon></span><p>Tambah pengalaman kerja, latihan industri atau projek berkaitan.</p></div>;
  }

  return (
    <div className="job-preference-card-list experience-summary-list">
      {data.records.map((record, index) => {
        const startDate = formatExperienceMonthYear(record.startMonth, record.startYear);
        const endDate = record.isCurrent ? "Kini" : formatExperienceMonthYear(record.endMonth, record.endYear);
        const duration = formatExperienceDuration(record);
        const period = [startDate, endDate].filter(Boolean).join(" - ");

        return (
          <article className="job-preference-card experience-summary-card" key={record.id}>
            <span className="experience-summary-index">Pengalaman {index + 1}</span>
            <strong>{record.title || "Pekerjaan belum diisi"}</strong>
            {record.careerLevel ? <span>{record.careerLevel}</span> : null}
            {record.organisation ? <span>{record.organisation}</span> : null}
            {period ? <span>{period}{duration ? ` | ${duration}` : ""}</span> : null}
          </article>
        );
      })}
    </div>
  );
}

function createEmptyAcademicRecord() {
  return { id: createLocalId(), level: "", fieldOfStudy: "", specialization: "", institution: "", country: "Malaysia", result: "", spmGrades: {}, startMonth: "", startYear: "", endMonth: "", endYear: "", isStudying: false };
}

function AcademicForm({ data, onDraftChange, onSave }) {
  const [form, setForm] = useState(() => ({ ...defaultAcademicProfile, ...data, records: data.records.length ? data.records : [createEmptyAcademicRecord()] }));
  const updateRecord = (id, changes) => setForm((current) => ({ ...current, records: current.records.map((record) => record.id === id ? { ...record, ...changes } : record) }));
  const addRecord = () => setForm((current) => ({ ...current, records: [...current.records, createEmptyAcademicRecord()] }));
  const removeRecord = (id) => setForm((current) => ({ ...current, records: current.records.filter((record) => record.id !== id) }));
  useEffect(() => { onDraftChange(form); }, [form, onDraftChange]);

  return (
    <div className="academic-layout">
      <strong className="academic-layout-label">Akademik</strong>
      <div className="academic-form">
        <p className="academic-intro">Tambah latar belakang akademik anda<span>*</span></p>
        <div className="academic-record-list">
        {form.records.map((record, index) => (
          <section className="academic-record" key={record.id}>
            <strong>Akademik {index + 1}</strong>
            <PersonalField label="Tahap Akademik"><PersonalSelect value={record.level} placeholder="Pilih tahap akademik" options={academicLevelOptions} onChange={(event) => updateRecord(record.id, { level: event.target.value })} /></PersonalField>
            {record.level === spmAcademicLevel ? <div className="spm-grades"><strong>Sila isikan gred untuk mata pelajaran SPM di bawah <em>(tidak wajib)</em></strong><div>{spmSubjectOptions.map((subject) => <PersonalField key={subject} label={subject} noIndicator><input value={record.spmGrades?.[subject] || ""} placeholder="Contoh. A+, A1" onChange={(event) => updateRecord(record.id, { spmGrades: { ...(record.spmGrades || {}), [subject]: event.target.value } })} /></PersonalField>)}</div></div> : null}
            {higherAcademicLevels.has(record.level) ? <><PersonalField label="Bidang Akademik"><PersonalSelect value={record.fieldOfStudy || ""} placeholder="Pilih bidang akademik" options={academicFieldOptions} searchable searchPlaceholder="Cari bidang akademik" onChange={(event) => updateRecord(record.id, { fieldOfStudy: event.target.value })} /></PersonalField><PersonalField label="Pengkhususan" optional hint={`Maksimum ${10000 - (record.specialization || "").length} huruf`}><input maxLength="10000" value={record.specialization || ""} placeholder="Contoh. Software Engineering" onChange={(event) => updateRecord(record.id, { specialization: event.target.value })} /></PersonalField></> : null}
            <PersonalField label="Nama Institusi Akademik" hint={`Maksimum ${10000 - (record.institution || "").length} huruf`}><input maxLength="10000" value={record.institution || ""} placeholder="Contoh. Universiti Sains Malaysia" onChange={(event) => updateRecord(record.id, { institution: event.target.value })} /></PersonalField>
            <PersonalField label="Negara"><PersonalSelect value={record.country} placeholder="Pilih negara" options={countryOptions} searchable searchPlaceholder="Cari negara" onChange={(event) => updateRecord(record.id, { country: event.target.value })} /></PersonalField>
            <PersonalField label="Keputusan" optional hint={`Maksimum ${10000 - (record.result || "").length} huruf`}><input maxLength="10000" value={record.result || ""} placeholder="Contoh. 12A 3B+, CGPA 4.0, Cemerlang" onChange={(event) => updateRecord(record.id, { result: event.target.value })} /></PersonalField>
            <div className="academic-date-section"><strong>Tarikh Mula <em>(tidak wajib)</em></strong><div className="academic-date-grid"><PersonalField label="Bulan" noIndicator><PersonalSelect value={record.startMonth} placeholder="Pilih" options={toSelectOptions(monthOptions)} onChange={(event) => updateRecord(record.id, { startMonth: event.target.value })} /></PersonalField><PersonalField label="Tahun" noIndicator><PersonalSelect value={record.startYear} placeholder="Pilih" options={toSelectOptions(yearOptions)} onChange={(event) => updateRecord(record.id, { startYear: event.target.value })} /></PersonalField></div></div>
            <div className="academic-date-section"><strong>Tarikh Akhir <em>(tidak wajib)</em></strong><div className="academic-date-grid"><PersonalField label="Bulan" noIndicator><PersonalSelect disabled={record.isStudying} value={record.endMonth} placeholder="Pilih" options={toSelectOptions(monthOptions)} onChange={(event) => updateRecord(record.id, { endMonth: event.target.value })} /></PersonalField><PersonalField label="Tahun" noIndicator><PersonalSelect disabled={record.isStudying} value={record.endYear} placeholder="Pilih" options={toSelectOptions(yearOptions)} onChange={(event) => updateRecord(record.id, { endYear: event.target.value })} /></PersonalField></div></div>
            <label className="job-checkbox-row"><input type="checkbox" checked={record.isStudying} onChange={(event) => updateRecord(record.id, { isStudying: event.target.checked, endMonth: event.target.checked ? "" : record.endMonth, endYear: event.target.checked ? "" : record.endYear })} /><span>Saya sedang belajar di sini</span></label>
            {form.records.length > 1 ? <button type="button" className="personal-outline-button academic-delete-button" onClick={() => removeRecord(record.id)}>Padam</button> : null}
          </section>
        ))}
        </div>
        <button type="button" className="personal-add-reference" onClick={addRecord}><Icon>add_circle</Icon> Tambah Akademik Lain</button>
        <div className="personal-submit-row"><button type="button" className="personal-save-button" onClick={() => onSave(form)}><Icon>save</Icon>Simpan dan Teruskan</button></div>
      </div>
    </div>
  );
}

function AcademicSummary({ data }) {
  if (!data.records.length) return <div className="profile-empty-row"><span><Icon>school</Icon></span><p>Masukkan kelayakan akademik supaya permohonan lebih lengkap.</p></div>;
  return <div className="job-preference-card-list academic-summary-list">{data.records.map((record, index) => <article className="job-preference-card academic-summary-card" key={record.id}><span className="experience-summary-index">Akademik {index + 1}</span><strong>{record.institution || "Institusi belum diisi"}</strong>{record.level ? <span>{record.level}</span> : null}{record.fieldOfStudy ? <span>{record.fieldOfStudy}</span> : null}{record.specialization ? <span>{record.specialization}</span> : null}{record.result ? <span>{record.result}</span> : null}</article>)}</div>;
}

function SkillsForm({ data, onDraftChange, onSave }) {
  const [skills, setSkills] = useState(data);
  const toggleSkill = (skill) => setSkills((current) => current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill]);
  useEffect(() => { onDraftChange(skills); }, [onDraftChange, skills]);

  return <div className="personal-edit-panel skills-form"><PersonalField label="Kemahiran"><SkillAutocomplete selectedSkills={skills} onToggle={toggleSkill} /><small>Anda boleh mencari atau menambah kemahiran secara manual.</small></PersonalField>{skills.length ? <div className="job-selected-list"><strong>Kemahiran Anda ({skills.length})</strong><div>{skills.map((skill) => <button type="button" key={skill} onClick={() => toggleSkill(skill)}><span>{skill}</span><Icon>cancel</Icon></button>)}</div></div> : null}<div className="personal-submit-row"><button type="button" className="personal-save-button" onClick={() => onSave(skills)}><Icon>save</Icon>Simpan dan Teruskan</button></div></div>;
}

function SkillsSummary({ data }) {
  if (!data.length) return <div className="profile-empty-row"><span><Icon>psychology</Icon></span><p>Senaraikan kemahiran teknikal, bahasa dan sijil profesional anda.</p></div>;
  return <div className="job-selected-list skills-summary"><strong>Kemahiran Anda ({data.length})</strong><div>{data.map((skill) => <span key={skill}>{skill}</span>)}</div></div>;
}

export default function ApplicantProfilePage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingSection, setEditingSection] = useState(null);
  const [isPersonalCloseDialogOpen, setIsPersonalCloseDialogOpen] = useState(false);
  const [isJobPreferencesCloseDialogOpen, setIsJobPreferencesCloseDialogOpen] = useState(false);
  const [isAcademicCloseDialogOpen, setIsAcademicCloseDialogOpen] = useState(false);
  const [isExperienceCloseDialogOpen, setIsExperienceCloseDialogOpen] = useState(false);
  const [isSkillsCloseDialogOpen, setIsSkillsCloseDialogOpen] = useState(false);
  const [isPersonalDraftDirty, setIsPersonalDraftDirty] = useState(false);
  const [isJobPreferencesDraftDirty, setIsJobPreferencesDraftDirty] = useState(false);
  const [isAcademicDraftDirty, setIsAcademicDraftDirty] = useState(false);
  const [isExperienceDraftDirty, setIsExperienceDraftDirty] = useState(false);
  const [isSkillsDraftDirty, setIsSkillsDraftDirty] = useState(false);
  const [personalDraft, setPersonalDraft] = useState(null);
  const [academicDraft, setAcademicDraft] = useState(null);
  const [experienceDraft, setExperienceDraft] = useState(null);
  const [skillsDraft, setSkillsDraft] = useState(null);
  const [personalSaveRequestKey, setPersonalSaveRequestKey] = useState(0);
  const [jobPreferencesSaveRequestKey, setJobPreferencesSaveRequestKey] = useState(0);
  const displayName = user?.full_name || user?.first_name || "Pemohon DBKU";
  const email = user?.email || "Belum dikemaskini";
  const [personalProfile, setPersonalProfile] = useState(() => {
    const savedProfile = getSavedDraft(user, "personal") || getSavedPersonalProfile(user);
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
  const [jobPreferences, setJobPreferences] = useState(() => normalizeJobPreferences(getSavedDraft(user, "job-preferences") || getSavedJobPreferences(user)));
  const [experienceProfile, setExperienceProfile] = useState(() => getSavedExperienceProfile(user));
  const [academicProfile, setAcademicProfile] = useState(() => getSavedAcademicProfile(user));
  const [skillsProfile, setSkillsProfile] = useState(() => getSavedSkills(user));
  const profileDisplayName = personalProfile.displayName || displayName;
  const profileEmail = personalProfile.email || email;

  const handleSavePersonalProfile = async (profile) => {
    const savedProfile = await savePersonalProfile(user, profile);

    if (profile.profilePhotoPreviewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(profile.profilePhotoPreviewUrl);
    }

    setPersonalProfile(savedProfile);
    clearDraft(user, "personal");
    setEditingSection(null);
    setIsPersonalDraftDirty(false);
    setIsPersonalCloseDialogOpen(false);
    setPersonalDraft(null);
  };

  const handlePersonalDraftChange = useCallback((draft, isDirty) => {
    const persistentDraft = { ...draft, profilePhotoFile: null, resumeUploadFile: null, videoResumeUploadFile: null, profilePhotoPreviewUrl: draft.profilePhotoPreviewUrl?.startsWith("blob:") ? "" : draft.profilePhotoPreviewUrl };
    saveDraft(user, "personal", persistentDraft);
    setPersonalDraft(draft);
    setIsPersonalDraftDirty(isDirty);
  }, [user]);

  const handleSaveJobPreferences = async (preferences) => {
    const savedPreferences = await saveJobPreferences(user, preferences);

    setJobPreferences(savedPreferences);
    clearDraft(user, "job-preferences");
    setEditingSection(null);
    setIsJobPreferencesDraftDirty(false);
    setIsJobPreferencesCloseDialogOpen(false);
  };

  const handleJobPreferencesDraftChange = useCallback((draft, isDirty) => {
    saveDraft(user, "job-preferences", draft);
    setIsJobPreferencesDraftDirty(isDirty);
  }, [user]);

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

  const handleExperienceSave = (experience) => {
    setExperienceProfile(saveExperienceProfile(user, experience));
    clearDraft(user, "experience");
    setEditingSection(null);
    setExperienceDraft(null);
    setIsExperienceDraftDirty(false);
    setIsExperienceCloseDialogOpen(false);
  };

  const handleExperienceDraftChange = useCallback((draft) => {
    saveDraft(user, "experience", draft);
    setExperienceDraft(draft);
    setIsExperienceDraftDirty(JSON.stringify(draft) !== JSON.stringify(experienceProfile));
  }, [experienceProfile, user]);

  const discardExperienceDraft = () => {
    clearDraft(user, "experience");
    setExperienceDraft(null);
    setIsExperienceDraftDirty(false);
    setIsExperienceCloseDialogOpen(false);
    setEditingSection(null);
  };

  const handleExperienceEditToggle = () => {
    if (editingSection !== "experience") { setEditingSection("experience"); return; }
    if (isExperienceDraftDirty) { setIsExperienceCloseDialogOpen(true); return; }
    discardExperienceDraft();
  };

  const handleSkillsSave = (skills) => {
    setSkillsProfile(saveSkills(user, skills));
    clearDraft(user, "skills");
    setSkillsDraft(null);
    setIsSkillsDraftDirty(false);
    setIsSkillsCloseDialogOpen(false);
    setEditingSection(null);
  };

  const handleSkillsDraftChange = useCallback((draft) => {
    saveDraft(user, "skills", draft);
    setSkillsDraft(draft);
    setIsSkillsDraftDirty(JSON.stringify(draft) !== JSON.stringify(skillsProfile));
  }, [skillsProfile, user]);

  const discardSkillsDraft = () => {
    clearDraft(user, "skills");
    setSkillsDraft(null);
    setIsSkillsDraftDirty(false);
    setIsSkillsCloseDialogOpen(false);
    setEditingSection(null);
  };

  const handleSkillsEditToggle = () => {
    if (editingSection !== "skills") { setEditingSection("skills"); return; }
    if (isSkillsDraftDirty) { setIsSkillsCloseDialogOpen(true); return; }
    discardSkillsDraft();
  };

  const handleAcademicSave = (academic) => {
    setAcademicProfile(saveAcademicProfile(user, academic));
    clearDraft(user, "academic");
    setEditingSection(null);
    setAcademicDraft(null);
    setIsAcademicDraftDirty(false);
    setIsAcademicCloseDialogOpen(false);
  };

  const handleAcademicDraftChange = useCallback((draft) => {
    saveDraft(user, "academic", draft);
    setAcademicDraft(draft);
    setIsAcademicDraftDirty(getComparableAcademicProfile(draft) !== getComparableAcademicProfile(academicProfile));
  }, [academicProfile, user]);

  const handleAcademicEditToggle = () => {
    if (editingSection !== "academic") {
      setEditingSection("academic");
      return;
    }

    if (isAcademicDraftDirty) {
      setIsAcademicCloseDialogOpen(true);
      return;
    }

    discardAcademicDraft();
  };

  const discardAcademicDraft = () => {
    clearDraft(user, "academic");
    setAcademicDraft(null);
    setIsAcademicDraftDirty(false);
    setIsAcademicCloseDialogOpen(false);
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

              <ProfileCard id="profile-section-3" isEditing={editingSection === "experience"} title="Pengalaman" onEdit={handleExperienceEditToggle}>
                {editingSection === "experience" ? <ExperienceForm data={getSavedDraft(user, "experience") || experienceProfile} onDraftChange={handleExperienceDraftChange} onSave={handleExperienceSave} /> : <ExperienceSummary data={experienceProfile} />}
              </ProfileCard>

              <ProfileCard id="profile-section-4" isEditing={editingSection === "academic"} title="Akademik" onEdit={handleAcademicEditToggle}>
                {editingSection === "academic" ? <AcademicForm data={getSavedDraft(user, "academic") || academicProfile} onDraftChange={handleAcademicDraftChange} onSave={handleAcademicSave} /> : <AcademicSummary data={academicProfile} />}
              </ProfileCard>

              <ProfileCard id="profile-section-5" isEditing={editingSection === "skills"} title="Kemahiran" onEdit={handleSkillsEditToggle}>
                {editingSection === "skills" ? <SkillsForm data={getSavedDraft(user, "skills") || skillsProfile} onDraftChange={handleSkillsDraftChange} onSave={handleSkillsSave} /> : <SkillsSummary data={skillsProfile} />}
              </ProfileCard>

              {emptyProfileCards.filter((card) => !["Pengalaman", "Akademik", "Kemahiran"].includes(card.title)).map((card, index) => (
                <ProfileCard id={`profile-section-${index + 5}`} title={card.title} key={card.title}>
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
      {isAcademicCloseDialogOpen ? (
        <div className="profile-confirm-overlay" role="presentation">
          <section className="profile-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="academic-close-title">
            <h2 id="academic-close-title">Perubahan belum disimpan</h2>
            <p>Anda ada membuat kemaskini pada Akademik. Pilih Simpan untuk menyimpan perubahan atau Buang untuk membuang perubahan.</p>
            <div>
              <button type="button" className="profile-confirm-secondary" onClick={discardAcademicDraft}>Buang</button>
              <button type="button" className="profile-confirm-primary" onClick={() => handleAcademicSave(academicDraft || academicProfile)}>Simpan</button>
            </div>
          </section>
        </div>
      ) : null}
      {isExperienceCloseDialogOpen ? (
        <div className="profile-confirm-overlay" role="presentation"><section className="profile-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="experience-close-title"><h2 id="experience-close-title">Perubahan belum disimpan</h2><p>Anda ada membuat kemaskini pada Pengalaman. Pilih Simpan untuk menyimpan perubahan atau Buang untuk membuang perubahan.</p><div><button type="button" className="profile-confirm-secondary" onClick={discardExperienceDraft}>Buang</button><button type="button" className="profile-confirm-primary" onClick={() => handleExperienceSave(experienceDraft || experienceProfile)}>Simpan</button></div></section></div>
      ) : null}
      {isSkillsCloseDialogOpen ? (
        <div className="profile-confirm-overlay" role="presentation"><section className="profile-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="skills-close-title"><h2 id="skills-close-title">Perubahan belum disimpan</h2><p>Anda ada membuat kemaskini pada Kemahiran. Pilih Simpan untuk menyimpan perubahan atau Buang untuk membuang perubahan.</p><div><button type="button" className="profile-confirm-secondary" onClick={discardSkillsDraft}>Buang</button><button type="button" className="profile-confirm-primary" onClick={() => handleSkillsSave(skillsDraft || skillsProfile)}>Simpan</button></div></section></div>
      ) : null}
    </div>
  );
}
