import { Request, Response } from 'express';
import { ProjectTypesController } from '../projectTypes.controller';
import { ProjectTypesService } from '../projectTypes.service';
import { ApiError } from '../../../utils/errors';

describe('ProjectTypesController', () => {
  let controller: ProjectTypesController;
  let service: ProjectTypesService;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as ProjectTypesService;

    jsonMock = jest.fn();
    res = {
      json: jsonMock,
      status: jest.fn().mockReturnThis(),
    };

    controller = new ProjectTypesController(service);
  });

  describe('getAll', () => {
    it('should return all project types', async () => {
      const mockTypes = [{ name: 'Type 1' }, { name: 'Type 2' }];
      (service.findAll as jest.Mock).mockResolvedValue(mockTypes);

      await controller.getAll(req as Request, res as Response);

      expect(jsonMock).toHaveBeenCalledWith({ data: mockTypes });
    });
  });

  describe('getById', () => {
    beforeEach(() => {
      req = {
        params: { id: '123' }
      };
    });

    it('should return project type by id', async () => {
      const mockType = { name: 'Type 1' };
      (service.findById as jest.Mock).mockResolvedValue(mockType);

      await controller.getById(req as Request, res as Response);

      expect(jsonMock).toHaveBeenCalledWith({ data: mockType });
    });

    it('should handle not found error', async () => {
      (service.findById as jest.Mock).mockRejectedValue(new ApiError('Not found', 404));

      await expect(controller.getById(req as Request, res as Response))
        .rejects.toThrow(ApiError);
    });
  });

  describe('create', () => {
    const mockData = {
      name: 'New Type',
      description: 'Description',
      configSchema: { type: 'object' },
      isActive: true
    };

    beforeEach(() => {
      req = {
        body: mockData,
        user: { sub: 'user123' }
      };
    });

    it('should create new project type', async () => {
      (service.create as jest.Mock).mockResolvedValue({ ...mockData, _id: '123' });

      await controller.create(req as Request, res as Response);

      expect(service.create).toHaveBeenCalledWith(mockData, 'user123');
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('update', () => {
    const mockData = {
      name: 'Updated Type',
      description: 'Updated Description'
    };

    beforeEach(() => {
      req = {
        params: { id: '123' },
        body: mockData,
        user: { sub: 'user123' }
      };
    });

    it('should update project type', async () => {
      (service.update as jest.Mock).mockResolvedValue({ ...mockData, _id: '123' });

      await controller.update(req as Request, res as Response);

      expect(service.update).toHaveBeenCalledWith('123', mockData, 'user123');
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      req = {
        params: { id: '123' },
        user: { sub: 'user123' }
      };
    });

    it('should delete project type', async () => {
      await controller.delete(req as Request, res as Response);

      expect(service.delete).toHaveBeenCalledWith('123', 'user123');
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });
});