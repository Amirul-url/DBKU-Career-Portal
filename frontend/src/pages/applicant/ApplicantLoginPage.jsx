import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { getStoredUser, loginApplicant, saveAuthSession } from "../../lib/authApi";
import { ApplicantAuthLayout, AuthField, PasswordField } from "./ApplicantAuthShared";

const dashboardPathForRole = (role) =>
  role === "superadmin" ? "/superadmin" : role === "admin" ? "/admin" : "/profile";

function LoginForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const [storedUser] = useState(getStoredUser);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [status, setStatus] = useState(
    location.state?.message ? { type: "success", message: location.state.message } : { type: "", message: "" }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (storedUser) navigate(dashboardPathForRole(storedUser.role), { replace: true });
  }, [navigate, storedUser]);

  const handleChange = (event) => {
    const { name, value, dataset } = event.currentTarget;
    const fieldName = dataset.field || name;
    setFormData((current) => ({ ...current, [fieldName]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });
    setIsSubmitting(true);

    try {
      const data = await loginApplicant(formData);
      saveAuthSession(data);
      navigate(dashboardPathForRole(data.user?.role), { replace: true });
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

      <form className="split-form" autoComplete="off" onSubmit={handleSubmit}>
        <AuthField icon="mail" label="Emel">
          <input
            type="text"
            inputMode="email"
            name="applicantLoginContact"
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

        <PasswordField
          label="Kata Laluan"
          name="applicantLoginSecret"
          fieldName="password"
          value={formData.password}
          placeholder="Masukkan kata laluan"
          autoComplete="off"
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
