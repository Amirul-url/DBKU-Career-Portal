import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/authApi";
import { Icon } from "../applicant/ApplicantAuthShared";

function valueOrDash(value) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  return value || "-";
}

function ReadOnlySection({ children, title }) {
  return <section className="rounded-lg border border-emerald-100 border-t-4 border-t-emerald-500 bg-white p-5"><h3 className="mb-4 text-lg font-bold text-slate-900">{title}</h3>{children}</section>;
}

function DetailGrid({ values }) {
  return <div className="grid gap-3 sm:grid-cols-2">{values.map(([label, value]) => <div key={label} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2"><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 break-words text-sm font-semibold text-slate-800">{valueOrDash(value)}</p></div>)}</div>;
}

function ApplicantProfileModal({ data, onClose }) {
  if (!data) return null;
  const { applicant, profile } = data;
  const personal = profile.personal || {};
  const details = personal.details || {};
  const preferences = profile.job_preferences || {};
  const experience = profile.experience || {};
  const academic = profile.academic || {};
  const skills = profile.skills || {};
  const name = personal.displayName || applicant.full_name || applicant.first_name || "Pemohon";
  const photo = personal.profilePhotoUrl || applicant.profile_photo_url;

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-5" role="presentation"><section className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-slate-50 shadow-2xl" role="dialog" aria-modal="true" aria-label={`Profil ${name}`}><header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4"><div><h2 className="text-xl font-bold text-slate-950">Profil Pemohon</h2><p className="mt-1 text-sm font-semibold text-slate-500">{name}</p></div><button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} type="button" aria-label="Tutup"><Icon>close</Icon></button></header><div className="space-y-5 overflow-y-auto p-6"><ReadOnlySection title="Maklumat Peribadi"><div className="mb-5 flex items-center gap-4">{photo ? <img className="h-16 w-16 rounded-full border border-emerald-200 object-cover" src={photo} alt="" /> : <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700">{name.charAt(0)}</span>}<div><p className="font-bold text-slate-950">{name}</p><p className="text-sm font-semibold text-slate-500">{personal.email || applicant.email}</p></div></div><DetailGrid values={[["Nombor MyKad", details.identificationNumber || applicant.mykad_number], ["Jantina", details.gender], ["Tarikh lahir", [details.birthDay, details.birthMonth, details.birthYear].filter(Boolean).join(" ")], ["Warganegara", details.citizenship], ["Telefon", details.primaryPhone || applicant.mobile_number], ["Alamat", details.address || applicant.address], ["Negeri", details.state], ["Bandar", details.city], ["Poskod", details.postcode], ["LinkedIn", details.linkedIn]]} /></ReadOnlySection><ReadOnlySection title="Pilihan Pekerjaan"><DetailGrid values={[["Status pencarian kerja", preferences.isLookingForJob], ["Matlamat kerjaya", preferences.careerObjective]]} />{(preferences.preferredJobs || []).map((job, index) => <div className="mt-4 rounded-md border border-slate-200 p-4" key={job.id || index}><p className="font-bold text-slate-900">Pilihan pekerjaan {index + 1}</p><div className="mt-3"><DetailGrid values={[["Jawatan", job.title], ["Tahap kerjaya", job.careerLevel], ["Negeri", job.state], ["Bandar", job.city], ["Sektor", job.sectors], ["Kemahiran", job.skills], ["Status pekerjaan", job.employmentStatuses], ["Gaji dijangka", job.expectedSalary]]} /></div></div>)}</ReadOnlySection><ReadOnlySection title="Pengalaman">{(experience.records || []).length ? <div className="space-y-3">{experience.records.map((record, index) => <div className="rounded-md border border-slate-200 p-4" key={record.id || index}><p className="font-bold text-slate-900">{record.title || "Jawatan tidak diisi"}</p><p className="mt-1 text-sm font-semibold text-slate-500">{record.organisation || "Organisasi tidak diisi"}</p><div className="mt-3"><DetailGrid values={[["Negara", record.country], ["Sektor", record.sectors], ["Tempoh", `${record.startMonth || ""} ${record.startYear || ""} - ${record.isCurrent ? "Kini" : `${record.endMonth || ""} ${record.endYear || ""}`}`], ["Deskripsi", record.description], ["Kemahiran", record.skills]]} /></div></div>)}</div> : <p className="text-sm text-slate-500">Tiada pengalaman direkodkan.</p>}</ReadOnlySection><ReadOnlySection title="Akademik">{(academic.records || []).length ? <div className="space-y-3">{academic.records.map((record, index) => <div className="rounded-md border border-slate-200 p-4" key={record.id || index}><p className="font-bold text-slate-900">{record.institution || "Institusi tidak diisi"}</p><div className="mt-3"><DetailGrid values={[["Tahap akademik", record.level], ["Bidang akademik", record.fieldOfStudy], ["Pengkhususan", record.specialization], ["Keputusan", record.result], ["Negara", record.country], ["Tarikh", `${record.startMonth || ""} ${record.startYear || ""} - ${record.isStudying ? "Sedang belajar" : `${record.endMonth || ""} ${record.endYear || ""}`}`], ["Gred SPM", Object.entries(record.spmGrades || {}).filter(([, value]) => value).map(([subject, grade]) => `${subject}: ${grade}`)]]} /></div></div>)}</div> : <p className="text-sm text-slate-500">Tiada akademik direkodkan.</p>}</ReadOnlySection><ReadOnlySection title="Kemahiran"><DetailGrid values={[["Kemahiran", skills.skills], ["Kemahiran MS Office", skills.microsoftOffice], ["Lesen memandu", skills.licences]]} />{(skills.languages || []).length ? <div className="mt-4"><p className="mb-2 text-sm font-bold text-slate-700">Bahasa</p><DetailGrid values={skills.languages.map((language, index) => [`Bahasa ${index + 1}`, `${language.name || "-"} · Pembacaan: ${language.reading || "-"} · Percakapan: ${language.speaking || "-"} · Penulisan: ${language.writing || "-"}`])} /></div> : null}</ReadOnlySection></div><footer className="border-t border-slate-200 bg-white px-6 py-4 text-right"><button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50" onClick={onClose} type="button">Tutup</button></footer></section></div>;
}

export default function SuperAdminApplicantsPanel() {
  const [applicants, setApplicants] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const loadApplicants = async () => {
    setLoading(true); setError("");
    try { setApplicants(await apiRequest(`/auth/applicants/${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`)); }
    catch (requestError) { setError(requestError.message || "Senarai pemohon tidak dapat dimuatkan."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    apiRequest("/auth/applicants/")
      .then((data) => setApplicants(data))
      .catch((requestError) => setError(requestError.message || "Senarai pemohon tidak dapat dimuatkan."))
      .finally(() => setLoading(false));
  }, []);
  const totalLabel = `${applicants.length} pemohon dijumpai.`;
  const viewProfile = async (id) => { setLoadingProfile(true); try { setProfile(await apiRequest(`/auth/applicants/${id}/profile/`)); } catch (requestError) { setError(requestError.message || "Profil pemohon tidak dapat dimuatkan."); } finally { setLoadingProfile(false); } };

  return <section className="p-8"><div className="mb-6 flex items-start justify-between gap-4"><div><h1 className="text-3xl font-bold text-slate-950">Pengurusan Pemohon</h1><p className="mt-1 text-slate-500">Semak akaun pemohon dan maklumat profil mereka.</p></div></div><form className="mb-5 flex gap-3 rounded-lg border border-slate-200 bg-white p-4" onSubmit={(event) => { event.preventDefault(); loadApplicants(); }}><input className="min-w-0 flex-1 rounded-md border border-slate-300 px-4 py-3 text-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama, MyKad, emel atau nombor telefon" /><button className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800" type="submit"><Icon>search</Icon>Tapis</button><button className="rounded-md border border-slate-300 px-4 font-bold text-slate-600" type="button" onClick={() => { setQuery(""); setTimeout(loadApplicants, 0); }}>Set Semula</button></form><div className="overflow-hidden rounded-lg border border-slate-200 bg-white"><header className="border-b border-slate-200 px-5 py-4"><h2 className="font-bold text-slate-950">Senarai Pemohon</h2><p className="mt-1 text-sm text-slate-500">{totalLabel}</p></header>{error ? <p className="m-5 rounded-md bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}<div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-4">Nama</th><th className="px-5 py-4">Nombor MyKad</th><th className="px-5 py-4">Emel</th><th className="px-5 py-4">Nombor Telefon</th><th className="px-5 py-4">Tindakan</th></tr></thead><tbody>{loading ? <tr><td className="px-5 py-6 text-slate-500" colSpan="5">Memuatkan pemohon...</td></tr> : applicants.length ? applicants.map((applicant) => <tr className="border-t border-slate-100" key={applicant.id}><td className="px-5 py-4 font-bold text-slate-900">{applicant.full_name || applicant.first_name}</td><td className="px-5 py-4 text-slate-600">{valueOrDash(applicant.mykad_number)}</td><td className="px-5 py-4 text-slate-600">{applicant.email}</td><td className="px-5 py-4 text-slate-600">{valueOrDash(applicant.mobile_number)}</td><td className="px-5 py-4"><button className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 font-bold text-slate-700 hover:bg-slate-50" type="button" onClick={() => viewProfile(applicant.id)}><Icon>visibility</Icon>{loadingProfile ? "Memuatkan" : "Lihat"}</button></td></tr>) : <tr><td className="px-5 py-6 text-slate-500" colSpan="5">Tiada pemohon ditemui.</td></tr>}</tbody></table></div></div><ApplicantProfileModal data={profile} onClose={() => setProfile(null)} /></section>;
}
