import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { requestPasswordResetOtp, verifyPasswordResetOtp } from "../../lib/authApi";
import { countryCallingCodes, defaultCountryCallingCode } from "../../lib/countryCallingCodes";
import { ApplicantAuthLayout, AuthField } from "./ApplicantAuthShared";

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

  return { country: defaultCountryCallingCode, localNumber: digits.replace(/^0+/, "") };
}

function combinePhoneNumber(countryCode, localNumber) {
  const cleanLocalNumber = String(localNumber || "").replace(/\D/g, "").replace(/^0+/, "");
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

function OtpInput({ value, onChange, disabled = false }) {
  const digits = value.padEnd(6, " ").slice(0, 6).split("");

  const updateDigit = (index, nextValue) => {
    const cleanValue = nextValue.replace(/\D/g, "");
    const nextDigits = digits.map((digit) => (digit === " " ? "" : digit));

    if (!cleanValue) {
      nextDigits[index] = "";
      onChange(nextDigits.join("").slice(0, 6));
      return;
    }

    cleanValue.slice(0, 6 - index).split("").forEach((digit, offset) => {
      nextDigits[index + offset] = digit;
    });
    onChange(nextDigits.join("").slice(0, 6));

    const nextIndex = Math.min(index + cleanValue.length, 5);
    window.requestAnimationFrame(() => {
      document.querySelector(`[data-reset-otp-index="${nextIndex}"]`)?.focus();
    });
  };

  const handleKeyDown = (event, index) => {
    if (event.key === "Backspace" && !digits[index].trim() && index > 0) {
      window.requestAnimationFrame(() => {
        document.querySelector(`[data-reset-otp-index="${index - 1}"]`)?.focus();
      });
    }
  };

  return (
    <div className="split-otp-grid" aria-label="Masukkan OTP 6 digit">
      {digits.map((digit, index) => (
        <input
          key={index}
          data-reset-otp-index={index}
          inputMode="numeric"
          maxLength={1}
          value={digit.trim()}
          disabled={disabled}
          onChange={(event) => updateDigit(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onFocus={(event) => event.target.select()}
          aria-label={`Digit OTP ${index + 1}`}
          required
        />
      ))}
    </div>
  );
}

export default function ApplicantForgotPasswordPage() {
  const navigate = useNavigate();
  const [method, setMethod] = useState("email");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const identifierLabel = method === "email" ? email.trim().toLowerCase() : phoneNumber.trim();

  const sendOtp = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });
    setIsSubmitting(true);

    try {
      await requestPasswordResetOtp({ method, email, phone_number: phoneNumber });
      setOtp("");
      setStep("otp");
      setStatus({ type: "", message: "" });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });
    setIsSubmitting(true);

    try {
      await verifyPasswordResetOtp({ method, email, phone_number: phoneNumber, otp });
      const params = new URLSearchParams({ method, otp });
      if (method === "email") {
        params.set("email", email.trim().toLowerCase());
      } else {
        params.set("phone_number", phoneNumber.trim());
      }
      navigate(`/reset-password?${params.toString()}`);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ApplicantAuthLayout mode="forgot">
      <section className="split-form-panel" aria-labelledby="forgot-password-title">
        <h1 id="forgot-password-title">Lupa Kata Laluan</h1>
        <p>Masukkan emel atau nombor WhatsApp berdaftar untuk menerima OTP tetapan semula kata laluan.</p>

        <div className="split-steps" aria-label="Langkah pemulihan akaun">
          <span className={step === "email" ? "active" : "done"}>{method === "email" ? "Emel" : "WhatsApp"}</span>
          <span className={step === "otp" ? "active" : ""}>OTP</span>
          <span>Kata Laluan</span>
        </div>

        {step === "email" ? (
          <form className="split-form forgot-password-request-form" autoComplete="off" onSubmit={sendOtp}>
            <AuthField icon={method === "email" ? "mail" : "phone"} label={method === "email" ? "Emel Berdaftar" : "Nombor WhatsApp Berdaftar"} required>
              {method === "email" ? (
                <input
                  type="email"
                  inputMode="email"
                  value={email}
                  placeholder="cth. example@example.com"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  disabled={isSubmitting}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              ) : (
                <PhoneNumberSelectInput
                  value={phoneNumber}
                  disabled={isSubmitting}
                  onChange={setPhoneNumber}
                  required
                />
              )}
            </AuthField>

            <div className="split-method-grid" aria-label="Kaedah penerimaan OTP">
              <button
                type="button"
                className={method === "email" ? "active" : ""}
                disabled={isSubmitting}
                onClick={() => {
                  setMethod("email");
                  setStatus({ type: "", message: "" });
                }}
              >
                <strong>Emel</strong>
                <span>Hantar OTP ke emel berdaftar.</span>
              </button>
              <button
                type="button"
                className={method === "whatsapp" ? "active" : ""}
                disabled={isSubmitting}
                onClick={() => {
                  setMethod("whatsapp");
                  setStatus({ type: "", message: "" });
                }}
              >
                <strong>WhatsApp</strong>
                <span>Hantar OTP ke nombor telefon berdaftar.</span>
              </button>
            </div>

            {status.message ? (
              <p className={`split-alert ${status.type}`} role={status.type === "error" ? "alert" : "status"}>
                {status.message}
              </p>
            ) : null}

            <span className="forgot-password-spacer" aria-hidden="true" />

            <button type="submit" className="split-submit" disabled={isSubmitting}>
              {isSubmitting ? "Menghantar..." : "Dapatkan OTP"}
            </button>
          </form>
        ) : (
          <form className="split-form" autoComplete="off" onSubmit={verifyOtp}>
            <p className="split-helper-box">OTP 6 digit telah dihantar ke {identifierLabel}.</p>
            <label className="split-field">
              <span>OTP</span>
              <OtpInput value={otp} onChange={setOtp} disabled={isSubmitting} />
            </label>

            {status.message ? (
              <p className={`split-alert ${status.type}`} role={status.type === "error" ? "alert" : "status"}>
                {status.message}
              </p>
            ) : null}

            <button type="submit" className="split-submit" disabled={isSubmitting || otp.length !== 6}>
              {isSubmitting ? "Menyemak..." : "Sahkan OTP"}
            </button>
            <button type="button" className="split-secondary-action" disabled={isSubmitting} onClick={() => setStep("email")}>
              Tukar {method === "email" ? "Emel" : "WhatsApp"}
            </button>
          </form>
        )}

        <p className="split-mobile-switch">
          Ingat kata laluan? <Link to="/login">Log Masuk</Link>
        </p>
      </section>
    </ApplicantAuthLayout>
  );
}
