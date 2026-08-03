import { Link } from "react-router-dom";
import { ApplicantAuthLayout, AuthField, PasswordField } from "./ApplicantAuthShared";

function LoginForm() {
  return (
    <section className="split-form-panel" aria-labelledby="login-title">
      <span className="split-eyebrow">Portal Pemohon</span>
      <h1 id="login-title">Log Masuk</h1>
      <p>Masuk menggunakan emel berdaftar untuk menyemak permohonan dan makluman kerjaya DBKU.</p>

      <form className="split-form">
        <AuthField icon="mail" label="Emel">
          <input type="email" placeholder="cth. example@example.com" autoComplete="email" />
        </AuthField>

        <PasswordField
          label="Kata Laluan"
          placeholder="Masukkan kata laluan"
          autoComplete="current-password"
        />

        <div className="split-options">
          <a href="#forgot-password">Lupa kata laluan?</a>
        </div>

        <button type="button" className="split-submit">Log Masuk</button>
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
