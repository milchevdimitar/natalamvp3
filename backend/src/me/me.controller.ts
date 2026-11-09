import { Controller, Get, Inject, NotFoundException, Param } from '@nestjs/common';
import { sql } from 'kysely';
import { z } from 'zod';
import { AuthUser, CurrentUser } from '../auth/auth.guard';
import { parse } from '../common/validation';
import { DB, Db } from '../db/database.module';

interface MeRow {
  id: string;
  username: string | null;
  displayName: string;
  locale: string;
  timezone: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  streakAlive: boolean;
}

@Controller('me')
export class MeController {
  constructor(@Inject(DB) private readonly db: Db) {}

  /** GET /v1/me — profile basics + discovery streak */
  @Get()
  async me(@CurrentUser() user: AuthUser) {
    const { rows } = await sql<MeRow>`
      select p.id, p.username, p.display_name as "displayName", p.locale, p.timezone,
             coalesce(s.current_streak, 0)  as "currentStreak",
             coalesce(s.longest_streak, 0)  as "longestStreak",
             s.last_active_date             as "lastActiveDate",
             coalesce(s.last_active_date >= (now() at time zone p.timezone)::date - 1, false) as "streakAlive"
        from profiles p
        left join streaks s on s.user_id = p.id
       where p.id = ${user.id}
    `.execute(this.db);
    const me = rows[0];
    if (!me) throw new NotFoundException('Profile not found');
    const { currentStreak, longestStreak, lastActiveDate, streakAlive, ...profile } = me;
    return {
      ...profile,
      // a streak broken by a missed day reads as 0 until the next gift is opened
      streak: { current: streakAlive ? currentStreak : 0, longest: longestStreak, lastActiveDate },
    };
  }

  /** GET /v1/me/results/:system — the user's own result for a lens, or null */
  @Get('results/:system')
  async result(@CurrentUser() user: AuthUser, @Param('system') system: string) {
    const key = parse(z.string().regex(/^[a-z_]{2,32}$/), system);
    const { rows } = await sql<{ summary: string; data: unknown; visibility: string; computedAt: string }>`
      select summary, data, visibility, computed_at as "computedAt"
        from system_results
       where user_id = ${user.id} and system_key = ${key}
    `.execute(this.db);
    return { result: rows[0] ?? null };
  }
}
