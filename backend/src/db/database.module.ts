import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool, types } from 'pg';
import { CONFIG, Config } from '../config';

export const DB = Symbol('DB');

/**
 * Untyped for now: queries use Kysely's `sql` template with explicit row types.
 * Next step: `npx kysely-codegen --out-file src/db/types.ts` against the local
 * database and switch this to `Kysely<DB>` for fully typed query building.
 */
export type Db = Kysely<any>;

// Return `date` columns as 'YYYY-MM-DD' strings (no timezone shifting)
types.setTypeParser(1082, (v) => v);
// Return `numeric` as JS numbers (scores, percentages)
types.setTypeParser(1700, (v) => parseFloat(v));

@Global()
@Module({
  providers: [
    {
      provide: DB,
      inject: [CONFIG],
      useFactory: (config: Config): Db =>
        new Kysely<any>({
          dialect: new PostgresDialect({
            pool: new Pool({ connectionString: config.DATABASE_URL, max: 10 }),
          }),
        }),
    },
  ],
  exports: [DB],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(DB) private readonly db: Db) {}

  async onApplicationShutdown() {
    await this.db.destroy();
  }
}
