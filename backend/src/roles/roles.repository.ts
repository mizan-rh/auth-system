import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

type Role = {
  id: string;
  name: string;
};

@Injectable()
export class RolesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(): Promise<Role[]> {
    const result = await this.databaseService.query<Role>(
      `
        SELECT id, name
        FROM roles
        ORDER BY name;
        `,
    );

    return result.rows;
  }
}
