import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateParkingRatesTable1712078400000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "parking_rates",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    {
                        name: "vehicle_type",
                        type: "varchar",
                        isNullable: false
                    },
                    {
                        name: "base_rate",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                        isNullable: false
                    },
                    {
                        name: "hourly_rate",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                        isNullable: false
                    },
                    {
                        name: "max_daily_rate",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                        isNullable: false
                    },
                    {
                        name: "active",
                        type: "boolean",
                        default: true,
                        isNullable: false
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "now()"
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "now()"
                    }
                ]
            }),
            true
        );

        // Insert default parking rates
        await queryRunner.query(`
            INSERT INTO parking_rates (vehicle_type, base_rate, hourly_rate, max_daily_rate, active)
            VALUES 
                ('Motor', 2500.00, 1000.00, 10000.00, true),
                ('Mobil', 5000.00, 2000.00, 20000.00, true),
                ('Truk', 10000.00, 5000.00, 50000.00, true),
                ('Bus', 10000.00, 5000.00, 50000.00, true)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("parking_rates");
    }
} 