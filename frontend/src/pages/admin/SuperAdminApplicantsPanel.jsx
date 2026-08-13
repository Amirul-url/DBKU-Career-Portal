import { useEffect, useState } from "react";
import { apiRequest, resolveMediaUrl } from "../../lib/authApi";
import { Icon } from "../applicant/ApplicantAuthShared";

const text = (value) => Array.isArray(value) ? (value.length ? value.join(", ") : "-") : (value || "-");
const APPLICANTS_PER_PAGE = 5;
const employmentStatusOptions = ["Tetap", "Sementara", "Sambilan", "Kontrak", "Perantisan", "Latihan Industri", "Bekerja sendiri"];
const workTimeOptions = ["Waktu Biasa", "Syif 3 Masa", "Syif 2 Masa", "Waktu Fleksibel", "Syif Malam", "HIBRID"];
const salaryRangeOptions = ["< 1,200", "1,200 - 1,499", "1,500 - 1,999", "2,000 - 2,499", "2,500 - 2,999", "3,000 - 3,499", "3,500 - 3,999", "4,000 - 4,999", "5,000 - 5,999", "6,000 - 7,999", "8,000 - 9,999", "10,000 - 12,999", "13,000 - 15,999", "> 16,000"];
const schoolGradeAcademicLevels = new Set(["Sekolah Rendah atau Ke Bawah", "PMR / PT3 atau Yang Setaraf", "SPM / O Level / SKM Tahap 1 / SKM Tahap 2 / SKM Tahap 3 atau Yang Setaraf"]);
const higherAcademicLevels = new Set(["Diploma / Diploma Lanjutan / Diploma Graduan Atasan / DVM / DKM Tahap 4 / DLKM Tahap 5", "Sarjana Muda atau Yang Setaraf", "Sarjana atau Yang Setaraf", "Doktor Falsafah (PhD) atau Yang Setaraf"]);

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

function Field({ label, value, optional = false, noIndicator = false, placeholder = "", type = "text", hint = "", multiline = false, info = false }) {
  const controlValue = value || "";
  return <label className="personal-field"><span>{label}{noIndicator ? null : optional ? <em> (tidak wajib)</em> : "*"}{info ? <InfoHelper title={label} body={info} /> : null}</span>{multiline ? <textarea readOnly rows={4} value={controlValue} placeholder={placeholder} /> : <input readOnly type={type} value={controlValue} placeholder={placeholder} />}{hint ? <small>{hint}</small> : null}</label>;
}

function SelectField({ label, value, optional = false, noIndicator = false, placeholder = "" }) {
  return <div className="personal-field"><span>{label}{noIndicator ? null : optional ? <em> (tidak wajib)</em> : "*"}</span><div className={`personal-select-button ${value ? "" : "placeholder"}`}><span>{value || placeholder}</span><Icon>expand_more</Icon></div></div>;
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

const asArray = (value) => Array.isArray(value) ? value : [];
const joinValues = (value) => asArray(value).filter(hasValue).join(", ");
const formatMonthYear = (month, year) => [month, year].filter(hasValue).join(" ");
const normalizeSubjectGrades = (record) => {
  const rawGrades = Array.isArray(record?.subjectGrades)
    ? record.subjectGrades
    : Object.entries(record?.spmGrades || {}).map(([subject, grade]) => ({ subject, grade }));

  return rawGrades
    .map((item) => ({ grade: item?.grade || "", subject: item?.subject || "" }))
    .filter((item) => item.subject || item.grade);
};

function TextBlock({ children }) {
  return <div className="profile-empty-row"><span><Icon>info</Icon></span><p>{children}</p></div>;
}

function MultiField({ label, value, optional = false, placeholder = "" }) {
  return <Field label={label} value={joinValues(value)} optional={optional} placeholder={placeholder} />;
}

function ReadOnlyCheckbox({ checked, label }) {
  return <label className="job-checkbox-row"><input type="checkbox" checked={Boolean(checked)} readOnly /><span>{label}</span></label>;
}

function JobSearchPreview({ label, value, placeholder, helper }) {
  return <div className="personal-field"><span>{label}*</span><div className="job-search-input"><Icon>search</Icon><input readOnly value={value || ""} placeholder={placeholder} /></div>{helper ? <small>{helper}</small> : null}</div>;
}

function SelectedList({ title, values }) {
  const selectedValues = asArray(values).filter(hasValue);
  if (!selectedValues.length) return null;
  return <div className="job-selected-list"><strong>{title} ({selectedValues.length})</strong><div>{selectedValues.map((value) => <button type="button" key={value}><span>{value}</span><Icon>cancel</Icon></button>)}</div></div>;
}

function MultiSelectPreview({ label, values, selectedLabel, optional = false, placeholder = "Pilih satu atau lebih" }) {
  const selectedValues = asArray(values).filter(hasValue);
  return <div className="personal-field"><span>{label}{optional ? <em> (tidak wajib)</em> : "*"}</span><div className={`personal-select-button ${selectedValues.length ? "" : "placeholder"}`}><span>{selectedValues.length ? `${selectedValues.length} dipilih` : placeholder}</span><Icon>expand_more</Icon></div><SelectedList title={selectedLabel} values={selectedValues} /></div>;
}

function ChoicePillPreview({ label, options, values }) {
  const selectedValues = asArray(values);
  return <fieldset className="job-choice-group"><legend>{label}*</legend><div>{options.map((option) => <button type="button" className={selectedValues.includes(option) ? "selected" : ""} key={option}>{selectedValues.includes(option) ? <Icon>check</Icon> : null}{option}</button>)}</div></fieldset>;
}

function SubjectGradesPreview({ record }) {
  const subjectGrades = normalizeSubjectGrades(record);
  if (!subjectGrades.length) return null;

  return <div className="spm-grades"><strong>Gred mata pelajaran <em>(tidak wajib)</em></strong><div>{subjectGrades.map((item, index) => <Field key={`${item.subject}-${index}`} label={item.subject || `Subjek ${index + 1}`} value={item.grade} noIndicator placeholder="Contoh. A+, A1" />)}</div></div>;
}

function ProfileMirrorCard({ children, details, isOpen, onToggle, title }) {
  return <section className={`superadmin-personal-mirror overflow-hidden rounded-lg border bg-white ${isOpen ? "is-editing border-emerald-600" : "border-emerald-100"}`}><header className="flex items-center justify-between border-b border-slate-200 px-7 py-6"><h3 className="text-2xl font-bold text-slate-950">{title}</h3><button className={`inline-flex items-center gap-2 font-bold ${isOpen ? "text-slate-950" : "text-emerald-700 hover:text-emerald-800"}`} type="button" onClick={onToggle}>{isOpen ? null : <Icon>visibility</Icon>}{isOpen ? "Tutup" : "Lihat Butiran"}</button></header>{isOpen ? <div className="superadmin-personal-mirror-body">{details}</div> : children}</section>;
}

function ApplicantPersonalFormMirror({ applicant, profile }) {
  const personal = profile.personal || {};
  const details = personal.details || {};
  const name = personal.displayName || applicant.full_name || applicant.first_name || "Pemohon";
  const email = personal.email || applicant.email;
  const photo = resolveMediaUrl(personal.profilePhotoUrl || applicant.profile_photo_url);
  const resumeFile = details.resumeFile || fileNameFromUrl(resolveMediaUrl(personal.resumeFileUrl || applicant.resume_file_url));
  const videoResumeFile = details.videoResumeFile || fileNameFromUrl(resolveMediaUrl(personal.videoResumeFileUrl || applicant.video_resume_file_url));
  const references = Array.isArray(personal.references) ? personal.references.filter(hasValue) : [];

  return <div className="personal-edit-panel" aria-label="Mirror maklumat peribadi pemohon"><div className="personal-edit-form"><FormRow label="Foto Profil"><div className="personal-photo-upload"><div className="personal-photo-preview" aria-hidden="true">{photo ? <img src={photo} alt="" /> : name.charAt(0)}</div><div><strong>Muat naik foto profil anda <em>(tidak wajib)</em></strong><p>Saiz yang disyorkan: 512x512 pixels</p><p>Saiz fail maksimum: 5MB</p><p>Disyorkan: .jpg dan .png sahaja</p></div></div></FormRow><FormRow label="Maklumat Peribadi"><Field label="Nama Penuh" value={name} /><Field label="Nombor Kad Pengenalan" value={details.identificationNumber || applicant.mykad_number} /><div className="personal-date-group"><span>Tarikh Lahir*<InfoHelper title="Tarikh Lahir" body="Tarikh lahir anda ditetapkan berdasarkan nombor kad pengenalan anda." /></span><div><label>Hari<input readOnly value={details.birthDay || ""} /></label><label>Bulan<input readOnly value={details.birthMonth || ""} /></label><label>Tahun<input readOnly value={details.birthYear || ""} /></label></div></div><SelectField label="Bangsa" value={details.race} optional placeholder="Pilih bangsa" /><RadioGroup label="Kewarganegaraan" name="citizenship" options={["Malaysia", "Penduduk tetap"]} value={details.citizenship} /><RadioGroup label="Jantina" name="gender" options={["Perempuan", "Lelaki"]} value={details.gender} /></FormRow><FormRow label="Aksesibiliti dan Kesihatan"><div className="personal-helper-copy">Maklumat kesihatan anda adalah sulit dan tidak akan dikongsikan dengan DBKU. Pencari kerja bertanggungjawab untuk memaklumkan maklumat kesihatan anda kepada DBKU.</div><RadioGroup label="Adakah anda mempunyai sebarang masalah kesihatan?" name="health" options={["Ya", "Tidak"]} value={details.hasHealthIssue} /><RadioGroup label="Adakah anda mempunyai sebarang ketidakupayaan?" name="disability" options={["Ya", "Tidak"]} value={details.hasDisability} /></FormRow><FormRow label="Alamat"><SelectField label="Negeri" value={details.state} placeholder="Pilih negeri" /><SelectField label="Bandar" value={details.city} placeholder="Pilih bandar" /><SelectField label="Poskod" value={details.postcode} placeholder="Pilih poskod" /><Field label="Alamat" value={details.address || applicant.address} multiline /></FormRow><FormRow label="Butiran Hubungan"><Field label="Alamat E-mel" value={email} type="email" info="Alamat e-mel ini digunakan untuk log masuk dan makluman permohonan anda." /><Field label="Nombor Telefon Bimbit Utama" value={details.primaryPhone || applicant.mobile_number} type="tel" /><Field label="Nombor Telefon Bimbit Lain" value={details.secondaryPhone} type="tel" optional placeholder="Contoh. 0123456789" /></FormRow><FormRow label="Resume"><div className="personal-profile-tip"><header><span><Icon>emoji_objects</Icon></span><strong>Tingkatkan ketampakan profil anda.</strong></header><p>Ketengahkan bakat anda dan tingkatkan profil anda - muat naik resume dan video resume anda untuk menarik perhatian DBKU.</p></div><UploadPrompt label="Muat naik resume anda" hint="Word atau PDF sahaja (maksimum 5MB)" /><FileCard icon="description" label={resumeFile} /><UploadPrompt label="Muat naik resume video anda" hint=".mp4 sahaja (maksimum 5MB)" /><FileCard icon="movie" label={videoResumeFile} /><Field label="LinkedIn" value={details.linkedIn} type="url" optional hint="Isikan pautan URL ke profil LinkedIn anda." /></FormRow><FormRow label="Rujukan"><div className="personal-reference-copy"><strong>Tambah rujukan anda <em>(tidak wajib)</em></strong><p>Kukuhkan permohonan kerja anda dengan sertakan sokongan daripada DBKU atau mentor anda yang terdahulu.</p></div>{references.map((reference, index) => <div className="personal-reference-card" key={reference.id || index}><strong>Rujukan{references.length > 1 ? ` ${index + 1}` : ""}</strong><div className="personal-reference-fields"><Field label="Nama Rujukan" value={reference.name} /><Field label="Nama DBKU Rujukan" value={reference.employerName || reference.organisation} /><Field label="Jawatan Rujukan" value={reference.position || reference.relationship} /><Field label="Nombor Hubungan Rujukan" value={reference.phone} type="tel" /><Field label="Alamat E-mel Rujukan" value={reference.email} type="email" /></div></div>)}</FormRow></div></div>;
}

function JobPreferencesMirror({ data, isOpen, onToggle }) {
  const preferences = data || {};
  const jobs = asArray(preferences.preferredJobs);
  const hasContent = hasValue(preferences.careerObjective) || hasValue(preferences.isLookingForJob) || jobs.some(hasValue);
  const summary = hasContent ? <div className="job-preference-summary px-7 py-6"><div className="job-preference-status"><span><Icon>{preferences.isLookingForJob === "Ya" ? "visibility" : "visibility_off"}</Icon></span><div><strong>{preferences.isLookingForJob === "Ya" ? "Sedang mencari pekerjaan" : "Tidak mencari pekerjaan"}</strong><p>{preferences.isLookingForJob === "Ya" ? "Profil pemohon boleh dipadankan dengan kekosongan yang sesuai." : "Profil pemohon tidak berada dalam senarai padanan kekosongan DBKU."}</p></div></div>{preferences.careerObjective ? <section className="job-preference-objective"><strong>Matlamat Kerjaya</strong><p>{preferences.careerObjective}</p></section> : null}{jobs.length ? <div className="job-preference-card-list">{jobs.map((job, index) => <article className="job-preference-card" key={job.id || index}><strong>{job.title || "Pilihan pekerjaan belum lengkap"}</strong>{job.careerLevel ? <span>{job.careerLevel}</span> : null}{asArray(job.employmentStatuses).length ? <span>{job.employmentStatuses.join(", ")}</span> : null}{asArray(job.expectedSalary).length ? <span>Gaji dijangka: RM {job.expectedSalary.join(", ")}</span> : null}</article>)}</div> : null}</div> : <div className="px-7 py-6"><TextBlock>Tetapkan matlamat kerjaya, keterlihatan profil dan pilihan pekerjaan yang diminati.</TextBlock></div>;
  const details = <div className="personal-edit-panel"><div className="personal-edit-form"><FormRow label="Keterlihatan Profil"><RadioGroup label="Adakah anda sedang mencari pekerjaan?" name="job-search-status" options={["Ya", "Tidak"]} value={preferences.isLookingForJob} /><p className="job-preference-note">Jika anda memilih 'Tidak', profil anda tidak akan berada dalam senarai padanan kekosongan oleh DBKU.</p></FormRow><FormRow label="Matlamat Kerjaya"><Field label="Matlamat kerjaya" value={preferences.careerObjective} multiline /></FormRow><FormRow label="Pilihan Pekerjaan"><div className="personal-reference-copy"><strong>Tambahkan pilihan pekerjaan anda*</strong><p>Tambah dalam profesion pilihan anda untuk mendapatkan hasil padanan kerja yang lebih baik.</p></div>{jobs.length ? jobs.map((job, index) => <div className="job-preference-edit-card" key={job.id || index}><Field label="Pilihan Pekerjaan" value={job.title} /><small>Sila masukkan dan pilih pekerjaan yang paling hampir yang anda cari.</small><ReadOnlyCheckbox checked={job.hasRelatedExperience} label="Saya mempunyai pengalaman berkaitan kerja ini" /><SelectField label="Taraf Jawatan Pilihan" value={job.careerLevel} placeholder="Pilih tahap kerjaya" /><SelectField label="Sektor Pilihan" value={asArray(job.sectors).length ? `${asArray(job.sectors).length} sektor dipilih` : ""} placeholder="Pilih satu atau lebih" /><SelectedList title="Sektor Pilihan Ditambah" values={job.sectors} /><JobSearchPreview label="Kemahiran Berkaitan" value="" placeholder="Contoh. Perform market research" helper="Anda boleh membuat penambahan kemahiran yang anda miliki secara manual." /><SelectedList title="Kemahiran Anda" values={job.skills} /><ChoicePillPreview label="Status Pilihan Pekerjaan" options={employmentStatusOptions} values={job.employmentStatuses} /><ChoicePillPreview label="Pilihan Waktu Bekerja" options={workTimeOptions} values={job.workTimes} /><ChoicePillPreview label="Gaji Yang Dijangkakan (MYR)" options={salaryRangeOptions} values={job.expectedSalary} /><SelectField label="Negeri" value={job.state} optional placeholder="Pilih negeri" /><SelectField label="Bandar" value={job.city} optional placeholder="Pilih bandar" /><SelectField label="Jarak" value={job.distance} optional placeholder="Pilih jarak" /></div>) : <TextBlock>Tiada pilihan pekerjaan direkodkan.</TextBlock>}</FormRow></div></div>;
  return <ProfileMirrorCard title="Pilihan Pekerjaan" details={details} isOpen={isOpen} onToggle={onToggle}>{summary}</ProfileMirrorCard>;
}

function ExperienceMirror({ data, isOpen, onToggle }) {
  const experience = data || {};
  const records = asArray(experience.records);
  const summary = records.length ? <div className="job-preference-card-list experience-summary-list px-7 py-6">{records.map((record, index) => <article className="job-preference-card experience-summary-card" key={record.id || index}><span className="experience-summary-index">Pengalaman {index + 1}</span><strong>{record.title || "Pekerjaan belum diisi"}</strong>{record.careerLevel ? <span>{record.careerLevel}</span> : null}{record.organisation ? <span>{record.organisation}</span> : null}{formatMonthYear(record.startMonth, record.startYear) || record.isCurrent || formatMonthYear(record.endMonth, record.endYear) ? <span>{[formatMonthYear(record.startMonth, record.startYear), record.isCurrent ? "Kini" : formatMonthYear(record.endMonth, record.endYear)].filter(Boolean).join(" - ")}</span> : null}</article>)}</div> : <div className="px-7 py-6"><TextBlock>Tambah pengalaman kerja, latihan industri atau projek berkaitan.</TextBlock></div>;
  const details = <div className="personal-edit-panel experience-form"><div className="personal-edit-form"><FormRow label="Status Bekerja"><SelectField label="Status pekerjaan semasa" value={experience.employmentStatus} placeholder="Pilih status pekerjaan" /></FormRow><FormRow label="Pengalaman Kerja"><RadioGroup label="Adakah anda mempunyai pengalaman bekerja?" name="experience-status" options={["Ya, saya mula bekerja sejak:", "Tidak"]} value={experience.hasExperience} />{String(experience.hasExperience || "").startsWith("Ya") ? <div className="experience-details"><strong>Tarikh mula <em>(tidak wajib)</em></strong><div className="personal-date-group"><Field label="Bulan" value={experience.startMonth} noIndicator placeholder="Pilih" /><Field label="Tahun" value={experience.startYear} noIndicator placeholder="Pilih" /></div><strong>Tambah pengalaman kerja anda*</strong><p>Tingkatkan peluang anda dengan memaparkan pengalaman kerja terdahulu.</p>{records.length ? records.map((record, index) => <div className="experience-record" key={record.id || index}><strong>Pengalaman {index + 1}</strong><JobSearchPreview label="Pekerjaan" value={record.title} placeholder="Contoh. Pembangun laman web" /><SelectField label="Taraf Jawatan" value={record.careerLevel} placeholder="Pilih taraf jawatan" /><Field label="Syarikat" value={record.organisation} placeholder="Contoh. DBKU" /><SelectField label="Negara" value={record.country} optional placeholder="Pilih negara" /><MultiSelectPreview label="Sektor" values={record.sectors} selectedLabel="Sektor Ditambah" /><div className="experience-date-grid"><SelectField label="Tarikh Mula - Bulan" value={record.startMonth} placeholder="Pilih" /><SelectField label="Tarikh Mula - Tahun" value={record.startYear} placeholder="Pilih" /><SelectField label="Tarikh Akhir - Bulan" value={record.isCurrent ? "" : record.endMonth} placeholder="Pilih" /><SelectField label="Tarikh Akhir - Tahun" value={record.isCurrent ? "" : record.endYear} placeholder="Pilih" /></div><ReadOnlyCheckbox checked={record.isCurrent} label="Saya masih bekerja di sini" /><Field label="Deskripsi Jawatan" value={record.description} optional multiline placeholder="Masukkan deskripsi tugas" /><JobSearchPreview label="Kemahiran Berkaitan" value="" placeholder="Contoh. Perform market research" helper="Anda boleh membuat penambahan kemahiran yang anda miliki secara manual." /><SelectedList title="Kemahiran Anda" values={record.skills} /><SelectField label="Purata Gaji (MYR)" value={record.salary} placeholder="Pilih purata gaji" /></div>) : <TextBlock>Tiada pengalaman kerja direkodkan.</TextBlock>}</div> : null}</FormRow></div></div>;
  return <ProfileMirrorCard title="Pengalaman" details={details} isOpen={isOpen} onToggle={onToggle}>{summary}</ProfileMirrorCard>;
}

function AcademicMirror({ data, isOpen, onToggle }) {
  const records = asArray(data?.records);
  const summary = records.length ? <div className="job-preference-card-list academic-summary-list px-7 py-6">{records.map((record, index) => <article className="job-preference-card academic-summary-card" key={record.id || index}><span className="experience-summary-index">Akademik {index + 1}</span><strong>{record.institution || "Institusi belum diisi"}</strong>{record.level ? <span>{record.level}</span> : null}{record.fieldOfStudy ? <span>{record.fieldOfStudy}</span> : null}{record.specialization ? <span>{record.specialization}</span> : null}{record.result ? <span>{record.result}</span> : null}</article>)}</div> : <div className="px-7 py-6"><TextBlock>Masukkan kelayakan akademik supaya permohonan lebih lengkap.</TextBlock></div>;
  const details = <div className="academic-layout"><strong className="academic-layout-label">Akademik</strong><div className="academic-form"><p className="academic-intro">Tambah latar belakang akademik anda<span>*</span></p><div className="academic-record-list">{records.length ? records.map((record, index) => <section className="academic-record" key={record.id || index}><strong>Akademik {index + 1}</strong><SelectField label="Tahap Akademik" value={record.level} placeholder="Pilih tahap akademik" />{schoolGradeAcademicLevels.has(record.level) ? <SubjectGradesPreview record={record} /> : null}{higherAcademicLevels.has(record.level) ? <><SelectField label="Bidang Akademik" value={record.fieldOfStudy} placeholder="Pilih bidang akademik" /><Field label="Pengkhususan" value={record.specialization} optional hint={`Maksimum ${10000 - String(record.specialization || "").length} huruf`} placeholder="Contoh. Software Engineering" /></> : null}<Field label="Nama Institusi Akademik" value={record.institution} hint={`Maksimum ${10000 - String(record.institution || "").length} huruf`} placeholder="Contoh. Universiti Sains Malaysia" /><SelectField label="Negara" value={record.country} placeholder="Pilih negara" /><Field label="Keputusan" value={record.result} optional hint={`Maksimum ${10000 - String(record.result || "").length} huruf`} placeholder="Contoh. 12A 3B+, CGPA 4.0, Cemerlang" /><div className="academic-date-section"><strong>Tarikh Mula <em>(tidak wajib)</em></strong><div className="academic-date-grid"><SelectField label="Bulan" value={record.startMonth} noIndicator placeholder="Pilih" /><SelectField label="Tahun" value={record.startYear} noIndicator placeholder="Pilih" /></div></div><div className="academic-date-section"><strong>Tarikh Akhir <em>(tidak wajib)</em></strong><div className="academic-date-grid"><SelectField label="Bulan" value={record.isStudying ? "" : record.endMonth} noIndicator placeholder="Pilih" /><SelectField label="Tahun" value={record.isStudying ? "" : record.endYear} noIndicator placeholder="Pilih" /></div></div><ReadOnlyCheckbox checked={record.isStudying} label="Saya sedang belajar di sini" /></section>) : <TextBlock>Tiada rekod akademik direkodkan.</TextBlock>}</div></div></div>;
  return <ProfileMirrorCard title="Akademik" details={details} isOpen={isOpen} onToggle={onToggle}>{summary}</ProfileMirrorCard>;
}

function SkillsMirror({ data, isOpen, onToggle }) {
  const skills = data || {};
  const skillList = asArray(skills.skills);
  const office = asArray(skills.microsoftOffice);
  const licences = asArray(skills.licences);
  const languages = asArray(skills.languages);
  const hasContent = skillList.length || office.length || licences.length || languages.some(hasValue);
  const summary = hasContent ? <div className="skills-summary px-7 py-6">{[["Kemahiran", skillList], ["Kemahiran MS Office", office], ["Bahasa", languages.map((language) => language.name).filter(Boolean)], ["Lesen memandu", licences]].filter(([, values]) => values.length).map(([title, values]) => <section key={title}><strong>{title}</strong><div>{values.slice(0, 10).map((value) => <span className="skills-summary-tag" key={value}>{value}</span>)}</div></section>)}</div> : <div className="px-7 py-6"><TextBlock>Senaraikan kemahiran teknikal, bahasa dan sijil profesional pemohon.</TextBlock></div>;
  const details = <div className="skills-layout"><strong className="skills-layout-label">Set Kemahiran</strong><div className="skills-form"><strong>Set kemahiran yang dipilih<span>*</span></strong><p>Anda boleh menambah lebih banyak kemahiran melalui pilihan pekerjaan, pengalaman kerja, atau dengan menambahkan kemahiran berkaitan di bawah.</p><JobSearchPreview label="Kemahiran Berkaitan" value="" placeholder="Contoh. Perform market research" helper="Anda boleh membuat penambahan kemahiran yang anda miliki secara manual." /><SelectedList title="Kemahiran Anda" values={skillList} /><MultiSelectPreview label="Kemahiran MS Office" values={office} selectedLabel="Kemahiran MS Office Ditambah" optional /><MultiSelectPreview label="Lesen Memandu" values={licences} selectedLabel="Lesen Memandu Ditambah" optional />{languages.length ? <div className="skills-language-section"><strong>Sila tambah bahasa<span>*</span></strong>{languages.map((language, index) => <article key={language.id || index}><strong>Bahasa {index + 1}</strong><SelectField label="Bahasa" value={language.name} placeholder="Pilih bahasa" /><SelectField label="Tahap Pembacaan" value={language.reading} placeholder="Pilih tahap" /><SelectField label="Tahap Percakapan" value={language.speaking} placeholder="Pilih tahap" /><SelectField label="Tahap Penulisan" value={language.writing} placeholder="Pilih tahap" /></article>)}</div> : null}</div></div>;
  return <ProfileMirrorCard title="Kemahiran" details={details} isOpen={isOpen} onToggle={onToggle}>{summary}</ProfileMirrorCard>;
}

function PersonalProfileMirror({ applicant, isOpen, onToggle, profile }) {
  const personal = profile.personal || {};
  const name = personal.displayName || applicant.full_name || applicant.first_name || "Pemohon";
  const email = personal.email || applicant.email;
  const photo = resolveMediaUrl(personal.profilePhotoUrl || applicant.profile_photo_url);
  const resumeUrl = resolveMediaUrl(personal.resumeFileUrl || applicant.resume_file_url);
  const videoResumeUrl = resolveMediaUrl(personal.videoResumeFileUrl || applicant.video_resume_file_url);

  return <section className={`superadmin-personal-mirror overflow-hidden rounded-lg border bg-white ${isOpen ? "is-editing border-emerald-600" : "border-emerald-100"}`}><header className="flex items-center justify-between border-b border-slate-200 px-7 py-6"><h3 className="text-2xl font-bold text-slate-950">Maklumat Peribadi</h3><button className={`inline-flex items-center gap-2 font-bold ${isOpen ? "text-slate-950" : "text-emerald-700 hover:text-emerald-800"}`} type="button" onClick={onToggle}>{isOpen ? null : <Icon>visibility</Icon>}{isOpen ? "Tutup" : "Lihat Butiran"}</button></header>{isOpen ? <div className="superadmin-personal-mirror-body"><ApplicantPersonalFormMirror applicant={applicant} profile={profile} /></div> : <div className="flex flex-col justify-between gap-6 px-7 py-6 md:flex-row md:items-center"><div className="flex items-center gap-5">{photo ? <img className="h-24 w-24 rounded-full border border-emerald-200 object-cover" src={photo} alt={`Foto profil ${name}`} /> : <span className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-3xl font-bold text-emerald-700">{name.charAt(0)}</span>}<div><p className="text-xl font-bold text-slate-950">{name}</p><p className="mt-2 font-semibold text-slate-600">{email}</p></div></div><div className="grid w-full gap-3 md:w-72">{resumeUrl ? <a className="inline-flex items-center justify-center gap-2 border border-emerald-200 px-4 py-3 font-bold text-emerald-600 hover:bg-emerald-50" href={resumeUrl} target="_blank" rel="noreferrer"><Icon>description</Icon>Muat Turun Resume (PDF)</a> : null}{videoResumeUrl ? <a className="inline-flex items-center justify-center gap-2 border border-emerald-200 px-4 py-3 font-bold text-emerald-600 hover:bg-emerald-50" href={videoResumeUrl} target="_blank" rel="noreferrer"><Icon>movie</Icon>Muat Turun Video (MP4)</a> : null}</div></div>}</section>;
}

function ApplicantProfileModal({ data, onClose }) {
  const [openSection, setOpenSection] = useState(null);
  useEffect(() => { setOpenSection(null); }, [data?.applicant?.id]);
  if (!data) return null;
  const name = data.profile.personal?.displayName || data.applicant.full_name || data.applicant.first_name || "Pemohon";
  const toggleSection = (section) => setOpenSection((current) => current === section ? null : section);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-5"><section className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-slate-50 shadow-2xl" role="dialog" aria-modal="true" aria-label={`Profil ${name}`}><header className="flex items-center justify-between border-b border-slate-200 bg-white px-7 py-5"><div><h2 className="text-2xl font-bold text-slate-950">Profil Pemohon</h2><p className="mt-1 text-sm font-semibold text-slate-500">{name}</p></div><button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} type="button" aria-label="Tutup"><Icon>close</Icon></button></header><div className="space-y-5 overflow-y-auto p-7"><PersonalProfileMirror applicant={data.applicant} profile={data.profile} isOpen={openSection === "personal"} onToggle={() => toggleSection("personal")} /><ExperienceMirror data={data.profile.experience} isOpen={openSection === "experience"} onToggle={() => toggleSection("experience")} /><AcademicMirror data={data.profile.academic} isOpen={openSection === "academic"} onToggle={() => toggleSection("academic")} /><SkillsMirror data={data.profile.skills} isOpen={openSection === "skills"} onToggle={() => toggleSection("skills")} /></div></section></div>;
}

function ApplicantDeleteModal({ applicant, deleting, onCancel, onConfirm }) {
  if (!applicant) return null;
  const name = applicant.full_name || applicant.first_name || applicant.email || "pemohon ini";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-5" role="presentation">
      <section className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="applicant-delete-title">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-red-600">Padam Pemohon</p>
            <h2 id="applicant-delete-title" className="mt-1 text-2xl font-bold text-slate-950">Padam akaun pemohon?</h2>
          </div>
          <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" type="button" onClick={onCancel} aria-label="Tutup" disabled={deleting}><Icon>close</Icon></button>
        </header>
        <div className="px-6 py-5">
          <p className="text-sm leading-6 text-slate-600">
            Adakah anda pasti mahu memadam akaun <strong className="font-bold text-slate-950">{name}</strong>? Tindakan ini akan memadam akaun dan maklumat profil pemohon, serta tidak boleh dibuat asal.
          </p>
          <footer className="mt-6 flex justify-end gap-3">
            <button className="rounded-md border border-slate-300 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50" type="button" onClick={onCancel} disabled={deleting}>Batal</button>
            <button className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70" type="button" onClick={onConfirm} disabled={deleting}>
              <Icon>delete</Icon>
              {deleting ? "Memadam..." : "Padam Akaun"}
            </button>
          </footer>
        </div>
      </section>
    </div>
  );
}

export default function SuperAdminApplicantsPanel() {
  const [applicants, setApplicants] = useState([]); const [query, setQuery] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [profile, setProfile] = useState(null); const [loadingProfile, setLoadingProfile] = useState(false); const [currentPage, setCurrentPage] = useState(1); const [deleteTarget, setDeleteTarget] = useState(null); const [deleting, setDeleting] = useState(false);
  const loadApplicants = async (search = query) => { setLoading(true); setError(""); try { setApplicants(await apiRequest(`/auth/applicants/${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ""}`)); setCurrentPage(1); } catch (requestError) { setError(requestError.message || "Senarai pemohon tidak dapat dimuatkan."); } finally { setLoading(false); } };
  useEffect(() => { apiRequest("/auth/applicants/").then((items) => { setApplicants(items); setCurrentPage(1); }).catch((requestError) => setError(requestError.message || "Senarai pemohon tidak dapat dimuatkan.")).finally(() => setLoading(false)); }, []);
  const pageCount = Math.max(1, Math.ceil(applicants.length / APPLICANTS_PER_PAGE));
  const pageStart = (currentPage - 1) * APPLICANTS_PER_PAGE;
  const visibleApplicants = applicants.slice(pageStart, pageStart + APPLICANTS_PER_PAGE);
  useEffect(() => { setCurrentPage((page) => Math.min(page, pageCount)); }, [pageCount]);
  const viewProfile = async (id) => { setLoadingProfile(true); try { setProfile(await apiRequest(`/auth/applicants/${id}/profile/`)); } catch (requestError) { setError(requestError.message || "Profil pemohon tidak dapat dimuatkan."); } finally { setLoadingProfile(false); } };
  const confirmDeleteApplicant = async () => { if (!deleteTarget) return; setDeleting(true); setError(""); try { await apiRequest(`/auth/applicants/${deleteTarget.id}/profile/`, { method: "DELETE" }); setApplicants((items) => items.filter((item) => item.id !== deleteTarget.id)); setProfile((current) => current?.applicant?.id === deleteTarget.id ? null : current); setDeleteTarget(null); } catch (requestError) { setError(requestError.message || "Akaun pemohon tidak dapat dipadam."); } finally { setDeleting(false); } };
  return <section className="p-8"><div className="mb-6"><h1 className="text-3xl font-bold text-slate-950">Pengurusan Pemohon</h1><p className="mt-1 text-slate-500">Semak akaun pemohon dan maklumat profil mereka.</p></div><form className="mb-5 flex gap-3 rounded-lg border border-slate-200 bg-white p-4" onSubmit={(event) => { event.preventDefault(); loadApplicants(); }}><input className="min-w-0 flex-1 rounded-md border border-slate-300 px-4 py-3 text-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama, MyKad, emel atau nombor telefon" /><button className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800" type="submit"><Icon>search</Icon>Tapis</button><button className="rounded-md border border-slate-300 px-4 font-bold text-slate-600" type="button" onClick={() => { setQuery(""); loadApplicants(""); }}>Set Semula</button></form><div className="overflow-hidden rounded-lg border border-slate-200 bg-white"><header className="border-b border-slate-200 px-5 py-4"><h2 className="font-bold text-slate-950">Senarai Pemohon</h2><p className="mt-1 text-sm text-slate-500">{applicants.length} pemohon dijumpai.</p></header>{error ? <p className="m-5 rounded-md bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}<div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="w-20 px-5 py-4">No.</th><th className="px-5 py-4">Nama</th><th className="px-5 py-4">Nombor MyKad</th><th className="px-5 py-4">Emel</th><th className="px-5 py-4">Nombor Telefon</th><th className="px-5 py-4">Tindakan</th></tr></thead><tbody>{loading ? <tr><td className="px-5 py-6 text-slate-500" colSpan="6">Memuatkan pemohon...</td></tr> : visibleApplicants.length ? visibleApplicants.map((applicant, index) => <tr className="border-t border-slate-100" key={applicant.id}><td className="px-5 py-4 font-semibold text-slate-500">{pageStart + index + 1}</td><td className="px-5 py-4 font-bold text-slate-900">{applicant.full_name || applicant.first_name}</td><td className="px-5 py-4 text-slate-600">{text(applicant.mykad_number)}</td><td className="px-5 py-4 text-slate-600">{applicant.email}</td><td className="px-5 py-4 text-slate-600">{text(applicant.mobile_number)}</td><td className="px-5 py-4"><div className="flex gap-2"><button className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 font-bold text-slate-700 hover:bg-slate-50" type="button" onClick={() => viewProfile(applicant.id)}><Icon>visibility</Icon>{loadingProfile ? "Memuatkan" : "Lihat"}</button><button className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 font-bold text-red-600 hover:bg-red-50" type="button" onClick={() => setDeleteTarget(applicant)}><Icon>delete</Icon>Padam</button></div></td></tr>) : <tr><td className="px-5 py-6 text-slate-500" colSpan="6">Tiada pemohon ditemui.</td></tr>}</tbody></table></div><footer className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm text-slate-500"><span>{applicants.length ? `Memaparkan ${pageStart + 1}-${Math.min(pageStart + APPLICANTS_PER_PAGE, applicants.length)} daripada ${applicants.length}` : "Tiada rekod untuk dipaparkan."}</span><div className="flex items-center gap-2"><button className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40" type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} aria-label="Halaman sebelumnya">&lt;</button><span className="font-semibold text-slate-700">{currentPage} / {pageCount}</span><button className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40" type="button" onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} disabled={currentPage === pageCount} aria-label="Halaman seterusnya">&gt;</button></div></footer></div><ApplicantProfileModal data={profile} onClose={() => setProfile(null)} /><ApplicantDeleteModal applicant={deleteTarget} deleting={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDeleteApplicant} /></section>;
}
