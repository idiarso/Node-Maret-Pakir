declare module 'qrcode' {
  interface QRCodeOptions {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    type?: 'png' | 'svg' | 'terminal';
    quality?: number;
    level?: string;
    margin?: number;
    scale?: number;
    small?: boolean;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  function toDataURL(text: string, options?: QRCodeOptions): Promise<string>;
  function toBuffer(text: string, options?: QRCodeOptions): Promise<Buffer>;
  function toString(text: string, options?: QRCodeOptions): Promise<string>;

  export = {
    toDataURL,
    toBuffer,
    toString
  };
} 