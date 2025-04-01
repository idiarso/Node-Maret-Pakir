export interface TriggerConfig {
  type: 'pushbutton' | 'loop-detector';
  pin: number; // GPIO pin number
  debounceTime?: number; // Debounce time in milliseconds
  activeLow?: boolean; // Whether the trigger is active low
}

export interface TriggerController {
  on(event: 'trigger', listener: () => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  readState(): boolean;
  dispose(): void;
} 