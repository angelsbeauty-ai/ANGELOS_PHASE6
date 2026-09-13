import { Module } from '@nestjs/common';
import { DbMigrationController, DbMigrationService } from './db-migration.controller';

@Module({
  controllers: [DbMigrationController],
  providers: [DbMigrationService],
  exports: [DbMigrationService],
})
export class DbMigrationModule {}