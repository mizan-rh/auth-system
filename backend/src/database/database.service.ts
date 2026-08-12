import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not configured.');
    }

    this.pool = new Pool({
      connectionString: databaseUrl,
    });
  }
  //test
  async testConnection(): Promise<boolean> {
    const result = await this.pool.query('SELECT 1');

    return result.rowCount === 1;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
