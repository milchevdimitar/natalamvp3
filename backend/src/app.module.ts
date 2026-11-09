import { Controller, Get, Inject, Module } from '@nestjs/common';
import { sql } from 'kysely';
import { AuthModule } from './auth/auth.module';
import { Public } from './auth/auth.guard';
import { ConfigModule } from './config';
import { DailyController } from './daily/daily.controller';
import { DB, Db, DatabaseModule } from './db/database.module';
import { MeController } from './me/me.controller';
import { TestsController } from './tests/tests.controller';

@Controller('health')
class HealthController {
  constructor(@Inject(DB) private readonly db: Db) {}

  /** GET /v1/health — API up and database reachable */
  @Public()
  @Get()
  async health() {
    await sql`select 1`.execute(this.db);
    return { ok: true };
  }
}

@Module({
  imports: [ConfigModule, DatabaseModule, AuthModule],
  controllers: [HealthController, MeController, DailyController, TestsController],
})
export class AppModule {}
