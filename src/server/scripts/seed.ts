import { DataSource } from "typeorm";
import { seedInitialData } from "../seeds/initial-data";
import AppDataSource from "../config/ormconfig";

async function runSeed() {
    try {
        await AppDataSource.initialize();
        console.log("Connected to database");
        
        await seedInitialData(AppDataSource);
        console.log("Seed completed successfully");
    } catch (error) {
        console.error("Error during seeding:", error);
        process.exit(1);
    } finally {
        await AppDataSource.destroy();
    }
}

runSeed(); 