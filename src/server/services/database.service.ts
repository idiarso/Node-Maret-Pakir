import { Repository, EntityTarget, FindOptionsWhere, FindOneOptions, ObjectLiteral, DeepPartial, FindManyOptions, BaseEntity } from 'typeorm';
import AppDataSource from '../config/ormconfig';
import { LoggerService } from './logger.service';
import { ApiError } from '../middleware/error.middleware';

export class DatabaseService<T extends BaseEntity> {
    private repository: Repository<T>;

    constructor(entity: EntityTarget<T>) {
        this.repository = AppDataSource.getRepository(entity);
    }

    async create(data: DeepPartial<T>): Promise<T> {
        try {
            const entity = this.repository.create(data);
            const result = await this.repository.save(entity);
            LoggerService.info(`Created entity: ${this.repository.metadata.name}`, { id: (result as any).id });
            return result;
        } catch (error) {
            LoggerService.error(`Error creating ${this.repository.metadata.name}:`, error);
            throw new ApiError(400, `Failed to create ${this.repository.metadata.name}`);
        }
    }

    async findById(id: number): Promise<T> {
        try {
            const entity = await this.repository.findOne({
                where: { id } as unknown as FindOptionsWhere<T>
            });
            if (!entity) {
                throw new ApiError(404, `${this.repository.metadata.name} not found`);
            }
            return entity;
        } catch (error) {
            if (error instanceof ApiError) throw error;
            LoggerService.error(`Error finding ${this.repository.metadata.name}:`, error);
            throw new ApiError(500, `Error retrieving ${this.repository.metadata.name}`);
        }
    }

    async findOne(options: FindOneOptions<T>): Promise<T | null> {
        try {
            return await this.repository.findOne(options);
        } catch (error) {
            LoggerService.error(`Error finding ${this.repository.metadata.name}:`, error);
            throw new ApiError(500, `Error retrieving ${this.repository.metadata.name}`);
        }
    }

    async findAll(options?: FindManyOptions<T>): Promise<T[]> {
        try {
            return await this.repository.find(options || {});
        } catch (error) {
            LoggerService.error(`Error finding ${this.repository.metadata.name} list:`, error);
            throw new ApiError(500, `Error retrieving ${this.repository.metadata.name} list`);
        }
    }

    async update(id: number, data: DeepPartial<T>): Promise<T> {
        try {
            const entity = await this.findById(id);
            const updated = this.repository.merge(entity, data);
            const result = await this.repository.save(updated);
            LoggerService.info(`Updated ${this.repository.metadata.name}:`, { id });
            return result;
        } catch (error) {
            if (error instanceof ApiError) throw error;
            LoggerService.error(`Error updating ${this.repository.metadata.name}:`, error);
            throw new ApiError(400, `Failed to update ${this.repository.metadata.name}`);
        }
    }

    async delete(id: number): Promise<void> {
        try {
            const entity = await this.findById(id);
            await this.repository.remove(entity);
            LoggerService.info(`Deleted ${this.repository.metadata.name}:`, { id });
        } catch (error) {
            if (error instanceof ApiError) throw error;
            LoggerService.error(`Error deleting ${this.repository.metadata.name}:`, error);
            throw new ApiError(400, `Failed to delete ${this.repository.metadata.name}`);
        }
    }

    async count(where?: FindOptionsWhere<T>): Promise<number> {
        try {
            return await this.repository.count({ where });
        } catch (error) {
            LoggerService.error(`Error counting ${this.repository.metadata.name}:`, error);
            throw new ApiError(500, `Error counting ${this.repository.metadata.name}`);
        }
    }
} 