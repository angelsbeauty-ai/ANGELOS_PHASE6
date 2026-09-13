import { Module } from '@nestjs/common';
import { DbMigrationController } from './db-migration.controller';

@Module({
  controllers: [DbMigrationController],
})
export class DbMigrationModule {}
