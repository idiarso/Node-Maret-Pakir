import { DataSource } from "typeorm";
import { ParkingArea } from "../entities/ParkingArea";
import { Vehicle } from "../entities/Vehicle";
import { Membership } from "../entities/Membership";
import { Device } from "../entities/Device";
import { Gate } from "../entities/Gate";
import { SystemSetting } from "../entities/SystemSetting";

export async function seedInitialData(dataSource: DataSource) {
    // Create parking areas
    const parkingAreas = await dataSource.getRepository(ParkingArea).save([
        {
            name: "Main Parking Lot",
            capacity: 100,
            occupied: 0,
            status: "ACTIVE"
        },
        {
            name: "VIP Parking",
            capacity: 20,
            occupied: 0,
            status: "ACTIVE"
        },
        {
            name: "Employee Parking",
            capacity: 50,
            occupied: 0,
            status: "ACTIVE"
        }
    ]);

    // Create sample vehicles
    const vehicles = await dataSource.getRepository(Vehicle).save([
        {
            plate_number: "ABC123",
            type: "CAR",
            owner_name: "John Doe",
            owner_contact: "+1234567890",
            registration_date: new Date()
        },
        {
            plate_number: "XYZ789",
            type: "MOTORCYCLE",
            owner_name: "Jane Smith",
            owner_contact: "+0987654321",
            registration_date: new Date()
        }
    ]);

    // Create memberships
    await dataSource.getRepository(Membership).save([
        {
            vehicle: vehicles[0],
            type: "MONTHLY",
            start_date: new Date(),
            end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
            status: "ACTIVE"
        },
        {
            vehicle: vehicles[1],
            type: "ANNUAL",
            start_date: new Date(),
            end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            status: "ACTIVE"
        }
    ]);

    // Create devices
    await dataSource.getRepository(Device).save([
        {
            name: "Entry Camera 1",
            type: "CAMERA",
            location: "Main Entrance",
            status: "ACTIVE",
            last_maintenance: new Date(),
            next_maintenance: new Date(new Date().setMonth(new Date().getMonth() + 3))
        },
        {
            name: "Exit Printer 1",
            type: "PRINTER",
            location: "Exit Booth 1",
            status: "ACTIVE",
            last_maintenance: new Date(),
            next_maintenance: new Date(new Date().setMonth(new Date().getMonth() + 6))
        }
    ]);

    // Create gates
    await dataSource.getRepository(Gate).save([
        {
            name: "Main Entry Gate",
            type: "ENTRY",
            status: "CLOSED",
            last_maintenance: new Date()
        },
        {
            name: "Main Exit Gate",
            type: "EXIT",
            status: "CLOSED",
            last_maintenance: new Date()
        }
    ]);

    // Create system settings
    await dataSource.getRepository(SystemSetting).save([
        {
            key: "PARKING_RATE_HOURLY",
            value: "5.00",
            description: "Hourly parking rate in USD"
        },
        {
            key: "PARKING_RATE_DAILY",
            value: "50.00",
            description: "Daily parking rate in USD"
        },
        {
            key: "MEMBERSHIP_RATE_MONTHLY",
            value: "100.00",
            description: "Monthly membership rate in USD"
        },
        {
            key: "MEMBERSHIP_RATE_ANNUAL",
            value: "1000.00",
            description: "Annual membership rate in USD"
        }
    ]);

    console.log("Initial data seeded successfully");
} 