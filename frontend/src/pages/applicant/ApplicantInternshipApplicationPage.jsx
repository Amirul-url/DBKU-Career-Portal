import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredUser } from "../../lib/authApi";
import { Icon } from "./ApplicantAuthShared";
import { ProfileContentHeader, ProfileSidebar } from "./ApplicantProfilePage";

const infoMenuItems = [
  ["person", "Personal Info"],
  ["shield", "Health Info"],
  ["work", "Financial Info"],
  ["group", "Guardian Info"],
  ["person", "Kin Info"],
  ["shield_person", "Guarantor Info"],
  ["description", "SPM Info"],
  ["description", "STPM Info"],
  ["description", "MATRIK Info"],
  ["description", "STAM Info"],
  ["description", "Supervisory Info"],
  ["description", "Research Info"],
];

const infoTabs = [
  "Personal Info",
  "Address 1",
  "Address 2",
  "Voting Info",
  "Course Info",
  "Lang. Info",
  "Course Status",
  "E-Portfolio Information",
];

const selectOptions = {
  citizenship: ["WARGANEGARA", "BUKAN WARGANEGARA"],
  citizenshipCountry: ["MALAYSIA", "BRUNEI", "INDONESIA", "LAIN-LAIN"],
  ethnicity: ["MELANAU", "MELAYU", "IBAN", "BIDAYUH", "CINA", "LAIN-LAIN"],
  gender: ["MALE", "FEMALE"],
  got: ["No", "Yes"],
  maritalStatus: ["SINGLE", "MARRIED"],
  nativeStatus: ["BUMIPUTERA", "BUKAN BUMIPUTERA"],
  religion: ["MUSLIM", "CHRISTIAN", "BUDDHIST", "HINDU", "LAIN-LAIN"],
  schoolType: ["SEKOLAH MENENGAH KEBANGSAAN", "SEKOLAH MENENGAH TEKNIK", "LAIN-LAIN"],
  sponsorship: ["PTPTN", "BIASISWA", "SENDIRI"],
  state: ["SARAWAK", "SABAH", "JOHOR", "KEDAH", "KELANTAN", "MELAKA", "NEGERI SEMBILAN", "PAHANG", "PERAK", "PERLIS", "PULAU PINANG", "SELANGOR", "TERENGGANU", "WP KUALA LUMPUR"],
  statusB40: ["Yes", "No"],
  qualification: ["STPM", "MATRICULATION", "DIPLOMA", "FOUNDATION", "DEGREE"],
};

export default function ApplicantInternshipApplicationPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notice, setNotice] = useState("");
  const [passportPhoto, setPassportPhoto] = useState(null);
  const passportPhotoInputRef = useRef(null);
  const [studentInfo, setStudentInfo] = useState({
    citizenship: "WARGANEGARA",
    citizenshipCountry: "MALAYSIA",
    dateOfBirth: "",
    email: user?.email || "",
    ethnicity: "",
    gender: "",
    got: "No",
    householdIncome: "",
    icNo: "",
    maritalStatus: "SINGLE",
    matricNo: "",
    name: user?.full_name || user?.first_name || "",
    nativeStatus: "",
    phone: user?.mobile_number || "",
    religion: "",
    residenceState: "SARAWAK",
    schoolType: "",
    sponsorship: "",
    stateOfBirth: "SARAWAK",
    statusB40: "No",
    umsEmail: "",
    qualification: "",
  });
  const displayName = user?.full_name || user?.first_name || "Pemohon DBKU";
  const email = user?.email || "Belum dikemaskini";

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true, state: { message: "Sila log masuk untuk memohon latihan industri." } });
    } else if (user.role !== "applicant") {
      navigate("/", { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => () => {
    if (passportPhoto?.previewUrl) {
      URL.revokeObjectURL(passportPhoto.previewUrl);
    }
  }, [passportPhoto]);

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
    setPassportPhoto((current) => {
      if (current?.previewUrl) {
        URL.revokeObjectURL(current.previewUrl);
      }

      return { name: file.name, previewUrl: URL.createObjectURL(file) };
    });
  };

  const openPassportPhotoPicker = () => {
    passportPhotoInputRef.current?.click();
  };

  const deletePassportPhoto = () => {
    setNotice("");
    setPassportPhoto((current) => {
      if (current?.previewUrl) {
        URL.revokeObjectURL(current.previewUrl);
      }

      return null;
    });

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
              <h1>Basic Student Information</h1>
              <button type="button">Hantar Maklum Balas / Send Feedback</button>
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
                  <h2>Personal Info</h2>
                  {notice ? <p className="student-info-notice">{notice}</p> : null}

                  <div className="student-info-layout">
                    <div className="student-info-fields">
                      <label>Matric No.<input value={studentInfo.matricNo} onChange={updateStudentInfo("matricNo")} /></label>
                      <label className="wide">Name<input value={studentInfo.name} onChange={updateStudentInfo("name")} /></label>
                      <label>IC. No.<input value={studentInfo.icNo} onChange={updateStudentInfo("icNo")} /></label>
                      <label>Gender<select value={studentInfo.gender} onChange={updateStudentInfo("gender")}><option value="">Select gender</option>{selectOptions.gender.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label>Ethnicity<select value={studentInfo.ethnicity} onChange={updateStudentInfo("ethnicity")}><option value="">Select ethnicity</option>{selectOptions.ethnicity.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label>Local Native Status<select value={studentInfo.nativeStatus} onChange={updateStudentInfo("nativeStatus")}><option value="">Select status</option>{selectOptions.nativeStatus.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label>Status Malaysia Citizenship<select value={studentInfo.citizenship} onChange={updateStudentInfo("citizenship")}>{selectOptions.citizenship.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label>Citizenship Country<select value={studentInfo.citizenshipCountry} onChange={updateStudentInfo("citizenshipCountry")}>{selectOptions.citizenshipCountry.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label>Religion<select value={studentInfo.religion} onChange={updateStudentInfo("religion")}><option value="">Select religion</option>{selectOptions.religion.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label>Marital Status<select value={studentInfo.maritalStatus} onChange={updateStudentInfo("maritalStatus")}>{selectOptions.maritalStatus.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label>State of Birth<select value={studentInfo.stateOfBirth} onChange={updateStudentInfo("stateOfBirth")}>{selectOptions.state.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label>Residence State<select value={studentInfo.residenceState} onChange={updateStudentInfo("residenceState")}>{selectOptions.state.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label>Date of Birth<input type="date" value={studentInfo.dateOfBirth} onChange={updateStudentInfo("dateOfBirth")} /></label>
                      <label>Secondary School Type<select value={studentInfo.schoolType} onChange={updateStudentInfo("schoolType")}><option value="">Select school type</option>{selectOptions.schoolType.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label>Sponsorship<select value={studentInfo.sponsorship} onChange={updateStudentInfo("sponsorship")}><option value="">Select sponsorship</option>{selectOptions.sponsorship.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label>Intake Qualification<select value={studentInfo.qualification} onChange={updateStudentInfo("qualification")}><option value="">Select qualification</option>{selectOptions.qualification.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <label>Phone Number<input value={studentInfo.phone} onChange={updateStudentInfo("phone")} /></label>
                      <label className="wide">UMS Email Address<input type="email" value={studentInfo.umsEmail} onChange={updateStudentInfo("umsEmail")} /></label>
                      <label className="wide">Email Address<input type="email" value={studentInfo.email} onChange={updateStudentInfo("email")} /></label>
                      <label>Household Income<input value={studentInfo.householdIncome} onChange={updateStudentInfo("householdIncome")} /></label>
                      <label>Status <em>Bottom 40</em><select value={studentInfo.statusB40} onChange={updateStudentInfo("statusB40")}>{selectOptions.statusB40.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <p className="student-info-note"><strong>Note:</strong> Status B40 ini akan disahkan semasa semakan permohonan.</p>
                      <label>Status Graduate On Time (GOT)<select value={studentInfo.got} onChange={updateStudentInfo("got")}>{selectOptions.got.map((option) => <option key={option}>{option}</option>)}</select></label>
                      <p className="student-info-note"><strong>Note:</strong> Status GOT ini hanya untuk rujukan pelajar pascasiswazah.</p>
                    </div>

                    <aside className="student-info-photo-card">
                      <div className="student-passport-upload">
                        {passportPhoto?.previewUrl ? (
                          <img src={passportPhoto.previewUrl} alt="Gambar passport pelajar" />
                        ) : (
                          <span>
                            <Icon>upload_file</Icon>
                            <b>Muat naik gambar passport</b>
                            <small>3.5 cm x 5.0 cm</small>
                          </span>
                        )}
                      </div>
                      <input className="student-passport-input" ref={passportPhotoInputRef} accept=".jpg" type="file" onChange={updatePassportPhoto} />
                      <div className="student-passport-actions">
                        <button type="button" onClick={openPassportPhotoPicker}>
                          <Icon>upload_file</Icon>
                          Upload
                        </button>
                        <button disabled={!passportPhoto} type="button" onClick={deletePassportPhoto}>
                          <Icon>delete</Icon>
                          Delete
                        </button>
                      </div>
                      <p>
                        <strong>Note</strong>
                        <span>Sila pastikan gambar yang dimuatnaik adalah dalam format .jpg</span>
                      </p>
                    </aside>
                  </div>

                  <button className="student-info-update" type="submit">Update</button>
                </form>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
