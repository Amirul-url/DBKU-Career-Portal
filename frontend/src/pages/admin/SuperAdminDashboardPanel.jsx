import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/authApi";
import { Icon } from "../applicant/ApplicantAuthShared";

const display = (value) => value || "-";

function StatCard({ accentClass, icon, rows, title }) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <header className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-md ${accentClass}`}>
          <Icon>{icon}</Icon>
        </span>
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      </header>
      <div>
        {rows.map((row) => (
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0" key={row.label}>
            <span className="flex items-center gap-3 font-semibold text-slate-600">
              <Icon>{row.icon}</Icon>
              {row.label}
            </span>
            <strong className="text-2xl text-slate-950">{row.value}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function AccessSummary({ user }) {
  return (
    <aside className="rounded-lg border border-slate-200 bg-white">
      <header className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-violet-100 text-violet-700">
          <Icon>shield_person</Icon>
        </span>
        <div>
          <h2 className="font-bold text-slate-950">Ringkasan Akses</h2>
          <p className="text-sm text-slate-500">Kebenaran anda</p>
        </div>
      </header>
      <div className="grid gap-3 p-5">
        <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <Icon>person</Icon>
            <h3 className="font-bold text-slate-950">Peranan Anda</h3>
          </div>
          <span className="mt-3 inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-white">{user?.role === "superadmin" ? "Super Admin" : display(user?.role)}</span>
        </section>
        <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <Icon>dashboard</Icon>
            <h3 className="font-bold text-slate-950">Akses Papan Pemuka</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">Super Admin boleh melihat ringkasan akaun pemohon, pentadbir DBKU dan akaun sistem.</p>
        </section>
        <section className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <Icon>admin_panel_settings</Icon>
            <h3 className="font-bold text-slate-950">Akses Pengurusan</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">Akses penuh untuk mengurus akaun Pemohon, Pentadbir DBKU dan Super Admin.</p>
        </section>
      </div>
    </aside>
  );
}

export default function SuperAdminDashboardPanel({ user }) {
  const [applicants, setApplicants] = useState([]);
  const [administrators, setAdministrators] = useState([]);
  const [superadmins, setSuperadmins] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");
    Promise.all([
      apiRequest("/auth/applicants/"),
      apiRequest("/auth/admin-accounts/"),
      apiRequest("/auth/superadmin-accounts/"),
    ]).then(([applicantData, administratorData, superadminData]) => {
      if (!isMounted) return;
      setApplicants(applicantData);
      setAdministrators(administratorData);
      setSuperadmins(superadminData);
    }).catch((requestError) => {
      if (!isMounted) return;
      setError(requestError.message || "Maklumat papan pemuka tidak dapat dimuatkan.");
    }).finally(() => {
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, []);

  const activityRows = useMemo(() => {
    const rows = [
      ...superadmins.map((account) => ({ ...account, roleLabel: "Super Admin" })),
      ...administrators.map((account) => ({ ...account, roleLabel: "Pentadbir" })),
      ...applicants.map((account) => ({ ...account, roleLabel: "Pemohon" })),
    ];
    return rows
      .sort((a, b) => String(b.last_login || "").localeCompare(String(a.last_login || "")))
      .slice(0, 5);
  }, [administrators, applicants, superadmins]);

  const totalAccounts = applicants.length + administrators.length + superadmins.length;

  return (
    <section className="p-8">
      <header className="mb-5">
        <h1 className="text-3xl font-bold text-slate-950">Papan Pemuka Super Admin</h1>
        <p className="mt-1 text-slate-500">Pantau akses akaun, aktiviti log masuk dan liputan pentadbir.</p>
      </header>

      {error ? <p className="mb-5 rounded-md bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}

      <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
        <StatCard accentClass="bg-emerald-50 text-emerald-700" icon="group" title="Akaun Pemohon" rows={[{ icon: "group", label: "Pemohon", value: loading ? "..." : applicants.length }]} />
        <StatCard accentClass="bg-emerald-50 text-emerald-700" icon="admin_panel_settings" title="Akaun DBKU" rows={[{ icon: "admin_panel_settings", label: "Pentadbir", value: loading ? "..." : administrators.length }]} />
        <StatCard accentClass="bg-blue-50 text-blue-700" icon="shield_person" title="Akaun Sistem" rows={[{ icon: "shield_person", label: "Super Admin", value: loading ? "..." : superadmins.length }]} />
        <StatCard accentClass="bg-amber-50 text-amber-700" icon="dashboard" title="Jumlah Akaun" rows={[{ icon: "person", label: "Keseluruhan", value: loading ? "..." : totalAccounts }]} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-950">Aktiviti Terkini</h2>
              <p className="mt-1 text-sm text-slate-500">{loading ? "Memuatkan aktiviti..." : `${activityRows.length} akaun terkini`}</p>
            </div>
          </header>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Aktiviti</th>
                  <th className="px-5 py-3">Peranan</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td className="px-5 py-6 text-slate-500" colSpan="2">Memuatkan aktiviti...</td></tr> : null}
                {!loading && activityRows.length ? activityRows.map((account) => (
                  <tr className="border-t border-slate-100" key={`${account.roleLabel}-${account.id}`}>
                    <td className="px-5 py-5">
                      <p className="font-bold text-slate-950">{display(account.first_name || account.full_name || account.email).toUpperCase()}</p>
                      <p className="mt-1 text-slate-600">{account.last_login ? "Log masuk" : "Akaun tersedia"}</p>
                      <p className="mt-1 text-slate-500">{account.last_login ? new Date(account.last_login).toLocaleString("ms-MY") : display(account.email)}</p>
                    </td>
                    <td className="px-5 py-5">
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">{account.roleLabel}</span>
                    </td>
                  </tr>
                )) : null}
                {!loading && !activityRows.length ? <tr><td className="px-5 py-6 text-slate-500" colSpan="2">Tiada aktiviti untuk dipaparkan.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>

        <AccessSummary user={user} />
      </div>
    </section>
  );
}
