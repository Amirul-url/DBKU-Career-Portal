# Modul Permohonan Latihan Industri

Dokumen ini menyenaraikan lima rajah Mermaid untuk menerangkan aliran Modul Permohonan Latihan Industri DBKU.

## 1. Flow Ringkas Modul LI

```mermaid
flowchart TD
  A([Pemohon]) --> B[Isi Permohonan Latihan Industri]
  B --> C{Hantar permohonan?}

  C -->|Simpan draf| D[Status: Draf]
  D --> B

  C -->|Hantar| E[Status: Menunggu Semakan HRM]
  E --> F[HRM semak permohonan]

  F --> G{Keputusan HRM}
  G -->|Tidak Lengkap| H[Status: Tidak Lengkap]
  G -->|Tidak Layak| I[Status: Ditolak]
  G -->|Hantar ke Bahagian| J[Status: Semakan Bahagian]

  J --> K[Bahagian semak permohonan]
  K --> L{Keputusan Bahagian}
  L -->|Tolak| M[Status: Ditolak Bahagian]
  L -->|Terima| N[HRM sediakan tawaran]

  M --> O[HRM buat keputusan akhir]
  O --> P{Keputusan Akhir HRM}
  P -->|Tolak| I
  P -->|Terima| N

  N --> Q[HRM hantar tawaran kepada pemohon]
  Q --> R[Status: Pengesahan Pemohon]

  R --> S{Respon Pemohon}
  S -->|Tolak tawaran| T[Status: Tolak Tawaran]
  S -->|Terima tawaran| U[Status HRM: Pemohon Bersetuju]

  U --> V[Status: Sedang Menjalani LI]
  V --> W[Status: Tamat LI]

  W --> X[Pemohon boleh mohon LI baru]
  I --> X
  T --> X
```

## 2. Flow Lengkap Proses Permohonan LI

```mermaid
flowchart TD
  Start([Mula]) --> ApplyBtn[Klik Mohon Latihan Industri]
  ApplyBtn --> Eligibility{Ada permohonan LI aktif?}

  Eligibility -->|Ya| Block[Permohonan baru disekat]
  Block --> BlockReason[Draf / Menunggu semakan / Semakan bahagian / Tawaran / Sedang LI masih aktif]

  Eligibility -->|Tidak| Form[Borang Permohonan LI]
  Form --> Back{Klik Kembali sebelum hantar?}

  Back -->|Ya| DraftPopup[Popup simpan draf]
  DraftPopup --> DraftText[Maklumat yang telah diisi akan disimpan sebagai draf dan dipaparkan dalam Permohonan Saya.]
  DraftText --> SaveDraft[Simpan draf]
  SaveDraft --> DraftStatus[Status: Draf]
  DraftStatus --> ContinueDraft[Teruskan Draf]
  ContinueDraft --> Form

  Back -->|Tidak| Submit[Klik Hantar Permohonan]
  Form --> Submit
  Submit --> GenerateRef[No. Rujukan dijana]
  GenerateRef --> RefExample[Contoh: PK.2026-0003]
  RefExample --> SubmittedStatus[Status: Menunggu Semakan HRM]

  SubmittedStatus --> HRMReview[HRM buat Semakan HRM]
  HRMReview --> HRMDecision{Keputusan HRM}

  HRMDecision -->|Tidak Lengkap| Incomplete[Status: Tidak Lengkap]
  Incomplete --> ApplicantUpdate[Pemohon kemaskini permohonan]
  ApplicantUpdate --> SubmittedStatus

  HRMDecision -->|Tidak Layak| Rejected[Status: Ditolak]

  HRMDecision -->|Hantar ke Bahagian| SentDept[Status: Semakan Bahagian]
  SentDept --> DeptReview[Bahagian semak permohonan]
  DeptReview --> DeptDecision{Keputusan Bahagian}

  DeptDecision -->|Tolak| DeptRejected[Status: Ditolak Bahagian]
  DeptRejected --> HRMFinal[HRM buat keputusan akhir]
  HRMFinal --> FinalDecision{Keputusan Akhir HRM}
  FinalDecision -->|Tolak| Rejected
  FinalDecision -->|Terima| OrgFeedback

  DeptDecision -->|Terima| DeptAccepted[Status: Diterima Bahagian]
  DeptAccepted --> OrgFeedback[HRM sediakan Maklumbalas Organisasi]

  OrgFeedback --> UploadOffer[HRM muat naik dokumen tawaran]
  UploadOffer --> ReportDetails[Tetapkan tarikh, masa dan tempat melapor diri]
  ReportDetails --> ConfirmationDeadline[Tetapkan tarikh akhir pengesahan pemohon]
  ConfirmationDeadline --> SendToApplicant[Hantar ke Pemohon]

  SendToApplicant --> ApplicantConfirmation[Status: Pengesahan Pemohon]
  ApplicantConfirmation --> ResponseCheck{Pemohon respon sebelum tarikh akhir?}

  ResponseCheck -->|Tidak| AutoReject[Auto status: Tolak Tawaran]
  ResponseCheck -->|Ya| ApplicantChoice{Pilihan Pemohon}

  ApplicantChoice -->|Tolak Tawaran| RejectOffer[Status: Tolak Tawaran]
  ApplicantChoice -->|Terima Tawaran| UploadConfirm[Pemohon muat naik dokumen pengesahan]
  UploadConfirm --> SubmitConfirm[Klik Hantar]
  SubmitConfirm --> ApplicantSent[Status Pemohon: Pengesahan Dihantar]
  SubmitConfirm --> HRMAgreed[Status HRM: Pemohon Bersetuju]

  HRMAgreed --> StartDate{Tarikh mula LI sudah sampai?}
  StartDate -->|Belum| HRMAgreed
  StartDate -->|Ya| ActiveLI[Status: Sedang Menjalani LI]

  ActiveLI --> EndDate{Tarikh tamat LI sudah lepas?}
  EndDate -->|Belum| ActiveLI
  EndDate -->|Ya| Completed[Status: Tamat LI]

  Completed --> End([Selesai])
  Rejected --> End
  RejectOffer --> End
  AutoReject --> End
```

## 3. State Diagram Status Permohonan LI

```mermaid
stateDiagram-v2
  [*] --> Draf: Simpan draf
  Draf --> Menunggu_Semakan_HRM: Hantar permohonan

  Menunggu_Semakan_HRM --> Tidak_Lengkap: HRM pilih Tidak Lengkap
  Tidak_Lengkap --> Menunggu_Semakan_HRM: Pemohon hantar semula

  Menunggu_Semakan_HRM --> Ditolak: HRM pilih Tidak Layak
  Menunggu_Semakan_HRM --> Semakan_Bahagian: HRM hantar ke bahagian

  Semakan_Bahagian --> Ditolak_Bahagian: Bahagian tolak
  Semakan_Bahagian --> Diterima_Bahagian: Bahagian terima

  Ditolak_Bahagian --> Ditolak: HRM tolak akhir
  Ditolak_Bahagian --> Pengesahan_Pemohon: HRM terima akhir

  Diterima_Bahagian --> Pengesahan_Pemohon: HRM hantar tawaran

  Pengesahan_Pemohon --> Tolak_Tawaran: Pemohon tolak tawaran
  Pengesahan_Pemohon --> Tolak_Tawaran: Tiada respon selepas tarikh akhir
  Pengesahan_Pemohon --> Pemohon_Bersetuju: Pemohon terima tawaran

  Pemohon_Bersetuju --> Sedang_Menjalani_LI: Tarikh mula LI sampai
  Sedang_Menjalani_LI --> Tamat_LI: Tarikh tamat LI lepas

  Ditolak --> [*]
  Tolak_Tawaran --> [*]
  Tamat_LI --> [*]
```

## 4. Flow Notifikasi Dan Kawalan Akses

```mermaid
flowchart TD
  A[Permohonan LI dihantar] --> B[Notify HRM]
  B --> B1[Emel HRM]
  B --> B2[WhatsApp HRM]

  B1 --> C[HRM semak permohonan]
  B2 --> C

  C --> D{Keputusan HRM}
  D -->|Hantar ke Bahagian| E[Notify Bahagian terlibat]
  E --> E1[Emel Bahagian]
  E --> E2[WhatsApp Bahagian]

  E1 --> F[Bahagian semak permohonan]
  E2 --> F

  F --> G{Keputusan Bahagian}
  G -->|Terima| H[Notify HRM untuk pengesahan]
  G -->|Tolak| I[Notify HRM keputusan bahagian]

  H --> J[HRM sediakan tawaran]
  I --> K[HRM buat keputusan akhir]

  J --> L[HRM hantar tawaran kepada pemohon]
  L --> M{Respon Pemohon}

  M -->|Terima Tawaran| N[Notify HRM: Pemohon menerima tawaran]
  M -->|Tolak Tawaran| O[Notify HRM: Pemohon menolak tawaran]
  M -->|Tiada respon selepas tarikh akhir| P[Auto notify HRM: Tawaran dianggap ditolak]

  subgraph Access[Kawalan Akses]
    R1[HRM boleh lihat semua permohonan LI]
    R2[Bahagian hanya lihat permohonan yang dihantar kepada bahagian sendiri]
    R3[Bahagian tidak lihat senarai penuh selepas keputusan dibuat]
    R4[Bahagian tidak perlu menu Akaun Pemohon]
    R5[Dashboard Bahagian tidak perlu Status Permohonan]
    R6[Pemohon hanya lihat permohonan sendiri]
  end
```

## 5. Sequence Diagram Permohonan LI

```mermaid
sequenceDiagram
  actor Pemohon
  participant Sistem
  participant HRM
  participant Bahagian
  participant Emel
  participant WhatsApp

  Pemohon->>Sistem: Isi borang permohonan LI
  alt Simpan draf
    Pemohon->>Sistem: Klik Kembali
    Sistem-->>Pemohon: Papar popup simpan draf
    Pemohon->>Sistem: Simpan draf
    Sistem-->>Pemohon: Status Draf dipaparkan dalam Permohonan Saya
  else Hantar permohonan
    Pemohon->>Sistem: Klik Hantar Permohonan
    Sistem-->>Pemohon: Jana No. Rujukan dan status Menunggu Semakan HRM
    Sistem->>Emel: Hantar notifikasi permohonan baharu kepada HRM
    Sistem->>WhatsApp: Hantar notifikasi permohonan baharu kepada HRM
    Sistem-->>HRM: Permohonan muncul dalam senarai HRM
  end

  HRM->>Sistem: Buka permohonan dan buat Semakan HRM

  alt Tidak Lengkap
    HRM->>Sistem: Tandakan Tidak Lengkap
    Sistem-->>Pemohon: Status Tidak Lengkap
  else Tidak Layak
    HRM->>Sistem: Tandakan Tidak Layak
    Sistem-->>Pemohon: Status Ditolak
  else Hantar ke Bahagian
    HRM->>Sistem: Hantar ke Bahagian berkaitan
    Sistem->>Emel: Notify Bahagian untuk semakan
    Sistem->>WhatsApp: Notify Bahagian untuk semakan
    Sistem-->>Bahagian: Permohonan muncul dalam senarai Bahagian
  end

  Bahagian->>Sistem: Semak permohonan

  alt Bahagian tolak
    Bahagian->>Sistem: Hantar keputusan Tolak
    Sistem->>Emel: Notify HRM keputusan bahagian
    Sistem->>WhatsApp: Notify HRM keputusan bahagian
    HRM->>Sistem: Buat keputusan akhir
  else Bahagian terima
    Bahagian->>Sistem: Hantar keputusan Terima
    Sistem->>Emel: Notify HRM untuk pengesahan
    Sistem->>WhatsApp: Notify HRM untuk pengesahan
  end

  HRM->>Sistem: Sediakan maklumbalas organisasi dan tawaran
  HRM->>Sistem: Hantar tawaran kepada pemohon
  Sistem-->>Pemohon: Status Pengesahan Pemohon

  alt Pemohon terima tawaran
    Pemohon->>Sistem: Muat naik dokumen pengesahan
    Pemohon->>Sistem: Klik Hantar
    Sistem-->>Pemohon: Status Pengesahan Dihantar
    Sistem-->>HRM: Status Pemohon Bersetuju
    Sistem->>Emel: Notify HRM pemohon menerima tawaran
    Sistem->>WhatsApp: Notify HRM pemohon menerima tawaran
  else Pemohon tolak tawaran
    Pemohon->>Sistem: Klik Tolak Tawaran
    Sistem-->>Pemohon: Status Tolak Tawaran
    Sistem-->>HRM: Status Tolak Tawaran
    Sistem->>Emel: Notify HRM pemohon menolak tawaran
    Sistem->>WhatsApp: Notify HRM pemohon menolak tawaran
  else Tiada respon selepas tarikh akhir
    Sistem->>Sistem: Auto tukar status kepada Tolak Tawaran
    Sistem->>Emel: Notify HRM tawaran dianggap ditolak
    Sistem->>WhatsApp: Notify HRM tawaran dianggap ditolak
  end

  Sistem->>Sistem: Semak tarikh mula LI
  Sistem-->>Pemohon: Status Sedang Menjalani LI apabila tarikh mula sampai
  Sistem->>Sistem: Semak tarikh tamat LI
  Sistem-->>Pemohon: Status Tamat LI apabila tarikh tamat lepas
```
