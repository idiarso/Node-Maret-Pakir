import { Request, Response } from 'express';
import { DataSource, Repository } from 'typeorm';
import { LanguageSettings } from '../shared/types';

export class SettingsController {
  private defaultLanguageSettings: LanguageSettings = {
    defaultLanguage: 'id',
    availableLanguages: ['en', 'id', 'ja', 'zh'],
    translations: {
      parkingSystem: {
        en: 'Parking System',
        id: 'Sistem Parkir',
        zh: '停车系统',
        ja: '駐車システム'
      },
      welcomeMessage: {
        en: 'Welcome to the Parking Management System',
        id: 'Selamat Datang di Sistem Manajemen Parkir',
        zh: '欢迎使用停车管理系统',
        ja: '駐車場管理システムへようこそ'
      },
      dashboard: {
        en: 'Dashboard',
        id: 'Dasbor',
        zh: '仪表板',
        ja: 'ダッシュボード'
      },
      vehicles: {
        en: 'Vehicles',
        id: 'Kendaraan',
        zh: '车辆',
        ja: '車両'
      },
      tickets: {
        en: 'Tickets',
        id: 'Tiket',
        zh: '票',
        ja: 'チケット'
      },
      payments: {
        en: 'Payments',
        id: 'Pembayaran',
        zh: '支付',
        ja: '支払い'
      },
      reports: {
        en: 'Reports',
        id: 'Laporan',
        zh: '报告',
        ja: 'レポート'
      },
      settings: {
        en: 'Settings',
        id: 'Pengaturan',
        zh: '设置',
        ja: '設定'
      },
      logout: {
        en: 'Logout',
        id: 'Keluar',
        zh: '登出',
        ja: 'ログアウト'
      },
      language: {
        en: 'Language',
        id: 'Bahasa',
        zh: '语言',
        ja: '言語'
      }
    }
  };

  constructor(private dataSource: DataSource) {
    // Seharusnya di sini menggunakan repository dari entity yang sesuai
    // Tapi untuk sementara kita hard-coded saja karena belum ada entity
  }

  getLanguageSettings = async (req: Request, res: Response) => {
    try {
      // Di implementasi sebenarnya, kita akan mendapatkan dari database
      // tapi untuk sementara gunakan data hardcoded
      
      // Log untuk debugging
      console.log('[SettingsController] Sending language settings');
      
      // Return language settings
      return res.status(200).json(this.defaultLanguageSettings);
    } catch (error) {
      console.error('[SettingsController] Error getting language settings:', error);
      return res.status(500).json({ 
        success: false,
        error: {
          message: 'Failed to get language settings',
          details: error instanceof Error ? [error.message] : ['Unknown error']
        }
      });
    }
  };

  updateLanguageSettings = async (req: Request, res: Response) => {
    try {
      const updatedSettings = req.body as Partial<LanguageSettings>;
      
      // Di implementasi sebenarnya, kita akan update ke database
      // tapi untuk sementara hanya update objek di memory
      
      if (updatedSettings.defaultLanguage) {
        this.defaultLanguageSettings.defaultLanguage = updatedSettings.defaultLanguage;
      }
      
      if (updatedSettings.availableLanguages) {
        this.defaultLanguageSettings.availableLanguages = updatedSettings.availableLanguages;
      }
      
      if (updatedSettings.translations) {
        // Merge translations
        this.defaultLanguageSettings.translations = {
          ...this.defaultLanguageSettings.translations,
          ...updatedSettings.translations
        };
      }
      
      // Log untuk debugging
      console.log('[SettingsController] Updated language settings');
      
      // Return updated settings
      return res.status(200).json(this.defaultLanguageSettings);
    } catch (error) {
      console.error('[SettingsController] Error updating language settings:', error);
      return res.status(500).json({ 
        success: false,
        error: {
          message: 'Failed to update language settings',
          details: error instanceof Error ? [error.message] : ['Unknown error']
        }
      });
    }
  };
} 