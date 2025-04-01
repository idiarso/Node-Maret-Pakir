import express from 'express';
import cors from 'cors';
import path from 'path';
import AppDataSource from './config/ormconfig';
import ticketRoutes from './routes/ticket.routes';
import deviceRoutes from './routes/device.routes';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import parkingAreaRoutes from './routes/parkingArea.routes';
import parkingRateRoutes from './routes/parkingRate.routes';
import parkingSessionRoutes from './routes/parkingSession.routes';
import gateRoutes from './routes/gate.routes';
import reportsRoutes from './routes/reports';
import usersRoutes from './routes/users';
import paymentsRoutes from './routes/payments';
import { Logger } from '../shared/services/Logger';
import { errorHandler } from './middleware';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { CacheService } from './services/cache.service';

const app = express();
const logger = Logger.getInstance();
const port = process.env.PORT || 3000;

// Initialize Redis cache service
const cacheService = CacheService.getInstance();

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));
app.use(limiter); // Apply rate limiting

// Routes - ensure all are properly imported as router functions
app.use('/api/tickets', ticketRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/parking-areas', parkingAreaRoutes);
app.use('/api/parking-rates', parkingRateRoutes);
app.use('/api/parking-sessions', parkingSessionRoutes);
app.use('/api/gates', gateRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/payments', paymentsRoutes);

// Dashboard data dengan nilai yang lebih realistis
let dashboardData = {
  activeTickets: 12,
  totalTickets: 85, 
  availableSpots: 75,
  totalCapacity: 200,
  occupancyRate: 62.5,
  todayRevenue: 2500000,
  weeklyRevenue: 15750000,
  monthlyRevenue: 45000000,
  averageDuration: '2.5h',
  peakHours: ['08:00', '17:00'],
  totalVehicles: 125,
  vehicleTypes: {
    car: 70,
    motorcycle: 45,
    truck: 10
  },
  deviceStatus: {
    online: 8,
    offline: 2,
    maintenance: 1
  },
  recentTransactions: Array.from({ length: 10 }, (_, i) => {
    const randomAmount = Math.floor(Math.random() * 50000) + 15000; // Between 15,000 and 65,000 Rp
    const randomHoursAgo = Math.floor(Math.random() * 24); // Within last 24 hours
    const randomVehicleType = ['Car', 'Motorcycle', 'Truck'][Math.floor(Math.random() * 3)];
    const randomPlateLetters = `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
    return {
      id: i + 1,
      licensePlate: `B ${1000 + Math.floor(Math.random() * 9000)} ${randomPlateLetters}`,
      amount: randomAmount,
      vehicleType: randomVehicleType,
      timestamp: new Date(Date.now() - (randomHoursAgo * 60 * 60 * 1000)),
      duration: `${Math.floor(Math.random() * 4) + 1}.${Math.floor(Math.random() * 6)}h`
    };
  })
};

// Reset data ke nilai default
const resetDashboardData = () => {
  dashboardData = {
    activeTickets: 0,
    totalTickets: 0,
    availableSpots: 200,
    totalCapacity: 200,
    occupancyRate: 0,
    todayRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    averageDuration: '0h',
    peakHours: ['--:--', '--:--'],
    totalVehicles: 0,
    vehicleTypes: {
      car: 0,
      motorcycle: 0,
      truck: 0
    },
    deviceStatus: {
      online: 8,
      offline: 0,
      maintenance: 0
    },
    recentTransactions: []
  };
  return dashboardData;
};

// Mendaftarkan endpoint baru untuk dashboard dan reset data
app.get('/api/dashboard', (req, res) => {
  res.json(dashboardData);
});

app.post('/api/dashboard/reset', (req, res) => {
  const resetData = resetDashboardData();
  res.json({ 
    success: true, 
    message: 'Dashboard data has been reset',
    data: resetData
  });
});

// Settings API routes - temporary implementation to support Frontend
app.get('/api/settings/language', (req, res) => {
  res.json({
    id: 1,
    defaultLanguage: 'id',
    availableLanguages: ['en', 'id', 'zh', 'ja'],
    translations: {
      // App name
      "parkingSystem": {
        "en": "Parking System",
        "id": "Sistem Parkir",
        "zh": "停车系统",
        "ja": "駐車システム"
      },
      // Dashboard items
      "welcomeMessage": {
        "en": "Welcome, System Administrator",
        "id": "Selamat Datang, System Administrator",
        "zh": "欢迎，系统管理员",
        "ja": "ようこそ、システム管理者"
      },
      "parkingSystemDashboard": {
        "en": "Parking System Dashboard",
        "id": "Dashboard Sistem Parkir",
        "zh": "停车系统仪表板",
        "ja": "駐車システムダッシュボード"
      },
      "activeTickets": {
        "en": "Active Tickets",
        "id": "Tiket Aktif",
        "zh": "活动票",
        "ja": "アクティブなチケット"
      },
      "totalRevenue": {
        "en": "Total Revenue",
        "id": "Total Pendapatan",
        "zh": "总收入",
        "ja": "総収入"
      },
      "averageDuration": {
        "en": "Average Duration",
        "id": "Durasi Rata-rata",
        "zh": "平均时长",
        "ja": "平均時間"
      },
      "totalTickets": {
        "en": "Total Tickets",
        "id": "Total Tiket",
        "zh": "总票数",
        "ja": "総チケット"
      },
      "resetData": {
        "en": "Reset Data",
        "id": "Reset Data",
        "zh": "重置数据",
        "ja": "データをリセット"
      },
      "confirmReset": {
        "en": "Are you sure you want to reset all dashboard data?",
        "id": "Apakah Anda yakin ingin mereset semua data dashboard?",
        "zh": "您确定要重置所有仪表板数据吗？",
        "ja": "すべてのダッシュボードデータをリセットしてもよろしいですか？"
      },
      "dataResetSuccess": {
        "en": "Data has been reset successfully",
        "id": "Data telah berhasil direset",
        "zh": "数据已成功重置",
        "ja": "データが正常にリセットされました"
      },
      // Navigation items
      "dashboard": {
        "en": "Dashboard",
        "id": "Dasbor",
        "zh": "仪表板",
        "ja": "ダッシュボード"
      },
      "parkingManagement": {
        "en": "Parking Management",
        "id": "Manajemen Parkir",
        "zh": "停车管理",
        "ja": "駐車管理"
      },
      "customerManagement": {
        "en": "Customer Management",
        "id": "Manajemen Pelanggan",
        "zh": "客户管理",
        "ja": "顧客管理"
      },
      // Menu items
      "parkingSessions": {
        "en": "Parking Sessions",
        "id": "Sesi Parkir",
        "zh": "停车会话",
        "ja": "駐車セッション"
      },
      "tickets": {
        "en": "Tickets",
        "id": "Tiket",
        "zh": "票据",
        "ja": "チケット"
      },
      "parkingAreas": {
        "en": "Parking Areas",
        "id": "Area Parkir",
        "zh": "停车区域",
        "ja": "駐車場"
      },
      "parkingRates": {
        "en": "Parking Rates",
        "id": "Tarif Parkir",
        "zh": "停车费率",
        "ja": "駐車料金"
      },
      "vehicles": {
        "en": "Vehicles",
        "id": "Kendaraan",
        "zh": "车辆",
        "ja": "車両"
      },
      "memberships": {
        "en": "Memberships",
        "id": "Keanggotaan",
        "zh": "会员资格",
        "ja": "メンバーシップ"
      },
      "payments": {
        "en": "Payments",
        "id": "Pembayaran",
        "zh": "支付",
        "ja": "支払い"
      },
      "system": {
        "en": "System",
        "id": "Sistem",
        "zh": "系统",
        "ja": "システム"
      },
      "users": {
        "en": "Users",
        "id": "Pengguna",
        "zh": "用户",
        "ja": "ユーザー"
      },
      "devices": {
        "en": "Devices",
        "id": "Perangkat",
        "zh": "设备",
        "ja": "デバイス"
      },
      "gates": {
        "en": "Gates",
        "id": "Gerbang",
        "zh": "闸门",
        "ja": "ゲート"
      },
      "settings": {
        "en": "Settings",
        "id": "Pengaturan",
        "zh": "设置",
        "ja": "設定"
      },
      "reports": {
        "en": "Reports",
        "id": "Laporan",
        "zh": "报告",
        "ja": "レポート"
      },
      "shifts": {
        "en": "Shifts",
        "id": "Shift",
        "zh": "轮班",
        "ja": "シフト"
      },
      "systemSettings": {
        "en": "System Settings",
        "id": "Pengaturan Sistem",
        "zh": "系统设置",
        "ja": "システム設定"
      },
      "backup": {
        "en": "Backup",
        "id": "Cadangan",
        "zh": "备份",
        "ja": "バックアップ"
      },
      "logout": {
        "en": "Logout",
        "id": "Keluar",
        "zh": "登出",
        "ja": "ログアウト"
      },
      // Settings pages
      "language": {
        "en": "Language Settings",
        "id": "Pengaturan Bahasa",
        "zh": "语言设置",
        "ja": "言語設定"
      },
      "configureLanguageSettings": {
        "en": "Configure language settings for the system.",
        "id": "Konfigurasikan pengaturan bahasa untuk sistem.",
        "zh": "配置系统的语言设置。",
        "ja": "システムの言語設定を構成します。"
      },
      "currentUILanguage": {
        "en": "Current UI Language",
        "id": "Bahasa UI Saat Ini",
        "zh": "当前界面语言",
        "ja": "現在のUI言語"
      },
      "defaultLanguage": {
        "en": "Default Language",
        "id": "Bahasa Default",
        "zh": "默认语言",
        "ja": "デフォルト言語"
      },
      "availableLanguages": {
        "en": "Available Languages",
        "id": "Bahasa yang Tersedia",
        "zh": "可用语言",
        "ja": "利用可能な言語"
      },
      "addLanguage": {
        "en": "Add Language",
        "id": "Tambah Bahasa",
        "zh": "添加语言",
        "ja": "言語を追加"
      },
      "languageSettingsSaved": {
        "en": "Language settings saved successfully",
        "id": "Pengaturan bahasa berhasil disimpan",
        "zh": "语言设置保存成功",
        "ja": "言語設定が正常に保存されました"
      },
      "failedToSaveSettings": {
        "en": "Failed to save language settings",
        "id": "Gagal menyimpan pengaturan bahasa",
        "zh": "保存语言设置失败",
        "ja": "言語設定の保存に失敗しました"
      },
      "cannotRemoveDefaultLanguage": {
        "en": "Cannot remove default language",
        "id": "Tidak dapat menghapus bahasa default",
        "zh": "无法删除默认语言",
        "ja": "デフォルト言語を削除できません"
      },
      "languageChanged": {
        "en": "UI language changed",
        "id": "Bahasa UI telah diubah",
        "zh": "界面语言已更改",
        "ja": "UI言語が変更されました"
      },
      "errorLoadingLanguageSettings": {
        "en": "Error loading language settings",
        "id": "Error memuat pengaturan bahasa",
        "zh": "加载语言设置时出错",
        "ja": "言語設定の読み込み中にエラーが発生しました"
      },
      "default": {
        "en": "Default",
        "id": "Default",
        "zh": "默认",
        "ja": "デフォルト"
      },
      "current": {
        "en": "Current",
        "id": "Saat Ini",
        "zh": "当前",
        "ja": "現在"
      },
      "removeLanguage": {
        "en": "Remove Language",
        "id": "Hapus Bahasa",
        "zh": "删除语言",
        "ja": "言語を削除"
      },
      // UI elements
      "save": {
        "en": "Save",
        "id": "Simpan",
        "zh": "保存",
        "ja": "保存"
      },
      "cancel": {
        "en": "Cancel",
        "id": "Batal",
        "zh": "取消",
        "ja": "キャンセル"
      },
      "add": {
        "en": "Add",
        "id": "Tambah",
        "zh": "添加",
        "ja": "追加"
      },
      "edit": {
        "en": "Edit",
        "id": "Edit",
        "zh": "编辑",
        "ja": "編集"
      },
      "delete": {
        "en": "Delete",
        "id": "Hapus",
        "zh": "删除",
        "ja": "削除"
      }
    },
    updatedAt: new Date()
  });
});

app.put('/api/settings/language', (req, res) => {
  const updatedSettings = {
    id: 1,
    ...req.body,
    updatedAt: new Date()
  };
  res.json(updatedSettings);
});

app.get('/api/settings/system', (req, res) => {
  res.json({
    id: 1,
    companyName: 'PT Parkir Jaya',
    companyLogo: 'https://via.placeholder.com/150',
    address: 'Jl. Gatot Subroto No. 123, Jakarta Selatan',
    contactPhone: '+62 21 555-7890',
    contactEmail: 'info@parkirjaya.com',
    taxId: '123.456.7-891.000',
    currency: 'IDR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    updatedAt: new Date()
  });
});

app.put('/api/settings/system', (req, res) => {
  const updatedSettings = {
    id: 1,
    ...req.body,
    updatedAt: new Date()
  };
  res.json(updatedSettings);
});

app.get('/api/settings/backup', (req, res) => {
  res.json({
    id: 1,
    automaticBackup: true,
    backupFrequency: 'daily',
    backupTime: '00:00',
    storageLocation: 'local',
    retentionDays: 30,
    lastBackupDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  });
});

app.put('/api/settings/backup', (req, res) => {
  const updatedSettings = {
    id: 1,
    ...req.body,
    updatedAt: new Date()
  };
  res.json(updatedSettings);
});

app.post('/api/settings/backup/trigger', (req, res) => {
  res.json({
    success: true,
    message: 'Backup started successfully'
  });
});

// Check if a route is a valid Express Router before using it
const safeUseRoute = (path: string, route: any) => {
  if (route && typeof route.use === 'function') {
    app.use(path, route);
  } else {
    logger.error(`Route at ${path} is not a valid Express Router`);
  }
};

// Attempt to import other routes that might be problematic
try {
  const vehicleRoutes = require('./routes/vehicle.routes').default;
  if (vehicleRoutes) safeUseRoute('/api/vehicles', vehicleRoutes);
} catch (error) {
  logger.error('Failed to load vehicle routes:', error);
}

try {
  const membershipRoutes = require('./routes/membership.routes').default;
  if (membershipRoutes) safeUseRoute('/api/memberships', membershipRoutes);
} catch (error) {
  logger.error('Failed to load membership routes:', error);
}

// Serve SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Error handling
app.use(errorHandler);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');
    
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing HTTP server and database connection...');
  await AppDataSource.destroy();
  process.exit(0);
});

export default app; 