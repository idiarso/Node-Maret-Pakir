import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
import { Logger } from '../../shared/services/Logger';

// Load environment variables
config();

const logger = Logger.getInstance();

async function setupDatabase() {
  const client = new Client({
    user: process.env.DB_USERNAME,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    logger.info('Connecting to database...');
    await client.connect();
    logger.info('Connected to database');

    // Read init.sql file
    const initSqlPath = path.join(process.cwd(), 'init.sql');
    logger.info(`Reading SQL file from: ${initSqlPath}`);
    
    const sqlScript = fs.readFileSync(initSqlPath, 'utf8');
    
    // Split script into individual statements
    // This is a simple approach - for complex scripts with functions, you might need a more robust parser
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    logger.info(`Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      try {
        await client.query(statements[i] + ';');
        if (i % 10 === 0) {
          logger.info(`Executed ${i + 1}/${statements.length} statements`);
        }
      } catch (err: any) {
        logger.warn(`Error executing statement ${i + 1}: ${err.message}`);
        // Continue with next statement
      }
    }
    
    logger.info('Database setup completed');
  } catch (err: any) {
    logger.error('Database setup error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run setup
setupDatabase(); 