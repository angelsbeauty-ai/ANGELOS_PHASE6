import { Module } from '@nestjs/common';
import { DbMigrationController } from './db-migration.controller';
import { DbMigrationService } from './db-migration.controller';

@Module({
  controllers: [DbMigrationController],
  providers: [DbMigrationService],
})
export class DbMigrationModule {}
