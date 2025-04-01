"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HardwareError = void 0;
class HardwareError extends Error {
    constructor(message, source, code, details) {
        super(message);
        this.source = source;
        this.code = code;
        this.details = details;
        this.name = 'HardwareError';
    }
    static fromError(error, source) {
        if (error instanceof HardwareError) {
            return error;
        }
        if (error instanceof Error) {
            return new HardwareError(error.message, source);
        }
        return new HardwareError(String(error), source);
    }
}
exports.HardwareError = HardwareError;
