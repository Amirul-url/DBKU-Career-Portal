# Backend Architecture

Backend ini menggunakan pendekatan modular monolith. Semua modul berjalan dalam satu aplikasi Django, tetapi kod dipisahkan mengikut domain supaya tidak bercampur dalam satu fail besar.

## Modul Domain

- `accounts` - pengguna, pendaftaran, log masuk dan profil akaun.
- `jobs` - jawatan kosong dan latihan industri.
- `applications` - permohonan calon, penghantaran, penarikan balik dan semakan status.
- `notifications` - notifikasi sistem dan penghantaran emel.
- `config` - konfigurasi projek, URL utama, pagination dan settings.

## Prinsip Fail

- `models.py` hanya untuk struktur data dan behavior model yang rapat dengan data.
- `serializers.py` hanya untuk kontrak API dan validasi input/output.
- `views.py` hanya untuk request, response dan routing action.
- `services.py` untuk workflow dan side effect seperti token auth, notifikasi dan perubahan status.
- `permissions.py` untuk access rules.
- `urls.py` untuk pendaftaran route modul.

## Peraturan Kerja Seterusnya

Jangan tambah logic domain besar terus ke `views.py` atau `serializers.py`. Jika logic itu boleh digunakan semula, mempunyai side effect, atau melibatkan beberapa model, letakkan dalam `services.py`. Jika logic itu menentukan siapa boleh akses sesuatu endpoint atau object, letakkan dalam `permissions.py`.
