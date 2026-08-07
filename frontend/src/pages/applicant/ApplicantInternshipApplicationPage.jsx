import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getStoredUser } from "../../lib/authApi";
import { APPLICANT_ROUTES } from "../../modules/applicant/applicantRoutes";
import { Icon } from "./ApplicantAuthShared";
import { ProfileContentHeader, ProfileSidebar } from "./ApplicantProfilePage";

const fieldOptions = [
  "Kejuruteraan Awam",
  "Kejuruteraan Mekanikal",
  "Kejuruteraan Elektrik atau Elektronik",
  "Teknologi Maklumat / Sistem",
  "Perakaunan / Kewangan",
  "Pengurusan Sumber Manusia / Pentadbiran",
  "Komunikasi Korporat / Perhubungan Awam / Khidmat Pelanggan",
  "Perancangan bandar, landskap, bangunan atau bidang berkaitan DBKU",
];

const documentFields = [
  { accept: ".pdf,.doc,.docx,image/png,image/jpeg", key: "institutionLetter", label: "Surat rasmi daripada institusi / kolej / universiti" },
  { accept: ".pdf,image/png,image/jpeg", key: "transcript", label: "Transkrip akademik terkini" },
  { accept: ".pdf,.doc,.docx", key: "resume", label: "Resume" },
  { accept: "image/png,image/jpeg", key: "passportPhoto", label: "1 keping gambar berukuran passport" },
  { accept: ".pdf,image/png,image/jpeg", key: "bankAccount", label: "1 salinan muka depan akaun bank" },
  { accept: ".pdf,.doc,.docx,image/png,image/jpeg", key: "logBook", label: "Buku log" },
];

const emptyForm = {
  address: "",
  email: "",
  endDate: "",
  faculty: "",
  fullName: "",
  identificationNo: "",
  institutionName: "",
  phone: "",
  preferredField: "",
  programName: "",
  startDate: "",
  studentId: "",
  supervisorEmail: "",
  supervisorName: "",
};

const getStorageKey = (user) => `dbku_internship_application_${user?.id || user?.email || "guest"}`;

function loadSavedApplication(user) {
  try {
    const saved = window.localStorage.getItem(getStorageKey(user));
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveApplication(user, payload) {
  try {
    window.localStorage.setItem(getStorageKey(user), JSON.stringify(payload));
  } catch {
    // Keep the in-memory state if browser storage is unavailable.
  }
}

export default function ApplicantInternshipApplicationPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const savedApplication = useMemo(() => loadSavedApplication(user), [user]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    ...(savedApplication?.form || {}),
    email: savedApplication?.form?.email || user?.email || "",
    fullName: savedApplication?.form?.fullName || user?.full_name || user?.first_name || "",
    phone: savedApplication?.form?.phone || user?.mobile_number || "",
  }));
  const [documents, setDocuments] = useState(() => savedApplication?.documents || {});
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(savedApplication?.submittedAt ? "Permohonan latihan industri terakhir telah disimpan." : "");
  const displayName = user?.full_name || user?.first_name || "Pemohon DBKU";
  const email = user?.email || "Belum dikemaskini";

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true, state: { message: "Sila log masuk untuk memohon latihan industri." } });
    } else if (user.role !== "applicant") {
      navigate("/", { replace: true });
    }
  }, [navigate, user]);

  if (!user || user.role !== "applicant") {
    return null;
  }

  const updateField = (field) => (event) => {
    setError("");
    setNotice("");
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const updateDocument = (field) => (event) => {
    const file = event.target.files?.[0];
    setError("");
    setNotice("");
    setDocuments((current) => ({
      ...current,
      [field]: file ? { name: file.name, size: file.size, type: file.type } : null,
    }));
  };

  const buildPayload = (status) => ({
    documents,
    form,
    savedAt: new Date().toISOString(),
    status,
    submittedAt: status === "submitted" ? new Date().toISOString() : savedApplication?.submittedAt || "",
  });

  const saveDraft = () => {
    saveApplication(user, buildPayload("draft"));
    setError("");
    setNotice("Draf permohonan latihan industri telah disimpan.");
  };

  const submitApplication = (event) => {
    event.preventDefault();
    const requiredFields = ["fullName", "identificationNo", "studentId", "institutionName", "programName", "faculty", "email", "phone", "startDate", "endDate", "preferredField", "supervisorName", "supervisorEmail"];
    const missingField = requiredFields.find((field) => !String(form[field] || "").trim());
    const missingDocument = documentFields.find((document) => !documents[document.key]?.name);

    if (missingField || missingDocument) {
      setNotice("");
      setError(missingField ? "Lengkapkan semua maklumat pelajar yang bertanda wajib." : `Muat naik dokumen: ${missingDocument.label}.`);
      return;
    }

    saveApplication(user, buildPayload("submitted"));
    setError("");
    setNotice("Permohonan latihan industri telah direkodkan. Sila pastikan dokumen asal disimpan untuk semakan DBKU.");
  };

  return (
    <div className={`applicant-profile-page ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
      <ProfileSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((current) => !current)} />
      <div className="profile-main-area">
        <ProfileContentHeader displayName={displayName} email={email} photoUrl={user.profile_photo_url} />
        <main className="profile-shell internship-application-shell">
          <div className="internship-application-heading">
            <Link to={APPLICANT_ROUTES.internships}>
              <Icon>arrow_back</Icon>
              Kembali ke maklumat latihan industri
            </Link>
            <span>Permohonan Latihan Industri</span>
            <h1>Borang permohonan latihan industri</h1>
            <p>Isi maklumat pelajar dan muat naik dokumen sokongan yang diperlukan untuk semakan DBKU.</p>
          </div>

          {notice ? <p className="internship-form-notice">{notice}</p> : null}
          {error ? <p className="internship-form-error" role="alert">{error}</p> : null}

          <form className="internship-application-form" onSubmit={submitApplication}>
            <section>
              <header>
                <span><Icon>person</Icon></span>
                <div>
                  <h2>Maklumat Pelajar</h2>
                  <p>Butiran ini digunakan untuk pengesahan identiti dan rujukan institusi.</p>
                </div>
              </header>
              <div className="internship-form-grid">
                <label>Nama penuh<input required value={form.fullName} onChange={updateField("fullName")} /></label>
                <label>No. kad pengenalan / passport<input required value={form.identificationNo} onChange={updateField("identificationNo")} /></label>
                <label>ID pelajar<input required value={form.studentId} onChange={updateField("studentId")} /></label>
                <label>Nama institusi<input required value={form.institutionName} onChange={updateField("institutionName")} /></label>
                <label>Program pengajian<input required value={form.programName} onChange={updateField("programName")} /></label>
                <label>Fakulti / jabatan<input required value={form.faculty} onChange={updateField("faculty")} /></label>
                <label>Alamat e-mel<input required type="email" value={form.email} onChange={updateField("email")} /></label>
                <label>No. telefon<input required type="tel" value={form.phone} onChange={updateField("phone")} /></label>
                <label>Tarikh mula latihan<input required type="date" value={form.startDate} onChange={updateField("startDate")} /></label>
                <label>Tarikh tamat latihan<input required type="date" value={form.endDate} onChange={updateField("endDate")} /></label>
                <label>Bidang penempatan pilihan<select required value={form.preferredField} onChange={updateField("preferredField")}><option value="">Pilih bidang</option>{fieldOptions.map((field) => <option key={field} value={field}>{field}</option>)}</select></label>
                <label>Alamat semasa<textarea value={form.address} onChange={updateField("address")} /></label>
              </div>
            </section>

            <section>
              <header>
                <span><Icon>school</Icon></span>
                <div>
                  <h2>Maklumat Penyelaras Institusi</h2>
                  <p>DBKU boleh menghubungi penyelaras untuk pengesahan surat dan tempoh latihan.</p>
                </div>
              </header>
              <div className="internship-form-grid two">
                <label>Nama penyelaras<input required value={form.supervisorName} onChange={updateField("supervisorName")} /></label>
                <label>E-mel penyelaras<input required type="email" value={form.supervisorEmail} onChange={updateField("supervisorEmail")} /></label>
              </div>
            </section>

            <section>
              <header>
                <span><Icon>upload_file</Icon></span>
                <div>
                  <h2>Dokumen Sokongan</h2>
                  <p>Muat naik dokumen dalam format PDF, Word, PNG atau JPG mengikut jenis dokumen.</p>
                </div>
              </header>
              <div className="internship-document-grid">
                {documentFields.map((document) => (
                  <label key={document.key}>
                    <strong>{document.label}</strong>
                    <input required={!documents[document.key]?.name} accept={document.accept} type="file" onChange={updateDocument(document.key)} />
                    {documents[document.key]?.name ? <small>{documents[document.key].name}</small> : <small>Belum dimuat naik</small>}
                  </label>
                ))}
              </div>
            </section>

            <footer>
              <button className="internship-secondary-button" type="button" onClick={saveDraft}>Simpan Draf</button>
              <button className="internship-submit-button" type="submit">
                Hantar Permohonan
                <Icon>arrow_forward</Icon>
              </button>
            </footer>
          </form>
        </main>
      </div>
    </div>
  );
}
