import { Link } from "react-router-dom";
import { ApplicantAuthLayout, AuthField, PasswordToggle } from "./ApplicantAuthShared";

function RegisterForm() {
  return (
    <section className="split-form-panel" aria-labelledby="register-title">
      <span className="split-eyebrow">Pendaftaran Calon</span>
      <h1 id="register-title">Daftar Akaun</h1>
      <p>Cipta akaun menggunakan emel aktif supaya notifikasi permohonan mudah diterima.</p>

      <form className="split-form register-split-form">
        <AuthField icon="person" label="Nama Penuh">
          <input type="text" placeholder="Nama seperti dalam MyKad" autoComplete="name" />
        </AuthField>

        <AuthField icon="mail" label="Emel">
          <input type="email" placeholder="cth. example@example.com" autoComplete="email" />
        </AuthField>

        <AuthField icon="lock" label="Kata Laluan">
          <input type="password" placeholder="Minimum 8 aksara" autoComplete="new-password" />
          <PasswordToggle />
        </AuthField>

        <AuthField icon="shield" label="Sahkan Kata Laluan">
          <input type="password" placeholder="Ulang kata laluan" autoComplete="new-password" />
          <PasswordToggle />
        </AuthField>

        <button type="button" className="split-submit">Daftar Akaun</button>
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
