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

const selectOptions = {
  citizenship: ["Warganegara", "Bukan Warganegara"],
  citizenshipCountry: ["Malaysia", "Brunei", "Indonesia", "Lain-lain"],
  ethnicity: ["Melanau", "Melayu", "Iban", "Bidayuh", "Cina", "Lain-lain"],
  gender: ["Lelaki", "Perempuan"],
  nativeStatus: ["Bumiputera", "Bukan Bumiputera"],
  religion: ["Islam", "Kristian", "Buddha", "Hindu", "Lain-lain"],
  schoolType: ["Sekolah Menengah Kebangsaan", "Sekolah Menengah Teknik", "Lain-lain"],
  sponsorship: ["PTPTN", "Biasiswa", "Sendiri"],
  state: ["Sarawak", "Sabah", "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang", "Perak", "Perlis", "Pulau Pinang", "Selangor", "Terengganu", "WP Kuala Lumpur"],
  qualification: ["STPM", "Matrikulasi", "Diploma", "Asasi", "Ijazah"],
};

const maritalStatusOptions = ["Tidak Dinyatakan", "Bujang", "Duda", "Janda", "Berkahwin"];

const valueAliases = {
  citizenship: { WARGANEGARA: "Warganegara", "BUKAN WARGANEGARA": "Bukan Warganegara" },
  citizenshipCountry: { MALAYSIA: "Malaysia", BRUNEI: "Brunei", INDONESIA: "Indonesia", "LAIN-LAIN": "Lain-lain" },
  ethnicity: { MELANAU: "Melanau", MELAYU: "Melayu", IBAN: "Iban", BIDAYUH: "Bidayuh", CINA: "Cina", "LAIN-LAIN": "Lain-lain" },
  gender: { MALE: "Lelaki", FEMALE: "Perempuan" },
  maritalStatus: { SINGLE: "Bujang", MARRIED: "Berkahwin" },
  nativeStatus: { BUMIPUTERA: "Bumiputera", "BUKAN BUMIPUTERA": "Bukan Bumiputera" },
  religion: { MUSLIM: "Islam", CHRISTIAN: "Kristian", BUDDHIST: "Buddha", HINDU: "Hindu", "LAIN-LAIN": "Lain-lain" },
  schoolType: { "SEKOLAH MENENGAH KEBANGSAAN": "Sekolah Menengah Kebangsaan", "SEKOLAH MENENGAH TEKNIK": "Sekolah Menengah Teknik", "LAIN-LAIN": "Lain-lain" },
  sponsorship: { BIASISWA: "Biasiswa", SENDIRI: "Sendiri" },
  stateOfBirth: { SARAWAK: "Sarawak", SABAH: "Sabah", JOHOR: "Johor", KEDAH: "Kedah", KELANTAN: "Kelantan", MELAKA: "Melaka", "NEGERI SEMBILAN": "Negeri Sembilan", PAHANG: "Pahang", PERAK: "Perak", PERLIS: "Perlis", "PULAU PINANG": "Pulau Pinang", SELANGOR: "Selangor", TERENGGANU: "Terengganu", "WP KUALA LUMPUR": "WP Kuala Lumpur" },
  residenceState: { SARAWAK: "Sarawak", SABAH: "Sabah", JOHOR: "Johor", KEDAH: "Kedah", KELANTAN: "Kelantan", MELAKA: "Melaka", "NEGERI SEMBILAN": "Negeri Sembilan", PAHANG: "Pahang", PERAK: "Perak", PERLIS: "Perlis", "PULAU PINANG": "Pulau Pinang", SELANGOR: "Selangor", TERENGGANU: "Terengganu", "WP KUALA LUMPUR": "WP Kuala Lumpur" },
  qualification: { MATRICULATION: "Matrikulasi", DIPLOMA: "Diploma", FOUNDATION: "Asasi", DEGREE: "Ijazah" },
};

const getDefaultStudentInfo = () => ({
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
  schoolType: "",
  sponsorship: "",
  stateOfBirth: "",
  umsEmail: "",
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
  const [notice, setNotice] = useState("");
  const [maritalStatusOpen, setMaritalStatusOpen] = useState(false);
  const [maritalStatusSearch, setMaritalStatusSearch] = useState("");
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
    setNotice("Maklumat asas pelajar telah dikemas kini untuk draf permohonan latihan industri.");
  };

  const filteredMaritalStatusOptions = maritalStatusOptions.filter((option) => option.toLowerCase().includes(maritalStatusSearch.trim().toLowerCase()));

  const selectMaritalStatus = (option) => {
    setNotice("");
    setStudentInfo((current) => ({ ...current, maritalStatus: option }));
    setMaritalStatusOpen(false);
    setMaritalStatusSearch("");
  };

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
                    <button className={index === 0 ? "active" : ""} key={tab} type="button">{tab}</button>
                  ))}
                </nav>

                <form className="student-info-form" onSubmit={handleUpdate}>
                  <h2>Maklumat Peribadi</h2>
                  {notice ? <p className="student-info-notice">{notice}</p> : null}

                  <div className="student-info-layout">
                    <div className="student-info-fields">
                      <label className="wide">Nama<input value={studentInfo.name} onChange={updateStudentInfo("name")} /></label>
                      <label>No. Kad Pengenalan<input value={studentInfo.icNo} onChange={updateStudentInfo("icNo")} /></label>
                      <label>Jantina<select value={studentInfo.gender} onChange={updateStudentInfo("gender")}><option value="">Pilih jantina</option>{selectOptions.gender.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label>Etnik<select value={studentInfo.ethnicity} onChange={updateStudentInfo("ethnicity")}><option value="">Pilih etnik</option>{selectOptions.ethnicity.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label>Status Bumiputera<select value={studentInfo.nativeStatus} onChange={updateStudentInfo("nativeStatus")}><option value="">Pilih status</option>{selectOptions.nativeStatus.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label>Status Kewarganegaraan Malaysia<select value={studentInfo.citizenship} onChange={updateStudentInfo("citizenship")}>{selectOptions.citizenship.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label>Negara Kewarganegaraan<select value={studentInfo.citizenshipCountry} onChange={updateStudentInfo("citizenshipCountry")}>{selectOptions.citizenshipCountry.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label>Agama<select value={studentInfo.religion} onChange={updateStudentInfo("religion")}><option value="">Pilih agama</option>{selectOptions.religion.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label className="student-search-select-label">Status Perkahwinan
                        <div
                          className={`student-search-select ${maritalStatusOpen ? "open" : ""}`}
                          onBlur={(event) => {
                            if (!event.currentTarget.contains(event.relatedTarget)) {
                              setMaritalStatusOpen(false);
                            }
                          }}
                        >
                          <button
                            className="student-search-select-trigger"
                            type="button"
                            onClick={() => {
                              setMaritalStatusOpen((current) => !current);
                              setMaritalStatusSearch("");
                            }}
                          >
                            <span>{studentInfo.maritalStatus || "Pilih status perkahwinan"}</span>
                            <Icon>expand_more</Icon>
                          </button>
                          {maritalStatusOpen ? (
                            <div className="student-search-select-menu">
                              <div className="student-search-select-search">
                                <input
                                  autoFocus
                                  placeholder="Cari status"
                                  type="search"
                                  value={maritalStatusSearch}
                                  onChange={(event) => setMaritalStatusSearch(event.target.value)}
                                />
                                <Icon>search</Icon>
                              </div>
                              <div className="student-search-select-options">
                                {filteredMaritalStatusOptions.length ? (
                                  filteredMaritalStatusOptions.map((option) => (
                                    <button
                                      className={studentInfo.maritalStatus === option ? "selected" : ""}
                                      key={option}
                                      type="button"
                                      onMouseDown={(event) => event.preventDefault()}
                                      onClick={() => selectMaritalStatus(option)}
                                    >
                                      {option}
                                    </button>
                                  ))
                                ) : (
                                  <p>Tiada pilihan ditemui</p>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </label>
                      <label>Negeri Kelahiran<select value={studentInfo.stateOfBirth} onChange={updateStudentInfo("stateOfBirth")}>{selectOptions.state.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label>Negeri Kediaman<select value={studentInfo.residenceState} onChange={updateStudentInfo("residenceState")}>{selectOptions.state.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label>Tarikh Lahir<input type="date" value={studentInfo.dateOfBirth} onChange={updateStudentInfo("dateOfBirth")} /></label>
                      <label>Jenis Sekolah Menengah<select value={studentInfo.schoolType} onChange={updateStudentInfo("schoolType")}><option value="">Pilih jenis sekolah</option>{selectOptions.schoolType.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label>Tajaan<select value={studentInfo.sponsorship} onChange={updateStudentInfo("sponsorship")}><option value="">Pilih tajaan</option>{selectOptions.sponsorship.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label>Kelayakan Kemasukan<select value={studentInfo.qualification} onChange={updateStudentInfo("qualification")}><option value="">Pilih kelayakan</option>{selectOptions.qualification.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label>No. Telefon<input value={studentInfo.phone} onChange={updateStudentInfo("phone")} /></label>
                      <label className="wide">Alamat E-mel UMS<input type="email" value={studentInfo.umsEmail} onChange={updateStudentInfo("umsEmail")} /></label>
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
