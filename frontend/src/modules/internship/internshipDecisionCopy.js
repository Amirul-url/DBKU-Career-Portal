export const hrmFinalRejectionMessage = `Dukacita dimaklumkan bahawa permohonan saudara/i untuk menjalani latihan industri di Dewan Bandaraya Kuching Utara (DBKU) telah diterima dan diteliti oleh pihak kami.

Walau bagaimanapun, setelah mengambil kira keperluan semasa serta kapasiti penempatan pelatih, dukacita dimaklumkan bahawa pihak DBKU tidak dapat mempertimbangkan permohonan tersebut buat masa ini.

Pihak DBKU merakamkan setinggi-tinggi penghargaan atas minat dan kepercayaan saudara/i untuk menjalani latihan industri bersama DBKU. Kami memohon maaf atas segala kesulitan yang mungkin timbul dan berharap saudara/i akan memperoleh peluang latihan industri yang bersesuaian pada masa akan datang.

Sekian, terima kasih.`;

export function normalizeHrmFinalRejectionRemarks(remarks) {
  const message = String(remarks || "").trim() || hrmFinalRejectionMessage;
  return message.replace(
    /^Sukacita dimaklumkan bahawa permohonan/i,
    "Dukacita dimaklumkan bahawa permohonan",
  );
}
