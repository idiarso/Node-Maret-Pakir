import { Request, Response } from 'express';
import AppDataSource from '../config/ormconfig';
import { ParkingSession } from '../entities/ParkingSession';
import { Logger } from '../../shared/services/Logger';
import { Vehicle } from '../entities/Vehicle';
import { ParkingArea } from '../entities/ParkingArea';
import { getRepository } from 'typeorm';
import { Payment } from '../entities/Payment';
import { PaymentStatus, PaymentMethod } from '../../shared/types';

const logger = Logger.getInstance();

export class ParkingSessionController {
    
    static async getAllParkingSessions(req: Request, res: Response) {
        try {
            const parkingSessionRepository = AppDataSource.getRepository(ParkingSession);
            const parkingSessions = await parkingSessionRepository.find({
                relations: ['vehicle', 'parkingArea', 'ticket'],
                order: { entry_time: 'DESC' }
            });
            
            return res.status(200).json(parkingSessions);
        } catch (error) {
            logger.error('Error fetching parking sessions:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                timestamp: new Date().toISOString()
            });
            return res.status(500).json({ 
                message: 'Error fetching parking sessions',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }

    static async getParkingSessionById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const parkingSessionRepository = AppDataSource.getRepository(ParkingSession);
            const parkingSession = await parkingSessionRepository.findOne({ 
                where: { id: Number(id) },
                relations: ['vehicle', 'parkingArea', 'ticket']
            });
            
            if (!parkingSession) {
                return res.status(404).json({ message: 'Parking session not found' });
            }
            
            return res.status(200).json(parkingSession);
        } catch (error) {
            logger.error(`Error fetching parking session with id ${req.params.id}:`, error);
            return res.status(500).json({ message: 'Error fetching parking session' });
        }
    }

    static async createParkingSession(req: Request, res: Response) {
        try {
            const { vehicleId, parkingAreaId, entryTime } = req.body;
            
            if (!vehicleId || !parkingAreaId) {
                return res.status(400).json({ message: 'Required fields missing' });
            }
            
            // Verify that the vehicle and parking area exist
            const vehicleRepository = AppDataSource.getRepository(Vehicle);
            const vehicle = await vehicleRepository.findOne({ where: { id: Number(vehicleId) } });
            
            if (!vehicle) {
                return res.status(404).json({ message: 'Vehicle not found' });
            }
            
            const parkingAreaRepository = AppDataSource.getRepository(ParkingArea);
            const parkingArea = await parkingAreaRepository.findOne({ where: { id: Number(parkingAreaId) } });
            
            if (!parkingArea) {
                return res.status(404).json({ message: 'Parking area not found' });
            }
            
            const parkingSessionRepository = AppDataSource.getRepository(ParkingSession);
            const newParkingSession = parkingSessionRepository.create({
                vehicle,
                parkingArea,
                entry_time: entryTime || new Date(),
                status: 'ACTIVE'
            });
            
            const savedParkingSession = await parkingSessionRepository.save(newParkingSession);
            
            return res.status(201).json(savedParkingSession);
        } catch (error) {
            logger.error('Error creating parking session:', error);
            return res.status(500).json({ message: 'Error creating parking session' });
        }
    }

    static async updateParkingSession(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            logger.info(`Updating parking session ${id} with data:`, updateData);
            
            const parkingSessionRepository = AppDataSource.getRepository(ParkingSession);
            const parkingSession = await parkingSessionRepository.findOne({ 
                where: { id: Number(id) },
                relations: ['vehicle', 'parkingArea', 'ticket']
            });
            
            if (!parkingSession) {
                return res.status(404).json({ message: 'Parking session not found' });
            }
            
            // Perbarui status jika ada
            if (updateData.status) {
                logger.info(`Changing status from ${parkingSession.status} to ${updateData.status}`);
                parkingSession.status = updateData.status;
            }
            
            // Perbarui exit_time jika ada
            if (updateData.exit_time) {
                logger.info(`Setting exit time to ${updateData.exit_time}`);
                parkingSession.exit_time = new Date(updateData.exit_time);
            }
            
            // Perbarui plat nomor jika ada
            if (updateData.license_plate && parkingSession.vehicle) {
                logger.info(`Updating license plate from ${parkingSession.vehicle.plate_number} to ${updateData.license_plate}`);
                parkingSession.vehicle.plate_number = updateData.license_plate;
                
                // Simpan perubahan ke kendaraan
                const vehicleRepository = AppDataSource.getRepository(Vehicle);
                await vehicleRepository.save(parkingSession.vehicle);
            }
            
            // Perbarui jenis kendaraan jika ada
            if (updateData.vehicle_type && parkingSession.vehicle) {
                logger.info(`Updating vehicle type from ${parkingSession.vehicle.type} to ${updateData.vehicle_type}`);
                parkingSession.vehicle.type = updateData.vehicle_type;
                
                // Simpan perubahan ke kendaraan
                const vehicleRepository = AppDataSource.getRepository(Vehicle);
                await vehicleRepository.save(parkingSession.vehicle);
            }
            
            // Jika status diubah menjadi COMPLETED, tambahkan juga exit_time jika belum ada
            if (updateData.status === 'COMPLETED' && !parkingSession.exit_time) {
                logger.info('Status set to COMPLETED but no exit_time, setting current time');
                parkingSession.exit_time = new Date();
            }
            
            // Simpan perubahan
            const updatedParkingSession = await parkingSessionRepository.save(parkingSession);
            logger.info(`Parking session ${id} updated successfully`);
            
            // Jika status diubah menjadi COMPLETED, buat catatan pembayaran
            if (updateData.status === 'COMPLETED') {
                try {
                    // Kalkulasi biaya berdasarkan durasi
                    const entryTime = parkingSession.entry_time;
                    const exitTime = parkingSession.exit_time || new Date(); // Fallback ke waktu sekarang jika undefined
                    const durationInMilliseconds = exitTime.getTime() - entryTime.getTime();
                    const durationInHours = durationInMilliseconds / (1000 * 60 * 60);
                    
                    // Tarif default
                    const hourlyRate = 10000; 
                    const totalAmount = Math.ceil(durationInHours) * hourlyRate;
                    
                    // Buat catatan pembayaran
                    const paymentRepository = AppDataSource.getRepository(Payment);
                    const payment = new Payment({
                        ticketId: parkingSession.ticket?.id || 0,
                        amount: totalAmount,
                        status: PaymentStatus.COMPLETED,
                        paymentMethod: PaymentMethod.CASH,
                        transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                        paidBy: 1 // Default operator ID
                    });
                    
                    await paymentRepository.save(payment);
                    logger.info(`Payment record created for session ${id}`, payment);
                } catch (paymentError) {
                    logger.error(`Error creating payment for completed session ${id}:`, paymentError);
                    // Tetap lanjutkan meski gagal membuat pembayaran
                }
            }
            
            return res.status(200).json(updatedParkingSession);
        } catch (error) {
            logger.error(`Error updating parking session ${req.params.id}:`, error);
            return res.status(500).json({ message: 'Error updating parking session' });
        }
    }

    static async completeParkingSession(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { exitTime } = req.body;
            
            const parkingSessionRepository = AppDataSource.getRepository(ParkingSession);
            const parkingSession = await parkingSessionRepository.findOne({ 
                where: { id: Number(id) },
                relations: ['vehicle', 'parkingArea', 'ticket']
            });
            
            if (!parkingSession) {
                return res.status(404).json({ message: 'Parking session not found' });
            }
            
            if (parkingSession.status !== 'ACTIVE') {
                return res.status(400).json({ message: 'Parking session is not active' });
            }
            
            // Set exit time and mark as completed
            parkingSession.exit_time = exitTime ? new Date(exitTime) : new Date();
            parkingSession.status = 'COMPLETED';
            
            const updatedParkingSession = await parkingSessionRepository.save(parkingSession);
            
            // Create payment record
            try {
                // Calculate duration in hours (or fraction of hours)
                const entryTime = parkingSession.entry_time;
                const exitTime = parkingSession.exit_time || new Date(); // Fallback ke waktu sekarang jika undefined
                const durationInMilliseconds = exitTime.getTime() - entryTime.getTime();
                const durationInHours = durationInMilliseconds / (1000 * 60 * 60);
                
                // Get parking rate based on vehicle type and parking area
                // For simplicity, using a default rate of 10000 per hour
                const hourlyRate = 10000; 
                const totalAmount = Math.ceil(durationInHours) * hourlyRate;
                
                // Create payment record
                const paymentRepository = AppDataSource.getRepository(Payment);
                const payment = new Payment({
                    ticketId: parkingSession.ticket?.id || 0,
                    amount: totalAmount,
                    status: PaymentStatus.COMPLETED,
                    paymentMethod: PaymentMethod.CASH, // Default to cash
                    transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    paidBy: 1 // Default operator ID
                });
                
                await paymentRepository.save(payment);
                
                logger.info(`Created payment record for parking session ${parkingSession.id}`);
            } catch (paymentError) {
                logger.error(`Error creating payment record for session ${parkingSession.id}:`, paymentError);
                // We still return success for the session completion, but log the payment error
            }
            
            return res.status(200).json(updatedParkingSession);
        } catch (error) {
            logger.error(`Error completing parking session with id ${req.params.id}:`, error);
            return res.status(500).json({ message: 'Error completing parking session' });
        }
    }

    static async getActiveParkingSessions(req: Request, res: Response) {
        try {
            const parkingSessionRepository = AppDataSource.getRepository(ParkingSession);
            const activeSessions = await parkingSessionRepository.find({
                where: { status: 'ACTIVE' },
                relations: ['vehicle', 'parkingArea'],
                order: { entry_time: 'DESC' }
            });
            
            return res.status(200).json(activeSessions);
        } catch (error) {
            logger.error('Error fetching active parking sessions:', error);
            return res.status(500).json({ message: 'Error fetching active parking sessions' });
        }
    }

    static async searchByBarcode(req: Request, res: Response) {
        try {
            const { barcode } = req.query;

            if (!barcode || typeof barcode !== 'string') {
                return res.status(400).json({ message: 'Barcode is required' });
            }

            const parkingSessionRepository = AppDataSource.getRepository(ParkingSession);
            
            // Find parking session through ticket's barcode
            const parkingSession = await parkingSessionRepository
                .createQueryBuilder('session')
                .leftJoinAndSelect('session.ticket', 'ticket')
                .leftJoinAndSelect('session.vehicle', 'vehicle')
                .leftJoinAndSelect('session.parkingArea', 'parkingArea')
                .where('ticket.barcode = :barcode', { barcode })
                .getOne();

            if (!parkingSession) {
                return res.status(404).json({ message: 'Parking session not found' });
            }

            return res.status(200).json(parkingSession);
        } catch (error) {
            logger.error('Error searching parking session by barcode:', error);
            return res.status(500).json({ message: 'Error searching parking session' });
        }
    }

    static async handleVehicleEntry(req: Request, res: Response) {
        try {
            const { plate_number, type } = req.body;

            if (!plate_number || !type) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            // Validate vehicle type
            const validTypes = ['MOTOR', 'MOBIL', 'TRUK', 'BUS', 'VAN'];
            if (!validTypes.includes(type)) {
                return res.status(400).json({ message: "Invalid vehicle type. Must be one of: MOTOR, MOBIL, TRUK, BUS, VAN" });
            }

            const vehicleRepository = AppDataSource.getRepository(Vehicle);
            const parkingSessionRepository = AppDataSource.getRepository(ParkingSession);

            // Find or create vehicle
            let vehicle = await vehicleRepository.findOne({ where: { plate_number } });
            if (!vehicle) {
                vehicle = vehicleRepository.create({
                    plate_number,
                    type
                });
                await vehicleRepository.save(vehicle);
            }

            // Create new parking session
            const parkingSession = parkingSessionRepository.create({
                vehicle,
                entry_time: new Date(),
                status: "ACTIVE"
            });

            const savedSession = await parkingSessionRepository.save(parkingSession);
            return res.status(201).json(savedSession);
        } catch (error) {
            console.error("Error in handleVehicleEntry:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    static async handleVehicleExit(req: Request, res: Response) {
        try {
            const { session_id } = req.body;

            if (!session_id) {
                return res.status(400).json({ message: "Missing required fields" });
            }

            const parkingSessionRepository = getRepository(ParkingSession);

            // Find the active parking session
            const parkingSession = await parkingSessionRepository.findOne({
                where: { id: session_id, status: "ACTIVE" },
                relations: ["vehicle"]
            });

            if (!parkingSession) {
                return res.status(404).json({ message: "Active parking session not found" });
            }

            // Update session with exit details
            parkingSession.exit_time = new Date();
            parkingSession.status = "COMPLETED";

            const updatedSession = await parkingSessionRepository.save(parkingSession);
            return res.status(200).json(updatedSession);
        } catch (error) {
            console.error("Error in handleVehicleExit:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
} 