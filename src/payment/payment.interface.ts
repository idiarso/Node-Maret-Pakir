import { EventEmitter } from 'events';

export interface PaymentMethod {
    id: string;
    name: string;
    type: 'cash' | 'card' | 'e-wallet';
    isEnabled: boolean;
    config?: Record<string, any>;
}

export interface PaymentTransaction {
    id: string;
    ticketId: string;
    amount: number;
    paymentMethod: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    timestamp: Date;
    operatorId: string;
    metadata?: Record<string, any>;
}

export interface PaymentReceipt {
    transactionId: string;
    ticketId: string;
    amount: number;
    paymentMethod: string;
    timestamp: Date;
    operatorId: string;
    barcode: string;
    qrCode?: string;
}

export interface PaymentConfig {
    methods: PaymentMethod[];
    taxRate: number;
    rounding: 'up' | 'down' | 'nearest';
    minimumAmount: number;
    maximumAmount: number;
    receiptTemplate: string;
}

export class PaymentSystem extends EventEmitter {
    private transactions: Map<string, PaymentTransaction> = new Map();
    private config: PaymentConfig;

    constructor(config: PaymentConfig) {
        super();
        this.config = config;
    }

    public async processPayment(
        ticketId: string,
        amount: number,
        paymentMethod: string,
        operatorId: string,
        metadata?: Record<string, any>
    ): Promise<PaymentTransaction> {
        // Validate payment method
        const method = this.config.methods.find(m => m.id === paymentMethod);
        if (!method || !method.isEnabled) {
            throw new Error('Invalid or disabled payment method');
        }

        // Validate amount
        if (amount < this.config.minimumAmount) {
            throw new Error(`Amount below minimum (${this.config.minimumAmount})`);
        }
        if (amount > this.config.maximumAmount) {
            throw new Error(`Amount above maximum (${this.config.maximumAmount})`);
        }

        // Calculate tax
        const tax = this.calculateTax(amount);
        const totalAmount = this.roundAmount(amount + tax);

        // Create transaction
        const transaction: PaymentTransaction = {
            id: this.generateTransactionId(),
            ticketId,
            amount: totalAmount,
            paymentMethod,
            status: 'pending',
            timestamp: new Date(),
            operatorId,
            metadata
        };

        try {
            // Process payment based on method
            switch (method.type) {
                case 'cash':
                    await this.processCashPayment(transaction);
                    break;
                case 'card':
                    await this.processCardPayment(transaction);
                    break;
                case 'e-wallet':
                    await this.processEWalletPayment(transaction);
                    break;
            }

            // Update transaction status
            transaction.status = 'completed';
            this.transactions.set(transaction.id, transaction);

            // Generate receipt
            const receipt = await this.generateReceipt(transaction);
            this.emit('paymentCompleted', { transaction, receipt });

            return transaction;
        } catch (error) {
            transaction.status = 'failed';
            this.transactions.set(transaction.id, transaction);
            this.emit('paymentFailed', { transaction, error });
            throw error;
        }
    }

    public async refundPayment(
        transactionId: string,
        operatorId: string,
        reason?: string
    ): Promise<PaymentTransaction> {
        const transaction = this.transactions.get(transactionId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        if (transaction.status !== 'completed') {
            throw new Error('Transaction cannot be refunded');
        }

        const refundTransaction: PaymentTransaction = {
            ...transaction,
            id: this.generateTransactionId(),
            status: 'refunded',
            timestamp: new Date(),
            operatorId,
            metadata: {
                ...transaction.metadata,
                refundReason: reason,
                originalTransactionId: transactionId
            }
        };

        try {
            // Process refund based on original payment method
            const method = this.config.methods.find(m => m.id === transaction.paymentMethod);
            if (!method) {
                throw new Error('Original payment method not found');
            }

            switch (method.type) {
                case 'cash':
                    await this.processCashRefund(refundTransaction);
                    break;
                case 'card':
                    await this.processCardRefund(refundTransaction);
                    break;
                case 'e-wallet':
                    await this.processEWalletRefund(refundTransaction);
                    break;
            }

            this.transactions.set(refundTransaction.id, refundTransaction);
            this.emit('refundCompleted', refundTransaction);
            return refundTransaction;
        } catch (error) {
            this.emit('refundFailed', { transaction: refundTransaction, error });
            throw error;
        }
    }

    public getTransaction(transactionId: string): PaymentTransaction | undefined {
        return this.transactions.get(transactionId);
    }

    public getTransactionsByTicket(ticketId: string): PaymentTransaction[] {
        return Array.from(this.transactions.values())
            .filter(t => t.ticketId === ticketId);
    }

    public getRecentTransactions(startDate: Date): PaymentTransaction[] {
        return Array.from(this.transactions.values())
            .filter(t => t.timestamp >= startDate);
    }

    private calculateTax(amount: number): number {
        return amount * (this.config.taxRate / 100);
    }

    private roundAmount(amount: number): number {
        switch (this.config.rounding) {
            case 'up':
                return Math.ceil(amount * 100) / 100;
            case 'down':
                return Math.floor(amount * 100) / 100;
            case 'nearest':
                return Math.round(amount * 100) / 100;
        }
    }

    private generateTransactionId(): string {
        return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private async generateReceipt(transaction: PaymentTransaction): Promise<PaymentReceipt> {
        return {
            transactionId: transaction.id,
            ticketId: transaction.ticketId,
            amount: transaction.amount,
            paymentMethod: transaction.paymentMethod,
            timestamp: transaction.timestamp,
            operatorId: transaction.operatorId,
            barcode: this.generateBarcode(transaction.id),
            qrCode: await this.generateQRCode(transaction.id)
        };
    }

    private generateBarcode(transactionId: string): string {
        // Implement barcode generation logic
        return `BAR_${transactionId}`;
    }

    private async generateQRCode(transactionId: string): Promise<string> {
        // Implement QR code generation logic
        return `QR_${transactionId}`;
    }

    // Payment method specific implementations
    private async processCashPayment(transaction: PaymentTransaction): Promise<void> {
        // Implement cash payment processing
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    private async processCardPayment(transaction: PaymentTransaction): Promise<void> {
        // Implement card payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    private async processEWalletPayment(transaction: PaymentTransaction): Promise<void> {
        // Implement e-wallet payment processing
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    private async processCashRefund(transaction: PaymentTransaction): Promise<void> {
        // Implement cash refund processing
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    private async processCardRefund(transaction: PaymentTransaction): Promise<void> {
        // Implement card refund processing
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    private async processEWalletRefund(transaction: PaymentTransaction): Promise<void> {
        // Implement e-wallet refund processing
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
} 