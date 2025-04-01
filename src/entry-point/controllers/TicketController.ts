import { CameraService } from '../services/CameraService';
import { PrinterService } from '../services/PrinterService';
import { DatabaseService } from '../services/DatabaseService';
import { GateController } from '../hardware/gate/GateController';

export class TicketController {
    constructor(
        private cameraService: CameraService,
        private printerService: PrinterService,
        private databaseService: DatabaseService,
        private gateController: GateController
    ) {}

    async createTicket(): Promise<void> {
        try {
            // 1. Capture plat nomor
            const plateNumber = await this.cameraService.capturePlateNumber();
            
            // 2. Buat tiket di database
            const ticket = await this.databaseService.createTicket({
                plateNumber,
                entryTime: new Date(),
                status: 'ACTIVE'
            });

            // 3. Cetak tiket
            await this.printerService.printTicket(ticket);

            // 4. Buka gate
            await this.gateController.openGate();

            // 5. Tunggu beberapa detik
            await new Promise(resolve => setTimeout(resolve, 5000));

            // 6. Tutup gate
            await this.gateController.closeGate();

        } catch (error) {
            console.error('Error creating ticket:', error);
            throw error;
        }
    }
} 