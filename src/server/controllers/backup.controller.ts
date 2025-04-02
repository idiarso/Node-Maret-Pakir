import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { Logger } from '../../shared/services/Logger';
import AppDataSource from '../config/ormconfig';

// Extend Request type to include file from multer
interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

const logger = Logger.getInstance();
const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  logger.info(`Created backup directory at ${BACKUP_DIR}`);
}

export class BackupController {
  
  static async getBackupSettings(req: Request, res: Response) {
    try {
      // Mock settings for now, in production these would come from database
      const settings = {
        auto_backup: true,
        backup_frequency: 'DAILY',
        backup_time: '00:00',
        backup_location: 'local',
        keep_backups: 5,
        last_backup: new Date().toISOString(),
        recent_backups: [
          { 
            date: new Date().toISOString(), 
            size: '2.3 MB',
            type: 'FULL'
          }
        ]
      };
      
      return res.status(200).json(settings);
    } catch (error) {
      logger.error('Error fetching backup settings:', error);
      return res.status(500).json({ message: 'Error fetching backup settings' });
    }
  }

  static async updateBackupSettings(req: Request, res: Response) {
    try {
      const settings = req.body;
      
      // Validate settings - simplified version
      if (!settings) {
        return res.status(400).json({ message: 'Invalid settings provided' });
      }
      
      // Actual implementation would save to database
      logger.info(`[MOCK] Updated backup settings: ${JSON.stringify(settings)}`);
      
      return res.status(200).json({ 
        message: 'Backup settings updated successfully',
        settings
      });
    } catch (error) {
      logger.error('Error updating backup settings:', error);
      return res.status(500).json({ message: 'Error updating backup settings' });
    }
  }

  static async triggerBackup(req: Request, res: Response) {
    try {
      logger.info('Triggering database backup (simple file version)...');
      
      // Check if custom name provided
      const { customName, format = 'json' } = req.body || {};
      
      let filename;
      const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
      const fileExt = format.toLowerCase() === 'sql' ? '.sql' : '.json';
      
      if (customName && typeof customName === 'string' && customName.trim() !== '') {
        // Use custom name provided by user - make sure it has correct extension
        filename = customName.trim().endsWith(fileExt) ? 
          customName.trim() : 
          `${customName.trim()}${fileExt}`;
      } else {
        // Use default timestamp-based name
        filename = `backup-${timestamp}${fileExt}`;
      }
      
      const filepath = path.join(BACKUP_DIR, filename);
      
      // Check if file already exists
      if (fs.existsSync(filepath)) {
        return res.status(400).json({ 
          success: false, 
          message: 'A backup with this name already exists. Please choose a different name.' 
        });
      }
      
      // Create backup based on format
      if (format.toLowerCase() === 'sql') {
        return BackupController.createSqlBackup(filename, filepath, res);
      } else {
        return BackupController.createJsonBackup(filename, filepath, res);
      }
    } catch (error) {
      logger.error('Error creating backup:', error);
      return res.status(500).json({ message: 'Error creating backup', error: String(error) });
    }
  }
  
  // Create SQL backup file
  private static async createSqlBackup(filename: string, filepath: string, res: Response) {
    try {
      // Generate SQL statements to recreate database
      const sqlStatements = await BackupController.generateSqlStatements();
      
      // Write to backup file
      fs.writeFileSync(filepath, sqlStatements);
      
      // Get file size
      const stats = fs.statSync(filepath);
      const fileSizeInBytes = stats.size;
      const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
      
      logger.info(`SQL Backup created successfully at ${filepath}`);
      
      return res.status(200).json({ 
        success: true, 
        message: 'SQL Backup created successfully',
        details: {
          filename,
          path: filepath,
          format: 'SQL',
          size: `${fileSizeInMB} MB`,
          created_at: new Date().toISOString()
        }
      });
    } catch (backupError) {
      logger.error('Error creating SQL backup:', backupError);
      return res.status(500).json({ 
        message: 'Error creating SQL backup', 
        error: String(backupError) 
      });
    }
  }
  
  // Create JSON backup file
  private static async createJsonBackup(filename: string, filepath: string, res: Response) {
    try {
      // Get database structure and some data samples
      const tables = await BackupController.getTableStructure();
      
      // Write to backup file
      fs.writeFileSync(filepath, JSON.stringify(tables, null, 2));
      
      // Get file size
      const stats = fs.statSync(filepath);
      const fileSizeInBytes = stats.size;
      const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
      
      logger.info(`JSON Backup created successfully at ${filepath}`);
      
      return res.status(200).json({ 
        success: true, 
        message: 'JSON Backup created successfully',
        details: {
          filename,
          path: filepath,
          format: 'JSON',
          size: `${fileSizeInMB} MB`,
          created_at: new Date().toISOString()
        }
      });
    } catch (backupError) {
      logger.error('Error creating JSON backup:', backupError);
      return res.status(500).json({ 
        message: 'Error creating JSON backup', 
        error: String(backupError) 
      });
    }
  }
  
  // Generate SQL statements for database backup
  private static async generateSqlStatements(): Promise<string> {
    let sqlStatements = `-- SQL Backup generated at ${new Date().toISOString()}\n`;
    sqlStatements += `-- This SQL backup can be restored using: psql -d your_database -f backup_file.sql\n\n`;
    
    try {
      // Get list of all tables
      const tableListQuery = `
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `;
      const tableList = await AppDataSource.query(tableListQuery);
      
      // Add BEGIN transaction
      sqlStatements += `BEGIN;\n\n`;
      
      // For each table, generate SQL
      for (const table of tableList) {
        const tableName = table.table_name;
        
        // Get table schema
        sqlStatements += `-- Table: ${tableName}\n`;
        
        // Get create table statement (simplified version)
        const columnsQuery = `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `;
        const columns = await AppDataSource.query(columnsQuery, [tableName]);
        
        // Generate CREATE TABLE statement
        sqlStatements += `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
        
        const columnDefinitions = columns.map((column: any) => {
          return `  "${column.column_name}" ${column.data_type} ${column.is_nullable === 'NO' ? 'NOT NULL' : ''}`;
        }).join(',\n');
        
        sqlStatements += columnDefinitions;
        sqlStatements += `\n);\n\n`;
        
        // Get primary key information
        try {
          const pkQuery = `
            SELECT a.attname
            FROM pg_index i
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
            WHERE i.indrelid = '"${tableName}"'::regclass AND i.indisprimary;
          `;
          const primaryKeys = await AppDataSource.query(pkQuery);
          
          if (primaryKeys.length > 0) {
            const pkColumns = primaryKeys.map((pk: any) => `"${pk.attname}"`).join(', ');
            sqlStatements += `ALTER TABLE "${tableName}" ADD PRIMARY KEY (${pkColumns});\n\n`;
          }
        } catch (pkError) {
          logger.warn(`Could not determine primary key for table ${tableName}:`, pkError);
        }
        
        // Get sample data (up to 20 rows)
        try {
          const sampleDataQuery = `SELECT * FROM "${tableName}" LIMIT 20`;
          const sampleData = await AppDataSource.query(sampleDataQuery);
          
          if (sampleData.length > 0) {
            // Generate INSERT statements
            sqlStatements += `-- Sample data for ${tableName}\n`;
            
            for (const row of sampleData) {
              const columnNames = Object.keys(row).map(c => `"${c}"`).join(', ');
              const columnValues = Object.values(row).map((v: any) => {
                if (v === null) return 'NULL';
                if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
                if (v instanceof Date) return `'${v.toISOString()}'`;
                return v;
              }).join(', ');
              
              sqlStatements += `INSERT INTO "${tableName}" (${columnNames}) VALUES (${columnValues});\n`;
            }
            sqlStatements += '\n';
          }
        } catch (dataError) {
          logger.warn(`Error getting sample data for table ${tableName}:`, dataError);
        }
      }
      
      // Commit transaction
      sqlStatements += `COMMIT;\n`;
      
      return sqlStatements;
    } catch (error) {
      logger.error('Error generating SQL statements:', error);
      throw error;
    }
  }
  
  // Helper method to get database structure without pg_dump
  private static async getTableStructure() {
    const tables: Record<string, any> = {};
    
    try {
      // Get list of all tables
      const tableListQuery = `
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `;
      const tableList = await AppDataSource.query(tableListQuery);
      
      // For each table, get structure and sample data
      for (const table of tableList) {
        const tableName = table.table_name;
        
        // Get columns
        const columnsQuery = `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1
        `;
        const columns = await AppDataSource.query(columnsQuery, [tableName]);
        
        // Get sample data (first 5 rows)
        try {
          const sampleDataQuery = `SELECT * FROM "${tableName}" LIMIT 5`;
          const sampleData = await AppDataSource.query(sampleDataQuery);
          
          tables[tableName] = {
            structure: columns,
            sampleData: sampleData
          };
        } catch (error) {
          // If error in getting sample data, just save the structure
          tables[tableName] = {
            structure: columns,
            sampleData: []
          };
        }
      }
      
      return tables;
    } catch (error) {
      logger.error('Error getting table structure:', error);
      throw error;
    }
  }
  
  static async listBackups(req: Request, res: Response) {
    try {
      logger.info('Listing available backups...');
      
      const files = fs.readdirSync(BACKUP_DIR);
      const backups = files
        .filter(file => file.endsWith('.json') || file.endsWith('.sql'))
        .map(file => {
          const filepath = path.join(BACKUP_DIR, file);
          const stats = fs.statSync(filepath);
          const fileSizeInBytes = stats.size;
          const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
          
          return {
            filename: file,
            path: filepath,
            size: `${fileSizeInMB} MB`,
            created_at: stats.mtime.toISOString()
          };
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      logger.info(`Found ${backups.length} backups`);
      return res.status(200).json(backups);
    } catch (error) {
      logger.error('Error listing backups:', error);
      return res.status(500).json({ message: 'Error listing backups', error: String(error) });
    }
  }
  
  static async restoreBackup(req: Request, res: Response) {
    try {
      const { filename } = req.params;
      logger.info(`Restoring backup from ${filename}...`);
      
      const filepath = path.join(BACKUP_DIR, filename);
      
      // Verify file exists
      if (!fs.existsSync(filepath)) {
        logger.error(`Backup file ${filepath} not found`);
        return res.status(404).json({ message: 'Backup file not found' });
      }
      
      // For JSON backups, we would need to implement restore logic here
      // For now, just return success
      logger.info(`[MOCK] Backup restored successfully from ${filepath}`);
      return res.status(200).json({ 
        success: true, 
        message: 'Backup restore simulation successful' 
      });
    } catch (error) {
      logger.error('Error restoring backup:', error);
      return res.status(500).json({ message: 'Error restoring backup', error: String(error) });
    }
  }
  
  static async deleteBackup(req: Request, res: Response) {
    try {
      const { filename } = req.params;
      logger.info(`Deleting backup ${filename}...`);
      
      const filepath = path.join(BACKUP_DIR, filename);
      
      // Verify file exists
      if (!fs.existsSync(filepath)) {
        logger.error(`Backup file ${filepath} not found`);
        return res.status(404).json({ message: 'Backup file not found' });
      }
      
      // Delete file
      fs.unlinkSync(filepath);
      
      logger.info(`Backup ${filepath} deleted successfully`);
      return res.status(200).json({ 
        success: true, 
        message: 'Backup deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting backup:', error);
      return res.status(500).json({ message: 'Error deleting backup', error: String(error) });
    }
  }
  
  // Method to download a backup file
  static async downloadBackup(req: Request, res: Response) {
    try {
      const { filename } = req.params;
      const { downloadName } = req.query;
      
      logger.info(`Downloading backup ${filename}...`);
      
      const filepath = path.join(BACKUP_DIR, filename);
      
      // Verify file exists
      if (!fs.existsSync(filepath)) {
        logger.error(`Backup file ${filepath} not found`);
        return res.status(404).json({ message: 'Backup file not found' });
      }
      
      // Set the filename for download - use custom name if provided
      const customFilename = downloadName && typeof downloadName === 'string' && downloadName.trim() ? 
        downloadName.trim() : filename;
      
      // Make sure the filename has the correct extension
      const fileExt = path.extname(filename);
      const finalFilename = customFilename.endsWith(fileExt) ? 
        customFilename : 
        `${customFilename}${fileExt}`;
      
      // Set response headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
      res.setHeader('Content-Type', fileExt === '.json' ? 'application/json' : 'application/octet-stream');
      
      // Stream the file
      const fileStream = fs.createReadStream(filepath);
      fileStream.pipe(res);
      
      logger.info(`Streaming backup file ${filepath} for download as ${finalFilename}`);
    } catch (error) {
      logger.error('Error downloading backup:', error);
      return res.status(500).json({ message: 'Error downloading backup', error: String(error) });
    }
  }
  
  // New method for handling file upload (restore from uploaded file)
  static async uploadAndRestoreBackup(req: RequestWithFile, res: Response) {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ message: 'No backup file uploaded' });
      }
      
      logger.info(`Processing uploaded backup file: ${req.file.originalname}`);
      
      // Move uploaded file to backup directory with original name or timestamp name
      const targetFilename = req.body.useOriginalName ? 
        req.file.originalname : 
        `uploaded-backup-${Date.now()}.json`;
      
      const targetPath = path.join(BACKUP_DIR, targetFilename);
      
      // Check if file with that name already exists
      if (fs.existsSync(targetPath)) {
        return res.status(400).json({ 
          message: 'A backup with this name already exists. Please choose a different name.' 
        });
      }
      
      // Move the temporary file to the backup directory
      fs.copyFileSync(req.file.path, targetPath);
      fs.unlinkSync(req.file.path); // Remove temporary file
      
      logger.info(`Backup file saved to ${targetPath}`);
      
      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Backup file uploaded successfully',
        details: {
          filename: targetFilename,
          path: targetPath,
          size: (req.file.size / (1024 * 1024)).toFixed(2) + ' MB',
          created_at: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error processing uploaded backup:', error);
      return res.status(500).json({ 
        message: 'Error processing uploaded backup', 
        error: String(error) 
      });
    }
  }
} 