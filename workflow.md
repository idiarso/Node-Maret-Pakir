# Diagram Alur Sistem Parkir

## Komponen Sistem

```
+------------------+      +------------------+      +------------------+
|                  |      |                  |      |                  |
|    ParkingIN     |<---->|  ParkingServer   |<---->|    ParkingOUT    |
|    (Entry)       |      | (WebSocket/DB)   |      |    (Exit)        |
|                  |      |                  |      |                  |
+--------^---------+      +------------------+      +--------^---------+
         |                                                   |
         |                                                   |
+--------v---------+                                +--------v---------+
|                  |                                |                  |
| Mikrokontroler   |                                | Mikrokontroler   |
|    arduino uno         |                                |    arduino uno         |
| (Entry Gate)     |                                | (Exit Gate)      |
|                  |                                |                  |
+--------^---------+                                +--------^---------+
         |                                                   |
         |                                                   |
+--------v---------+      +------------------+      +--------v---------+
|                  |      |                  |      |                  |
|  Push Button     |      |   PostgreSQL     |      |  Barcode Scanner |
|  & Sensor Masuk  |      |    Database      |      |  & Printer Keluar|
|                  |      |                  |      |                  |
+--------^---------+      +------------------+      +--------^---------+
         |                                                   |
         |                                                   |
+--------v---------+                                +--------v---------+
|                  |                                |                  |
|    Kamera        |                                |  Gate Barrier    |
|  (Entry Point)   |                                |  (Exit Point)    |
|                  |                                |                  |
+------------------+                                +------------------+
```

## Alur Proses Sistem

### Proses Masuk (Entry)

```
+---------------+     +---------------+     +---------------+
| Kendaraan     |     | Push Button   |     | arduino uno MCU     |
| Terdeteksi    |---->| Ditekan       |---->| Kirim Sinyal  |
|               |     |               |     | "IN:<ID>"     |
+---------------+     +---------------+     +-------+-------+
                                                    |
                                                    v
+---------------+     +---------------+     +---------------+
| Gambar        |     | Data          |     | ParkingIN     |
| Disimpan      |<----| Diproses      |<----| Terima Sinyal |
|               |     |               |     |               |
+-------+-------+     +-------+-------+     +---------------+
        |                     |
        v                     v
+---------------+     +---------------+     +---------------+
| Tiket Dengan  |     | Portal        |     | Kendaraan     |
| Barcode       |---->| Terbuka       |---->| Masuk         |
| Dicetak       |     |               |     |               |
+---------------+     +---------------+     +---------------+
```

### Proses Keluar (Exit)

```
+---------------+     +---------------+     +---------------+
| Kendaraan     |     | Barcode Tiket |     | ParkingOUT    |
| di Exit Gate  |---->| Dipindai      |---->| Proses Data   |
|               |     |               |     |               |
+---------------+     +---------------+     +-------+-------+
                                                    |
                                                    v
+---------------+     +---------------+     +---------------+
| Petugas       |     | Sistem        |     | Data Parkir   |
| Verifikasi    |<----| Tampilkan     |<----| & Foto        |
| Kendaraan     |     | Foto Entry    |     | Diambil       |
+-------+-------+     +---------------+     +---------------+
        |
        v
+---------------+     +---------------+     +---------------+
| Transaksi     |     | Tombol        |     | Sinyal Buka   |
| Pembayaran    |---->| "Buka Gate"   |---->| Dikirim ke MCU|
| (jika ada)    |     | Ditekan       |     |               |
+---------------+     +---------------+     +-------+-------+
                                                    |
                                                    v
+---------------+     +---------------+     +---------------+
| Struk         |     | Portal Exit   |     | Kendaraan     |
| Pembayaran    |---->| Terbuka       |---->| Keluar        |
| Dicetak       |     |               |     |               |
+---------------+     +---------------+     +---------------+
```

## Detail Alur Proses Hardware

### 1. Proses Masuk Kendaraan (Entry)

1. **Trigger Kamera:**
   - Driver kendaraan menekan push button pada gate masuk
   - Push button terhubung ke arduino uno MCU
   - MCU mengirim sinyal melalui port serial (RS232/DB9) ke PC dengan format "IN:<timestamp>"
   - HardwareManager.cs di aplikasi ParkingIN menerima sinyal dan memicu proses berikutnya

2. **Pengambilan Gambar:**
   - ParkingEntryHandler.cs menerima sinyal trigger
   - `HardwareManager.CaptureEntryImageAsync()` dipanggil untuk mengambil gambar
   - Kamera (webcam atau IP) mengambil gambar kendaraan
   - Gambar disimpan dengan format ID tiket: `YYYYMMDD_HHMMSS_<random>.jpg`
   - Path gambar disimpan di database untuk referensi nanti

3. **Pencetakan Tiket:**
   - `HardwareManager.PrintTicket()` dipanggil dengan data tiket
   - Tiket dicetak dengan printer thermal yang terkonfigurasi
   - Format tiket sesuai konfigurasi di `printer.ini` termasuk:
     - Barcode dengan format Code128 atau QR
     - Waktu masuk dan informasi lokasi parkir
     - Tarif dasar (jika diaplikasikan)

4. **Pembukaan Gate:**
   - `HardwareManager.OpenEntryGate()` dipanggil untuk membuka portal
   - Sinyal dikirim melalui port serial ke arduino uno MCU
   - MCU mengaktifkan relay untuk membuka gate barrier
   - Sensor keamanan memantau area gate
   - Setelah durasi timeout, gate ditutup kembali secara otomatis

### 2. Proses Keluar Kendaraan (Exit)

1. **Pemindaian Barcode:**
   - Petugas atau pengemudi memindai barcode tiket dengan barcode scanner
   - Scanner (terhubung sebagai HID keyboard) mengirim data barcode + Enter
   - ParkingExitHandler.cs menerima data barcode
   - `ParkingExitHandler.ProcessBarcodeData()` memproses data barcode

2. **Verifikasi Kendaraan:**
   - Data kendaraan diambil dari database berdasarkan ID barcode
   - Foto kendaraan saat masuk ditampilkan di layar
   - Petugas memverifikasi bahwa kendaraan yang keluar sesuai dengan foto
   - Jika diperlukan, petugas dapat menambahkan catatan atau override tarif

3. **Kalkulasi Biaya:**
   - Sistem menghitung durasi parkir (waktu keluar - waktu masuk)
   - Tarif dihitung berdasarkan jenis kendaraan dan durasi
   - Jika pembayaran diperlukan, petugas memproses pembayaran
   - Data pembayaran dicatat dalam database

4. **Pencetakan Struk:**
   - `HardwareManager.PrintReceipt()` dipanggil dengan data pembayaran
   - Struk dicetak menggunakan printer thermal
   - Struk berisi rincian parkir dan pembayaran

5. **Pembukaan Gate:**
   - Setelah verifikasi dan pembayaran, petugas menekan tombol "Buka Gate"
   - `HardwareManager.OpenExitGate()` dipanggil untuk membuka portal keluar
   - Sinyal dikirim melalui port serial ke arduino uno MCU
   - MCU mengaktifkan relay untuk membuka gate barrier
   - Status transaksi diupdate menjadi "Completed" di database

### 3. Diagram Sequence Detail Kamera

```
+-------------------+  +-------------------+  +-------------------+  +-------------------+
| Push Button/MCU   |  | HardwareManager   |  | Camera System     |  | Storage System    |
+-------------------+  +-------------------+  +-------------------+  +-------------------+
         |                      |                      |                      |
         | Serial Signal        |                      |                      |
         |--------------------->|                      |                      |
         |                      | Initialize Camera    |                      |
         |                      |--------------------->|                      |
         |                      |                      |                      |
         |                      | Capture Image        |                      |
         |                      |--------------------->|                      |
         |                      |                      |                      |
         |                      |     Image Data       |                      |
         |                      |<---------------------|                      |
         |                      |                      |                      |
         |                      | Save Image           |                      |
         |                      |--------------------------------------------->|
         |                      |                      |                      |
         |                      |           File Path                         |
         |                      |<---------------------------------------------|
         |                      |                      |                      |
```

### 4. Diagram Sequence Detail Gate Control

```
+-------------------+  +-------------------+  +-------------------+  +-------------------+
| UI/Operator       |  | HardwareManager   |  | Serial Port       |  | arduino uno MCU         |
+-------------------+  +-------------------+  +-------------------+  +-------------------+
         |                      |                      |                      |
         | Open Gate Request    |                      |                      |
         |--------------------->|                      |                      |
         |                      | Initialize Port      |                      |
         |                      |--------------------->|                      |
         |                      |                      |                      |
         |                      | Send Command         |                      |
         |                      |--------------------->|                      |
         |                      |                      | Serial Data          |
         |                      |                      |--------------------->|
         |                      |                      |                      |
         |                      |                      |                      | Activate Relay
         |                      |                      |                      |----------+
         |                      |                      |                      |          |
         |                      |                      | Acknowledgement      |          |
         |                      |                      |<---------------------|          |
         |                      |  Command Result      |                      |          |
         |                      |<---------------------|                      |          |
         |  Gate Status         |                      |                      |          |
         |<---------------------|                      |                      |          |
         |                      |                      |                      |          |
         |                      |                      |                      | Gate Opens
         |                      |                      |                      |<---------+
         |                      |                      |                      |
```

### 5. Diagram Sequence Detail Printer

```
+-------------------+  +-------------------+  +-------------------+  +-------------------+
| ParkingHandler    |  | HardwareManager   |  | Printer System    |  | User/Operator     |
+-------------------+  +-------------------+  +-------------------+  +-------------------+
         |                      |                      |                      |
         | Print Request        |                      |                      |
         |--------------------->|                      |                      |
         |                      | Generate Ticket Data |                      |
         |                      |----------+           |                      |
         |                      |          |           |                      |
         |                      |<---------+           |                      |
         |                      |                      |                      |
         |                      | Print Command        |                      |
         |                      |--------------------->|                      |
         |                      |                      |                      |
         |                      |                      | Printing...          |
         |                      |                      |----------+           |
         |                      |                      |          |           |
         |                      |                      |<---------+           |
         |                      |                      |                      |
         |                      |  Print Status        |                      |
         |                      |<---------------------|                      |
         |  Print Complete      |                      |                      |
         |<---------------------|                      |                      |
         |                      |                      | Ticket/Receipt       |
         |                      |                      |--------------------->|
         |                      |                      |                      |
```

## Komunikasi antar Hardware

### 1. Komunikasi Serial (usb)

Komunikasi antara PC dan arduino uno MCU menggunakan format berikut:

#### Dari MCU ke PC:
- `IN:<timestamp>` - Sinyal dari push button entry
- `STATUS:READY` - MCU siap menerima perintah
- `STATUS:BUSY` - MCU sedang memproses perintah
- `ERROR:<error_code>` - Error pada MCU

#### Dari PC ke MCU:
- `OPEN_ENTRY` - Perintah untuk membuka gate masuk
- `CLOSE_ENTRY` - Perintah untuk menutup gate masuk
- `OPEN_EXIT` - Perintah untuk membuka gate keluar
- `CLOSE_EXIT` - Perintah untuk menutup gate keluar
- `STATUS` - Request status MCU

### 2. Komunikasi Database
Data transaksi parkir disimpan dalam database PostgreSQL dengan struktur:

```sql
-- Contoh kueri untuk mendapatkan data ticket berdasarkan barcode
SELECT v.vehicle_id, v.entry_time, v.entry_image, v.ticket_number, v.vehicle_type
FROM vehicles v
WHERE v.ticket_number = '{barcode}'
AND v.exit_time IS NULL;

-- Contoh kueri untuk update saat kendaraan keluar
UPDATE vehicles
SET exit_time = CURRENT_TIMESTAMP, 
    exit_image = '{imagePath}', 
    parking_fee = {fee}, 
    payment_status = 'PAID'
WHERE ticket_number = '{barcode}';
```

### 3. Komunikasi Kamera

#### Webcam:
- Menggunakan library AForge.Video.DirectShow
- Menangkap frame melalui event handler
- Menyimpan gambar dalam format JPG

#### IP Camera:
- Menggunakan HTTP request ke snapshot URL
- Format URL: `http://{ip}:{port}/snapshot.jpg` atau API khusus vendor
- Autentikasi menggunakan Basic Auth (username/password)

## Konfigurasi Hardware

Semua pengaturan hardware tersimpan dalam file konfigurasi terpisah:

1. **camera.ini** - Konfigurasi kamera (IP/Webcam)
2. **gate.ini** - Konfigurasi gate controller dan serial port
3. **printer.ini** - Konfigurasi printer thermal dan format tiket
4. **network.ini** - Konfigurasi database dan koneksi jaringan

File-file ini dikelola melalui `HardwareManager.js` yang berfungsi sebagai interface terpadu untuk semua komponen hardware.

## Error Handling Flow

### 1. Hardware Error

```
+-------------------+  +-------------------+  +-------------------+
| Hardware Device   |  | Error Handler     |  | System Admin      |
+-------------------+  +-------------------+  +-------------------+
         |                      |                      |
         | Device Error         |                      |
         |--------------------->|                      |
         |                      | Log Error            |
         |                      |----------+           |
         |                      |          |           |
         |                      |<---------+           |
         |                      |                      |
         |                      | Notify Admin         |
         |                      |--------------------->|
         |                      |                      |
         |                      | Fallback Mode        |
         |                      |----------+           |
         |                      |          |           |
         |                      |<---------+           |
         |                      |                      |
```

#### Jenis Error dan Penanganan:
1. **Kamera Error**
   - Fallback: Input manual nomor plat
   - Notifikasi ke admin sistem
   - Log error untuk troubleshooting

2. **Printer Error**
   - Fallback: Cetak manual atau generate e-ticket
   - Retry mechanism dengan printer cadangan
   - Alert untuk penggantian kertas/pita printer

3. **Gate Barrier Error**
   - Fallback: Operasi manual oleh petugas
   - Safety check sebelum operasi manual
   - Notifikasi urgent ke teknisi

4. **Scanner Error**
   - Fallback: Input manual nomor tiket
   - Verifikasi data dari database
   - Double check oleh petugas

### 2. Software Error

```
+-------------------+  +-------------------+  +-------------------+
| Application       |  | Error Logger      |  | Recovery System   |
+-------------------+  +-------------------+  +-------------------+
         |                      |                      |
         | Exception           |                      |
         |--------------------->|                      |
         |                      | Log Details         |
         |                      |----------+           |
         |                      |          |           |
         |                      |<---------+           |
         |                      |                      |
         |                      | Recovery Action      |
         |                      |--------------------->|
         |                      |                      |
         |                      | Service Restored     |
         |<--------------------------------------------|         
```

#### Error Handling Strategy:
1. **Database Errors**
   - Retry connection dengan exponential backoff
   - Failover ke backup database
   - Cache temporary untuk transaksi pending

2. **Network Errors**
   - Offline mode dengan local storage
   - Sync otomatis saat koneksi pulih
   - Queue system untuk transaksi

3. **Application Errors**
   - Detailed logging dengan stack trace
   - Automatic restart untuk critical services
   - Alert system untuk DevOps team

## Backup System Flow

### 1. Data Backup

```
+-------------------+  +-------------------+  +-------------------+
| Primary System    |  | Backup Service    |  | Storage System    |
+-------------------+  +-------------------+  +-------------------+
         |                      |                      |
         | Scheduled Backup     |                      |
         |--------------------->|                      |
         |                      | Process Data         |
         |                      |----------+           |
         |                      |          |           |
         |                      |<---------+           |
         |                      |                      |
         |                      | Store Backup         |
         |                      |--------------------->|
         |                      |                      |
         |                      | Confirm Storage      |
         |                      |<---------------------|
```

#### Backup Strategy:
1. **Database Backup**
   - Full backup harian (midnight)
   - Incremental backup per jam
   - Point-in-time recovery support

2. **Image Backup**
   - Backup gambar kendaraan setiap hari
   - Kompresi untuk menghemat ruang penyimpanan
   - Retensi selama 30 hari (configurable)

3. **Configuration Backup**
   - Backup file konfigurasi setiap ada perubahan
   - Version control untuk tracking perubahan
   - Restore point untuk rollback

## Sistem Pembayaran

### 1. Diagram Alur Pembayaran

```
+-------------------+  +-------------------+  +-------------------+
| ParkingOUT App    |  | Payment Gateway   |  | Receipt Printer   |
+-------------------+  +-------------------+  +-------------------+
         |                      |                      |
         | Calculate Fee        |                      |
         |----------+           |                      |
         |          |           |                      |
         |<---------+           |                      |
         |                      |                      |
         | Payment Request      |                      |
         |--------------------->|                      |
         |                      |                      |
         |                      | Process Payment      |
         |                      |----------+           |
         |                      |          |           |
         |                      |<---------+           |
         |                      |                      |
         | Payment Response     |                      |
         |<---------------------|                      |
         |                      |                      |
         | Print Receipt        |                      |
         |--------------------------------------------->|
         |                      |                      |
         |                      |                      | Print Process
         |                      |                      |----------+
         |                      |                      |          |
         |                      |                      |<---------+
         |                      |                      |
         | Receipt Printed      |                      |
         |<---------------------------------------------|
```

### 2. Metode Pembayaran

#### Cash Payment Flow

```
+-------------------+  +-------------------+  +-------------------+
| Operator          |  | ParkingOUT App    |  | Receipt Printer   |
+-------------------+  +-------------------+  +-------------------+
         |                      |                      |
         | Input Cash Amount    |                      |
         |--------------------->|                      |
         |                      |                      |
         |                      | Calculate Change     |
         |                      |----------+           |
         |                      |          |           |
         |                      |<---------+           |
         |                      |                      |
         | Display Change       |                      |
         |<---------------------|                      |
         |                      |                      |
         | Confirm Payment      |                      |
         |--------------------->|                      |
         |                      |                      |
         |                      | Generate Receipt     |
         |                      |--------------------->|
         |                      |                      |
         |                      |                      | Print Receipt
         |                      |                      |----------+
         |                      |                      |          |
         |                      |                      |<---------+
         |                      |                      |
```

#### Electronic Payment Flow (Debit/Credit Card)

```
+-------------------+  +-------------------+  +-------------------+  +-------------------+
| Customer          |  | ParkingOUT App    |  | Payment Terminal  |  | Bank/Card Issuer  |
+-------------------+  +-------------------+  +-------------------+  +-------------------+
         |                      |                      |                      |
         |                      | Initiate Payment     |                      |
         |                      |--------------------->|                      |
         |                      |                      |                      |
         | Insert/Tap Card      |                      |                      |
         |--------------------->|                      |                      |
         |                      |                      |                      |
         |                      |                      | Process Transaction  |
         |                      |                      |--------------------->|
         |                      |                      |                      |
         |                      |                      |                      | Verify & Authorize
         |                      |                      |                      |----------+
         |                      |                      |                      |          |
         |                      |                      |                      |<---------+
         |                      |                      |                      |
         |                      |                      | Authorization Result |
         |                      |                      |<---------------------|
         |                      |                      |                      |
         |                      | Payment Result       |                      |
         |                      |<---------------------|                      |
         |                      |                      |                      |
         | Transaction Complete |                      |                      |
         |<---------------------|                      |                      |
```

### 3. Integrasi dengan Sistem Keuangan

#### Database Schema untuk Pembayaran

```sql
-- Tabel untuk menyimpan data transaksi pembayaran
CREATE TABLE payment_transactions (
    transaction_id SERIAL PRIMARY KEY,
    vehicle_id INT REFERENCES vehicles(vehicle_id),
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    operator_id INT REFERENCES users(user_id),
    receipt_number VARCHAR(50) UNIQUE,
    notes TEXT
);

-- Tabel untuk menyimpan tarif parkir
CREATE TABLE parking_rates (
    rate_id SERIAL PRIMARY KEY,
    vehicle_type VARCHAR(50) NOT NULL,
    base_rate DECIMAL(10,2) NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    maximum_daily_rate DECIMAL(10,2),
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE
);
```

#### Kalkulasi Biaya Parkir

```javascript
// Pseudocode untuk kalkulasi biaya parkir
function calculateParkingFee(entryTime, exitTime, vehicleType) {
    // Ambil tarif dari database
    const rates = getParkingRates(vehicleType);
    
    // Hitung durasi dalam jam
    const durationHours = (exitTime - entryTime) / (1000 * 60 * 60);
    
    // Hitung biaya dasar
    let fee = rates.baseRate;
    
    // Tambahkan biaya per jam
    fee += Math.ceil(durationHours) * rates.hourlyRate;
    
    // Terapkan batas maksimum harian jika ada
    if (rates.maximumDailyRate && fee > rates.maximumDailyRate) {
        fee = rates.maximumDailyRate * Math.ceil(durationHours / 24);
    }
    
    return fee;
}
```

## Manajemen Pengguna

### 1. Diagram Alur Manajemen Pengguna

```
+-------------------+  +-------------------+  +-------------------+
| Admin Interface   |  | User Manager      |  | Database          |
+-------------------+  +-------------------+  +-------------------+
         |                      |                      |
         | Create/Edit User     |                      |
         |--------------------->|                      |
         |                      |                      |
         |                      | Validate Input       |
         |                      |----------+           |
         |                      |          |           |
         |                      |<---------+           |
         |                      |                      |
         |                      | Store User Data      |
         |                      |--------------------->|
         |                      |                      |
         |                      |                      | Process Query
         |                      |                      |----------+
         |                      |                      |          |
         |                      |                      |<---------+
         |                      |                      |
         |                      | Database Response    |
         |                      |<---------------------|
         |                      |                      |
         | Operation Result     |                      |
         |<---------------------|                      |
```

### 2. Struktur Manajemen Pengguna

#### Database Schema untuk Pengguna

```sql
-- Tabel untuk menyimpan data pengguna
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    role VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel untuk menyimpan hak akses pengguna
CREATE TABLE user_permissions (
    permission_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    granted_by INT REFERENCES users(user_id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, resource, action)
);

-- Tabel untuk menyimpan log aktivitas pengguna
CREATE TABLE user_activity_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    activity_type VARCHAR(50) NOT NULL,
    activity_details TEXT,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Tingkatan Pengguna dan Hak Akses

#### Jenis Pengguna

1. **Administrator**
   - Akses penuh ke semua fitur sistem
   - Manajemen pengguna dan hak akses
   - Konfigurasi sistem dan hardware
   - Akses ke laporan dan analitik

2. **Supervisor**
   - Monitoring operasi parkir
   - Override tarif dan transaksi
   - Akses ke laporan harian dan bulanan
   - Manajemen operator

3. **Operator Entry**
   - Operasi gate masuk
   - Pencetakan tiket
   - Penanganan kasus khusus entry

4. **Operator Exit**
   - Operasi gate keluar
   - Pemrosesan pembayaran
   - Verifikasi kendaraan

5. **Teknisi**
   - Akses ke konfigurasi hardware
   - Troubleshooting perangkat
   - Maintenance sistem

#### Implementasi Autentikasi dan Otorisasi

```javascript
// Pseudocode untuk autentikasi pengguna
async function authenticateUser(username, password) {
    // Ambil data pengguna dari database
    const user = await getUserByUsername(username);
    
    if (!user || !user.is_active) {
        return { success: false, message: 'Invalid username or inactive account' };
    }
    
    // Verifikasi password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    
    if (!isPasswordValid) {
        // Log failed attempt
        await logUserActivity(user.user_id, 'LOGIN_FAILED', 'Invalid password');
        return { success: false, message: 'Invalid password' };
    }
    
    // Update last login
    await updateLastLogin(user.user_id);
    
    // Log successful login
    await logUserActivity(user.user_id, 'LOGIN_SUCCESS', 'User logged in');
    
    // Load user permissions
    const permissions = await getUserPermissions(user.user_id);
    
    return {
        success: true,
        user: {
            id: user.user_id,
            username: user.username,
            fullName: user.full_name,
            role: user.role,
            permissions: permissions
        }
    };
}

// Pseudocode untuk otorisasi akses
function checkPermission(user, resource, action) {
    // Admin selalu punya akses penuh
    if (user.role === 'ADMINISTRATOR') {
        return true;
    }
    
    // Cek permission spesifik
    return user.permissions.some(p => 
        p.resource === resource && p.action === action
    );
}
```
njut halaman 
## Integrasi Sistem

### 1. Diagram Integrasi Keseluruhan

```
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
|  ParkingIN        |<--->|  ParkingServer    |<--->|  ParkingOUT       |
|  (Entry System)   |     |  (Central System) |     |  (Exit System)    |
|                   |     |                   |     |                   |
+-------------------+     +-------------------+     +-------------------+
         ^                         ^                         ^
         |                         |                         |
         v                         v                         v
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
|  Hardware         |     |  Database         |     |  Payment          |
|  Controllers      |     |  System           |     |  Gateway          |
|                   |     |                   |     |                   |
+-------------------+     +-------------------+     +-------------------+
         ^                         ^                         ^
         |                         |                         |
         v                         v                         v
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
|  Physical         |     |  Monitoring &     |     |  Reporting &      |
|  Devices          |     |  Backup System    |     |  Analytics        |
|                   |     |                   |     |                   |
+-------------------+     +-------------------+     +-------------------+
```

### 2. Komunikasi Antar Sistem

#### WebSocket Communication

```javascript
// Pseudocode untuk komunikasi WebSocket
const socket = new WebSocket('ws://parkingserver:8080/events');

// Event listener untuk menerima pesan
socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    
    switch(data.type) {
        case 'VEHICLE_ENTRY':
            handleVehicleEntry(data.payload);
            break;
        case 'VEHICLE_EXIT':
            handleVehicleExit(data.payload);
            break;
        case 'PAYMENT_COMPLETED':
            handlePaymentCompleted(data.payload);
            break;
        case 'GATE_STATUS_CHANGED':
            updateGateStatus(data.payload);
            break;
        case 'SYSTEM_ALERT':
            displaySystemAlert(data.payload);
            break;
    }
});

// Mengirim pesan ke server
function sendEvent(type, payload) {
    socket.send(JSON.stringify({
        type: type,
        payload: payload,
        timestamp: new Date().toISOString(),
        source: 'PARKING_CLIENT'
    }));
}
```

### 3. Integrasi dengan Sistem Eksternal

#### API Endpoints

```
GET  /api/v1/vehicles - Mendapatkan daftar kendaraan yang sedang parkir
POST /api/v1/vehicles - Menambahkan data kendaraan baru (entry)
GET  /api/v1/vehicles/:id - Mendapatkan detail kendaraan berdasarkan ID
PUT  /api/v1/vehicles/:id/exit - Update data kendaraan saat keluar

GET  /api/v1/payments - Mendapatkan daftar transaksi pembayaran
POST /api/v1/payments - Membuat transaksi pembayaran baru
GET  /api/v1/payments/:id - Mendapatkan detail transaksi pembayaran

GET  /api/v1/reports/daily - Mendapatkan laporan harian
GET  /api/v1/reports/monthly - Mendapatkan laporan bulanan
GET  /api/v1/reports/custom - Mendapatkan laporan kustom berdasarkan parameter
```

#### Integrasi dengan Sistem Akuntansi

```javascript
// Pseudocode untuk integrasi dengan sistem akuntansi
async function syncWithAccountingSystem() {
    // Ambil transaksi yang belum disinkronkan
    const pendingTransactions = await getPendingTransactions();
    
    // Format data sesuai kebutuhan sistem akuntansi
    const formattedData = formatTransactionsForAccounting(pendingTransactions);
    
    try {
        // Kirim data ke sistem akuntansi
        const response = await sendToAccountingSystem(formattedData);
        
        // Update status sinkronisasi
        if (response.success) {
            await markTransactionsAsSynced(pendingTransactions);
            logSuccess('Accounting sync completed successfully');
        } else {
            logError('Accounting sync failed', response.error);
        }
    } catch (error) {
        logError('Accounting sync error', error);
        // Retry mechanism
        scheduleRetry(syncWithAccountingSystem, 15 * 60 * 1000); // Retry after 15 minutes
    }
}
```

## Monitoring System Flow

### 1. System Health Monitoring

```
+-------------------+  +-------------------+  +-------------------+
| System Components |  | Monitoring Agent  |  | Dashboard         |
+-------------------+  +-------------------+  +-------------------+
         |                      |                      |
         | Metrics & Logs      |                      |
         |--------------------->|                      |
         |                      | Process Data         |
         |                      |----------+           |
         |                      |          |           |
         |                      |<---------+           |
         |                      |                      |
         |                      | Update Dashboard     |
         |                      |--------------------->|
         |                      |                      |
         |                      | Alert if Threshold   |
         |                      |----------+           |
         |                      |          |           |
         |                      |<---------+           |
```

#### Monitoring Aspects:
1. **Hardware Monitoring**
   - Status gate barrier (open/close)
   - Printer status dan supplies
   - Camera connectivity
   - MCU health check

2. **Software Monitoring**
   - Application performance metrics
   - Database connection status
   - API response times
   - Error rate monitoring

3. **Security Monitoring**
   - Unauthorized access attempts
   - System modification logs
   - User activity tracking
   - CCTV system status

## Rincian Komponen

### Hardware
- **PC Server**: Menjalankan PostgreSQL dan ParkingServer
- **PC Entry**: Menjalankan ParkingIN
- **PC Exit**: Menjalankan ParkingOUT
- **arduino uno MCU**: Mikrokontroler untuk komunikasi dengan push button dan gate barrier
- **Printer Thermal**: Untuk mencetak tiket dan struk
- **Kamera**: Webcam atau Kamera IP untuk pengambilan gambar kendaraan
- **Barcode Scanner**: Untuk memindai tiket masuk
- **Push Button**: Memicu proses cetak tiket dan pengambilan gambar
- **Gate Barrier**: Portal otomatis untuk entry dan exit

### Software
- **ParkingIN**: Aplikasi untuk mengelola proses masuk kendaraan
- **ParkingOUT**: Aplikasi untuk mengelola proses keluar kendaraan
- **ParkingServer**: WebSocket server untuk komunikasi real-time
- **PostgreSQL**: Database untuk menyimpan data transaksi, pengguna, dan log

## Alur Data
1. Data kendaraan masuk disimpan di database dengan ID unik
2. Foto kendaraan disimpan dengan nama sesuai ID unik
3. ID unik dicetak dalam bentuk barcode pada tiket
4. Saat kendaraan keluar, data diambil berdasarkan ID dari barcode
5. Foto kendaraan saat masuk ditampilkan untuk verifikasi
6. Setelah verifikasi, gate dibuka dan data transaksi diupdate
