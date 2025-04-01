import { EventEmitter } from 'events';
import { TriggerController, TriggerConfig } from '../interfaces/trigger.interface';

interface TriggerState {
    value: number;
    lastChange: number;
}

export class TriggerControllerImpl extends EventEmitter implements TriggerController {
    private state: TriggerState = { value: 0, lastChange: 0 };
    private interval: NodeJS.Timeout | null = null;

    constructor(private readonly config: TriggerConfig) {
        super();
        this.startMonitoring();
    }

    private startMonitoring(): void {
        // Poll trigger state every 100ms
        this.interval = setInterval(() => {
            this.checkTriggerState();
        }, 100);
    }

    private checkTriggerState(): void {
        const now = Date.now();
        const debounceTime = this.config.debounceTime || 1000;

        // Simulate trigger state change
        const newValue = Math.random() > 0.95 ? 1 : 0;
        const isActive = this.config.activeLow ? !newValue : newValue;

        // Check for state change with debounce
        if (isActive !== (this.state.value === 1) && (now - this.state.lastChange) >= debounceTime) {
            this.state = {
                value: isActive ? 1 : 0,
                lastChange: now
            };

            if (isActive) {
                this.emit('trigger');
            }
        }
    }

    public readState(): boolean {
        return this.state.value === 1;
    }

    public dispose(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
} 