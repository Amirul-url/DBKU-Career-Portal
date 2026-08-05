import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredUser } from "../../lib/authApi";
import { Icon } from "../applicant/ApplicantAuthShared";

const items = [["dashboard", "Papan Pemuka"], ["section", "PEMOHON"], ["group", "Pemohon"], ["section", "DBKU"], ["admin_panel_settings", "Pentadbir"], ["section", "SISTEM"], ["shield_person", "Super Admin"]];

export default function SuperAdminShellPage() {
  const navigate = useNavigate(); const user = getStoredUser();
  useEffect(() => { if (!user) navigate("/login", { replace: true }); else if (user.role !== "superadmin") navigate("/", { replace: true }); }, [navigate, user]);
  if (!user || user.role !== "superadmin") return null;
  return <div className="min-h-screen min-w-[900px] bg-slate-50"><aside className="fixed inset-y-0 left-0 w-[350px] border-r border-slate-200 bg-white"><div className="grid h-[72px] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-slate-200 px-4"><div className="flex items-center gap-3"><img className="h-9 w-9 object-contain" src="/logo-dbku.png" alt="DBKU"/><div><p className="font-semibold text-slate-950">Portal Kerjaya DBKU</p><p className="text-xs text-slate-500">Super Admin</p></div></div><button className="rounded-md border border-slate-200 bg-white p-2 text-slate-700"><Icon>menu</Icon></button></div><nav className="space-y-1 px-4 py-5">{items.map(([icon, label], index) => icon === "section" ? <p className="px-4 pb-2 pt-4 text-[13px] font-bold text-slate-400" key={`${label}-${index}`}>{label}</p> : <button className={`flex w-full items-center gap-4 rounded-md px-4 py-3 text-left text-[15px] font-semibold ${index === 0 ? "bg-emerald-50 text-slate-950" : "text-slate-950"}`} key={`${label}-${index}`} type="button"><Icon>{icon}</Icon>{label}</button>)}</nav></aside><main className="ml-[350px] min-h-screen bg-slate-50" /></div>;
}
