Aplikasi GUI untuk input/collect data timbangan kompos Molindo Raya dengan electron.

Alat:
- Windows 10 (operating system)
- Visual Studio 2022 (installer)
- python 3.13 (installer)
- Install software didalam Windows, lengkapi dependensinya.

Ketentuan:
- Compile code dari typescript ke javascript npm run build di root project dan didalam frontend 
- Hasil compile akan ditampilkan di directory dist-electron
- Copy file frontend/dist hasil build ke root project beri nama dist-frontend

Build Portable:
- Siapkan Alat
- clone dari repo
- lakukan command di PowerShell (Administrator)
- jalankan npm install
- perhatikan ketentuan
- jalankan npm rebuild --runtime=electron --target=38.0.0 --dist-url=https://electronjs.org/headers (target sesuai versi electron)
- jalankan npx electron-builder build --windows portable
- tunggu hingga proses selesai
