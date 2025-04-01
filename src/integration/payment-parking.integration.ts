import { EventEmitter } from 'events';
import { PaymentSystem } from '../payment/payment.interface';
import { ParkingManager } from '../parking/parking.manager';
import { PaymentTransaction } from '../payment/payment.interface';
import { ParkingSpace } from '../parking/parking.manager';

interface IntegrationConfig {
    paymentSystem: PaymentSystem;
    parkingManager: ParkingManager;
    autoOpenGate: boolean;
    requireConfirmation: boolean;
}

interface PaymentParkingEvent {
    type: 'payment_initiated' | 'payment_completed' | 'payment_failed' | 'gate_opened' | 'gate_closed';
    timestamp: Date;
    transactionId?: string;
    parkingSpaceId?: string;
    amount?: number;
    details: Record<string, unknown>;
}

interface ActiveTransaction {
    transaction: PaymentTransaction;
    parkingSpace: ParkingSpace;
    timestamp: Date;
    error?: string;
}

export class PaymentParkingIntegration extends EventEmitter {
    private config: IntegrationConfig;
    private activeTransactions: Map<string, ActiveTransaction>;

    constructor(config: IntegrationConfig) {
        super();
        this.config = config;
        this.activeTransactions = new Map();
        this.initialize();
    }

    private initialize(): void {
        // Listen to payment events
        this.config.paymentSystem.on('payment_initiated', this.handlePaymentInitiated.bind(this));
        this.config.paymentSystem.on('payment_completed', this.handlePaymentCompleted.bind(this));
        this.config.paymentSystem.on('payment_failed', this.handlePaymentFailed.bind(this));

        // Listen to parking events
        this.config.parkingManager.on('space_assigned', this.handleSpaceAssigned.bind(this));
        this.config.parkingManager.on('space_released', this.handleSpaceReleased.bind(this));
    }

    public async initiatePayment(
        parkingSpaceId: string,
        amount: number,
        paymentMethod: string
    ): Promise<PaymentTransaction> {
        const parkingSpace = await this.config.parkingManager.getParkingSpace(parkingSpaceId);
        if (!parkingSpace) {
            throw new Error('Parking space not found');
        }

        if (parkingSpace.status !== 'occupied') {
            throw new Error('Parking space is not occupied');
        }

        const transaction = await this.config.paymentSystem.processPayment(
            parkingSpaceId,
            amount,
            paymentMethod,
            'SYSTEM',
            {
                parkingSpaceId,
                vehicleType: parkingSpace.currentVehicle?.type || 'unknown',
                entryTime: parkingSpace.currentVehicle?.entryTime || new Date()
            }
        );

        this.activeTransactions.set(transaction.id, {
            transaction,
            parkingSpace,
            timestamp: new Date()
        });

        this.emitEvent('payment_initiated', {
            transactionId: transaction.id,
            parkingSpaceId,
            amount
        });

        return transaction;
    }

    private async handlePaymentInitiated(transaction: PaymentTransaction): Promise<void> {
        const activeTransaction = this.activeTransactions.get(transaction.id);
        if (!activeTransaction) {
            throw new Error('Active transaction not found');
        }

        // Update parking space status
        await this.config.parkingManager.updateSpaceStatus(
            activeTransaction.parkingSpace.id,
            'payment_pending'
        );
    }

    private async handlePaymentCompleted(transaction: PaymentTransaction): Promise<void> {
        const activeTransaction = this.activeTransactions.get(transaction.id);
        if (!activeTransaction) {
            throw new Error('Active transaction not found');
        }

        // Release parking space
        await this.config.parkingManager.releaseSpace(activeTransaction.parkingSpace.id);

        // Open gate if configured and gate ID is available
        if (this.config.autoOpenGate && activeTransaction.parkingSpace.gateId) {
            await this.config.parkingManager.openGate(activeTransaction.parkingSpace.gateId);
        }

        this.emitEvent('payment_completed', {
            transactionId: transaction.id,
            parkingSpaceId: activeTransaction.parkingSpace.id,
            amount: transaction.amount
        });

        // Clean up
        this.activeTransactions.delete(transaction.id);
    }

    private async handlePaymentFailed(transaction: PaymentTransaction): Promise<void> {
        const activeTransaction = this.activeTransactions.get(transaction.id);
        if (!activeTransaction) {
            throw new Error('Active transaction not found');
        }

        // Revert parking space status
        await this.config.parkingManager.updateSpaceStatus(
            activeTransaction.parkingSpace.id,
            'occupied'
        );

        this.emitEvent('payment_failed', {
            transactionId: transaction.id,
            parkingSpaceId: activeTransaction.parkingSpace.id,
            error: activeTransaction.error || 'Unknown error'
        });

        // Clean up
        this.activeTransactions.delete(transaction.id);
    }

    private async handleSpaceAssigned(space: ParkingSpace): Promise<void> {
        // Update any active transactions for this space
        for (const [transactionId, activeTransaction] of this.activeTransactions.entries()) {
            if (activeTransaction.parkingSpace.id === space.id) {
                const updatedTransaction = {
                    ...activeTransaction,
                    parkingSpace: space
                };
                this.activeTransactions.set(transactionId, updatedTransaction);
            }
        }
    }

    private async handleSpaceReleased(space: ParkingSpace): Promise<void> {
        // Clean up any active transactions for this space
        for (const [transactionId, activeTransaction] of this.activeTransactions.entries()) {
            if (activeTransaction.parkingSpace.id === space.id) {
                this.activeTransactions.delete(transactionId);
            }
        }
    }

    private emitEvent(type: PaymentParkingEvent['type'], details: Record<string, unknown>): void {
        const event: PaymentParkingEvent = {
            type,
            timestamp: new Date(),
            details
        };
        this.emit('integration_event', event);
    }

    public getActiveTransactions(): Map<string, ActiveTransaction> {
        return new Map(this.activeTransactions);
    }

    public dispose(): void {
        // Clean up active transactions
        this.activeTransactions.clear();
    }
} 