import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/authApi";
import { Icon } from "../applicant/ApplicantAuthShared";

const display = (value) => value || "-";
function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const todayInputValue = () => toDateInputValue(new Date());

function formatDuration(totalSeconds = 0) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

function formatActivityDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ms-MY", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatActivityRange(activity) {
  if (!activity?.created_at) return "-";
  if (activity.action !== "logout") return formatActivityDate(activity.created_at);

  const logoutDate = new Date(activity.created_at);
  const loginDate = new Date(logoutDate.getTime() - (activity.duration_seconds || 0) * 1000);
  return `${formatActivityDate(loginDate)} - ${logoutDate.toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit" })}`;
}

function buildActivitySessions(activities) {
  const skipNextLoginByUser = new Set();
  const sessions = [];

  activities.forEach((activity) => {
    const userKey = activity.email || activity.full_name || activity.id;
    if (activity.action === "logout") {
      skipNextLoginByUser.add(userKey);
      sessions.push({ ...activity, sessionLabel: "Log masuk - Log keluar" });
      return;
    }

    if (activity.action === "login" && skipNextLoginByUser.has(userKey)) {
      skipNextLoginByUser.delete(userKey);
      return;
    }

    sessions.push({ ...activity, sessionLabel: activity.action_label || "Log masuk" });
  });

  return sessions.slice(0, 5);
}

function StatCard({ accentClass, icon, rows, title }) {
  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <header className="flex items-center gap-3 border-b border-slate-200 px-5 py-3.5">
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${accentClass}`}>
          <Icon>{icon}</Icon>
        </span>
        <h2 className="text-base font-bold text-slate-950">{title}</h2>
      </header>
      <div>
        {rows.map((row) => (
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-3.5 last:border-b-0" key={row.label}>
            <span className="flex items-center gap-3 text-sm font-semibold text-slate-600">
              <Icon>{row.icon}</Icon>
              {row.label}
            </span>
            <strong className="text-xl font-bold text-slate-950">{row.value}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function AccessSummary({ user }) {
  return (
    <aside className="rounded-lg border border-slate-200 bg-white">
      <header className="flex items-center gap-3 border-b border-slate-200 px-5 py-3.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-violet-100 text-violet-700">
          <Icon>shield_person</Icon>
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-950">Ringkasan Akses</h2>
          <p className="text-xs text-slate-500">Kebenaran anda</p>
        </div>
      </header>
      <div className="grid gap-3 p-4">
        <section className="rounded-md border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex items-center gap-3">
            <Icon>person</Icon>
            <h3 className="text-base font-bold text-slate-950">Peranan Anda</h3>
          </div>
          <span className="mt-3 inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-white">{user?.role === "superadmin" ? "Super Admin" : display(user?.role)}</span>
        </section>
        <section className="rounded-md border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex items-center gap-3">
            <Icon>dashboard</Icon>
            <h3 className="text-base font-bold text-slate-950">Akses Papan Pemuka</h3>
          </div>
          <p className="mt-2 text-sm leading-5 text-slate-600">Super Admin boleh melihat ringkasan akaun pemohon, pentadbir DBKU dan akaun sistem.</p>
        </section>
        <section className="rounded-md border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex items-center gap-3">
            <Icon>admin_panel_settings</Icon>
            <h3 className="text-base font-bold text-slate-950">Akses Pengurusan</h3>
          </div>
          <p className="mt-2 text-sm leading-5 text-slate-600">Akses penuh untuk mengurus akaun Pemohon, Pentadbir DBKU dan Super Admin.</p>
        </section>
      </div>
    </aside>
  );
}

export default function SuperAdminDashboardPanel({ user }) {
  const [applicants, setApplicants] = useState([]);
  const [administrators, setAdministrators] = useState([]);
  const [superadmins, setSuperadmins] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activityDate, setActivityDate] = useState(todayInputValue);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);

  const loadActivities = useCallback((selectedDate = activityDate) => {
    setActivityLoading(true);
    const params = new URLSearchParams({ limit: "50" });
    params.set("date", selectedDate || todayInputValue());
    return apiRequest(`/auth/account-activities/?${params.toString()}`)
      .then(setActivities)
      .catch((requestError) => setError(requestError.message || "Aktiviti akaun tidak dapat dimuatkan."))
      .finally(() => setActivityLoading(false));
  }, [activityDate]);

  useEffect(() => {
    let isMounted = true;
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

  useEffect(() => {
    Promise.resolve().then(() => loadActivities(activityDate));
  }, [activityDate, loadActivities]);

  const activitySessions = useMemo(() => buildActivitySessions(activities), [activities]);

  const updateActivityDate = (value) => {
    setActivityDate(value || todayInputValue());
  };

  return (
    <section className="p-7">
      <header className="mb-5">
        <h1 className="text-2xl font-bold text-slate-950">Papan Pemuka Super Admin</h1>
        <p className="mt-1 text-sm text-slate-500">Pantau akses akaun, aktiviti log masuk dan liputan pentadbir.</p>
      </header>

      {error ? <p className="mb-5 rounded-md bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}

      <div className="grid gap-4 xl:grid-cols-3 md:grid-cols-2">
        <StatCard accentClass="bg-emerald-50 text-emerald-700" icon="group" title="Akaun Pemohon" rows={[{ icon: "group", label: "Pemohon", value: loading ? "..." : applicants.length }]} />
        <StatCard accentClass="bg-emerald-50 text-emerald-700" icon="admin_panel_settings" title="Akaun DBKU" rows={[{ icon: "admin_panel_settings", label: "Pentadbir", value: loading ? "..." : administrators.length }]} />
        <StatCard accentClass="bg-blue-50 text-blue-700" icon="shield_person" title="Akaun Sistem" rows={[{ icon: "shield_person", label: "Super Admin", value: loading ? "..." : superadmins.length }]} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-3.5">
            <div>
              <h2 className="text-base font-bold text-slate-950">Aktiviti Terkini</h2>
              <p className="mt-1 text-xs text-slate-500">{activityLoading ? "Memuatkan aktiviti..." : `${activitySessions.length} aktiviti akaun terkini`}</p>
            </div>
            <div className="flex items-center gap-2">
              <input className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" type="date" value={activityDate} onChange={(event) => updateActivityDate(event.target.value)} aria-label="Pilih tarikh aktiviti" />
              <button className="inline-flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-md border border-slate-200 text-slate-400 opacity-50" type="button" aria-label="Tarikh sebelumnya" disabled>
                <Icon>chevron_left</Icon>
              </button>
              <button className="inline-flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-md border border-slate-200 text-slate-400 opacity-50" type="button" aria-label="Tarikh seterusnya" disabled>
                <Icon>chevron_right</Icon>
              </button>
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
                {activityLoading ? <tr><td className="px-5 py-6 text-slate-500" colSpan="2">Memuatkan aktiviti...</td></tr> : null}
                {!activityLoading && activitySessions.length ? activitySessions.map((activity) => (
                  <tr className="border-t border-slate-100" key={activity.id}>
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-slate-950">{display(activity.full_name || activity.email).toUpperCase()}</p>
                      <p className="mt-1 text-sm text-slate-600">{activity.sessionLabel}</p>
                      <p className="mt-1 text-sm text-slate-500">Jumlah masa: {formatDuration(activity.duration_seconds)}</p>
                      <p className="mt-1 text-sm text-slate-500">{formatActivityRange(activity)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600">{activity.role_label}</span>
                    </td>
                  </tr>
                )) : null}
                {!activityLoading && !activitySessions.length ? <tr><td className="px-5 py-6 text-slate-500" colSpan="2">Tiada aktiviti untuk dipaparkan.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>

        <AccessSummary user={user} />
      </div>
    </section>
  );
}
