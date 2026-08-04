import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuthSession, getStoredUser } from "../../lib/authApi";
import { Icon } from "../applicant/ApplicantAuthShared";

const navigation = [
  ["dashboard", "Papan Pemuka"], ["manage_accounts", "Pengurusan Akaun"], ["work", "Jawatan Kosong"], ["description", "Permohonan"], ["bar_chart", "Laporan"],
];

export default function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const user = getStoredUser();

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
    else if (user.role !== "superadmin") navigate("/profile", { replace: true });
  }, [navigate, user]);

  if (!user || user.role !== "superadmin") return null;

  const logout = () => { clearAuthSession(); navigate("/login", { replace: true }); };
  const displayName = user.full_name || user.first_name || "Super Admin";

  return <div className="superadmin-page"><aside className="superadmin-sidebar"><div className="superadmin-brand"><img src="/logo-dbku.png" alt="DBKU" /><span>Portal Kerjaya DBKU</span></div><nav>{navigation.map(([icon, label], index) => <button className={index === 0 ? "active" : ""} key={label} type="button"><Icon>{icon}</Icon>{label}</button>)}</nav><button className="superadmin-logout" onClick={logout} type="button"><Icon>logout</Icon>Log Keluar</button></aside><main className="superadmin-main"><header className="superadmin-topbar"><div><p>Portal Kerjaya DBKU</p><h1>Papan Pemuka Super Admin</h1></div><div className="superadmin-user"><span><Icon>shield_person</Icon></span><div><strong>{displayName}</strong><small>Super Admin</small></div></div></header><section className="superadmin-welcome"><div><span>SELAMAT DATANG</span><h2>Urus portal kerjaya DBKU dengan lebih mudah.</h2><p>Ini ialah paparan sementara untuk Super Admin. Modul pengurusan penuh akan ditambah kemudian.</p></div><Icon>admin_panel_settings</Icon></section><section className="superadmin-stat-grid"><Stat icon="group" label="Jumlah Pemohon" value="—" tone="green" /><Stat icon="business_center" label="Jawatan Aktif" value="—" tone="blue" /><Stat icon="assignment" label="Permohonan Baharu" value="—" tone="orange" /><Stat icon="campaign" label="Notifikasi" value="—" tone="purple" /></section><section className="superadmin-placeholder"><div><Icon>construction</Icon><div><h2>Modul Super Admin sedang disediakan</h2><p>Pengurusan akaun, jawatan kosong, permohonan dan laporan akan tersedia dalam paparan ini.</p></div></div></section></main></div>;
}

function Stat({ icon, label, tone, value }) { return <article className={`superadmin-stat ${tone}`}><span><Icon>{icon}</Icon></span><p>{label}</p><strong>{value}</strong><small>Belum disambungkan ke data</small></article>; }
