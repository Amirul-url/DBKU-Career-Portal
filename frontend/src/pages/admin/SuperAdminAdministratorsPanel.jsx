import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../../lib/authApi";
import { Icon } from "../applicant/ApplicantAuthShared";

const ADMIN_PAGE_SIZE = 5;
const departmentOptions = ["Pengurusan Sumber Manusia (HRM)"];
const blankForm = {
  full_name: "",
  mykad_number: "",
  email: "",
  mobile_number: "",
  department: "",
  role: "",
  is_active: true,
  password: "",
  confirm_password: "",
  notify_whatsapp: true,
  notify_email: true,
};

const display = (value) => value || "-";

function AdminAccountModal({ account, error, form, mode, onChange, onClose, onSave, saving }) {
  const isEdit = mode === "edit";
  const inputClass = "h-12 w-full rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
  const labelClass = "grid gap-2 text-sm font-bold text-slate-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-5">
      <section className="w-full max-w-[780px] overflow-hidden rounded-xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-label={isEdit ? "Kemaskini akaun pentadbir" : "Tambah akaun pentadbir"}>
        <header className="flex items-center justify-between border-b border-slate-200 px-7 py-5">
          <h2 className="text-2xl font-bold text-slate-950">{isEdit ? "Kemaskini Akaun" : "Tambah Akaun"}</h2>
          <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" type="button" onClick={onClose} aria-label="Tutup">
            <Icon>close</Icon>
          </button>
        </header>

        <form onSubmit={onSave}>
          <div className="grid gap-5 px-7 py-6">
            {error ? <p className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}

            <label className={labelClass}>
              Nama Penuh
              <input className={inputClass} value={form.full_name} onChange={(event) => onChange("full_name", event.target.value)} placeholder="Masukkan nama penuh" required />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className={labelClass}>
                No. Kad Pengenalan
                <input className={inputClass} value={form.mykad_number} onChange={(event) => onChange("mykad_number", event.target.value)} placeholder="Masukkan No. Kad Pengenalan" />
              </label>
              <label className={labelClass}>
                E-mel
                <input className={inputClass} value={form.email} onChange={(event) => onChange("email", event.target.value)} placeholder="Masukkan e-mel" type="email" required />
              </label>
              <label className={labelClass}>
                Nombor Telefon
                <input className={inputClass} value={form.mobile_number} onChange={(event) => onChange("mobile_number", event.target.value)} placeholder="Masukkan nombor telefon" />
              </label>
              <label className={labelClass}>
                Jabatan
                <select className={inputClass} value={form.department} onChange={(event) => onChange("department", event.target.value)} required>
                  <option value="">Sila pilih</option>
                  {departmentOptions.map((department) => <option value={department} key={department}>{department}</option>)}
                </select>
              </label>
              <label className={labelClass}>
                Peranan
                <select className={inputClass} value={form.role} onChange={(event) => onChange("role", event.target.value)} required>
                  <option value="">Sila pilih</option>
                  <option value="admin">Pentadbir</option>
                </select>
              </label>
              <div className={labelClass}>
                <span>Notifikasi</span>
                <div className="flex h-12 items-center gap-6 rounded-md border border-slate-300 px-4 text-sm font-bold text-slate-700">
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.notify_whatsapp} onChange={(event) => onChange("notify_whatsapp", event.target.checked)} />WhatsApp</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.notify_email} onChange={(event) => onChange("notify_email", event.target.checked)} />E-mel</label>
                </div>
              </div>
              <label className={labelClass}>
                Kata Laluan
                <input className={inputClass} value={form.password} onChange={(event) => onChange("password", event.target.value)} placeholder={isEdit ? "Kosongkan jika tidak mahu tukar" : "Masukkan kata laluan"} type="password" required={!isEdit} />
              </label>
              <label className={labelClass}>
                Sahkan Kata Laluan
                <input className={inputClass} value={form.confirm_password} onChange={(event) => onChange("confirm_password", event.target.value)} placeholder="Sahkan kata laluan" type="password" required={!isEdit || Boolean(form.password)} />
              </label>
            </div>

            {account ? <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700"><input type="checkbox" checked={form.is_active} onChange={(event) => onChange("is_active", event.target.checked)} />Akaun aktif</label> : null}
          </div>

          <footer className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-7 py-4">
            <button className="rounded-md border border-slate-300 bg-white px-5 py-2 font-bold text-slate-600 hover:bg-slate-50" type="button" onClick={onClose}>Batal</button>
            <button className="rounded-md bg-emerald-700 px-5 py-2 font-bold text-white hover:bg-emerald-800 disabled:opacity-60" disabled={saving} type="submit">{saving ? "Menyimpan..." : "Simpan"}</button>
          </footer>
        </form>
      </section>
    </div>
  );
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

  return <section className="p-8"><div className="mb-6 flex items-start justify-between gap-4"><div><h1 className="text-3xl font-bold text-slate-950">Pengurusan Pentadbir DBKU</h1><p className="mt-1 text-slate-500">Urus akaun log masuk pentadbir DBKU dan peranan akses.</p></div><button className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800" type="button" onClick={openAddModal}><Icon>person_add</Icon>Tambah Akaun</button></div><form className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_320px_auto_auto]" onSubmit={(event) => { event.preventDefault(); loadAccounts(); }}><input className="min-w-0 rounded-md border border-slate-300 px-4 py-3 text-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama, MyKad, emel atau nombor telefon" /><select className="rounded-md border border-slate-300 px-4 py-3 text-sm" value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">Semua jabatan</option>{departmentOptions.map((option) => <option value={option} key={option}>{option}</option>)}</select><button className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-5 py-3 font-bold text-white hover:bg-emerald-800" type="submit"><Icon>search</Icon>Tapis</button><button className="rounded-md border border-slate-300 px-4 font-bold text-slate-600" type="button" onClick={() => { setQuery(""); setDepartment(""); loadAccounts("", ""); }}>Set Semula</button></form><div className="overflow-hidden rounded-lg border border-slate-200 bg-white"><header className="border-b border-slate-200 px-5 py-4"><h2 className="font-bold text-slate-950">Senarai Pentadbir DBKU</h2><p className="mt-1 text-sm text-slate-500">{accounts.length} akaun dijumpai.</p></header>{error ? <p className="m-5 rounded-md bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}<div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="w-20 px-5 py-4">No.</th><th className="px-5 py-4">Nama</th><th className="px-5 py-4">Nombor MyKad</th><th className="px-5 py-4">Emel</th><th className="px-5 py-4">Nombor Telefon</th><th className="px-5 py-4">Tindakan</th></tr></thead><tbody>{loading ? <tr><td className="px-5 py-6 text-slate-500" colSpan="6">Memuatkan pentadbir...</td></tr> : visibleAccounts.length ? visibleAccounts.map((account, index) => <tr className="border-t border-slate-100" key={account.id}><td className="px-5 py-4 font-semibold text-slate-500">{pageStart + index + 1}</td><td className="px-5 py-4 font-bold text-slate-900">{display(account.first_name)}</td><td className="px-5 py-4 text-slate-600">{display(account.mykad_number)}</td><td className="px-5 py-4 text-slate-600">{display(account.email)}</td><td className="px-5 py-4 text-slate-600">{display(account.mobile_number)}</td><td className="px-5 py-4"><div className="flex gap-2"><button className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 font-bold text-slate-700 hover:bg-slate-50" type="button" onClick={() => openEditModal(account)}><Icon>edit</Icon>Kemaskini</button><button className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 font-bold text-red-600 hover:bg-red-50" type="button" onClick={() => deleteAccount(account)}><Icon>delete</Icon>Padam</button></div></td></tr>) : <tr><td className="px-5 py-6 text-slate-500" colSpan="6">Tiada akaun pentadbir ditemui.</td></tr>}</tbody></table></div><footer className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm text-slate-500"><span>{accounts.length ? `Memaparkan ${pageStart + 1}-${Math.min(pageStart + ADMIN_PAGE_SIZE, accounts.length)} daripada ${accounts.length}` : "Tiada rekod untuk dipaparkan."}</span><div className="flex items-center gap-2"><button className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40" type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} aria-label="Halaman sebelumnya">&lt;</button><span className="font-semibold text-slate-700">{currentPage} / {pageCount}</span><button className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40" type="button" onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))} disabled={currentPage === pageCount} aria-label="Halaman seterusnya">&gt;</button></div></footer></div>{modalMode ? <AdminAccountModal account={editingAccount} error={formError} form={form} mode={modalMode} onChange={updateForm} onClose={closeModal} onSave={saveAccount} saving={saving} /> : null}</section>;
}
