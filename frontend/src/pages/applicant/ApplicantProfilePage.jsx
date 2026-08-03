import { useCallback, useEffect, useRef, useState } from "react";
import { getCities, getPostcodes, getStates } from "malaysia-postcodes";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { clearAuthSession, getStoredUser, updateCurrentUser } from "../../lib/authApi";
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
    icon: "tune",
    title: "Keutamaan Kerja",
    body: "Tetapkan jawatan, bidang, lokasi dan jenis pekerjaan yang anda minati.",
  },
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

export default function ApplicantProfilePage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingSection, setEditingSection] = useState(null);
  const [isPersonalCloseDialogOpen, setIsPersonalCloseDialogOpen] = useState(false);
  const [isPersonalDraftDirty, setIsPersonalDraftDirty] = useState(false);
  const [personalDraft, setPersonalDraft] = useState(null);
  const [personalSaveRequestKey, setPersonalSaveRequestKey] = useState(0);
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

  const handlePersonalEditToggle = () => {
    if (editingSection !== "personal") {
      setEditingSection("personal");
      return;
    }

    if (isPersonalDraftDirty) {
      setIsPersonalCloseDialogOpen(true);
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
                      <div>
                        <h3>{profileDisplayName}</h3>
                        <p>{profileEmail}</p>
                      </div>
                    </div>
                )}
              </ProfileCard>

              {emptyProfileCards.map((card, index) => (
                <ProfileCard id={`profile-section-${index + 2}`} title={card.title} key={card.title}>
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
    </div>
  );
}
