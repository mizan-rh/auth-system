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
  async findById(id: string): Promise<Role | null> {
    const result = await this.databaseService.query<Role>(
      `
        SELECT id, name
        FROM roles
        WHERE id = $1;
        `,
      [id],
    );

    return result.rows[0] ?? null;
  }

  async create(name: string): Promise<Role> {
    const result = await this.databaseService.query<Role>(
      `
        INSERT INTO roles (name)
        VALUES ($1)
        RETURNING id, name;
        `,
      [name],
    );

    return result.rows[0];
  }

  async update(id: string, name: string): Promise<Role | null> {
    const result = await this.databaseService.query<Role>(
      `
      UPDATE roles
      SET name = $1
      WHERE id = $2
      RETURNING id, name;
    `,
      [name, id],
    );

    return result.rows[0] ?? null;
  }
  async remove(id: string): Promise<Role | null> {
    const result = await this.databaseService.query<Role>(
      `
      DELETE FROM roles
      WHERE id = $1
      RETURNING id, name;
    `,
      [id],
    );

    return result.rows[0] ?? null;
  }
}
