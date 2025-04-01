export class HardwareError extends Error {
    constructor(
        message: string,
        public readonly source?: string,
        public readonly code?: string,
        public readonly details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'HardwareError';
    }

    static fromError(error: unknown, source?: string): HardwareError {
        if (error instanceof HardwareError) {
            return error;
        }

        if (error instanceof Error) {
            return new HardwareError(error.message, source);
        }

        return new HardwareError(String(error), source);
    }
} 