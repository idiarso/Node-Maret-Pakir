import AppDataSource from "./ormconfig";

async function checkParkingRatesTable() {
    try {
        await AppDataSource.initialize();
        
        // Check if table exists
        const tableExists = await AppDataSource.query(`
            SELECT EXISTS (
                SELECT FROM pg_tables 
                WHERE schemaname = 'public'
                AND tablename = 'parking_rates'
            )
        `);
        
        console.log('Table exists:', tableExists);
        
        if (tableExists[0].exists) {
            // Get table schema
            const columns = await AppDataSource.query(`
                SELECT column_name, data_type, character_maximum_length, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'parking_rates'
                ORDER BY ordinal_position
            `);
            
            console.log('Table columns:', columns);
        }
    } catch (error) {
        console.error('Error checking parking_rates table:', error);
    } finally {
        try {
            await AppDataSource.destroy();
        } catch (error) {
            console.error('Error closing database connection:', error);
        }
    }
}

checkParkingRatesTable().catch(console.error); 