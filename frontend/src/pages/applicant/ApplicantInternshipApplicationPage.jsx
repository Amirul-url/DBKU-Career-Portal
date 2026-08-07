import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getStoredUser } from "../../lib/authApi";
import { APPLICANT_ROUTES } from "../../modules/applicant/applicantRoutes";
import { Icon } from "./ApplicantAuthShared";
import { ProfileContentHeader, ProfileSidebar } from "./ApplicantProfilePage";

const documentFields = [
  { accept: ".pdf,.doc,.docx,image/png,image/jpeg", key: "institutionLetter", label: "Surat rasmi daripada institusi / kolej / universiti" },
  { accept: ".pdf,image/png,image/jpeg", key: "transcript", label: "Transkrip akademik terkini" },
  { accept: ".pdf,.doc,.docx", key: "resume", label: "Resume" },
  { accept: "image/png,image/jpeg", key: "passportPhoto", label: "1 keping gambar berukuran passport" },
  { accept: ".pdf,image/png,image/jpeg", key: "bankAccount", label: "1 salinan muka depan akaun bank" },
  { accept: ".pdf,.doc,.docx,image/png,image/jpeg", key: "logBook", label: "Buku log" },
];

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
    const missingDocument = documentFields.find((document) => !documents[document.key]?.name);

    if (missingDocument) {
      setNotice("");
      setError(`Muat naik dokumen: ${missingDocument.label}.`);
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
            <p>Muat naik dokumen sokongan yang diperlukan untuk semakan permohonan latihan industri DBKU.</p>
          </div>

          {notice ? <p className="internship-form-notice">{notice}</p> : null}
          {error ? <p className="internship-form-error" role="alert">{error}</p> : null}

          <form className="internship-application-form" onSubmit={submitApplication}>
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
