# Modul Permohonan Jawatan DBKU

Dokumen ini menyenaraikan lima rajah Mermaid untuk menerangkan aliran Modul Permohonan Jawatan DBKU.

## 1. Flow Ringkas Modul Jawatan DBKU

```mermaid
flowchart TD
  A([Pemohon]) --> B[Isi Borang Permohonan Jawatan DBKU A hingga L]
  B --> C{Hantar permohonan?}

  C -->|Simpan draf| D[Status: Draf]
  D --> B

  C -->|Hantar| E[Status: Menunggu Semakan HRM]
  E --> F[HRM semak permohonan]

  F --> G{Keputusan HRM}
  G -->|Tidak Lengkap| H[Status: Tidak Lengkap]
  H --> B
  G -->|Tidak Layak| I[Status: Ditolak]
  G -->|Hantar ke Bahagian| J[Status: Semakan Bahagian]

  J --> K[Bahagian dipilih semak permohonan]
  K --> L{Keputusan Bahagian}
  L -->|Tolak| M[Status: Ditolak Bahagian]
  L -->|Terima| N[HRM sediakan Maklumbalas Organisasi]

  M --> O[HRM buat Keputusan Akhir HRM]
  O --> P{Keputusan Akhir HRM}
  P -->|Tolak| I
  P -->|Terima| N

  N --> Q[HRM hantar maklumbalas kepada pemohon]
  Q --> R[Status: Pengesahan Pemohon]

  R --> S{Respon Pemohon}
  S -->|Tolak tawaran| T[Status: Tolak Tawaran]
  S -->|Terima tawaran| U[Status HRM: Pemohon Bersetuju]

  I --> V[Pemohon boleh mohon semula jika dibenarkan]
  T --> V
```

## 2. Flow Lengkap Proses Permohonan Jawatan DBKU

```mermaid
flowchart TD
  Start([Mula]) --> ApplyBtn[Klik Mohon Jawatan DBKU]
  ApplyBtn --> Eligibility{Ada permohonan aktif untuk jawatan yang sama?}

  Eligibility -->|Ya| Block[Permohonan baru disekat]
  Block --> BlockReason[Draf / Menunggu semakan / Semakan bahagian / Pengesahan pemohon masih aktif]

  Eligibility -->|Tidak| Form[Borang Permohonan Jawatan DBKU]
  Form --> Tabs[Isi semua tab A hingga L]
  Tabs --> Back{Klik Kembali sebelum hantar?}

  Back -->|Ya| DraftPopup[Popup simpan draf]
  DraftPopup --> DraftText[Maklumat yang telah diisi akan disimpan sebagai draf dan dipaparkan dalam Permohonan Saya.]
  DraftText --> SaveDraft[Simpan draf]
  SaveDraft --> DraftStatus[Status: Draf]
  DraftStatus --> ContinueDraft[Teruskan Draf]
  ContinueDraft --> Form

  Back -->|Tidak| Submit[Klik Hantar Permohonan]
  Tabs --> Submit
  Submit --> Validate{Semua tab wajib lengkap?}
  Validate -->|Tidak| MissingTab[Buka tab pertama yang belum lengkap]
  MissingTab --> Tabs

  Validate -->|Ya| GenerateRef[No. Rujukan dijana]
  GenerateRef --> RefExample[Contoh: PK.2026-0007]
  RefExample --> SubmittedStatus[Status: Menunggu Semakan HRM]

  SubmittedStatus --> NotifyHRM[Notify HRM permohonan baharu]
  NotifyHRM --> HRMReview[HRM buat Semakan HRM]
  HRMReview --> HRMPopup{Popup pengesahan tindakan HRM}

  HRMPopup -->|Hantar ke Bahagian| HRMDecisionSend[Ya, hantar ke bahagian dipilih]
  HRMPopup -->|Tidak Lengkap| HRMDecisionIncomplete[Ya, tandakan Tidak Lengkap]
  HRMPopup -->|Tidak Layak| HRMDecisionReject[Ya, tandakan Tidak Layak]

  HRMDecisionIncomplete --> Incomplete[Status: Tidak Lengkap]
  Incomplete --> ApplicantUpdate[Pemohon kemaskini maklumat atau dokumen]
  ApplicantUpdate --> SubmittedStatus

  HRMDecisionReject --> Rejected[Status: Ditolak]

  HRMDecisionSend --> SelectedDept[HRM pilih satu bahagian sahaja]
  SelectedDept --> DeptReviewStatus[Status: Semakan Bahagian]
  DeptReviewStatus --> NotifyDept[Notify bahagian dipilih sahaja]
  NotifyDept --> DeptReview[Bahagian semak permohonan]
  DeptReview --> DeptDecision{Keputusan Bahagian}

  DeptDecision -->|Tolak| DeptRejected[Status: Ditolak Bahagian]
  DeptRejected --> NotifyHRMDecision[Notify HRM keputusan bahagian]
  NotifyHRMDecision --> HRMFinal[HRM buat Keputusan Akhir HRM]
  HRMFinal --> FinalDecision{Keputusan Akhir HRM}
  FinalDecision -->|Tolak| FinalRejected[Status: Ditolak]
  FinalRejected --> NotifyApplicantRejected[Notify pemohon permohonan tidak berjaya]
  FinalDecision -->|Terima| OrgFeedback

  DeptDecision -->|Terima| DeptAccepted[Status: Diterima Bahagian]
  DeptAccepted --> NotifyHRMConfirm[Notify HRM untuk pengesahan]
  NotifyHRMConfirm --> OrgFeedback[HRM sediakan Maklumbalas Organisasi]

  OrgFeedback --> OfferLetterText[Isi maklumat tawaran jawatan]
  OfferLetterText --> ReportDetails[Tetapkan tarikh, masa dan tempat melapor diri]
  ReportDetails --> ConfirmationDeadline[Tetapkan tarikh akhir pengesahan pemohon]
  ConfirmationDeadline --> SendToApplicant[Hantar ke Pemohon]

  SendToApplicant --> NotifyApplicantOffer[Notify pemohon tawaran diterima]
  NotifyApplicantOffer --> ApplicantConfirmation[Status: Pengesahan Pemohon]
  ApplicantConfirmation --> ResponseCheck{Pemohon respon sebelum tarikh akhir?}

  ResponseCheck -->|Tidak| AutoReject[Auto status: Tolak Tawaran]
  ResponseCheck -->|Ya| ApplicantChoice{Pilihan Pemohon}

  ApplicantChoice -->|Tolak Tawaran| RejectOffer[Status: Tolak Tawaran]
  RejectOffer --> NotifyHRMRejectOffer[Notify HRM pemohon menolak tawaran]

  ApplicantChoice -->|Terima Tawaran| UploadConfirm[Pemohon muat naik borang asal dan surat permohonan kerja PDF]
  UploadConfirm --> SubmitConfirm[Klik Hantar]
  SubmitConfirm --> ApplicantSent[Status Pemohon: Pengesahan Dihantar]
  SubmitConfirm --> HRMAgreed[Status HRM: Pemohon Bersetuju]
  HRMAgreed --> NotifyHRMAcceptOffer[Notify HRM pemohon menerima tawaran]

  Rejected --> Reapply[Permohonan jawatan yang sama boleh dibuat semula jika status membenarkan]
  FinalRejected --> Reapply
  RejectOffer --> Reapply
  AutoReject --> Reapply
  NotifyHRMAcceptOffer --> End([Selesai])
  NotifyHRMRejectOffer --> End
  NotifyApplicantRejected --> End
```

## 3. State Diagram Status Permohonan Jawatan DBKU

```mermaid
stateDiagram-v2
  [*] --> Draf: Simpan draf
  Draf --> Menunggu_Semakan_HRM: Hantar permohonan

  Menunggu_Semakan_HRM --> Tidak_Lengkap: HRM pilih Tidak Lengkap
  Tidak_Lengkap --> Menunggu_Semakan_HRM: Pemohon hantar semula

  Menunggu_Semakan_HRM --> Ditolak: HRM pilih Tidak Layak
  Menunggu_Semakan_HRM --> Semakan_Bahagian: HRM hantar ke bahagian dipilih

  Semakan_Bahagian --> Ditolak_Bahagian: Bahagian tolak
  Semakan_Bahagian --> Diterima_Bahagian: Bahagian terima

  Ditolak_Bahagian --> Ditolak: HRM tolak akhir
  Ditolak_Bahagian --> Pengesahan_Pemohon: HRM terima akhir dan hantar tawaran

  Diterima_Bahagian --> Pengesahan_Pemohon: HRM hantar tawaran

  Pengesahan_Pemohon --> Tolak_Tawaran: Pemohon tolak tawaran
  Pengesahan_Pemohon --> Tolak_Tawaran: Tiada respon selepas tarikh akhir
  Pengesahan_Pemohon --> Pemohon_Bersetuju: Pemohon terima tawaran

  Ditolak --> [*]
  Tolak_Tawaran --> [*]
  Pemohon_Bersetuju --> [*]
```

## 4. Flow Notifikasi Dan Kawalan Akses

```mermaid
flowchart TD
  A[Permohonan Jawatan DBKU dihantar] --> B[Notify HRM]
  B --> B1[Emel HRM]
  B --> B2[WhatsApp HRM]

  B1 --> C[HRM semak permohonan]
  B2 --> C

  C --> D{Keputusan HRM}
  D -->|Tidak Lengkap| D1[Status Tidak Lengkap kepada pemohon]
  D -->|Tidak Layak| D2[Status Ditolak kepada pemohon]
  D -->|Hantar ke Bahagian| E[Notify bahagian dipilih sahaja]

  E --> E0[Portal Kerjaya DBKU<br/>Terdapat permohonan Jawatan untuk semakan Bahagian<br/>Sila semak melalui portal]
  E --> E1[Emel Bahagian]
  E --> E2[WhatsApp Bahagian]

  E1 --> F[Bahagian semak permohonan]
  E2 --> F

  F --> G{Keputusan Bahagian}
  G -->|Terima| H[Notify HRM untuk pengesahan]
  G -->|Tolak| I[Notify HRM keputusan bahagian]

  H --> J[HRM sediakan Maklumbalas Organisasi]
  I --> K[HRM buat Keputusan Akhir HRM]

  K --> K1{Keputusan Akhir HRM}
  K1 -->|Tolak| K2[Notify pemohon permohonan tidak berjaya]
  K1 -->|Terima| J

  J --> L[HRM hantar tawaran kepada pemohon]
  L --> L1[Emel Pemohon]
  L --> L2[WhatsApp Pemohon]
  L1 --> M{Respon Pemohon}
  L2 --> M

  M -->|Terima Tawaran| N[Notify HRM: Pemohon menerima tawaran jawatan]
  M -->|Tolak Tawaran| O[Notify HRM: Pemohon menolak tawaran jawatan]
  M -->|Tiada respon selepas tarikh akhir| P[Auto notify HRM: Tawaran dianggap ditolak]

  subgraph Access[Kawalan Akses]
    R1[HRM boleh lihat semua permohonan Jawatan DBKU]
    R2[Bahagian hanya lihat permohonan yang dihantar kepada bahagian sendiri]
    R3[Hanya satu bahagian dipilih menerima notifikasi]
    R4[Bahagian tidak lihat permohonan bahagian lain]
    R5[Pemohon hanya lihat permohonan sendiri]
    R6[Pemohon tidak boleh mohon jawatan sama yang masih aktif]
    R7[Pemohon boleh mohon semula jika status Ditolak / Tolak Tawaran / Ditarik balik]
  end
```

## 5. Sequence Diagram Permohonan Jawatan DBKU

```mermaid
sequenceDiagram
  actor Pemohon
  participant Sistem
  participant HRM
  participant Bahagian
  participant Emel
  participant WhatsApp

  Pemohon->>Sistem: Isi borang permohonan jawatan A hingga L
  alt Simpan draf
    Pemohon->>Sistem: Klik Kembali
    Sistem-->>Pemohon: Papar popup simpan draf
    Pemohon->>Sistem: Simpan draf
    Sistem-->>Pemohon: Status Draf dipaparkan dalam Permohonan Saya
  else Hantar permohonan
    Pemohon->>Sistem: Klik Hantar Permohonan
    Sistem->>Sistem: Semak permohonan aktif untuk jawatan yang sama
    Sistem->>Sistem: Semak semua tab A hingga L lengkap
    Sistem-->>Pemohon: Jana No. Rujukan dan status Menunggu Semakan HRM
    Sistem->>Emel: Hantar notifikasi permohonan baharu kepada HRM
    Sistem->>WhatsApp: Hantar notifikasi permohonan baharu kepada HRM
    Sistem-->>HRM: Permohonan muncul dalam senarai HRM
  end

  HRM->>Sistem: Buka permohonan dan buat Semakan HRM

  alt Tidak Lengkap
    HRM->>Sistem: Klik Tidak Lengkap
    Sistem-->>HRM: Papar popup pengesahan
    HRM->>Sistem: Klik Ya
    Sistem-->>Pemohon: Status Tidak Lengkap
  else Tidak Layak
    HRM->>Sistem: Klik Tidak Layak
    Sistem-->>HRM: Papar popup pengesahan
    HRM->>Sistem: Klik Ya
    Sistem-->>Pemohon: Status Ditolak
  else Hantar ke Bahagian
    HRM->>Sistem: Pilih satu bahagian dan klik Hantar ke Bahagian
    Sistem-->>HRM: Papar popup pengesahan
    HRM->>Sistem: Klik Ya
    Sistem->>Emel: Notify bahagian dipilih untuk semakan
    Sistem->>WhatsApp: Notify bahagian dipilih untuk semakan
    Sistem-->>Bahagian: Permohonan muncul dalam senarai Bahagian
  end

  Bahagian->>Sistem: Semak permohonan

  alt Bahagian tolak
    Bahagian->>Sistem: Hantar keputusan Tolak
    Sistem->>Emel: Notify HRM keputusan bahagian
    Sistem->>WhatsApp: Notify HRM keputusan bahagian
    HRM->>Sistem: Buat Keputusan Akhir HRM
    alt HRM tolak akhir
      HRM->>Sistem: Hantar keputusan akhir Tolak
      Sistem-->>Pemohon: Status Ditolak
      Sistem->>Emel: Notify pemohon permohonan tidak berjaya
      Sistem->>WhatsApp: Notify pemohon permohonan tidak berjaya
    else HRM terima akhir
      HRM->>Sistem: Teruskan ke Maklumbalas Organisasi
    end
  else Bahagian terima
    Bahagian->>Sistem: Hantar keputusan Terima
    Sistem->>Emel: Notify HRM untuk pengesahan
    Sistem->>WhatsApp: Notify HRM untuk pengesahan
  end

  HRM->>Sistem: Sediakan Maklumbalas Organisasi
  HRM->>Sistem: Tetapkan tarikh, masa dan tempat melapor diri
  HRM->>Sistem: Hantar tawaran kepada pemohon
  Sistem->>Emel: Notify pemohon permohonan diterima
  Sistem->>WhatsApp: Notify pemohon permohonan diterima
  Sistem-->>Pemohon: Status Pengesahan Pemohon

  alt Pemohon terima tawaran
    Pemohon->>Sistem: Muat naik borang asal dan surat permohonan kerja PDF
    Pemohon->>Sistem: Klik Hantar
    Sistem-->>Pemohon: Status Pengesahan Dihantar
    Sistem-->>HRM: Status Pemohon Bersetuju
    Sistem->>Emel: Notify HRM pemohon menerima tawaran jawatan
    Sistem->>WhatsApp: Notify HRM pemohon menerima tawaran jawatan
  else Pemohon tolak tawaran
    Pemohon->>Sistem: Klik Tolak Tawaran
    Sistem-->>Pemohon: Papar ringkasan Anda telah menolak tawaran jawatan ini
    Sistem-->>HRM: Status Tolak Tawaran
    Sistem->>Emel: Notify HRM pemohon menolak tawaran jawatan
    Sistem->>WhatsApp: Notify HRM pemohon menolak tawaran jawatan
  else Tiada respon selepas tarikh akhir
    Sistem->>Sistem: Auto tukar status kepada Tolak Tawaran
    Sistem->>Emel: Notify HRM tawaran dianggap ditolak
    Sistem->>WhatsApp: Notify HRM tawaran dianggap ditolak
  end
```
