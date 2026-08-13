import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { dashboardPathForRole, registerApplicant, saveAuthSession } from "../../lib/authApi";
import { countryCallingCodes, defaultCountryCallingCode } from "../../lib/countryCallingCodes";
import { ApplicantAuthLayout, AuthField, PasswordField } from "./ApplicantAuthShared";

const countriesByLongestCode = [...countryCallingCodes].sort(
  (first, second) =>
    second.code.replace(/\D/g, "").length - first.code.replace(/\D/g, "").length ||
    first.name.localeCompare(second.name),
);

function getCountryKey(country) {
  return `${country.iso}-${country.code}`;
}

function splitPhoneNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  const matchedCountry = countriesByLongestCode.find((country) => {
    const countryDigits = country.code.replace(/\D/g, "");
    return digits.startsWith(countryDigits);
  });

  if (matchedCountry) {
    return {
      country: matchedCountry,
      localNumber: digits.slice(matchedCountry.code.replace(/\D/g, "").length),
    };
  }

  return { country: defaultCountryCallingCode, localNumber: digits };
}

function combinePhoneNumber(countryCode, localNumber) {
  const cleanLocalNumber = String(localNumber || "").replace(/\D/g, "");
  if (!cleanLocalNumber) return "";
  return `${String(countryCode || "").replace(/\D/g, "")}${cleanLocalNumber}`;
}

function PhoneNumberSelectInput({ value, onChange, disabled = false, required = false }) {
  const initialPhone = splitPhoneNumber(value);
  const [selectedCountry, setSelectedCountry] = useState(initialPhone.country);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const countryDigits = selectedCountry.code.replace(/\D/g, "");
  const valueDigits = String(value || "").replace(/\D/g, "");
  const localNumber =
    countryDigits && valueDigits.startsWith(countryDigits)
      ? valueDigits.slice(countryDigits.length)
      : splitPhoneNumber(value).localNumber;
  const filteredCountries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return countryCallingCodes;
    const queryDigits = query.replace(/\D/g, "");
    return countryCallingCodes.filter((country) => {
      const countryCodeDigits = country.code.replace(/\D/g, "");
      return (
        country.name.toLowerCase().includes(query) ||
        country.iso.toLowerCase().includes(query) ||
        country.code.includes(query) ||
        (queryDigits && countryCodeDigits.includes(queryDigits))
      );
    });
  }, [searchTerm]);

  function updatePhone(nextCountry, nextLocalNumber) {
    setSelectedCountry(nextCountry);
    onChange(combinePhoneNumber(nextCountry.code, nextLocalNumber));
  }

  function chooseCountry(nextCountry) {
    setSearchTerm("");
    setIsOpen(false);
    updatePhone(nextCountry, localNumber);
  }

  return (
    <div
      className="split-phone-grid"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
          setSearchTerm("");
        }
      }}
    >
      <div className="split-phone-country">
        <button
          type="button"
          className="split-phone-code"
          aria-label="Pilih kod negara WhatsApp"
          aria-expanded={isOpen}
          disabled={disabled}
          onClick={() => setIsOpen((open) => !open)}
        >
          <span>{selectedCountry.code}</span>
          <span aria-hidden="true">v</span>
        </button>
        {isOpen ? (
          <div className="split-phone-menu" role="listbox" aria-label="Senarai kod negara">
            <input
              type="search"
              className="split-phone-search"
              value={searchTerm}
              placeholder="Cari negara atau kod"
              autoComplete="off"
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <div className="split-phone-options">
              {filteredCountries.length ? (
                filteredCountries.map((country) => (
                  <button
                    type="button"
                    key={getCountryKey(country)}
                    className={getCountryKey(country) === getCountryKey(selectedCountry) ? "active" : ""}
                    role="option"
                    aria-selected={getCountryKey(country) === getCountryKey(selectedCountry)}
                    onClick={() => chooseCountry(country)}
                  >
                    <span>{country.name}</span>
                    <strong>{country.code}</strong>
                  </button>
                ))
              ) : (
                <div className="split-phone-empty">Tiada kod negara dijumpai.</div>
              )}
            </div>
          </div>
        ) : null}
      </div>
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
        onChange={(event) => updatePhone(selectedCountry, event.target.value)}
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
