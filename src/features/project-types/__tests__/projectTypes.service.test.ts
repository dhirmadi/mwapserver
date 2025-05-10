import { Collection, ObjectId } from 'mongodb';
import { ProjectTypesService } from '../projectTypes.service';
import { ApiError } from '../../../utils/errors';
import { ProjectTypeErrorCodes } from '../../../schemas/projectType.schema';

describe('ProjectTypesService', () => {
  let projectTypesCollection: Collection;
  let service: ProjectTypesService;

  beforeEach(() => {
    projectTypesCollection = {
      find: jest.fn(),
      findOne: jest.fn(),
      insertOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
    } as unknown as Collection;

    service = new ProjectTypesService(projectTypesCollection);
  });

  describe('findAll', () => {
    it('should return all project types', async () => {
      const mockTypes = [{ name: 'Type 1' }, { name: 'Type 2' }];
      (projectTypesCollection.find as jest.Mock).mockReturnValue({
        toArray: () => Promise.resolve(mockTypes)
      });

      const result = await service.findAll();
      expect(result).toEqual(mockTypes);
    });
  });

  describe('findById', () => {
    it('should return project type by id', async () => {
      const mockType = { name: 'Type 1' };
      (projectTypesCollection.findOne as jest.Mock).mockResolvedValue(mockType);

      const result = await service.findById('123');
      expect(result).toEqual(mockType);
    });

    it('should throw error if project type not found', async () => {
      (projectTypesCollection.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.findById('123')).rejects.toThrow(ApiError);
    });
  });

  describe('create', () => {
    const mockData = {
      name: 'New Type',
      description: 'Description',
      configSchema: { type: 'object' },
      isActive: true
    };

    it('should create new project type', async () => {
      (projectTypesCollection.findOne as jest.Mock).mockResolvedValue(null);
      (projectTypesCollection.insertOne as jest.Mock).mockResolvedValue({
        insertedId: new ObjectId()
      });

      const result = await service.create(mockData, 'user123');
      expect(result).toMatchObject(mockData);
    });

    it('should throw error if name exists', async () => {
      (projectTypesCollection.findOne as jest.Mock).mockResolvedValue({ name: 'New Type' });

      await expect(service.create(mockData, 'user123')).rejects.toThrow(
        new ApiError('Project type name already exists', 409, ProjectTypeErrorCodes.NAME_EXISTS)
      );
    });

    it('should throw error if config schema is invalid', async () => {
      const invalidData = { ...mockData, configSchema: 'invalid' };
      
      await expect(service.create(invalidData, 'user123')).rejects.toThrow(
        new ApiError('Invalid configuration schema', 400, ProjectTypeErrorCodes.INVALID_CONFIG_SCHEMA)
      );
    });
  });

  describe('update', () => {
    const mockData = {
      name: 'Updated Type',
      description: 'Updated Description'
    };

    it('should update project type', async () => {
      const mockType = { name: 'Old Type' };
      (projectTypesCollection.findOne as jest.Mock).mockResolvedValueOnce(mockType);
      (projectTypesCollection.findOneAndUpdate as jest.Mock).mockResolvedValue({
        ...mockType,
        ...mockData
      });

      const result = await service.update('123', mockData, 'user123');
      expect(result).toMatchObject(mockData);
    });

    it('should throw error if project type not found', async () => {
      (projectTypesCollection.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.update('123', mockData, 'user123')).rejects.toThrow(
        new ApiError('Project type not found', 404, ProjectTypeErrorCodes.NOT_FOUND)
      );
    });

    it('should throw error if new name exists', async () => {
      (projectTypesCollection.findOne as jest.Mock)
        .mockResolvedValueOnce({ name: 'Old Type' })
        .mockResolvedValueOnce({ name: 'Updated Type' });

      await expect(service.update('123', mockData, 'user123')).rejects.toThrow(
        new ApiError('Project type name already exists', 409, ProjectTypeErrorCodes.NAME_EXISTS)
      );
    });
  });

  describe('delete', () => {
    it('should delete project type', async () => {
      (projectTypesCollection.findOne as jest.Mock).mockResolvedValue({ name: 'Type' });
      (projectTypesCollection.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      await service.delete('123', 'user123');
      expect(projectTypesCollection.deleteOne).toHaveBeenCalled();
    });

    it('should throw error if project type not found', async () => {
      (projectTypesCollection.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.delete('123', 'user123')).rejects.toThrow(
        new ApiError('Project type not found', 404, ProjectTypeErrorCodes.NOT_FOUND)
      );
    });
  });
});