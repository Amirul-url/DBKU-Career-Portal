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

function SearchableSelect({ label, onChange, options, placeholder, value }) {
  const [isOpen, setIsOpen] = useState(false);
  const typedValue = String(value || "").trim();
  const normalizedSearch = typedValue.toLowerCase();
  const filteredOptions = options.filter((option) => option.toLowerCase().includes(normalizedSearch));

  const commitValue = (nextValue) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  return (
    <label className="student-search-select-label">{label}
      <div
        className={`student-search-select ${isOpen ? "open" : ""}`}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setIsOpen(false);
          }
        }}
      >
        <div className="student-search-select-control">
          <input
            placeholder={placeholder}
            type="text"
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setIsOpen(false);
              }
            }}
          />
          <button
            aria-label={`Buka cadangan ${label}`}
            type="button"
            onClick={() => setIsOpen((current) => !current)}
          >
            <Icon>expand_more</Icon>
          </button>
        </div>
        {isOpen ? (
          <div className="student-search-select-menu">
            <p className="student-search-select-hint">Taip nilai lain jika tiada dalam senarai.</p>
            <div className="student-search-select-options">
              {filteredOptions.map((option) => (
                <button
                  className={value === option ? "selected" : ""}
                  key={option}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => commitValue(option)}
                >
                  {option}
                </button>
              ))}
              {!filteredOptions.length && !typedValue ? <p>Tiada pilihan ditemui</p> : null}
              {!filteredOptions.length && typedValue ? <p>Nilai "{typedValue}" akan disimpan.</p> : null}
            </div>
          </div>
        ) : null}
      </div>
    </label>
  );
}

export default function ApplicantInternshipApplicationPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const savedDraft = loadStudentInfoDraft(user);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  const updateStudentInfoValue = (field) => (value) => {
    setNotice("");
    setStudentInfo((current) => ({ ...current, [field]: value }));
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
                      <SearchableSelect label="Jantina" onChange={updateStudentInfoValue("gender")} options={selectOptions.gender} placeholder="Pilih jantina" value={studentInfo.gender} />
                      <SearchableSelect label="Etnik" onChange={updateStudentInfoValue("ethnicity")} options={selectOptions.ethnicity} placeholder="Pilih etnik" value={studentInfo.ethnicity} />
                      <SearchableSelect label="Status Bumiputera" onChange={updateStudentInfoValue("nativeStatus")} options={selectOptions.nativeStatus} placeholder="Pilih status" value={studentInfo.nativeStatus} />
                      <SearchableSelect label="Status Kewarganegaraan Malaysia" onChange={updateStudentInfoValue("citizenship")} options={selectOptions.citizenship} placeholder="Pilih status kewarganegaraan" value={studentInfo.citizenship} />
                      <SearchableSelect label="Negara Kewarganegaraan" onChange={updateStudentInfoValue("citizenshipCountry")} options={selectOptions.citizenshipCountry} placeholder="Pilih negara" value={studentInfo.citizenshipCountry} />
                      <SearchableSelect label="Agama" onChange={updateStudentInfoValue("religion")} options={selectOptions.religion} placeholder="Pilih agama" value={studentInfo.religion} />
                      <SearchableSelect label="Status Perkahwinan" onChange={updateStudentInfoValue("maritalStatus")} options={maritalStatusOptions} placeholder="Pilih status perkahwinan" value={studentInfo.maritalStatus} />
                      <SearchableSelect label="Negeri Kelahiran" onChange={updateStudentInfoValue("stateOfBirth")} options={selectOptions.state} placeholder="Pilih negeri kelahiran" value={studentInfo.stateOfBirth} />
                      <SearchableSelect label="Negeri Kediaman" onChange={updateStudentInfoValue("residenceState")} options={selectOptions.state} placeholder="Pilih negeri kediaman" value={studentInfo.residenceState} />
                      <label>Tarikh Lahir<input type="date" value={studentInfo.dateOfBirth} onChange={updateStudentInfo("dateOfBirth")} /></label>
                      <SearchableSelect label="Jenis Sekolah Menengah" onChange={updateStudentInfoValue("schoolType")} options={selectOptions.schoolType} placeholder="Pilih jenis sekolah" value={studentInfo.schoolType} />
                      <SearchableSelect label="Tajaan" onChange={updateStudentInfoValue("sponsorship")} options={selectOptions.sponsorship} placeholder="Pilih tajaan" value={studentInfo.sponsorship} />
                      <SearchableSelect label="Kelayakan Kemasukan" onChange={updateStudentInfoValue("qualification")} options={selectOptions.qualification} placeholder="Pilih kelayakan" value={studentInfo.qualification} />
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
