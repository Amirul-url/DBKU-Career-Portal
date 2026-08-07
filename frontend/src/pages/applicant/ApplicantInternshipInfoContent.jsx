import { Link } from "react-router-dom";
import { APPLICANT_ROUTES } from "../../modules/applicant/applicantRoutes";

const fieldOptions = [
  "Kejuruteraan Awam",
  "Kejuruteraan Mekanikal",
  "Kejuruteraan Elektrik atau Elektronik",
  "Teknologi Maklumat / Sistem",
  "Perakaunan / Kewangan",
  "Pengurusan Sumber Manusia / Pentadbiran",
  "Komunikasi Korporat / Perhubungan Awam / Khidmat Pelanggan",
  "Perancangan bandar, landskap, bangunan atau bidang berkaitan DBKU",
];

const requiredDocuments = [
  "Surat rasmi daripada institusi / kolej / universiti",
  "Transkrip akademik terkini",
  "Resume",
  "1 keping gambar berukuran passport",
  "1 salinan muka depan akaun bank",
  "Buku log",
];

function Icon({ children, className = "" }) {
  return (
    <span className={`material-symbols-outlined notranslate ${className}`} aria-hidden="true" translate="no">
      {children}
    </span>
  );
}

export default function ApplicantInternshipInfoContent() {
  return (
    <main className="applicant-internship-page">
      <section className="internship-hero" aria-label="Peluang latihan industri">
        <div className="internship-hero-grid" aria-hidden="true">
          <img src="/discussion.jpg" alt="" />
          <img src="/banner landing page.jpg" alt="" />
          <img src="/senior urban planner.jpg" alt="" />
        </div>
        <div className="internship-hero-overlay">
          <h1>Peluang Latihan Industri</h1>
        </div>
      </section>

      <section className="internship-content-shell">
        <div className="internship-intro">
          <h2>Latihan industri dan praktikal bersama Dewan Bandaraya Kuching Utara.</h2>
          <p>
            Dewan Bandaraya Kuching Utara tiada halangan untuk menerima pelajar institusi pengajian tinggi yang ingin
            menjalani latihan industri atau praktikal, tertakluk kepada kesesuaian penempatan, bidang pengajian dan
            keperluan semasa jabatan.
          </p>
        </div>

        <article className="internship-copy-card">
          <h4>Syarat-syarat bagi latihan industri / praktikal</h4>
          <ol>
            <li>
              Pelajar yang menjalani latihan industri / praktikal di DBKU akan dibayar elaun sebanyak RM500.00 secara
              bulanan setelah genap tempoh sebulan dari tarikh melapor diri terhad untuk tempoh maksimum tiga (3) bulan
              sahaja. Namun demikian, pembayaran elaun ini adalah tertakluk kepada kuota pengambilan pelajar latihan
              industri / praktikal bagi tahun semasa mengikut bahagian-bahagian di DBKU.
            </li>
            <li>
              Sekiranya kuota elaun telah dipenuhi, pelajar masih berpeluang menjalani latihan industri di DBKU tetapi{" "}
              <strong>tidak akan dibayar sebarang elaun</strong>. Penerimaan pelajar tanpa elaun akan dipertimbangkan
              berdasarkan keperluan organisasi. Walaupun tanpa elaun, pelajar tetap akan mendapat pengalaman kerja yang
              bermakna serta sijil pengesahan tamat latihan sebagai pengiktirafan.
            </li>
            <li>
              Pelajar tidak akan mendapat kemudahan perkhidmatan seperti pegawai DBKU termasuk pengangkutan dan
              penginapan.
            </li>
            <li>
              Pihak DBKU tidak akan bertanggungjawab ke atas sebarang kecederaan atau kemalangan yang berlaku kepada
              pelajar sepanjang latihan.
            </li>
            <li>Pelajar diwajibkan berpakaian kemas, sopan dan bersesuaian dengan imej profesional.</li>
            <li>
              Pelajar dikehendaki menepati waktu bekerja seperti berikut semasa menjalani latihan industri / praktikal
              di DBKU:
              <div className="internship-work-hours">
                <span>Isnin - Khamis</span>
                <span>8.00 pagi - 1.00 petang<br />2.00 petang - 5.00 petang</span>
                <span>Jumaat</span>
                <span>8.00 pagi - 11.45 pagi<br />2.15 petang - 5.00 petang</span>
              </div>
            </li>
            <li>
              Pelajar bertanggungjawab untuk menyelesaikan tugasan yang diberikan oleh penyelia dan melengkapkan
              laporan yang telah ditetapkan oleh institut pengajian.
            </li>
            <li>
              Pelajar latihan industri / praktikal dibenarkan bercuti tetapi perlu mendapatkan kebenaran Ketua Penyelaras
              dari institut pengajian dan Pegawai Penyelia Pelajar terlebih dahulu.
            </li>
            <li>Mematuhi arahan / peraturan yang telah ditetapkan oleh pihak DBKU dari semasa ke semasa.</li>
            <li>Menjaga nama baik DBKU dan institut pengajian.</li>
            <li>
              Pihak DBKU mempunyai hak untuk melaporkan dan menamatkan program latihan industri / praktikal sekiranya
              pelajar didapati melakukan sebarang salah laku disiplin.
            </li>
          </ol>

          <h4>Bidang pengajian yang boleh dipertimbangkan</h4>
          <div className="internship-field-grid">
            {fieldOptions.map((field) => (
              <span key={field}>
                <Icon>check_circle</Icon>
                {field}
              </span>
            ))}
          </div>

          <h4>Dokumen yang diperlukan</h4>
          <ol>
            {requiredDocuments.map((document) => (
              <li key={document}>{document}</li>
            ))}
          </ol>

          <div className="internship-cta-panel">
            <div>
              <strong>Bersedia untuk hantar permohonan?</strong>
              <p>Lengkapkan profil sebelum membuat permohonan latihan industri.</p>
            </div>
            <Link to={APPLICANT_ROUTES.internshipApplication}>
              Mohon Latihan Industri
              <Icon>arrow_forward</Icon>
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
