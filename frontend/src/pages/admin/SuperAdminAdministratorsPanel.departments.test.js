import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./SuperAdminAdministratorsPanel.jsx", import.meta.url), "utf8");

const expectedDepartments = [
  "Bahagian Audit Dalaman (AUD)",
  "Bahagian Projek Khas & Fasiliti Awam (SPF)",
  "Bahagian Hal Ehwal Undang-Undang (LAW)",
  "Bahagian Penguatkuasaan dan Keselamatan (ENS)",
  "Bahagian Pelesenan (LES)",
  "Bahagian Pengurusan Sumber Manusia (HRM)",
  "Bahagian Pentadbiran (ADM)",
  "Bahagian Transformasi dan Inovasi (CTS)",
  "Bahagian Kewangan (FIN)",
  "Bahagian Penilaian dan Pencukaian (VAL)",
  "Bahagian Teknologi Maklumat (ICT)",
  "Bahagian Kesihatan Persekitaran (ENV)",
  "Bahagian Perhubungan Awam (PRD)",
  "Bahagian Pembangunan & Perkhidmatan (CDS)",
  "Bahagian Pembangunan Sumber (IRD)",
  "Bahagian Landskap (LNP)",
  "Bahagian Kontrak dan Perolehan (COP)",
  "Bahagian Geoinformasi dan Pengurusan Hartanah (GPM)",
  "Bahagian Penyelenggaraan Infrastruktur (IMT)",
  "Bahagian Bangunan (BLG)",
  "Bahagian Projek Kejuruteraan (ENG)",
  "Bahagian Mekanikal dan Elektrikal (MNE)",
];

test("Super Admin administrator forms expose all DBKU department choices", () => {
  for (const department of expectedDepartments) {
    assert.match(source, new RegExp(department.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("legacy HRM department codes are normalized for editing", () => {
  assert.match(source, /"Pengurusan Sumber Manusia \(HRM\)": "Bahagian Pengurusan Sumber Manusia \(HRM\)"/);
  assert.match(source, /department: normalizeDepartment\(account\.department\)/);
});

test("administrator modal captures department role and password visibility toggles", () => {
  assert.match(source, /const departmentRoleOptions = \["Ketua Bahagian", "Pembantu Bahagian"\]/);
  assert.match(source, /department_role: account\.department_role/);
  assert.match(source, /payload\.department_role = form\.department_role/);
  assert.match(source, /aria-label=\{showPassword \? "Sembunyikan kata laluan" : "Tunjuk kata laluan"\}/);
  assert.match(source, /aria-label=\{showConfirmPassword \? "Sembunyikan pengesahan kata laluan" : "Tunjuk pengesahan kata laluan"\}/);
});

test("password fields stay adjacent at the bottom of the administrator modal grid", () => {
  assert.ok(source.indexOf("Notifikasi") < source.indexOf("Kata Laluan"));
  assert.ok(source.indexOf("Kata Laluan") < source.indexOf("Sahkan Kata Laluan"));
});
