import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { sql } from 'kysely';
import { CONFIG, Config } from '../config';
import { DB, Db } from '../db/database.module';

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  userId: string;
}

export interface DeviceInfo {
  deviceName?: string;
  platform?: 'ios' | 'android' | 'web';
}

const hash = (token: string) => createHash('sha256').update(token).digest();
const newRefreshToken = () => randomBytes(32).toString('base64url');

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB) private readonly db: Db,
    @Inject(CONFIG) private readonly config: Config,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Local development only: sign in as a seeded user by email, no password.
   * Disabled (404) unless DEV_LOGIN_ENABLED=true. Apple / Google / email-code
   * sign-in replace this before any real users exist.
   */
  async devLogin(email: string, device: DeviceInfo): Promise<SessionTokens> {
    if (!this.config.DEV_LOGIN_ENABLED) throw new NotFoundException();
    const { rows } = await sql<{ id: string }>`
      select id from users where email = ${email} and status = 'active'
    `.execute(this.db);
    if (!rows[0]) throw new UnauthorizedException('Unknown test user');
    return this.startSession(rows[0].id, device);
  }

  /** Exchanges a refresh token for a new pair; the old refresh token stops working. */
  async refresh(refreshToken: string): Promise<SessionTokens> {
    const next = newRefreshToken();
    const { rows } = await sql<{ id: string; user_id: string }>`
      update sessions s
         set refresh_token_hash = ${hash(next)}, last_used_at = now()
        from users u
       where s.refresh_token_hash = ${hash(refreshToken)}
         and s.revoked_at is null
         and s.expires_at > now()
         and u.id = s.user_id
         and u.status = 'active'
      returning s.id, s.user_id
    `.execute(this.db);
    const session = rows[0];
    if (!session) throw new UnauthorizedException('Invalid refresh token');
    return {
      accessToken: await this.signAccessToken(session.user_id, session.id),
      refreshToken: next,
      userId: session.user_id,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await sql`
      update sessions set revoked_at = now()
       where refresh_token_hash = ${hash(refreshToken)} and revoked_at is null
    `.execute(this.db);
  }

  private async startSession(userId: string, device: DeviceInfo): Promise<SessionTokens> {
    const refreshToken = newRefreshToken();
    const { rows } = await sql<{ id: string }>`
      insert into sessions (user_id, refresh_token_hash, device_name, platform, expires_at)
      values (${userId}, ${hash(refreshToken)}, ${device.deviceName ?? null}, ${device.platform ?? null},
              now() + make_interval(days => ${this.config.REFRESH_TOKEN_TTL_DAYS}::int))
      returning id
    `.execute(this.db);
    await sql`update users set last_seen_at = now() where id = ${userId}`.execute(this.db);
    return {
      accessToken: await this.signAccessToken(userId, rows[0].id),
      refreshToken,
      userId,
    };
  }

  private signAccessToken(userId: string, sessionId: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, sid: sessionId },
      { secret: this.config.JWT_SECRET, expiresIn: this.config.ACCESS_TOKEN_TTL_SECONDS, algorithm: 'HS256' },
    );
  }
}
