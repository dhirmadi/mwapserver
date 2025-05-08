import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MongoClient } from 'mongodb';
import { connectDB } from '../db.js';
import { createMockCollection } from '../../__tests__/mockDb.types';
import { ERROR_CODES } from '../../__tests__/constants';

// Import test setup
import '../../__tests__/setup';

// Mock external dependencies
vi.mock('mongodb');
vi.mock('../env.js', () => ({
  env: {
    MONGODB_URI: 'mongodb://localhost:27017/mwap_test',
    NODE_ENV: 'test'
  }
}));

describe('Database Configuration', () => {
  // Mock dependencies
  const mockConnect = vi.fn();
  const mockClose = vi.fn();
  const mockDb = vi.fn();
  const mockConsoleLog = vi.fn();
  const mockConsoleError = vi.fn();
  const mockExit = vi.fn();

  beforeEach(() => {
    // Reset modules and mocks
    vi.resetModules();
    vi.clearAllMocks();
    
    // Mock console and process methods
    console.log = mockConsoleLog;
    console.error = mockConsoleError;
    process.exit = mockExit;

    // Setup MongoDB client mock
    (MongoClient as unknown as vi.Mock).mockImplementation(() => ({
      connect: mockConnect,
      close: mockClose,
      db: mockDb
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('connectDB', () => {
    it('should successfully connect to MongoDB', async () => {
      // Setup mocks
      mockConnect.mockResolvedValueOnce(undefined);
      mockDb.mockReturnValueOnce(createMockCollection());

      // Execute
      await connectDB();

      // Verify
      expect(MongoClient).toHaveBeenCalledWith('mongodb://localhost:27017/mwap_test');
      expect(mockConnect).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith('Connected to MongoDB');
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      // Setup mocks
      const error = new Error('Connection failed');
      mockConnect.mockRejectedValueOnce(error);

      // Execute
      await connectDB();

      // Verify
      expect(mockConsoleError).toHaveBeenCalledWith('MongoDB connection error:', error);
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('SIGINT handler', () => {
    it('should close MongoDB connection on SIGINT', async () => {
      // Setup mocks
      mockClose.mockResolvedValueOnce(undefined);

      // Execute
      process.emit('SIGINT');

      // Verify
      expect(mockClose).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith('MongoDB disconnected');
      expect(mockExit).toHaveBeenCalledWith(0);
    });

    it('should handle close errors on SIGINT', async () => {
      // Setup mocks
      const error = new Error('Failed to close MongoDB connection');
      mockClose.mockRejectedValueOnce(error);

      // Execute
      process.emit('SIGINT');

      // Verify
      expect(mockConsoleError).toHaveBeenCalledWith('Error closing MongoDB connection:', error);
      expect(mockExit).toHaveBeenCalledWith(0); // Should still exit gracefully
    });
  });
});