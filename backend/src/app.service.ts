import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database/database.service';
@Injectable()
export class AppService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getHello(): Promise<string> {
    const connected = await this.databaseService.testConnection();

    return connected
      ? 'Database connection successful.'
      : 'Database connection failed.';
  }
}
