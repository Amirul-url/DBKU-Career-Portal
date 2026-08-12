import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { submitPasswordReset } from "../../lib/authApi";
import { ApplicantAuthLayout, PasswordField } from "./ApplicantAuthShared";

export default function ApplicantResetPasswordPage() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const [formData, setFormData] = useState({
    email: params.get("email") || "",
    otp: params.get("otp") || "",
    password: "",
    password2: "",
  });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { value, dataset } = event.currentTarget;
    setFormData((current) => ({ ...current, [dataset.field]: value }));
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
      await submitPasswordReset(formData);
      setStatus({ type: "success", message: "Kata laluan berjaya ditetapkan semula. Anda akan dibawa ke log masuk." });
      window.setTimeout(() => navigate("/login", { replace: true }), 900);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ApplicantAuthLayout mode="forgot">
      <section className="split-form-panel" aria-labelledby="reset-password-title">
        <span className="split-eyebrow">Pemulihan Akaun</span>
        <h1 id="reset-password-title">Tetapkan Kata Laluan</h1>
        <p>Cipta kata laluan baharu untuk akaun Portal Kerjaya DBKU anda.</p>

        <div className="split-steps" aria-label="Langkah pemulihan akaun">
          <span className="done">Emel</span>
          <span className="done">OTP</span>
          <span className="active">Kata Laluan</span>
        </div>

        <form className="split-form" autoComplete="off" onSubmit={handleSubmit}>
          <PasswordField
            label="Kata Laluan Baharu"
            name="applicantResetSecret"
            fieldName="password"
            value={formData.password}
            placeholder="Masukkan kata laluan baharu"
            autoComplete="off"
            disabled={isSubmitting}
            onChange={handleChange}
            required
          />

          <PasswordField
            icon="shield"
            label="Sahkan Kata Laluan"
            name="applicantResetSecretConfirm"
            fieldName="password2"
            value={formData.password2}
            placeholder="Masukkan semula kata laluan baharu"
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
            {isSubmitting ? "Menyimpan..." : "Tetapkan Kata Laluan"}
          </button>
        </form>

        <p className="split-mobile-switch">
          Kembali ke <Link to="/login">Log Masuk</Link>
        </p>
      </section>
    </ApplicantAuthLayout>
  );
}
