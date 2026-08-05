import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/authApi";
import { Icon } from "../applicant/ApplicantAuthShared";

const ADMIN_PAGE_SIZE = 5;
const departmentOptions = ["Pengurusan Sumber Manusia (HRM)"];
const roleOptions = [
  ["admin", "Pentadbir"],
  ["hr", "Pegawai HR"],
  ["reviewer", "Penyemak"],
];
const blankForm = {
  full_name: "",
  mykad_number: "",
  email: "",
  mobile_number: "",
  department: departmentOptions[0],
  role: "admin",
  is_active: true,
  password: "",
  confirm_password: "",
  notify_whatsapp: true,
  notify_email: true,
};

const display = (value) => value || "-";
const displayDepartment = (value) => value === "HRM" ? departmentOptions[0] : display(value);
const roleLabel = (role) => roleOptions.find(([value]) => value === role)?.[1] || role || "-";
const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ms-MY", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
};

function AdminAccountModal({ account, error, form, mode, onChange, onClose, onSave, saving }) {
  const isEdit = mode === "edit";
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-5"><section className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label={isEdit ? "Kemaskini akaun pentadbir" : "Tambah akaun pentadbir"}><header className="flex items-center justify-between border-b border-slate-200 px-6 py-5"><h2 className="text-xl font-bold text-slate-950">{isEdit ? "Kemaskini Akaun" : "Tambah Akaun"}</h2><button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" type="button" onClick={onClose} aria-label="Tutup"><Icon>close</Icon></button></header><form onSubmit={onSave}><div className="grid gap-4 px-6 py-5">{error ? <p className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}<label className="grid gap-2 text-sm font-bold text-slate-600 md:col-span-2">Nama Penuh<input className="h-12 rounded-md border border-slate-300 px-3 font-normal text-slate-900" value={form.full_name} onChange={(event) => onChange("full_name", event.target.value)} placeholder="Masukkan nama penuh" required /></label><div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-bold text-slate-600">No. Kad Pengenalan<input className="h-12 rounded-md border border-slate-300 px-3 font-normal text-slate-900" value={form.mykad_number} onChange={(event) => onChange("mykad_number", event.target.value)} placeholder="Masukkan No. Kad Pengenalan" /></label><label className="grid gap-2 text-sm font-bold text-slate-600">E-mel<input className="h-12 rounded-md border border-slate-300 px-3 font-normal text-slate-900" value={form.email} onChange={(event) => onChange("email", event.target.value)} placeholder="Masukkan e-mel" type="email" required /></label><label className="grid gap-2 text-sm font-bold text-slate-600">Nombor Telefon<input className="h-12 rounded-md border border-slate-300 px-3 font-normal text-slate-900" value={form.mobile_number} onChange={(event) => onChange("mobile_number", event.target.value)} placeholder="Masukkan nombor telefon" /></label><label className="grid gap-2 text-sm font-bold text-slate-600">Jabatan<select className="h-12 rounded-md border border-slate-300 px-3 font-normal text-slate-900" value={form.department} onChange={(event) => onChange("department", event.target.value)} required>{departmentOptions.map((department) => <option value={department} key={department}>{department}</option>)}</select></label><label className="grid gap-2 text-sm font-bold text-slate-600">Peranan<select className="h-12 rounded-md border border-slate-300 px-3 font-normal text-slate-900" value={form.role} onChange={(event) => onChange("role", event.target.value)}>{roleOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><div className="grid gap-2 text-sm font-bold text-slate-600"><span>Notifikasi</span><div className="flex h-12 items-center gap-5 rounded-md border border-slate-300 px-3"><label className="inline-flex items-center gap-2 font-bold text-slate-700"><input type="checkbox" checked={form.notify_whatsapp} onChange={(event) => onChange("notify_whatsapp", event.target.checked)} />WhatsApp</label><label className="inline-flex items-center gap-2 font-bold text-slate-700"><input type="checkbox" checked={form.notify_email} onChange={(event) => onChange("notify_email", event.target.checked)} />E-mel</label></div></div><label className="grid gap-2 text-sm font-bold text-slate-600">Kata Laluan<input className="h-12 rounded-md border border-slate-300 px-3 font-normal text-slate-900" value={form.password} onChange={(event) => onChange("password", event.target.value)} placeholder={isEdit ? "Biarkan kosong untuk kekalkan kata laluan semasa" : "Masukkan kata laluan"} type="password" required={!isEdit} /></label><label className="grid gap-2 text-sm font-bold text-slate-600">Sahkan Kata Laluan<input className="h-12 rounded-md border border-slate-300 px-3 font-normal text-slate-900" value={form.confirm_password} onChange={(event) => onChange("confirm_password", event.target.value)} placeholder="Sahkan kata laluan" type="password" required={!isEdit || Boolean(form.password)} /></label></div>{account ? <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700"><input type="checkbox" checked={form.is_active} onChange={(event) => onChange("is_active", event.target.checked)} />Akaun aktif</label> : null}</div><footer className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4"><button className="rounded-md border border-slate-300 px-4 py-2 font-bold text-slate-600" type="button" onClick={onClose}>Batal</button><button className="rounded-md bg-emerald-700 px-4 py-2 font-bold text-white hover:bg-emerald-800 disabled:opacity-60" disabled={saving} type="submit">{saving ? "Menyimpan..." : "Simpan"}</button></footer></form></section></div>;
}

export default function SuperAdminAdministratorsPanel() {
  const [accounts, setAccounts] = useState([]);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const loadAccounts = async (search = query, selectedDepartment = department) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (selectedDepartment) params.set("department", selectedDepartment);
      const suffix = params.toString() ? `?${params.toString()}` : "";
      setAccounts(await apiRequest(`/auth/admin-accounts/${suffix}`));
      setCurrentPage(1);
    } catch (requestError) {
      setError(requestError.message || "Senarai pentadbir tidak dapat dimuatkan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAccounts("", ""); }, []);

  const pageCount = Math.max(1, Math.ceil(accounts.length / ADMIN_PAGE_SIZE));
  const pageStart = (currentPage - 1) * ADMIN_PAGE_SIZE;
  const visibleAccounts = useMemo(() => accounts.slice(pageStart, pageStart + ADMIN_PAGE_SIZE), [accounts, pageStart]);
  useEffect(() => { setCurrentPage((page) => Math.min(page, pageCount)); }, [pageCount]);

  const openAddModal = () => {
    setEditingAccount(null);
    setForm(blankForm);
    setFormError("");
    setModalMode("add");
  };

  const openEditModal = (account) => {
    setEditingAccount(account);
    setForm({ ...blankForm, full_name: account.first_name || "", mykad_number: account.mykad_number || "", email: account.email || "", mobile_number: account.mobile_number || "", department: account.department || departmentOptions[0], role: account.role || "admin", is_active: account.is_active ?? true, password: "", confirm_password: "" });
    setFormError("");
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingAccount(null);
    setFormError("");
  };

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const saveAccount = async (event) => {
    event.preventDefault();
    setFormError("");
    if (form.password !== form.confirm_password) {
      setFormError("Kata laluan tidak sepadan.");
      return;
    }
    setSaving(true);
    try {
      const payload = { full_name: form.full_name, mykad_number: form.mykad_number, email: form.email, mobile_number: form.mobile_number, department: form.department, role: form.role, is_active: form.is_active };
      if (form.password) payload.password = form.password;
      await apiRequest(editingAccount ? `/auth/admin-accounts/${editingAccount.id}/` : "/auth/admin-accounts/", { method: editingAccount ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      closeModal();
      await loadAccounts();
    } catch (requestError) {
      setFormError(requestError.message || "Akaun pentadbir tidak dapat disimpan.");
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async (account) => {
    if (!window.confirm(`Padam akaun ${account.first_name || account.email}?`)) return;
    setError("");
    try {
      await apiRequest(`/auth/admin-accounts/${account.id}/`, { method: "DELETE" });
      await loadAccounts();
    } catch (requestError) {
      setError(requestError.message || "Akaun pentadbir tidak dapat dipadam.");
    }
  };

  return <section className="p-8"><div className="mb-6 flex items-start justify-between gap-4"><div><h1 className="text-3xl font-bold text-slate-950">Pengurusan Pentadbir DBKU</h1><p className="mt-1 text-slate-500">Urus akaun log masuk pentadbir DBKU dan peranan akses.</p></div><button className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800" type="button" onClick={openAddModal}><Icon>person_add</Icon>Tambah Akaun</button></div><form className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_320px_auto_auto]" onSubmit={(event) => { event.preventDefault(); loadAccounts(); }}><input className="min-w-0 rounded-md border border-slate-300 px-4 py-3 text-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama, No. Kad Pengenalan, e-mel, nombor telefon atau jabatan" /><select className="rounded-md border border-slate-300 px-4 py-3 text-sm" value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">Semua jabatan</option>{departmentOptions.map((option) => <option value={option} key={option}>{option}</option>)}</select><button className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800" type="submit"><Icon>search</Icon>Tapis</button><button className="rounded-md border border-slate-300 px-4 font-bold text-slate-600" type="button" onClick={() => { setQuery(""); setDepartment(""); loadAccounts("", ""); }}>Set Semula</button></form><div className="overflow-hidden rounded-lg border border-slate-200 bg-white"><header className="border-b border-slate-200 px-5 py-4"><h2 className="font-bold text-slate-950">Senarai Pentadbir DBKU</h2><p className="mt-1 text-sm text-slate-500">{accounts.length} akaun dijumpai.</p></header>{error ? <p className="m-5 rounded-md bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}<div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-4">Nama</th><th className="px-5 py-4">No. Kad Pengenalan</th><th className="px-5 py-4">E-mel</th><th className="px-5 py-4">Nombor Telefon</th><th className="px-5 py-4">Jabatan</th><th className="px-5 py-4">Peranan</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Log Masuk Terakhir</th><th className="px-5 py-4">Tindakan</th></tr></thead><tbody>{loading ? <tr><td className="px-5 py-6 text-slate-500" colSpan="9">Memuatkan pentadbir...</td></tr> : visibleAccounts.length ? visibleAccounts.map((account) => <tr className="border-t border-slate-100" key={account.id}><td className="px-5 py-4 font-bold text-slate-900">{display(account.first_name)}</td><td className="px-5 py-4 text-slate-600">{display(account.mykad_number)}</td><td className="px-5 py-4 text-slate-600">{display(account.email)}</td><td className="px-5 py-4 text-slate-600">{display(account.mobile_number)}</td><td className="px-5 py-4 text-slate-600">{displayDepartment(account.department)}</td><td className="px-5 py-4"><span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">{roleLabel(account.role)}</span></td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${account.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{account.is_active ? "Aktif" : "Tidak Aktif"}</span></td><td className="px-5 py-4 text-slate-600">{formatDateTime(account.last_login)}</td><td className="px-5 py-4"><div className="flex gap-2"><button className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-3 py-2 font-bold text-white hover:bg-emerald-800" type="button" onClick={() => openEditModal(account)}><Icon>edit</Icon>Kemaskini</button><button className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 font-bold text-white hover:bg-red-700" type="button" onClick={() => deleteAccount(account)}><Icon>delete</Icon>Padam</button></div></td></tr>) : <tr><td className="px-5 py-6 text-slate-500" colSpan="9">Tiada akaun pentadbir ditemui.</td></tr>}</tbody></table></div><footer className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm text-slate-500"><span>Halaman {currentPage} daripada {pageCount}</span><div className="flex items-center gap-2"><button className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40" type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1}><Icon>chevron_left</Icon>Sebelumnya</button><button className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40" type="button" onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} disabled={currentPage === pageCount}>Seterusnya<Icon>chevron_right</Icon></button></div></footer></div>{modalMode ? <AdminAccountModal account={editingAccount} error={formError} form={form} mode={modalMode} onChange={updateForm} onClose={closeModal} onSave={saveAccount} saving={saving} /> : null}</section>;
}
