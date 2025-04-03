import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Person as OperatorIcon,
  ExpandMore as ExpandMoreIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  DirectionsCar as CarIcon,
  Payments as PaymentsIcon,
  Receipt as ReceiptIcon,
  Report as ReportIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import PageHeader from '../components/PageHeader';
import Breadcrumbs from '../components/Breadcrumbs';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`manual-tabpanel-${index}`}
      aria-labelledby={`manual-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const UserManualPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Breadcrumbs
        items={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Buku Panduan' },
        ]}
      />
      <PageHeader
        title="Buku Panduan"
        subtitle="Panduan penggunaan aplikasi untuk admin dan operator"
      />

      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="user manual tabs"
          variant="fullWidth"
        >
          <Tab 
            label="Panduan Admin" 
            icon={<AdminIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Panduan Operator" 
            icon={<OperatorIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Panduan untuk Admin
            </Typography>
            <Typography paragraph>
              Berikut adalah panduan penggunaan sistem untuk pengguna dengan peran Admin:
            </Typography>

            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  <DashboardIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Dashboard
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography paragraph>
                  Dashboard menampilkan informasi ringkas tentang keadaan sistem parkir, termasuk:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="Statistik Harian" secondary="Jumlah kendaraan masuk, keluar, dan pendapatan" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Grafik Tren" secondary="Visualisasi tren parkir dalam seminggu dan sebulan terakhir" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Status Gerbang" secondary="Kondisi dan status semua gerbang masuk dan keluar" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Perangkat Terhubung" secondary="Status koneksi semua perangkat (printer, kamera, sensor)" />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  <CarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Manajemen Kendaraan
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography paragraph>
                  Menu ini memungkinkan admin untuk mengelola data kendaraan:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="Lihat Semua Kendaraan" secondary="Melihat daftar semua kendaraan yang terdaftar" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Tambah Kendaraan Member" secondary="Mendaftarkan kendaraan baru sebagai member" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Edit Data Kendaraan" secondary="Mengubah informasi kendaraan yang sudah terdaftar" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Perpanjang Membership" secondary="Memperpanjang masa aktif membership kendaraan" />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  <PaymentsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Tarif Parkir
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography paragraph>
                  Admin dapat mengatur tarif parkir untuk berbagai jenis kendaraan:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="Set Tarif Dasar" secondary="Mengatur tarif minimum untuk setiap jenis kendaraan" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Set Tarif Progresif" secondary="Mengatur tarif tambahan berdasarkan durasi" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Set Tarif Khusus" secondary="Mengatur tarif untuk hari libur atau event khusus" />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  <ReportIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Laporan
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography paragraph>
                  Melihat dan menghasilkan berbagai laporan:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="Laporan Harian" secondary="Ringkasan transaksi dan pendapatan harian" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Laporan Bulanan" secondary="Analisis pendapatan dan tren bulanan" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Audit Log" secondary="Catatan aktivitas pengguna dalam sistem" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Export Data" secondary="Mengunduh data dalam format CSV atau Excel" />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Pengaturan Sistem
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography paragraph>
                  Mengonfigurasi berbagai pengaturan sistem:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="Manajemen Pengguna" secondary="Menambah, mengedit, atau menonaktifkan pengguna" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Konfigurasi Perangkat" secondary="Mengatur printer, kamera, sensor, dan perangkat lain" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Backup & Restore" secondary="Melakukan backup dan restore database" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Pengaturan Tampilan" secondary="Mengatur logo, tema, dan informasi tiket" />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Panduan untuk Operator
            </Typography>
            <Typography paragraph>
              Berikut adalah panduan penggunaan sistem untuk pengguna dengan peran Operator:
            </Typography>

            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  <LoginIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Proses Masuk Kendaraan
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography paragraph>
                  Proses untuk menangani kendaraan yang masuk area parkir:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="1. Buka Halaman Entry Gate" secondary="Pilih menu 'Entry Gate' di sidebar" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="2. Input Plat Nomor" secondary="Masukkan plat nomor kendaraan pada form yang tersedia" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="3. Pilih Jenis Kendaraan" secondary="Pilih jenis kendaraan (motor, mobil, dll.)" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="4. Cetak Tiket" secondary="Klik tombol 'Cetak Tiket' untuk mencetak tiket parkir" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="5. Buka Gerbang" secondary="Klik tombol 'Buka Gerbang' untuk membuka portal masuk" />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  <LogoutIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Proses Keluar Kendaraan
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography paragraph>
                  Proses untuk menangani kendaraan yang keluar area parkir:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="1. Buka Halaman Exit Gate" secondary="Pilih menu 'Exit Gate' di sidebar" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="2. Scan Tiket" secondary="Scan barcode tiket atau masukkan nomor tiket secara manual" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="3. Verifikasi Kendaraan" secondary="Pastikan plat nomor sesuai dengan data di tiket" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="4. Proses Pembayaran" secondary="Input jumlah pembayaran yang diterima" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="5. Cetak Struk" secondary="Klik tombol 'Cetak Struk' untuk mencetak bukti pembayaran" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="6. Buka Gerbang" secondary="Klik tombol 'Buka Gerbang' untuk membuka portal keluar" />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Menangani Tiket Hilang
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography paragraph>
                  Cara menangani kasus tiket parkir yang hilang:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="1. Buka Halaman Exit Gate" secondary="Pilih menu 'Exit Gate' di sidebar" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="2. Klik Tombol 'Tiket Hilang'" secondary="Akses form khusus untuk tiket hilang" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="3. Input Plat Nomor" secondary="Masukkan plat nomor kendaraan" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="4. Verifikasi dengan Foto" secondary="Bandingkan kendaraan dengan foto saat masuk (jika ada)" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="5. Terapkan Tarif Khusus" secondary="Sistem akan menerapkan tarif khusus untuk tiket hilang" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="6. Proses Pembayaran" secondary="Proses pembayaran seperti biasa" />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  <ReportIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Laporan Shift
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography paragraph>
                  Cara membuat dan menyerahkan laporan shift:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="1. Buka Menu Laporan" secondary="Pilih menu 'Laporan' di sidebar" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="2. Pilih 'Laporan Shift'" secondary="Pilih dari daftar jenis laporan yang tersedia" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="3. Set Tanggal dan Shift" secondary="Pilih tanggal dan shift yang ingin dilaporkan" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="4. Verifikasi Data" secondary="Pastikan semua transaksi tercatat dengan benar" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="5. Cetak Laporan" secondary="Cetak laporan untuk diserahkan ke supervisor" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="6. Serahkan Uang" secondary="Serahkan uang tunai sesuai dengan total di laporan" />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Menangani Masalah Umum
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography paragraph>
                  Cara menangani masalah umum yang mungkin terjadi:
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="Printer Tidak Mencetak" secondary="Cek koneksi printer, kertas, dan restart printer jika perlu" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Gerbang Tidak Terbuka" secondary="Gunakan tombol manual untuk membuka gerbang dan laporkan ke teknisi" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Sistem Tidak Merespon" secondary="Refresh halaman atau restart aplikasi jika perlu" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Scanner Tidak Berfungsi" secondary="Cek koneksi USB dan gunakan input manual sebagai alternatif" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Koneksi Terputus" secondary="Tunggu sampai koneksi pulih, catat transaksi secara manual jika perlu" />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};

export default UserManualPage; 