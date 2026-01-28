import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { SchemaService } from './schema.service';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('schemas')
export class SchemaController {
  constructor(private readonly schemaService: SchemaService) {}

  /**
   * GET /api/v1/schemas
   * List all registered form schema names
   */
  @Public()
  @Get()
  listSchemas(): { schemas: string[] } {
    return {
      schemas: this.schemaService.getAllSchemaNames(),
    };
  }

  /**
   * GET /api/v1/schemas/grids
   * List all registered grid schema names
   */
  @Public()
  @Get('grids')
  listGridSchemas(): { schemas: string[] } {
    return {
      schemas: this.schemaService.getAllGridSchemaNames(),
    };
  }

  /**
   * GET /api/v1/schemas/:name
   * Get schema definition for a specific form
   */
  @Public()
  @Get(':name')
  getSchema(@Param('name') name: string) {
    const schema = this.schemaService.getSchema(name);
    if (!schema) {
      throw new NotFoundException(`Schema "${name}" not found`);
    }
    return schema;
  }

  /**
   * GET /api/v1/schemas/grid/:name
   * Get grid schema definition for a specific entity
   */
  @Public()
  @Get('grid/:name')
  getGridSchema(@Param('name') name: string) {
    const schema = this.schemaService.getGridSchema(name);
    if (!schema) {
      throw new NotFoundException(`Grid schema "${name}" not found`);
    }
    return schema;
  }
}
