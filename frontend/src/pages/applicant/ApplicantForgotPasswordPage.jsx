import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { requestPasswordResetOtp, verifyPasswordResetOtp } from "../../lib/authApi";
import { ApplicantAuthLayout, AuthField } from "./ApplicantAuthShared";

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
        <span className="split-eyebrow">Pemulihan Akaun</span>
        <h1 id="forgot-password-title">Lupa Kata Laluan</h1>
        <p>Masukkan emel atau nombor WhatsApp berdaftar untuk menerima OTP tetapan semula kata laluan.</p>

        <div className="split-steps" aria-label="Langkah pemulihan akaun">
          <span className={step === "email" ? "active" : "done"}>{method === "email" ? "Emel" : "WhatsApp"}</span>
          <span className={step === "otp" ? "active" : ""}>OTP</span>
          <span>Kata Laluan</span>
        </div>

        {step === "email" ? (
          <form className="split-form" autoComplete="off" onSubmit={sendOtp}>
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
                <input
                  type="tel"
                  inputMode="tel"
                  value={phoneNumber}
                  placeholder="cth. 60123456789"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  disabled={isSubmitting}
                  onChange={(event) => setPhoneNumber(event.target.value)}
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
