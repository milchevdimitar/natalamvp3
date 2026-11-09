import { Body, Controller, Get, Inject, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { sql } from 'kysely';
import { z } from 'zod';
import { AuthUser, CurrentUser } from '../auth/auth.guard';
import { parse, uuid } from '../common/validation';
import { DB, Db } from '../db/database.module';

const SubmissionBody = z.object({
  answers: z
    .array(z.object({ questionId: uuid, value: z.number().int().min(1).max(7) }))
    .min(1)
    .max(200),
});

export interface TestResult {
  type: string;
  dimensions: Record<string, { score: number; pct: number }>;
}

@Controller('tests')
export class TestsController {
  constructor(@Inject(DB) private readonly db: Db) {}

  /**
   * GET /v1/tests/:system?locale=bg — the active questionnaire for a lens.
   * Prefers the requested locale, falls back to any active version.
   * Dimensions and directions stay on the server: scoring happens there.
   */
  @Get(':system')
  async get(@Param('system') system: string, @Query('locale') locale?: string) {
    const key = parse(z.string().regex(/^[a-z_]{2,32}$/), system);
    const { rows } = await sql<{ id: string; title: string; locale: string; scalePoints: number }>`
      select id, title, locale, scale_points as "scalePoints"
        from test_definitions
       where system_key = ${key} and is_active
       order by (locale = ${locale ?? 'en'}) desc, version desc
       limit 1
    `.execute(this.db);
    const test = rows[0];
    if (!test) throw new NotFoundException('No active test for this system');

    const { rows: questions } = await sql<{ id: string; position: number; text: string }>`
      select id, position, text from test_questions where test_id = ${test.id} order by position
    `.execute(this.db);
    return { ...test, questions };
  }

  /**
   * POST /v1/tests/:testId/submissions { answers: [{ questionId, value }] }
   * Stores the attempt and its answers, scores it and saves the result — all
   * in one transaction, so a failed request leaves nothing half-written.
   */
  @Post(':testId/submissions')
  async submit(@CurrentUser() user: AuthUser, @Param('testId') testIdParam: string, @Body() body: unknown) {
    const testId = parse(uuid, testIdParam);
    const { answers } = parse(SubmissionBody, body);
    // one answer per question; if the client sent a question twice, the last value wins
    const latest = new Map(answers.map((a) => [a.questionId, a.value]));
    const rows = [...latest].map(([question_id, value]) => ({ question_id, value }));

    return this.db.transaction().execute(async (trx) => {
      const { rows: created } = await sql<{ id: string }>`
        insert into test_attempts (user_id, test_id) values (${user.id}, ${testId}) returning id
      `.execute(trx);
      const attemptId = created[0].id;

      // Only answers to this test's own questions are stored.
      await sql`
        insert into test_answers (attempt_id, question_id, value)
        select ${attemptId}::uuid, a.question_id, a.value
          from jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) as a(question_id uuid, value smallint)
          join test_questions q on q.id = a.question_id and q.test_id = ${testId}::uuid
      `.execute(trx);

      const { rows: scored } = await sql<{ result: TestResult }>`
        select complete_test_attempt(${user.id}::uuid, ${attemptId}::uuid) as result
      `.execute(trx);
      return scored[0].result;
    });
  }
}
