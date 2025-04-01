import AppDataSource from "./ormconfig";

async function checkVehicleTypeEnum() {
    try {
        await AppDataSource.initialize();
        
        // Get enum values for vehicle_type
        const enumValues = await AppDataSource.query(`
            SELECT enum_range(NULL::vehicle_type) as values;
        `);
        
        console.log('Vehicle type enum values:', enumValues);
    } catch (error) {
        console.error('Error checking vehicle_type enum:', error);
    } finally {
        try {
            await AppDataSource.destroy();
        } catch (error) {
            console.error('Error closing database connection:', error);
        }
    }
}

checkVehicleTypeEnum().catch(console.error); 