import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';

/**
 * Turns every error into a JSON response. Postgres errors raised by the
 * schema's business rules (SQLSTATE P0001, e.g. "dating requires consent")
 * become 400s with their message; anything unexpected becomes a 500.
 */
@Catch()
export class ErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger('Error');

  catch(error: unknown, host: ArgumentsHost) {
    const reply = host.switchToHttp().getResponse();

    if (error instanceof HttpException) {
      const body = error.getResponse();
      const status = error.getStatus();
      return reply
        .code(status)
        .send(typeof body === 'string' ? { statusCode: status, message: body } : { statusCode: status, ...body });
    }

    const pg = error as { code?: string; message?: string };
    const mapped: Record<string, [number, string | undefined]> = {
      P0001: [400, pg.message], // business rule raised in SQL
      '23505': [409, 'Already exists'],
      '23503': [400, 'Referenced item does not exist'],
      '22P02': [400, 'Invalid id or value'],
      '23514': [400, 'Value out of range'],
    };
    if (pg.code && mapped[pg.code]) {
      const [status, message] = mapped[pg.code];
      return reply.code(status).send({ statusCode: status, message });
    }

    this.logger.error(error instanceof Error ? error.stack : String(error));
    return reply.code(500).send({ statusCode: 500, message: 'Internal server error' });
  }
}
