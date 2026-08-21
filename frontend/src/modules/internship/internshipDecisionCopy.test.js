import assert from "node:assert/strict";
import test from "node:test";
import {
  hrmFinalRejectionMessage,
  normalizeHrmFinalRejectionRemarks,
} from "./internshipDecisionCopy.js";

test("HRM final rejection copy starts with dukacita", () => {
  assert.match(
    hrmFinalRejectionMessage,
    /^Dukacita dimaklumkan bahawa permohonan saudara\/i untuk menjalani latihan industri/,
  );
});

test("normalizes older rejected decision remarks that started with sukacita", () => {
  const savedRemarks = `Sukacita dimaklumkan bahawa permohonan saudara/i untuk menjalani latihan industri di Dewan Bandaraya Kuching Utara (DBKU) telah diterima dan diteliti oleh pihak kami.

Walau bagaimanapun, setelah mengambil kira keperluan semasa serta kapasiti penempatan pelatih, dukacita dimaklumkan bahawa pihak DBKU tidak dapat mempertimbangkan permohonan tersebut buat masa ini.`;

  const normalized = normalizeHrmFinalRejectionRemarks(savedRemarks);

  assert.match(normalized, /^Dukacita dimaklumkan bahawa permohonan saudara\/i/);
  assert.doesNotMatch(normalized, /^Sukacita dimaklumkan bahawa permohonan saudara\/i/);
  assert.match(normalized, /dukacita dimaklumkan bahawa pihak DBKU tidak dapat mempertimbangkan/);
});

test("uses the current rejection message when saved remarks are empty", () => {
  assert.equal(normalizeHrmFinalRejectionRemarks(""), hrmFinalRejectionMessage);
});
