import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Book as BookIcon,
  Help as HelpIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Chat as ChatIcon,
  Dashboard as DashboardIcon,
  DirectionsCar as CarIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import Breadcrumbs from '../components/Breadcrumbs';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`manual-tabpanel-${index}`}
      aria-labelledby={`manual-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `manual-tab-${index}`,
    'aria-controls': `manual-tabpanel-${index}`,
  };
}

const ManualBookPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [value, setValue] = useState(0);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Manual Book' },
        ]}
      />
      <PageHeader
        title="Manual Book"
        subtitle="Panduan lengkap penggunaan sistem parkir"
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Cari di dalam manual..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />
        </CardContent>
      </Card>

      <Paper>
        <Tabs
          value={value}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Manual book tabs"
        >
          <Tab label="Pendahuluan" icon={<BookIcon />} {...a11yProps(0)} />
          <Tab label="Panduan Operator" icon={<CarIcon />} {...a11yProps(1)} />
          <Tab label="Panduan Admin" icon={<UsersIcon />} {...a11yProps(2)} />
          <Tab label="Pengelolaan Data" icon={<SettingsIcon />} {...a11yProps(3)} />
          <Tab label="Pemecahan Masalah" icon={<HelpIcon />} {...a11yProps(4)} />
        </Tabs>

        <TabPanel value={value} index={0}>
          <Typography variant="h5" gutterBottom>
            Pendahuluan Sistem Parkir
          </Typography>
          <Typography paragraph>
            Selamat datang di Manual Book Sistem Parkir. Dokumen ini memberikan panduan lengkap tentang penggunaan 
            sistem parkir untuk mengelola kendaraan, pembayaran, dan laporan.
          </Typography>

          <Typography variant="h6" sx={{ mt: 3 }}>
            Kebutuhan Sistem
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon><DashboardIcon /></ListItemIcon>
              <ListItemText 
                primary="Browser" 
                secondary="Google Chrome, Mozilla Firefox, atau Microsoft Edge versi terbaru"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><DashboardIcon /></ListItemIcon>
              <ListItemText 
                primary="Hardware" 
                secondary="Printer termal, scanner barcode, komputer dengan spesifikasi minimal Core i3, RAM 4GB"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><DashboardIcon /></ListItemIcon>
              <ListItemText 
                primary="Koneksi Internet" 
                secondary="Kecepatan minimal 10 Mbps untuk operasional optimal"
              />
            </ListItem>
          </List>

          <Typography variant="h6" sx={{ mt: 3 }}>
            Peran Pengguna Sistem
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Admin" 
                secondary="Memiliki akses penuh ke semua fitur sistem, termasuk pengaturan pengguna, tarif, dan konfigurasi sistem."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Operator" 
                secondary="Mengelola operasi harian seperti pencatatan kendaraan masuk/keluar dan pembayaran."
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="User" 
                secondary="Memiliki akses terbatas untuk melihat laporan dan informasi dasar."
              />
            </ListItem>
          </List>
        </TabPanel>

        <TabPanel value={value} index={1}>
          <Typography variant="h5" gutterBottom>
            Panduan Operator
          </Typography>
          
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Operasi Gerbang Masuk</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Sebagai operator gerbang masuk, Anda bertanggung jawab untuk:
              </Typography>
              <ol>
                <li>Mencatat kendaraan yang masuk ke area parkir</li>
                <li>Mencetak dan memberikan tiket parkir kepada pengemudi</li>
                <li>Membantu pengemudi jika terjadi masalah dengan sistem</li>
              </ol>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>Langkah-langkah Mencatat Kendaraan Masuk:</Typography>
              <ol>
                <li>Buka menu "Entry Gate" pada sidebar</li>
                <li>Pastikan kamera terhubung untuk mengambil foto plat nomor</li>
                <li>Masukkan nomor plat kendaraan pada kolom yang tersedia</li>
                <li>Pilih jenis kendaraan (Mobil, Motor, Truk, dll)</li>
                <li>Klik tombol "Cetak Tiket" untuk memproses masuk dan mencetak tiket</li>
                <li>Berikan tiket kepada pengemudi dan informasikan untuk menyimpan tiket</li>
              </ol>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>Jika Kendaraan adalah Member:</Typography>
              <ol>
                <li>Pilih tab "Member" pada halaman Entry Gate</li>
                <li>Scan kartu member atau masukkan ID member secara manual</li>
                <li>Verifikasi identitas pemilik kendaraan jika diperlukan</li>
                <li>Proses masuk tanpa mencetak tiket</li>
              </ol>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Operasi Gerbang Keluar</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Sebagai operator gerbang keluar, Anda bertanggung jawab untuk:
              </Typography>
              <ol>
                <li>Memproses pembayaran parkir</li>
                <li>Mencetak struk pembayaran</li>
                <li>Membuka gerbang untuk kendaraan keluar</li>
              </ol>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>Langkah-langkah Memproses Kendaraan Keluar:</Typography>
              <ol>
                <li>Buka menu "Exit Gate" pada sidebar</li>
                <li>Minta tiket parkir dari pengemudi</li>
                <li>Scan barcode tiket atau masukkan nomor tiket secara manual</li>
                <li>Sistem akan menampilkan detail parkir dan menghitung biaya</li>
                <li>Terima pembayaran sesuai jumlah yang ditampilkan</li>
                <li>Pilih metode pembayaran (tunai, kartu, e-wallet)</li>
                <li>Klik "Proses Pembayaran" untuk menyelesaikan transaksi</li>
                <li>Cetak dan berikan struk pembayaran kepada pengemudi</li>
                <li>Klik "Buka Gerbang" untuk mengizinkan kendaraan keluar</li>
              </ol>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>Jika Terjadi Masalah:</Typography>
              <ol>
                <li>Jika tiket hilang: gunakan opsi "Tiket Hilang" dan proses sesuai kebijakan</li>
                <li>Jika sistem tidak merespons: lakukan reset aplikasi atau hubungi admin</li>
                <li>Jika terjadi kesalahan perhitungan: periksa detail kendaraan dan waktu masuk</li>
              </ol>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Mengelola Shift</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Operator perlu mencatat aktivitas shift mereka:
              </Typography>
              <ol>
                <li>Memulai shift dengan login ke sistem dan memilih menu "Shifts"</li>
                <li>Klik "Mulai Shift" untuk mencatat waktu mulai</li>
                <li>Selama shift, sistem akan mencatat semua transaksi</li>
                <li>Sebelum selesai shift, hitung total uang tunai yang diterima</li>
                <li>Klik "Akhiri Shift" dan masukkan jumlah uang tunai</li>
                <li>Sistem akan memeriksa kesesuaian jumlah dengan transaksi</li>
                <li>Selesaikan shift dan cetak laporan shift jika diperlukan</li>
              </ol>
            </AccordionDetails>
          </Accordion>
        </TabPanel>

        <TabPanel value={value} index={2}>
          <Typography variant="h5" gutterBottom>
            Panduan Admin
          </Typography>
          
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Pengelolaan Pengguna</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Sebagai admin, Anda dapat mengelola semua pengguna sistem:
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold">Menambah Pengguna Baru:</Typography>
              <ol>
                <li>Buka menu "Users" pada sidebar</li>
                <li>Klik tombol "Tambah Pengguna"</li>
                <li>Isi formulir dengan data berikut:
                  <ul>
                    <li>Username (digunakan untuk login)</li>
                    <li>Nama Lengkap</li>
                    <li>Email</li>
                    <li>Password (minimal 8 karakter dengan kombinasi angka dan huruf)</li>
                    <li>Peran (Admin, Operator, User)</li>
                  </ul>
                </li>
                <li>Pilih "Active" untuk mengaktifkan pengguna</li>
                <li>Klik "Simpan" untuk membuat pengguna baru</li>
                <li>Informasikan username dan password kepada pengguna baru</li>
              </ol>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>Menonaktifkan Pengguna:</Typography>
              <ol>
                <li>Temukan pengguna dalam daftar</li>
                <li>Klik tombol toggle di kolom "Status"</li>
                <li>Konfirmasi perubahan status</li>
              </ol>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>Mengubah Peran Pengguna:</Typography>
              <ol>
                <li>Klik tombol "Edit" pada baris pengguna</li>
                <li>Ubah peran melalui dropdown "Role"</li>
                <li>Klik "Simpan" untuk menerapkan perubahan</li>
              </ol>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Mengelola Tarif Parkir</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Admin dapat mengatur tarif parkir berdasarkan jenis kendaraan:
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold">Menetapkan Tarif Baru:</Typography>
              <ol>
                <li>Buka menu "Parking Rates" pada sidebar</li>
                <li>Klik "Tambah Tarif"</li>
                <li>Pilih jenis kendaraan (Mobil, Motor, Truk, dll)</li>
                <li>Masukkan tarif dasar (biaya parkir minimum)</li>
                <li>Masukkan tarif per jam (biaya tambahan per jam)</li>
                <li>Masukkan tarif harian maksimum (opsional)</li>
                <li>Pilih "Active" untuk mengaktifkan tarif</li>
                <li>Klik "Simpan" untuk menerapkan tarif baru</li>
              </ol>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>Mengubah Tarif Existing:</Typography>
              <ol>
                <li>Temukan tarif dalam daftar</li>
                <li>Klik tombol "Edit"</li>
                <li>Ubah nilai tarif yang diperlukan</li>
                <li>Klik "Simpan" untuk menerapkan perubahan</li>
              </ol>
              <Typography variant="subtitle2" sx={{ mt: 2 }} color="warning.main">
                Catatan Penting: Perubahan tarif hanya akan berlaku untuk transaksi baru. Kendaraan yang sudah masuk akan tetap menggunakan tarif saat masuk!
              </Typography>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Mengelola Perangkat</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Admin bertanggung jawab memastikan semua perangkat berfungsi:
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold">Menambah Perangkat Baru:</Typography>
              <ol>
                <li>Buka menu "Devices" pada sidebar</li>
                <li>Klik "Tambah Perangkat"</li>
                <li>Isi formulir dengan informasi perangkat:
                  <ul>
                    <li>Nama Perangkat (untuk identifikasi)</li>
                    <li>Tipe Perangkat (Printer, Scanner, Kamera, Gate Controller)</li>
                    <li>Lokasi (Gerbang Masuk, Gerbang Keluar, Kantor)</li>
                    <li>IP Address atau Port (untuk perangkat jaringan)</li>
                    <li>Detail koneksi lainnya</li>
                  </ul>
                </li>
                <li>Klik "Simpan" untuk mendaftarkan perangkat</li>
              </ol>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>Monitoring Status Perangkat:</Typography>
              <ol>
                <li>Buka menu "Devices" untuk melihat semua perangkat</li>
                <li>Status perangkat ditampilkan dengan warna (hijau=online, merah=offline)</li>
                <li>Klik "Check Status" untuk memeriksa koneksi perangkat</li>
                <li>Jika status offline, periksa fisik perangkat atau jaringan</li>
              </ol>
            </AccordionDetails>
          </Accordion>
        </TabPanel>

        <TabPanel value={value} index={3}>
          <Typography variant="h5" gutterBottom>
            Pengelolaan Data
          </Typography>
          
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Sesi Parkir</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Halaman Sesi Parkir menampilkan data kendaraan yang sedang parkir:
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold">Fitur Utama:</Typography>
              <ul>
                <li>Pelacakan status kendaraan real-time</li>
                <li>Filter berdasarkan status, area, atau jenis kendaraan</li>
                <li>Detail durasi parkir dan biaya estimasi</li>
                <li>Fungsi checkout manual untuk kendaraan</li>
              </ul>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>Menangani Sesi Bermasalah:</Typography>
              <ol>
                <li>Identifikasi sesi parkir yang sudah lama aktif (potensial error)</li>
                <li>Gunakan filter "Active {`>`} 24 hours" untuk menemukan kendaraan tersebut</li>
                <li>Periksa fisik kendaraan di area parkir</li>
                <li>Jika kendaraan tidak ada, proses checkout manual:
                  <ul>
                    <li>Klik tombol "Checkout" pada baris kendaraan</li>
                    <li>Pilih alasan: "Kendaraan sudah keluar" atau "Data error"</li>
                    <li>Tambahkan catatan jika diperlukan</li>
                    <li>Konfirmasi tindakan</li>
                  </ul>
                </li>
              </ol>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Database Kendaraan</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Sistem menyimpan data kendaraan yang pernah masuk:
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold">Melihat Data Kendaraan:</Typography>
              <ol>
                <li>Buka menu "Vehicles" pada sidebar</li>
                <li>Gunakan pencarian untuk menemukan kendaraan dengan nomor plat tertentu</li>
                <li>Klik pada baris kendaraan untuk melihat riwayat kunjungan</li>
              </ol>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>Mengelola Member:</Typography>
              <ol>
                <li>Buka menu "Memberships" pada sidebar</li>
                <li>Klik "Tambah Member" untuk mendaftarkan kendaraan baru</li>
                <li>Lengkapi formulir dengan:
                  <ul>
                    <li>Nomor Plat Kendaraan</li>
                    <li>Jenis Kendaraan</li>
                    <li>Pemilik (nama dan kontak)</li>
                    <li>Jenis Keanggotaan (Bulanan/Tahunan)</li>
                    <li>Tanggal Mulai/Berakhir</li>
                  </ul>
                </li>
                <li>Klik "Simpan" untuk menambahkan member</li>
                <li>Cetak kartu member jika diperlukan</li>
              </ol>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Laporan dan Analisis</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Sistem menyediakan berbagai laporan untuk analisis:
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold">Jenis Laporan:</Typography>
              <ul>
                <li>Laporan Harian: ringkasan aktivitas parkir dan pendapatan per hari</li>
                <li>Laporan Bulanan: tren pendapatan dan penggunaan dalam satu bulan</li>
                <li>Laporan Operator: kinerja operator, transaksi, dan shift</li>
                <li>Laporan Kendaraan: analisis jenis kendaraan yang parkir</li>
                <li>Laporan Okupansi: tingkat penggunaan area parkir berdasarkan waktu</li>
              </ul>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2 }}>Mengakses Laporan:</Typography>
              <ol>
                <li>Buka menu "Reports" pada sidebar</li>
                <li>Pilih jenis laporan yang diinginkan</li>
                <li>Tentukan rentang tanggal (dari-sampai)</li>
                <li>Klik "Generate" untuk membuat laporan</li>
                <li>Gunakan tombol "Export" untuk mengunduh dalam format Excel, PDF, atau CSV</li>
              </ol>
            </AccordionDetails>
          </Accordion>
        </TabPanel>

        <TabPanel value={value} index={4}>
          <Typography variant="h5" gutterBottom>
            Pemecahan Masalah
          </Typography>
          
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Masalah Login</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Jika mengalami masalah saat login:
              </Typography>
              <ol>
                <li>Pastikan username dan password sudah benar</li>
                <li>Periksa apakah Caps Lock aktif pada keyboard</li>
                <li>Coba bersihkan cache browser</li>
                <li>Jika lupa password, gunakan opsi "Lupa Password" atau hubungi admin</li>
                <li>Untuk kasus username terkunci: tunggu 30 menit atau hubungi admin</li>
              </ol>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Masalah Koneksi</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Jika Anda mengalami masalah koneksi:
              </Typography>
              <ol>
                <li>Periksa koneksi internet Anda</li>
                <li>Pastikan server aplikasi berjalan</li>
                <li>Periksa apakah ada firewall yang memblokir koneksi</li>
                <li>Coba refresh halaman atau login ulang</li>
                <li>Periksa log sistem di menu "Logs" (khusus admin)</li>
              </ol>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Printer Tidak Berfungsi</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Jika printer tiket tidak berfungsi dengan baik:
              </Typography>
              <ol>
                <li>Periksa koneksi printer ke komputer</li>
                <li>Pastikan printer dinyalakan dan memiliki kertas</li>
                <li>Periksa pengaturan printer di sistem operasi</li>
                <li>Restart printer dan aplikasi</li>
                <li>Periksa driver printer terbaru sudah terpasang</li>
                <li>Coba cetak halaman test dari menu printer</li>
                <li>Jika masih tidak berfungsi, proses tiket manual sementara</li>
              </ol>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Masalah Scanner Barcode</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography paragraph>
                Jika scanner barcode tidak berfungsi:
              </Typography>
              <ol>
                <li>Periksa koneksi USB scanner ke komputer</li>
                <li>Pastikan driver scanner sudah terpasang dengan benar</li>
                <li>Coba scan pada area teks untuk menguji input</li>
                <li>Bersihkan lensa scanner dari debu atau kotoran</li>
                <li>Periksa apakah barcode tidak rusak atau terlipat</li>
                <li>Gunakan input manual (ketik nomor tiket) sebagai cadangan</li>
              </ol>
            </AccordionDetails>
          </Accordion>
          
          <Box sx={{ mt: 4, p: 2, bgcolor: 'primary.light', borderRadius: 1, color: 'white' }}>
            <Typography variant="h6">
              Butuh bantuan lebih lanjut?
            </Typography>
            <Typography variant="body1">
              Hubungi tim support kami melalui:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon sx={{ color: 'white' }}>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText primary="Email: support@parkingsystem.com" />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ color: 'white' }}>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText primary="Telepon: (021) 1234-5678" />
              </ListItem>
              <ListItem>
                <ListItemIcon sx={{ color: 'white' }}>
                  <ChatIcon />
                </ListItemIcon>
                <ListItemText primary="Live Chat: Tersedia 24/7" />
              </ListItem>
            </List>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default ManualBookPage; 