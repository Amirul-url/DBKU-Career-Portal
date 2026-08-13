import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { dashboardPathForRole, registerApplicant, saveAuthSession } from "../../lib/authApi";
import { ApplicantAuthLayout, AuthField, PasswordField } from "./ApplicantAuthShared";

const countryCodeOptions = ["+60"];

function splitPhoneNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("60")) {
    return { countryCode: "+60", localNumber: digits.slice(2) };
  }
  return { countryCode: "+60", localNumber: digits };
}

function combinePhoneNumber(countryCode, localNumber) {
  const cleanLocalNumber = String(localNumber || "").replace(/\D/g, "");
  if (!cleanLocalNumber) return "";
  return `${String(countryCode || "").replace(/\D/g, "")}${cleanLocalNumber}`;
}

function PhoneNumberSelectInput({ value, onChange, disabled = false, required = false }) {
  const initialPhone = splitPhoneNumber(value);
  const [countryCode, setCountryCode] = useState(initialPhone.countryCode);
  const countryDigits = String(countryCode || "").replace(/\D/g, "");
  const valueDigits = String(value || "").replace(/\D/g, "");
  const localNumber =
    countryDigits && valueDigits.startsWith(countryDigits)
      ? valueDigits.slice(countryDigits.length)
      : splitPhoneNumber(value).localNumber;

  function updatePhone(nextCountryCode, nextLocalNumber) {
    setCountryCode(nextCountryCode);
    onChange(combinePhoneNumber(nextCountryCode, nextLocalNumber));
  }

  return (
    <div className="split-phone-grid">
      <select
        className="split-phone-code"
        value={countryCode}
        onChange={(event) => updatePhone(event.target.value, localNumber)}
        aria-label="Kod negara WhatsApp"
        disabled={disabled}
        required={required}
      >
        {countryCodeOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="tel"
        value={localNumber}
        placeholder="cth. 123456789"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        aria-label="Nombor WhatsApp"
        disabled={disabled}
        onChange={(event) => updatePhone(countryCode, event.target.value)}
        required={required}
      />
    </div>
  );
}

function RegisterForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    password2: "",
  });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value, dataset } = event.currentTarget;
    const fieldName = dataset.field || name;
    setFormData((current) => ({
      ...current,
      [fieldName]: fieldName === "fullName" ? value.toUpperCase() : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    if (formData.password !== formData.password2) {
      setStatus({ type: "error", message: "Kata laluan dan sahkan kata laluan mesti sama." });
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await registerApplicant(formData);
      saveAuthSession(data);
      navigate(dashboardPathForRole(data.user?.role), { replace: true });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="split-form-panel" aria-labelledby="register-title">
      <h1 id="register-title">Daftar Akaun</h1>
      <p>Cipta akaun menggunakan emel aktif supaya notifikasi permohonan mudah diterima.</p>

      <form className="split-form register-split-form" autoComplete="off" onSubmit={handleSubmit}>
        <AuthField icon="person" label="Nama Penuh" required>
          <input
            type="text"
            name="applicantRegisterFullName"
            data-field="fullName"
            value={formData.fullName}
            placeholder="Nama seperti dalam MyKad"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            disabled={isSubmitting}
            onChange={handleChange}
            required
          />
        </AuthField>

        <AuthField icon="mail" label="Emel" required>
          <input
            type="text"
            inputMode="email"
            name="applicantRegisterContact"
            data-field="email"
            value={formData.email}
            placeholder="cth. example@example.com"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            disabled={isSubmitting}
            onChange={handleChange}
            required
          />
        </AuthField>

        <AuthField icon="phone" label="Nombor WhatsApp" required>
          <PhoneNumberSelectInput
            value={formData.phoneNumber}
            onChange={(phoneNumber) => setFormData((current) => ({ ...current, phoneNumber }))}
            disabled={isSubmitting}
            required
          />
        </AuthField>

        <PasswordField
          label="Kata Laluan"
          name="applicantRegisterSecret"
          fieldName="password"
          value={formData.password}
          placeholder="masukkan kata laluan anda"
          autoComplete="off"
          disabled={isSubmitting}
          onChange={handleChange}
          required
        />

        <PasswordField
          icon="shield"
          label="Sahkan Kata Laluan"
          name="applicantRegisterSecretConfirm"
          fieldName="password2"
          value={formData.password2}
          placeholder="masukkan semula kata laluan anda"
          autoComplete="off"
          disabled={isSubmitting}
          onChange={handleChange}
          required
        />

        {status.message ? (
          <p className={`split-alert ${status.type}`} role={status.type === "error" ? "alert" : "status"}>
            {status.message}
          </p>
        ) : null}

        <button type="submit" className="split-submit" disabled={isSubmitting}>
          {isSubmitting ? "Mendaftar..." : "Daftar Akaun"}
        </button>
      </form>

      <p className="split-mobile-switch">
        Sudah berdaftar? <Link to="/login">Log Masuk</Link>
      </p>
    </section>
  );
}

export default function ApplicantRegisterPage() {
  return (
    <ApplicantAuthLayout mode="register">
      <RegisterForm />
    </ApplicantAuthLayout>
  );
}
