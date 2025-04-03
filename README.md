# Parking System

Sistem manajemen parkir dengan fitur kamera IP untuk pengenalan plat nomor.

## Persyaratan Sistem

- Node.js v18 atau lebih tinggi
- NPM v8 atau lebih tinggi
- PM2 (akan diinstal otomatis)

## Cara Menjalankan Aplikasi

### Mode Development

1. Beri izin eksekusi pada script:
```bash
chmod +x setup.sh
```

2. Jalankan script setup:
```bash
./setup.sh
```

Script akan:
- Menginstal PM2 secara global
- Menginstal dependencies backend dan frontend
- Menjalankan aplikasi menggunakan PM2
- Mengkonfigurasi PM2 untuk start saat boot

### Mode Production

1. Beri izin eksekusi pada script:
```bash
chmod +x start-production.sh
```

2. Jalankan script production:
```bash
./start-production.sh
```

## Mengakses Aplikasi

- Backend: http://[IP_SERVER]:3000
- Frontend: http://[IP_SERVER]:3001

## Monitoring dan Logs

- Monitor aplikasi: `pm2 monit`
- Lihat logs: `pm2 logs`
- Stop aplikasi: `pm2 stop all`
- Restart aplikasi: `pm2 restart all`

## Konfigurasi Firewall

Pastikan port berikut terbuka:
- Port 3000 (Backend API)
- Port 3001 (Frontend)# Node-Maret-Pakir
