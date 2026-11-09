import { Controller, Inject, Param, Post } from '@nestjs/common';
import { sql } from 'kysely';
import { z } from 'zod';
import { AuthUser, CurrentUser } from '../auth/auth.guard';
import { parse } from '../common/validation';
import { DB, Db } from '../db/database.module';

const Kind = z.enum(['tarot', 'fortune', 'sky']);

@Controller('daily')
export class DailyController {
  constructor(@Inject(DB) private readonly db: Db) {}

  /**
   * POST /v1/daily/:kind/open — today's tarot card / fortune / sky text.
   * Same result all day in the user's timezone; opening also extends the streak.
   */
  @Post(':kind/open')
  async open(@CurrentUser() user: AuthUser, @Param('kind') kindParam: string) {
    const kind = parse(Kind, kindParam);
    const { rows } = await sql<{ id: string; kind: string; key: string; title: string; body: string; meta: unknown }>`
      select id, kind, key, title, body, meta
        from open_daily_gift(${user.id}::uuid, ${kind}::daily_kind)
    `.execute(this.db);
    return rows[0];
  }
}
