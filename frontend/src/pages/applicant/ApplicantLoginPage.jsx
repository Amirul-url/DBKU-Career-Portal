import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { loginApplicant, saveAuthSession } from "../../lib/authApi";
import { ApplicantAuthLayout, AuthField, PasswordField } from "./ApplicantAuthShared";

function LoginForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.currentTarget;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });
    setIsSubmitting(true);

    try {
      const data = await loginApplicant(formData);
      saveAuthSession(data);
      setStatus({ type: "success", message: "Log masuk berjaya." });
      navigate("/jobs");
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="split-form-panel" aria-labelledby="login-title">
      <span className="split-eyebrow">Portal Pemohon</span>
      <h1 id="login-title">Log Masuk</h1>
      <p>Masuk menggunakan emel berdaftar untuk menyemak permohonan dan makluman kerjaya DBKU.</p>

      <form className="split-form" onSubmit={handleSubmit}>
        <AuthField icon="mail" label="Emel">
          <input
            type="email"
            name="email"
            value={formData.email}
            placeholder="cth. example@example.com"
            autoComplete="email"
            disabled={isSubmitting}
            onChange={handleChange}
            required
          />
        </AuthField>

        <PasswordField
          label="Kata Laluan"
          name="password"
          value={formData.password}
          placeholder="Masukkan kata laluan"
          autoComplete="current-password"
          disabled={isSubmitting}
          onChange={handleChange}
          required
        />

        <div className="split-options">
          <a href="#forgot-password">Lupa kata laluan?</a>
        </div>

        {status.message ? (
          <p className={`split-alert ${status.type}`} role={status.type === "error" ? "alert" : "status"}>
            {status.message}
          </p>
        ) : null}

        <button type="submit" className="split-submit" disabled={isSubmitting}>
          {isSubmitting ? "Memproses..." : "Log Masuk"}
        </button>
      </form>

      <p className="split-mobile-switch">
        Belum mempunyai akaun? <Link to="/register">Daftar Sekarang</Link>
      </p>
    </section>
  );
}

export default function ApplicantLoginPage() {
  return (
    <ApplicantAuthLayout mode="login">
      <LoginForm />
    </ApplicantAuthLayout>
  );
}
