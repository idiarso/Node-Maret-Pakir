import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ArduinoGateController } from '../../services/GateController';

describe('ArduinoGateController', () => {
  let gateController: ArduinoGateController;

  beforeEach(() => {
    gateController = new ArduinoGateController();
  });

  describe('initialize', () => {
    it('should initialize with correct configuration', () => {
      const config = {
        type: 'arduino',
        port: 'COM7'
      };

      gateController.initialize(config);
      // Add assertions based on your implementation
    });
  });

  describe('open', () => {
    it('should open gate successfully', async () => {
      gateController.initialize({
        type: 'arduino',
        port: 'COM7'
      });

      await expect(gateController.open()).resolves.not.toThrow();
    });

    it('should handle opening errors gracefully', async () => {
      gateController.initialize({
        type: 'arduino',
        port: 'INVALID_PORT'
      });

      await expect(gateController.open()).rejects.toThrow();
    });
  });

  describe('close', () => {
    it('should close gate successfully', async () => {
      gateController.initialize({
        type: 'arduino',
        port: 'COM7'
      });

      await expect(gateController.close()).resolves.not.toThrow();
    });

    it('should handle closing errors gracefully', async () => {
      gateController.initialize({
        type: 'arduino',
        port: 'INVALID_PORT'
      });

      await expect(gateController.close()).rejects.toThrow();
    });
  });
}); 