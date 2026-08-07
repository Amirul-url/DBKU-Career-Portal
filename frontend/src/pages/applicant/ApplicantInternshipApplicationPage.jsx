import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredUser } from "../../lib/authApi";
import { Icon } from "./ApplicantAuthShared";
import { ProfileContentHeader, ProfileSidebar } from "./ApplicantProfilePage";

const infoMenuItems = [
  ["person", "Maklumat Peribadi"],
  ["shield", "Maklumat Kesihatan"],
  ["work", "Maklumat Kewangan"],
  ["group", "Maklumat Penjaga"],
  ["person", "Maklumat Waris"],
  ["shield_person", "Maklumat Penjamin"],
  ["description", "Maklumat SPM"],
  ["description", "Maklumat STPM"],
  ["description", "Maklumat Matrik"],
  ["description", "Maklumat STAM"],
  ["description", "Maklumat Penyeliaan"],
  ["description", "Maklumat Penyelidikan"],
];

const infoTabs = [
  "Maklumat Peribadi",
  "Alamat 1",
  "Alamat 2",
  "Maklumat Kursus",
  "Maklumat Bahasa",
  "Maklumat E-Portfolio",
];

const malaysiaStateOptions = [
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
];

const malaysiaDistrictGroups = {
  Johor: ["Batu Pahat", "Johor Bahru", "Kluang", "Kota Tinggi", "Kulai", "Mersing", "Muar", "Pontian", "Segamat", "Tangkak"],
  Kedah: ["Baling", "Bandar Baharu", "Kota Setar", "Kuala Muda", "Kubang Pasu", "Kulim", "Langkawi", "Padang Terap", "Pendang", "Pokok Sena", "Sik", "Yan"],
  Kelantan: ["Bachok", "Gua Musang", "Jeli", "Kota Bharu", "Kuala Krai", "Lojing", "Machang", "Pasir Mas", "Pasir Puteh", "Tanah Merah", "Tumpat"],
  Melaka: ["Alor Gajah", "Jasin", "Melaka Tengah"],
  "Negeri Sembilan": ["Jelebu", "Jempol", "Kuala Pilah", "Port Dickson", "Rembau", "Seremban", "Tampin"],
  Pahang: ["Bentong", "Bera", "Cameron Highlands", "Jerantut", "Kuantan", "Lipis", "Maran", "Pekan", "Raub", "Rompin", "Temerloh"],
  Perak: ["Bagan Datuk", "Batang Padang", "Hilir Perak", "Hulu Perak", "Kampar", "Kerian", "Kinta", "Kuala Kangsar", "Larut Matang dan Selama", "Manjung", "Muallim", "Perak Tengah"],
  Perlis: ["Perlis"],
  "Pulau Pinang": ["Barat Daya", "Seberang Perai Selatan", "Seberang Perai Tengah", "Seberang Perai Utara", "Timur Laut"],
  Sabah: ["Beaufort", "Beluran", "Kalabakan", "Keningau", "Kinabatangan", "Kota Belud", "Kota Kinabalu", "Kota Marudu", "Kuala Penyu", "Kudat", "Kunak", "Lahad Datu", "Nabawan", "Papar", "Penampang", "Pitas", "Putatan", "Ranau", "Sandakan", "Semporna", "Sipitang", "Tambunan", "Tawau", "Telupid", "Tenom", "Tongod", "Tuaran"],
  Sarawak: ["Bahagian Betong", "Bahagian Bintulu", "Bahagian Kapit", "Bahagian Kuching", "Bahagian Limbang", "Bahagian Miri", "Bahagian Mukah", "Bahagian Samarahan", "Bahagian Sarikei", "Bahagian Serian", "Bahagian Sibu", "Bahagian Sri Aman"],
  Selangor: ["Gombak", "Hulu Langat", "Hulu Selangor", "Klang", "Kuala Langat", "Kuala Selangor", "Petaling", "Sabak Bernam", "Sepang"],
  Terengganu: ["Besut", "Dungun", "Hulu Terengganu", "Kemaman", "Kuala Nerus", "Kuala Terengganu", "Marang", "Setiu"],
  "WP Kuala Lumpur": ["Kuala Lumpur"],
  "WP Labuan": ["Labuan"],
  "WP Putrajaya": ["Putrajaya"],
};

const selectOptions = {
  addressCountry: ["Malaysia"],
  districtGroups: malaysiaDistrictGroups,
  citizenship: ["Warganegara", "Bukan Warganegara"],
  citizenshipCountry: ["Malaysia", "Brunei", "Indonesia", "Lain-lain"],
  ethnicity: ["Melanau", "Melayu", "Iban", "Bidayuh", "Cina", "Lain-lain"],
  gender: ["Lelaki", "Perempuan"],
  nativeStatus: ["Bumiputera", "Bukan Bumiputera"],
  religion: ["Islam", "Kristian", "Buddha", "Hindu", "Lain-lain"],
  sponsorship: [
    "Sendiri",
    "PTPTN",
    "JPA",
    "MARA",
    "Yayasan Sarawak",
    "Yayasan Sabah",
    "Yayasan Selangor",
    "Yayasan Terengganu",
    "Yayasan Pahang",
    "Yayasan Perak",
    "Yayasan Johor",
    "Yayasan Negeri Sembilan",
    "Yayasan Kelantan Darulnaim",
    "Yayasan Melaka",
    "Biasiswa Kerajaan Negeri",
    "Biasiswa Korporat / GLC",
    "Zakat / Baitulmal",
    "Biasiswa Universiti / Institusi",
    "Pinjaman Pendidikan Bank",
    "Tajaan Majikan",
    "Lain-lain",
  ],
  state: malaysiaStateOptions,
  qualification: [
    "SPM",
    "STPM",
    "STAM",
    "Sijil",
    "Matrikulasi",
    "Asasi",
    "Diploma",
    "Diploma Lanjutan",
    "Ijazah Sarjana Muda",
    "Ijazah Sarjana",
    "PhD / Doktor Falsafah",
    "Kelayakan Profesional",
    "Lain-lain",
  ],
};

const maritalStatusOptions = ["Tidak Dinyatakan", "Bujang", "Duda", "Janda", "Berkahwin"];

const addressCountryAliases = { MALAYSIA: "Malaysia", BRUNEI: "Brunei", INDONESIA: "Indonesia", SINGAPORE: "Singapura", SINGAPURA: "Singapura", "LAIN-LAIN": "Lain-lain" };
const addressDistrictAliases = {
  "BAHAGIAN KUCHING": "Bahagian Kuching",
  "BAHAGIAN SAMARAHAN": "Bahagian Samarahan",
  "BAHAGIAN SERIAN": "Bahagian Serian",
  "BAHAGIAN SRI AMAN": "Bahagian Sri Aman",
  "BAHAGIAN BETONG": "Bahagian Betong",
  "BAHAGIAN SARIKEI": "Bahagian Sarikei",
  "BAHAGIAN SIBU": "Bahagian Sibu",
  "BAHAGIAN KAPIT": "Bahagian Kapit",
  "BAHAGIAN MUKAH": "Bahagian Mukah",
  "BAHAGIAN BINTULU": "Bahagian Bintulu",
  "BAHAGIAN MIRI": "Bahagian Miri",
  "BAHAGIAN LIMBANG": "Bahagian Limbang",
  "LAIN-LAIN": "Lain-lain",
};
const malaysiaStateAliases = { SARAWAK: "Sarawak", SABAH: "Sabah", JOHOR: "Johor", KEDAH: "Kedah", KELANTAN: "Kelantan", MELAKA: "Melaka", "NEGERI SEMBILAN": "Negeri Sembilan", PAHANG: "Pahang", PERAK: "Perak", PERLIS: "Perlis", "PULAU PINANG": "Pulau Pinang", SELANGOR: "Selangor", TERENGGANU: "Terengganu", "WP KUALA LUMPUR": "WP Kuala Lumpur", "WP LABUAN": "WP Labuan", "WP PUTRAJAYA": "WP Putrajaya" };

const valueAliases = {
  address1Country: addressCountryAliases,
  address1District: addressDistrictAliases,
  address1State: malaysiaStateAliases,
  address2Country: addressCountryAliases,
  address2District: addressDistrictAliases,
  address2State: malaysiaStateAliases,
  citizenship: { WARGANEGARA: "Warganegara", "BUKAN WARGANEGARA": "Bukan Warganegara" },
  citizenshipCountry: { MALAYSIA: "Malaysia", BRUNEI: "Brunei", INDONESIA: "Indonesia", "LAIN-LAIN": "Lain-lain" },
  ethnicity: { MELANAU: "Melanau", MELAYU: "Melayu", IBAN: "Iban", BIDAYUH: "Bidayuh", CINA: "Cina", "LAIN-LAIN": "Lain-lain" },
  gender: { MALE: "Lelaki", FEMALE: "Perempuan" },
  maritalStatus: { SINGLE: "Bujang", MARRIED: "Berkahwin" },
  nativeStatus: { BUMIPUTERA: "Bumiputera", "BUKAN BUMIPUTERA": "Bukan Bumiputera" },
  religion: { MUSLIM: "Islam", CHRISTIAN: "Kristian", BUDDHIST: "Buddha", HINDU: "Hindu", "LAIN-LAIN": "Lain-lain" },
  sponsorship: { BIASISWA: "Biasiswa Korporat / GLC", SENDIRI: "Sendiri" },
  stateOfBirth: malaysiaStateAliases,
  residenceState: malaysiaStateAliases,
  qualification: { MATRICULATION: "Matrikulasi", DIPLOMA: "Diploma", FOUNDATION: "Asasi", DEGREE: "Ijazah Sarjana Muda", MASTER: "Ijazah Sarjana", PHD: "PhD / Doktor Falsafah" },
};

const getDefaultStudentInfo = () => ({
  address1City: "",
  address1Country: "",
  address1District: "",
  address1Line1: "",
  address1Line2: "",
  address1Line3: "",
  address1Phone: "",
  address1Postcode: "",
  address1State: "",
  address2City: "",
  address2Country: "",
  address2District: "",
  address2Line1: "",
  address2Line2: "",
  address2Line3: "",
  address2Phone: "",
  address2Postcode: "",
  address2State: "",
  citizenship: "",
  citizenshipCountry: "",
  dateOfBirth: "",
  email: "",
  ethnicity: "",
  gender: "",
  icNo: "",
  maritalStatus: "",
  name: "",
  nativeStatus: "",
  phone: "",
  religion: "",
  residenceState: "",
  sponsorship: "",
  stateOfBirth: "",
  qualification: "",
});

function normalizeStudentInfoDraft(studentInfo = {}) {
  return Object.fromEntries(
    Object.entries(studentInfo).map(([field, value]) => [field, valueAliases[field]?.[value] || value]),
  );
}

const getDraftStorageKey = (user) => `dbku_internship_student_info_manual_${user?.id || user?.email || "guest"}`;

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeInfoTab, setActiveInfoTab] = useState("Maklumat Peribadi");
  const [notice, setNotice] = useState("");
  const [passportPhoto, setPassportPhoto] = useState(() => savedDraft?.passportPhoto || null);
  const passportPhotoInputRef = useRef(null);
  const [studentInfo, setStudentInfo] = useState(() => ({
    ...getDefaultStudentInfo(),
    ...normalizeStudentInfoDraft(savedDraft?.studentInfo || {}),
  }));
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
        passportPhoto,
        savedAt: new Date().toISOString(),
        studentInfo,
      });
    }
  }, [passportPhoto, studentInfo, user]);

  if (!user || user.role !== "applicant") {
    return null;
  }

  const updateStudentInfo = (field) => (event) => {
    setNotice("");
    setStudentInfo((current) => ({ ...current, [field]: event.target.value }));
  };

  const updatePassportPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setNotice("");
    const reader = new FileReader();
    reader.onload = () => {
      setPassportPhoto({ name: file.name, previewUrl: String(reader.result || "") });
    };
    reader.readAsDataURL(file);
  };

  const openPassportPhotoPicker = () => {
    passportPhotoInputRef.current?.click();
  };

  const deletePassportPhoto = () => {
    setNotice("");
    setPassportPhoto(null);

    if (passportPhotoInputRef.current) {
      passportPhotoInputRef.current.value = "";
    }
  };

  const handleUpdate = (event) => {
    event.preventDefault();
    setNotice(`${activeInfoTab} telah dikemas kini untuk draf permohonan latihan industri.`);
  };

  const openInfoTab = (tab) => {
    if (!["Maklumat Peribadi", "Alamat 1", "Alamat 2"].includes(tab)) {
      return;
    }

    setNotice("");
    setActiveInfoTab(tab);
  };

  const renderAddressFields = (prefix) => (
    <div className="student-info-fields student-address-fields">
      <label>Alamat 1<input value={studentInfo[`${prefix}Line1`]} onChange={updateStudentInfo(`${prefix}Line1`)} /></label>
      <label>Alamat 2<input value={studentInfo[`${prefix}Line2`]} onChange={updateStudentInfo(`${prefix}Line2`)} /></label>
      <label>Alamat 3<input value={studentInfo[`${prefix}Line3`]} onChange={updateStudentInfo(`${prefix}Line3`)} /></label>
      <label>Poskod<input value={studentInfo[`${prefix}Postcode`]} onChange={updateStudentInfo(`${prefix}Postcode`)} /></label>
      <label className="wide">Bandar<input value={studentInfo[`${prefix}City`]} onChange={updateStudentInfo(`${prefix}City`)} /></label>
      <label>Negeri<select value={studentInfo[`${prefix}State`]} onChange={updateStudentInfo(`${prefix}State`)}><option value="">Pilih negeri</option>{selectOptions.state.map((option) => <option key={option}>{option}</option>)}</select></label>
      <label>Daerah
        <select value={studentInfo[`${prefix}District`]} onChange={updateStudentInfo(`${prefix}District`)}>
          <option value="">Pilih daerah</option>
          {Object.entries(selectOptions.districtGroups).map(([state, districts]) => (
            <optgroup key={state} label={state}>
              {districts.map((option) => <option key={`${state}-${option}`} value={option}>{option}</option>)}
            </optgroup>
          ))}
        </select>
      </label>
      <label>Negara<select value={studentInfo[`${prefix}Country`]} onChange={updateStudentInfo(`${prefix}Country`)}><option value="">Pilih negara</option>{selectOptions.addressCountry.map((option) => <option key={option}>{option}</option>)}</select></label>
      <label>No. Telefon<input value={studentInfo[`${prefix}Phone`]} onChange={updateStudentInfo(`${prefix}Phone`)} /></label>
    </div>
  );

  const isAddressTab = activeInfoTab === "Alamat 1" || activeInfoTab === "Alamat 2";
  const formTitle = activeInfoTab === "Alamat 1" ? "Alamat Tetap" : activeInfoTab === "Alamat 2" ? "Alamat Surat Menyurat" : "Maklumat Peribadi";

  return (
    <div className={`applicant-profile-page ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      <ProfileSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((current) => !current)} />
      <div className="profile-main-area">
        <ProfileContentHeader displayName={displayName} email={email} photoUrl={user.profile_photo_url} />
        <main className="profile-shell internship-application-shell">
          <section className="student-info-panel" aria-label="Maklumat asas pelajar">
            <header className="student-info-titlebar">
              <h1>Maklumat Asas Pelajar</h1>
            </header>

            <div className="student-info-workspace">
              <aside className="student-info-sidebar" aria-label="Kategori maklumat pelajar">
                {infoMenuItems.map(([icon, label], index) => (
                  <button className={index === 0 ? "active" : ""} key={label} type="button">
                    <Icon>{icon}</Icon>
                    {label}
                  </button>
                ))}
              </aside>

              <div className="student-info-content">
                <nav className="student-info-tabs" aria-label="Bahagian maklumat pelajar">
                  {infoTabs.map((tab, index) => (
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
                  <h2>{formTitle}</h2>
                  {notice ? <p className="student-info-notice">{notice}</p> : null}

                  {isAddressTab ? (
                    renderAddressFields(activeInfoTab === "Alamat 1" ? "address1" : "address2")
                  ) : (
                    <div className="student-info-layout">
                      <div className="student-info-fields">
                        <label className="wide">Nama<input value={studentInfo.name} onChange={updateStudentInfo("name")} /></label>
                        <label>No. Kad Pengenalan<input value={studentInfo.icNo} onChange={updateStudentInfo("icNo")} /></label>
                        <label className="student-plain-select-label">Jantina
                          <select value={studentInfo.gender} onChange={updateStudentInfo("gender")}>
                            <option value="">Pilih jantina</option>
                            {selectOptions.gender.map((option) => <option key={option}>{option}</option>)}
                          </select>
                        </label>
                        <label className="student-plain-select-label">Etnik
                          <select value={studentInfo.ethnicity} onChange={updateStudentInfo("ethnicity")}>
                            <option value="">Pilih etnik</option>
                            {selectOptions.ethnicity.map((option) => <option key={option}>{option}</option>)}
                          </select>
                        </label>
                        <label className="student-plain-select-label">Status Bumiputera
                          <select value={studentInfo.nativeStatus} onChange={updateStudentInfo("nativeStatus")}>
                            <option value="">Pilih status</option>
                            {selectOptions.nativeStatus.map((option) => <option key={option}>{option}</option>)}
                          </select>
                        </label>
                        <label>Status Kewarganegaraan Malaysia<select value={studentInfo.citizenship} onChange={updateStudentInfo("citizenship")}>{selectOptions.citizenship.map((option) => <option key={option}>{option}</option>)}</select></label>
                        <label>Negara Kewarganegaraan<select value={studentInfo.citizenshipCountry} onChange={updateStudentInfo("citizenshipCountry")}>{selectOptions.citizenshipCountry.map((option) => <option key={option}>{option}</option>)}</select></label>
                        <label>Agama<select value={studentInfo.religion} onChange={updateStudentInfo("religion")}><option value="">Pilih agama</option>{selectOptions.religion.map((option) => <option key={option}>{option}</option>)}</select></label>
                        <label>Status Perkahwinan
                          <select value={studentInfo.maritalStatus} onChange={updateStudentInfo("maritalStatus")}>
                            <option value="">Pilih status perkahwinan</option>
                            {maritalStatusOptions.map((option) => <option key={option}>{option}</option>)}
                          </select>
                        </label>
                        <label>Negeri Kelahiran<select value={studentInfo.stateOfBirth} onChange={updateStudentInfo("stateOfBirth")}>{selectOptions.state.map((option) => <option key={option}>{option}</option>)}</select></label>
                        <label>Negeri Kediaman<select value={studentInfo.residenceState} onChange={updateStudentInfo("residenceState")}>{selectOptions.state.map((option) => <option key={option}>{option}</option>)}</select></label>
                        <label>Tarikh Lahir<input type="date" value={studentInfo.dateOfBirth} onChange={updateStudentInfo("dateOfBirth")} /></label>
                        <label>Tajaan<select value={studentInfo.sponsorship} onChange={updateStudentInfo("sponsorship")}><option value="">Pilih tajaan</option>{selectOptions.sponsorship.map((option) => <option key={option}>{option}</option>)}</select></label>
                        <label>Kelayakan Kemasukan<select value={studentInfo.qualification} onChange={updateStudentInfo("qualification")}><option value="">Pilih kelayakan</option>{selectOptions.qualification.map((option) => <option key={option}>{option}</option>)}</select></label>
                        <label>No. Telefon<input value={studentInfo.phone} onChange={updateStudentInfo("phone")} /></label>
                        <label className="wide">Alamat E-mel<input type="email" value={studentInfo.email} onChange={updateStudentInfo("email")} /></label>
                      </div>

                      <aside className="student-info-photo-card">
                        <div className="student-passport-upload">
                          {passportPhoto?.previewUrl ? (
                            <img src={passportPhoto.previewUrl} alt="Gambar pasport pelajar" />
                          ) : (
                            <span>
                              <Icon>upload_file</Icon>
                              <b>Muat naik gambar pasport</b>
                              <small>3.5 cm x 5.0 cm</small>
                            </span>
                          )}
                        </div>
                        <input className="student-passport-input" ref={passportPhotoInputRef} accept=".jpg" type="file" onChange={updatePassportPhoto} />
                        <div className="student-passport-actions">
                          <button type="button" onClick={openPassportPhotoPicker}>
                            <Icon>upload_file</Icon>
                            Muat Naik
                          </button>
                          <button disabled={!passportPhoto} type="button" onClick={deletePassportPhoto}>
                            <Icon>delete</Icon>
                            Padam
                          </button>
                        </div>
                        <p>
                          <strong>Nota</strong>
                          <span>Sila pastikan gambar yang dimuatnaik adalah dalam format .jpg</span>
                        </p>
                      </aside>
                    </div>
                  )}

                  <button className="student-info-update" type="submit">Kemas Kini</button>
                </form>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
