import { useEffect, useState } from "react";
import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { clearAuthSession, getStoredUser, recordLogoutActivity } from "../../lib/authApi";
import { superAdminNavItems } from "../../modules/superadmin/superAdminRoutes";
import { Icon } from "../applicant/ApplicantAuthShared";
import SuperAdminAdministratorsPanel from "./SuperAdminAdministratorsPanel";
import SuperAdminApplicantsPanel from "./SuperAdminApplicantsPanel";
import SuperAdminDashboardPanel from "./SuperAdminDashboardPanel";
import SuperAdminSuperAdminsPanel from "./SuperAdminSuperAdminsPanel";

export default function SuperAdminShellPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
    else if (user.role !== "superadmin") navigate("/", { replace: true });
  }, [navigate, user]);

  if (!user || user.role !== "superadmin") return null;

  const displayName = (user.full_name || user.first_name || "Super Admin").toUpperCase();
  const email = user.email || "Akaun Super Admin";
  const photoUrl = user.profile_photo_url || "";
  const profileChip = photoUrl ? <img src={photoUrl} alt="" /> : <Icon>person</Icon>;

  const handleLogout = async () => {
    await recordLogoutActivity();
    clearAuthSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen min-w-[900px] bg-slate-50">
      <aside className={`fixed inset-y-0 left-0 flex flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ${isSidebarOpen ? "w-[350px]" : "w-[72px]"}`}>
        <div className={`grid h-[72px] items-center gap-2 border-b border-slate-200 ${isSidebarOpen ? "grid-cols-[minmax(0,1fr)_auto] px-4" : "grid-cols-1 justify-items-center px-0"}`}>
          <div className={`flex min-w-0 items-center gap-3 ${isSidebarOpen ? "" : "hidden"}`}>
            <img className="h-9 w-9 object-contain" src="/logo-dbku.png" alt="DBKU" />
            <div>
              <p className="font-semibold text-slate-950">Portal Kerjaya DBKU</p>
              <p className="text-xs text-slate-500">Super Admin</p>
            </div>
          </div>
          <button className="rounded-md border border-slate-200 bg-white p-2 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700" type="button" aria-label={isSidebarOpen ? "Kecilkan sidebar" : "Buka sidebar"} title={isSidebarOpen ? "Kecilkan sidebar" : "Buka sidebar"} onClick={() => setIsSidebarOpen((current) => !current)}>
            <Icon>menu</Icon>
          </button>
        </div>

        <nav className={`space-y-1 py-5 ${isSidebarOpen ? "px-4" : "px-3"}`}>
          {superAdminNavItems.map((item, index) => (
            item.kind === "section" ? (
              isSidebarOpen ? <p className="px-4 pb-2 pt-4 text-[13px] font-bold text-slate-400" key={`${item.label}-${index}`}>{item.label}</p> : <div className="h-6" key={`${item.label}-${index}`} />
            ) : (
              <NavLink
                className={({ isActive }) => `flex w-full items-center rounded-md py-3 text-left text-[15px] font-semibold ${isSidebarOpen ? "gap-4 px-4" : "justify-center px-0"} ${isActive ? "bg-emerald-50 text-slate-950" : "text-slate-950"}`}
                end
                key={`${item.label}-${index}`}
                title={!isSidebarOpen ? item.label : undefined}
                to={item.to}
              >
                <Icon>{item.icon}</Icon>
                {isSidebarOpen ? item.label : <span className="sr-only">{item.label}</span>}
              </NavLink>
            )
          ))}
        </nav>
      </aside>

      <main className={`min-h-screen bg-slate-50 transition-[margin] duration-200 ${isSidebarOpen ? "ml-[350px]" : "ml-[72px]"}`}>
        <header className="flex h-[72px] items-center justify-between border-b border-emerald-100 bg-white px-11">
          <div>
            <p className="text-sm font-bold text-slate-950">Selamat datang</p>
            <strong className="mt-1 block text-[17px] text-slate-950">{displayName}</strong>
          </div>
          <div className="profile-actions">
            <button type="button" className="profile-icon-button" aria-label="Notifikasi">
              <Icon>notifications</Icon>
            </button>
            <details className="profile-account-menu">
              <summary className="profile-account-trigger" aria-label="Menu profil">
                <span className="profile-user-chip">{profileChip}</span>
                <Icon>expand_more</Icon>
              </summary>
              <div className="profile-account-dropdown">
                <div className="profile-account-card-head">
                  <span className="profile-user-chip">{profileChip}</span>
                  <span>
                    <strong>{displayName}</strong>
                    <em>{email}</em>
                  </span>
                </div>
                <button type="button" className="profile-logout-button" onClick={handleLogout}>
                  <Icon>logout</Icon>
                  Log Keluar
                </button>
              </div>
            </details>
          </div>
        </header>
        <Routes>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SuperAdminDashboardPanel user={user} />} />
          <Route path="applicants" element={<SuperAdminApplicantsPanel />} />
          <Route path="admins" element={<SuperAdminAdministratorsPanel />} />
          <Route path="superadmins" element={<SuperAdminSuperAdminsPanel />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}
