declare module 'tesseract.js' {
  interface RecognizeResult {
    data: {
      text: string;
      confidence: number;
    };
  }

  interface WorkerOptions {
    logger?: (m: any) => void;
    langPath?: string;
    gzip?: boolean;
    errorHandler?: (e: Error) => void;
  }

  interface Worker {
    loadLanguage(lang: string): Promise<void>;
    initialize(lang: string): Promise<void>;
    recognize(image: Buffer | string): Promise<RecognizeResult>;
    terminate(): Promise<void>;
  }

  function createWorker(options?: WorkerOptions): Promise<Worker>;
  export = createWorker;
} 