import { ArduinoClient } from '../arduino_client';
import { SerialPort } from 'serialport';

// Mock SerialPort
jest.mock('serialport', () => ({
  SerialPort: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    write: jest.fn(),
    close: jest.fn(),
    isOpen: false,
  })),
}));

describe('ArduinoClient', () => {
  let client: ArduinoClient;
  let mockSerialPort: any;

  beforeEach(() => {
    mockSerialPort = new SerialPort('COM3');
    client = new ArduinoClient('COM3');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should connect to Arduino successfully', async () => {
      mockSerialPort.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'open') {
          callback();
        }
      });

      await client.connect();

      expect(mockSerialPort.on).toHaveBeenCalledWith('open', expect.any(Function));
      expect(mockSerialPort.on).toHaveBeenCalledWith('data', expect.any(Function));
      expect(mockSerialPort.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockSerialPort.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(client.isConnected).toBe(true);
    });

    it('should handle connection error', async () => {
      const error = new Error('Connection failed');
      mockSerialPort.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') {
          callback(error);
        }
      });

      await expect(client.connect()).rejects.toThrow('Connection failed');
      expect(client.isConnected).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('should disconnect from Arduino', async () => {
      client.isConnected = true;
      await client.disconnect();

      expect(mockSerialPort.close).toHaveBeenCalled();
      expect(client.isConnected).toBe(false);
    });

    it('should handle disconnection error', async () => {
      const error = new Error('Disconnection failed');
      mockSerialPort.close.mockRejectedValue(error);

      client.isConnected = true;
      await expect(client.disconnect()).rejects.toThrow('Disconnection failed');
    });
  });

  describe('handleBarcode', () => {
    it('should process barcode data correctly', async () => {
      const barcode = '123456789';
      const mockResponse = { ok: true };
      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      await client.handleBarcode(barcode);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/tickets/scan',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ barcode }),
        })
      );
    });

    it('should handle server error', async () => {
      const barcode = '123456789';
      const error = new Error('Server error');
      global.fetch = jest.fn().mockRejectedValue(error);

      await expect(client.handleBarcode(barcode)).rejects.toThrow('Server error');
    });
  });

  describe('setupEventHandlers', () => {
    it('should set up all event handlers', () => {
      client.setupEventHandlers();

      expect(mockSerialPort.on).toHaveBeenCalledWith('data', expect.any(Function));
      expect(mockSerialPort.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockSerialPort.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should handle data events', () => {
      const mockData = Buffer.from('123456789\n');
      const handleBarcodeSpy = jest.spyOn(client, 'handleBarcode');

      client.setupEventHandlers();
      const dataHandler = mockSerialPort.on.mock.calls.find(
        call => call[0] === 'data'
      )[1];
      dataHandler(mockData);

      expect(handleBarcodeSpy).toHaveBeenCalledWith('123456789');
    });

    it('should handle error events', () => {
      const error = new Error('Serial port error');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      client.setupEventHandlers();
      const errorHandler = mockSerialPort.on.mock.calls.find(
        call => call[0] === 'error'
      )[1];
      errorHandler(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Serial port error:', error);
    });

    it('should handle close events', () => {
      client.isConnected = true;
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      client.setupEventHandlers();
      const closeHandler = mockSerialPort.on.mock.calls.find(
        call => call[0] === 'close'
      )[1];
      closeHandler();

      expect(consoleLogSpy).toHaveBeenCalledWith('Serial port closed');
      expect(client.isConnected).toBe(false);
    });
  });

  describe('sendCommand', () => {
    it('should send command to Arduino', async () => {
      client.isConnected = true;
      const command = 'TEST_COMMAND';

      await client.sendCommand(command);

      expect(mockSerialPort.write).toHaveBeenCalledWith(command + '\n');
    });

    it('should throw error if not connected', async () => {
      client.isConnected = false;
      const command = 'TEST_COMMAND';

      await expect(client.sendCommand(command)).rejects.toThrow('Not connected to Arduino');
      expect(mockSerialPort.write).not.toHaveBeenCalled();
    });

    it('should handle write error', async () => {
      client.isConnected = true;
      const command = 'TEST_COMMAND';
      const error = new Error('Write failed');
      mockSerialPort.write.mockImplementation((data: string, callback: Function) => {
        callback(error);
      });

      await expect(client.sendCommand(command)).rejects.toThrow('Write failed');
    });
  });
}); 