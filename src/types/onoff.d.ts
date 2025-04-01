declare module 'onoff' {
    export class Gpio {
        constructor(gpio: number, direction: 'in' | 'out', edge?: 'none' | 'rising' | 'falling' | 'both');
        read(callback: (err: Error | null, value: number) => void): void;
        readSync(): number;
        write(value: number, callback: (err: Error | null) => void): void;
        writeSync(value: number): void;
        watch(callback: (err: Error | null, value: number) => void): void;
        unexport(): void;
    }
} 