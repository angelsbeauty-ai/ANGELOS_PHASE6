import { Controller, Post, Req, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { createServiceSupabaseClient } from '../config/supabase';
import { Inject, Injectable, Module } from '@nestjs/common';

@Injectable()
export class DbExecutorService {
  private supabase = createServiceSupabaseClient();
}

@Controller('db')
export class DbExecutorController {
  constructor(private readonly dbExecutorService: DbExecutorService) {}
}

@Module({
  controllers: [DbExecutorController],
  providers: [DbExecutorService],
})
export class DbrexecModule {}
