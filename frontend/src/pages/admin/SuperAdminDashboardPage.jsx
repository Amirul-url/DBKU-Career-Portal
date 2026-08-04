import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, clearAuthSession, getStoredUser } from "../../lib/authApi";
import { Icon } from "../applicant/ApplicantAuthShared";

const navigation = [["manage_accounts", "Akaun Dalaman HRM"]];

export default function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
    else if (user.role !== "superadmin") navigate("/profile", { replace: true });
  }, [navigate, user]);

  if (!user || user.role !== "superadmin") return null;

  const logout = () => { clearAuthSession(); navigate("/login", { replace: true }); };
  const displayName = user.full_name || user.first_name || "Super Admin";
  const createAccount = async (event) => { event.preventDefault(); setStatus(""); setIsSaving(true); try { await apiRequest("/auth/internal-hrm-accounts/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); setForm({ full_name: "", email: "", password: "" }); setStatus("Akaun HRM berjaya dicipta."); } catch (error) { setStatus(error.message); } finally { setIsSaving(false); } };

  return <div className="superadmin-page"><aside className="superadmin-sidebar"><div className="superadmin-brand"><img src="/logo-dbku.png" alt="DBKU" /><span>Portal Kerjaya DBKU</span></div><nav>{navigation.map(([icon, label]) => <button className="active" key={label} type="button"><Icon>{icon}</Icon>{label}</button>)}</nav><button className="superadmin-logout" onClick={logout} type="button"><Icon>logout</Icon>Log Keluar</button></aside><main className="superadmin-main"><header className="superadmin-topbar"><div><p>Portal Kerjaya DBKU</p><h1>Pengurusan Akaun Dalaman HRM</h1></div><div className="superadmin-user"><span><Icon>shield_person</Icon></span><div><strong>{displayName}</strong><small>Super Admin</small></div></div></header><section className="superadmin-welcome"><div><span>SKOP SUPER ADMIN</span><h2>Cipta akaun dalaman untuk Bahagian Pengurusan Sumber Manusia.</h2><p>Akaun baharu akan ditetapkan sebagai HR Officer bagi jabatan HRM.</p></div><Icon>manage_accounts</Icon></section><section className="superadmin-account-form"><div><h2>Cipta Akaun HRM</h2><p>Masukkan maklumat staf dalaman DBKU.</p></div><form onSubmit={createAccount}><label>Nama Penuh<input required value={form.full_name} onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))} placeholder="Nama penuh staf" /></label><label>Emel DBKU<input required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="nama@dbku.gov.my" /></label><label>Kata Laluan Sementara<input required minLength="8" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="Minimum 8 aksara" /></label>{status ? <p className="superadmin-form-status">{status}</p> : null}<button disabled={isSaving} type="submit"><Icon>person_add</Icon>{isSaving ? "Mencipta..." : "Cipta Akaun HRM"}</button></form></section></main></div>;
}
