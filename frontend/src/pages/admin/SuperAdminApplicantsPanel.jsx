import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/authApi";
import { Icon } from "../applicant/ApplicantAuthShared";

const text = (value) => Array.isArray(value) ? (value.length ? value.join(", ") : "-") : (value || "-");
const APPLICANTS_PER_PAGE = 5;

const hasValue = (value) => {
  if (Array.isArray(value)) return value.some(hasValue);
  if (value && typeof value === "object") return Object.values(value).some(hasValue);
  return value !== undefined && value !== null && String(value).trim() !== "";
};

const fileNameFromUrl = (url) => {
  if (!url) return "";
  try {
    const pathname = new URL(url, window.location.origin).pathname;
    return decodeURIComponent(pathname.split("/").filter(Boolean).pop() || "");
  } catch {
    return String(url).split("/").filter(Boolean).pop() || "";
  }
};

function FormRow({ label, children }) {
  return <section className="personal-form-row"><strong className="personal-form-section-label">{label}</strong><div className="personal-form-fields">{children}</div></section>;
}

function InfoHelper({ body, title }) {
  return <span className="personal-info-helper" tabIndex={0} aria-label={`${title}. ${body}`}>i<span className="personal-info-tooltip" role="tooltip"><strong>{title}</strong><span>{body}</span></span></span>;
}

function Field({ label, value, optional = false, placeholder = "", type = "text", hint = "", multiline = false, info = false }) {
  const controlValue = value || "";
  return <label className="personal-field"><span>{label}{optional ? <em> (tidak wajib)</em> : "*"}{info ? <InfoHelper title={label} body={info} /> : null}</span>{multiline ? <textarea readOnly rows={4} value={controlValue} placeholder={placeholder} /> : <input readOnly type={type} value={controlValue} placeholder={placeholder} />}{hint ? <small>{hint}</small> : null}</label>;
}

function SelectField({ label, value, optional = false, placeholder = "" }) {
  return <div className="personal-field"><span>{label}{optional ? <em> (tidak wajib)</em> : "*"}</span><div className={`personal-select-button ${value ? "" : "placeholder"}`}><span>{value || placeholder}</span><Icon>expand_more</Icon></div></div>;
}

function RadioGroup({ label, name, options, value }) {
  return <fieldset className="personal-radio-group"><legend>{label}*</legend><div>{options.map((option) => <label key={option}><input type="radio" name={`superadmin-${name}`} checked={value === option} readOnly />{option}</label>)}</div></fieldset>;
}

function FileCard({ icon, label }) {
  if (!label) return null;
  return <div className="personal-file-card"><span><Icon>{icon}</Icon></span><strong>{label}</strong></div>;
}

function UploadPrompt({ label, hint }) {
  return <div className="personal-field"><span>{label}<em> (tidak wajib)</em></span><small>{hint}</small></div>;
}

function ApplicantPersonalFormMirror({ applicant, profile }) {
  const personal = profile.personal || {};
  const details = personal.details || {};
  const name = personal.displayName || applicant.full_name || applicant.first_name || "Pemohon";
  const email = personal.email || applicant.email;
  const photo = personal.profilePhotoUrl || applicant.profile_photo_url;
  const resumeFile = details.resumeFile || fileNameFromUrl(personal.resumeFileUrl || applicant.resume_file_url);
  const videoResumeFile = details.videoResumeFile || fileNameFromUrl(personal.videoResumeFileUrl || applicant.video_resume_file_url);
  const references = Array.isArray(personal.references) ? personal.references.filter(hasValue) : [];

  return <div className="personal-edit-panel" aria-label="Mirror maklumat peribadi pemohon"><div className="personal-edit-form"><FormRow label="Foto Profil"><div className="personal-photo-upload"><div className="personal-photo-preview" aria-hidden="true">{photo ? <img src={photo} alt="" /> : name.charAt(0)}</div><div><strong>Muat naik foto profil anda <em>(tidak wajib)</em></strong><p>Saiz yang disyorkan: 512x512 pixels</p><p>Saiz fail maksimum: 5MB</p><p>Disyorkan: .jpg dan .png sahaja</p></div></div></FormRow><FormRow label="Maklumat Peribadi"><Field label="Nama Penuh" value={name} /><Field label="Nombor Kad Pengenalan" value={details.identificationNumber || applicant.mykad_number} /><div className="personal-date-group"><span>Tarikh Lahir*<InfoHelper title="Tarikh Lahir" body="Tarikh lahir anda ditetapkan berdasarkan nombor kad pengenalan anda." /></span><div><label>Hari<input readOnly value={details.birthDay || ""} /></label><label>Bulan<input readOnly value={details.birthMonth || ""} /></label><label>Tahun<input readOnly value={details.birthYear || ""} /></label></div></div><SelectField label="Bangsa" value={details.race} optional placeholder="Pilih bangsa" /><RadioGroup label="Kewarganegaraan" name="citizenship" options={["Malaysia", "Penduduk tetap"]} value={details.citizenship} /><RadioGroup label="Jantina" name="gender" options={["Perempuan", "Lelaki"]} value={details.gender} /></FormRow><FormRow label="Aksesibiliti dan Kesihatan"><div className="personal-helper-copy">Maklumat kesihatan anda adalah sulit dan tidak akan dikongsikan dengan DBKU. Pencari kerja bertanggungjawab untuk memaklumkan maklumat kesihatan anda kepada DBKU.</div><RadioGroup label="Adakah anda mempunyai sebarang masalah kesihatan?" name="health" options={["Ya", "Tidak"]} value={details.hasHealthIssue} /><RadioGroup label="Adakah anda mempunyai sebarang ketidakupayaan?" name="disability" options={["Ya", "Tidak"]} value={details.hasDisability} /></FormRow><FormRow label="Alamat"><SelectField label="Negeri" value={details.state} placeholder="Pilih negeri" /><SelectField label="Bandar" value={details.city} placeholder="Pilih bandar" /><SelectField label="Poskod" value={details.postcode} placeholder="Pilih poskod" /><Field label="Alamat" value={details.address || applicant.address} multiline /></FormRow><FormRow label="Butiran Hubungan"><Field label="Alamat E-mel" value={email} type="email" info="Alamat e-mel ini digunakan untuk log masuk dan makluman permohonan anda." /><Field label="Nombor Telefon Bimbit Utama" value={details.primaryPhone || applicant.mobile_number} type="tel" /><Field label="Nombor Telefon Bimbit Lain" value={details.secondaryPhone} type="tel" optional placeholder="Contoh. 0123456789" /></FormRow><FormRow label="Resume"><div className="personal-profile-tip"><header><span><Icon>emoji_objects</Icon></span><strong>Tingkatkan ketampakan profil anda.</strong></header><p>Ketengahkan bakat anda dan tingkatkan profil anda - muat naik resume dan video resume anda untuk menarik perhatian DBKU.</p></div><UploadPrompt label="Muat naik resume anda" hint="Word atau PDF sahaja (maksimum 5MB)" /><FileCard icon="description" label={resumeFile} /><UploadPrompt label="Muat naik resume video anda" hint=".mp4 sahaja (maksimum 5MB)" /><FileCard icon="movie" label={videoResumeFile} /><Field label="LinkedIn" value={details.linkedIn} type="url" optional hint="Isikan pautan URL ke profil LinkedIn anda." /></FormRow><FormRow label="Rujukan"><div className="personal-reference-copy"><strong>Tambah rujukan anda <em>(tidak wajib)</em></strong><p>Kukuhkan permohonan kerja anda dengan sertakan sokongan daripada DBKU atau mentor anda yang terdahulu.</p></div>{references.map((reference, index) => <div className="personal-reference-card" key={reference.id || index}><strong>Rujukan{references.length > 1 ? ` ${index + 1}` : ""}</strong><div className="personal-reference-fields"><Field label="Nama Rujukan" value={reference.name} /><Field label="Nama DBKU Rujukan" value={reference.employerName || reference.organisation} /><Field label="Jawatan Rujukan" value={reference.position || reference.relationship} /><Field label="Nombor Hubungan Rujukan" value={reference.phone} type="tel" /><Field label="Alamat E-mel Rujukan" value={reference.email} type="email" /></div></div>)}</FormRow></div></div>;
}

function PersonalProfileMirror({ applicant, profile }) {
  const [isMirrorOpen, setIsMirrorOpen] = useState(false);
  const personal = profile.personal || {};
  const name = personal.displayName || applicant.full_name || applicant.first_name || "Pemohon";
  const email = personal.email || applicant.email;
  const photo = personal.profilePhotoUrl || applicant.profile_photo_url;
  const resumeUrl = personal.resumeFileUrl || applicant.resume_file_url;
  const videoResumeUrl = personal.videoResumeFileUrl || applicant.video_resume_file_url;

  return <section className={`superadmin-personal-mirror overflow-hidden rounded-lg border bg-white ${isMirrorOpen ? "is-editing border-emerald-600" : "border-emerald-100"}`}><header className="flex items-center justify-between border-b border-slate-200 px-7 py-6"><h3 className="text-2xl font-bold text-slate-950">Maklumat Peribadi</h3><button className={`inline-flex items-center gap-2 font-bold ${isMirrorOpen ? "text-slate-950" : "text-emerald-700 hover:text-emerald-800"}`} type="button" onClick={() => setIsMirrorOpen((current) => !current)}>{isMirrorOpen ? null : <Icon>visibility</Icon>}{isMirrorOpen ? "Tutup" : "Lihat Butiran"}</button></header>{isMirrorOpen ? <div className="superadmin-personal-mirror-body"><ApplicantPersonalFormMirror applicant={applicant} profile={profile} /></div> : <div className="flex flex-col justify-between gap-6 px-7 py-6 md:flex-row md:items-center"><div className="flex items-center gap-5">{photo ? <img className="h-24 w-24 rounded-full border border-emerald-200 object-cover" src={photo} alt={`Foto profil ${name}`} /> : <span className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-3xl font-bold text-emerald-700">{name.charAt(0)}</span>}<div><p className="text-xl font-bold text-slate-950">{name}</p><p className="mt-2 font-semibold text-slate-600">{email}</p></div></div><div className="grid w-full gap-3 md:w-72">{resumeUrl ? <a className="inline-flex items-center justify-center gap-2 border border-emerald-200 px-4 py-3 font-bold text-emerald-600 hover:bg-emerald-50" href={resumeUrl} target="_blank" rel="noreferrer"><Icon>description</Icon>Muat Turun Resume (PDF)</a> : null}{videoResumeUrl ? <a className="inline-flex items-center justify-center gap-2 border border-emerald-200 px-4 py-3 font-bold text-emerald-600 hover:bg-emerald-50" href={videoResumeUrl} target="_blank" rel="noreferrer"><Icon>movie</Icon>Muat Turun Video (MP4)</a> : null}</div></div>}</section>;
}

function ApplicantProfileModal({ data, onClose }) {
  if (!data) return null;
  const name = data.profile.personal?.displayName || data.applicant.full_name || data.applicant.first_name || "Pemohon";
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-5"><section className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-slate-50 shadow-2xl" role="dialog" aria-modal="true" aria-label={`Profil ${name}`}><header className="flex items-center justify-between border-b border-slate-200 bg-white px-7 py-5"><div><h2 className="text-2xl font-bold text-slate-950">Profil Pemohon</h2><p className="mt-1 text-sm font-semibold text-slate-500">{name}</p></div><button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} type="button" aria-label="Tutup"><Icon>close</Icon></button></header><div className="overflow-y-auto p-7"><PersonalProfileMirror applicant={data.applicant} profile={data.profile} /></div></section></div>;
}

export default function SuperAdminApplicantsPanel() {
  const [applicants, setApplicants] = useState([]); const [query, setQuery] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [profile, setProfile] = useState(null); const [loadingProfile, setLoadingProfile] = useState(false); const [currentPage, setCurrentPage] = useState(1);
  const loadApplicants = async (search = query) => { setLoading(true); setError(""); try { setApplicants(await apiRequest(`/auth/applicants/${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ""}`)); setCurrentPage(1); } catch (requestError) { setError(requestError.message || "Senarai pemohon tidak dapat dimuatkan."); } finally { setLoading(false); } };
  useEffect(() => { apiRequest("/auth/applicants/").then((items) => { setApplicants(items); setCurrentPage(1); }).catch((requestError) => setError(requestError.message || "Senarai pemohon tidak dapat dimuatkan.")).finally(() => setLoading(false)); }, []);
  const pageCount = Math.max(1, Math.ceil(applicants.length / APPLICANTS_PER_PAGE));
  const pageStart = (currentPage - 1) * APPLICANTS_PER_PAGE;
  const visibleApplicants = applicants.slice(pageStart, pageStart + APPLICANTS_PER_PAGE);
  useEffect(() => { setCurrentPage((page) => Math.min(page, pageCount)); }, [pageCount]);
  const viewProfile = async (id) => { setLoadingProfile(true); try { setProfile(await apiRequest(`/auth/applicants/${id}/profile/`)); } catch (requestError) { setError(requestError.message || "Profil pemohon tidak dapat dimuatkan."); } finally { setLoadingProfile(false); } };
  return <section className="p-8"><div className="mb-6"><h1 className="text-3xl font-bold text-slate-950">Pengurusan Pemohon</h1><p className="mt-1 text-slate-500">Semak akaun pemohon dan maklumat profil mereka.</p></div><form className="mb-5 flex gap-3 rounded-lg border border-slate-200 bg-white p-4" onSubmit={(event) => { event.preventDefault(); loadApplicants(); }}><input className="min-w-0 flex-1 rounded-md border border-slate-300 px-4 py-3 text-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama, MyKad, emel atau nombor telefon" /><button className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800" type="submit"><Icon>search</Icon>Tapis</button><button className="rounded-md border border-slate-300 px-4 font-bold text-slate-600" type="button" onClick={() => { setQuery(""); loadApplicants(""); }}>Set Semula</button></form><div className="overflow-hidden rounded-lg border border-slate-200 bg-white"><header className="border-b border-slate-200 px-5 py-4"><h2 className="font-bold text-slate-950">Senarai Pemohon</h2><p className="mt-1 text-sm text-slate-500">{applicants.length} pemohon dijumpai.</p></header>{error ? <p className="m-5 rounded-md bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}<div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="w-20 px-5 py-4">No.</th><th className="px-5 py-4">Nama</th><th className="px-5 py-4">Nombor MyKad</th><th className="px-5 py-4">Emel</th><th className="px-5 py-4">Nombor Telefon</th><th className="px-5 py-4">Tindakan</th></tr></thead><tbody>{loading ? <tr><td className="px-5 py-6 text-slate-500" colSpan="6">Memuatkan pemohon...</td></tr> : visibleApplicants.length ? visibleApplicants.map((applicant, index) => <tr className="border-t border-slate-100" key={applicant.id}><td className="px-5 py-4 font-semibold text-slate-500">{pageStart + index + 1}</td><td className="px-5 py-4 font-bold text-slate-900">{applicant.full_name || applicant.first_name}</td><td className="px-5 py-4 text-slate-600">{text(applicant.mykad_number)}</td><td className="px-5 py-4 text-slate-600">{applicant.email}</td><td className="px-5 py-4 text-slate-600">{text(applicant.mobile_number)}</td><td className="px-5 py-4"><button className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 font-bold text-slate-700 hover:bg-slate-50" type="button" onClick={() => viewProfile(applicant.id)}><Icon>visibility</Icon>{loadingProfile ? "Memuatkan" : "Lihat"}</button></td></tr>) : <tr><td className="px-5 py-6 text-slate-500" colSpan="6">Tiada pemohon ditemui.</td></tr>}</tbody></table></div><footer className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm text-slate-500"><span>{applicants.length ? `Memaparkan ${pageStart + 1}-${Math.min(pageStart + APPLICANTS_PER_PAGE, applicants.length)} daripada ${applicants.length}` : "Tiada rekod untuk dipaparkan."}</span><div className="flex items-center gap-2"><button className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40" type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} aria-label="Halaman sebelumnya">&lt;</button><span className="font-semibold text-slate-700">{currentPage} / {pageCount}</span><button className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40" type="button" onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} disabled={currentPage === pageCount} aria-label="Halaman seterusnya">&gt;</button></div></footer></div><ApplicantProfileModal data={profile} onClose={() => setProfile(null)} /></section>;
}
