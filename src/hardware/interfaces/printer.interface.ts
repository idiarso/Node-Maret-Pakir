import { EventEmitter } from 'events';

export interface PrinterConfig {
  name: string;
  width?: number;
  characterSet?: string;
}

export interface PrintOptions {
  bold?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right';
  size?: 'normal' | 'large' | 'small';
}

export class PrinterController extends EventEmitter {
  private readonly printerName: string;
  private readonly width: number;
  private readonly characterSet: string;

  constructor(private readonly config: PrinterConfig) {
    super();
    this.printerName = config.name;
    this.width = config.width || 80;
    this.characterSet = config.characterSet || 'SLOVENIA';
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Check if printer exists
      const { exec } = require('child_process');
      exec(`lpstat -p ${this.printerName}`, (error: Error | null) => {
        if (error) {
          this.emit('error', new Error('Printer not found'));
          return;
        }
        this.emit('ready');
      });
    } catch (error) {
      this.emit('error', error);
    }
  }

  public async print(text: string, options: PrintOptions = {}): Promise<void> {
    try {
      const { exec } = require('child_process');
      const tempFile = `/tmp/print_${Date.now()}.txt`;
      const fs = require('fs').promises;

      // Format text based on options
      const formattedText = this.formatText(text, options);

      // Write to temp file
      await fs.writeFile(tempFile, formattedText);

      // Print using lp command
      return new Promise((resolve, reject) => {
        exec(`lp -d ${this.printerName} ${tempFile}`, async (error: Error | null) => {
          try {
            // Clean up temp file
            await fs.unlink(tempFile);

            if (error) {
              reject(error);
              return;
            }
            resolve();
          } catch (cleanupError) {
            reject(cleanupError);
          }
        });
      });
    } catch (error) {
      throw error;
    }
  }

  private formatText(text: string, options: PrintOptions): string {
    let result = '';

    // Add text alignment
    if (options.align) {
      const padding = ' '.repeat(Math.floor((this.width - text.length) / 2));
      result += options.align === 'center' ? padding + text : 
                options.align === 'right' ? ' '.repeat(this.width - text.length) + text :
                text;
    } else {
      result += text;
    }

    // Add line breaks
    result += '\n';

    return result;
  }

  public dispose(): void {
    // Nothing to dispose for CUPS printing
  }
} 