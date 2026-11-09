import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { z } from 'zod';
import { parse } from '../common/validation';
import { AuthService } from './auth.service';
import { Public } from './auth.guard';

const device = {
  deviceName: z.string().max(100).optional(),
  platform: z.enum(['ios', 'android', 'web']).optional(),
};
const DevLoginBody = z.object({ email: z.string().email(), ...device });
const RefreshBody = z.object({ refreshToken: z.string().min(20).max(200) });

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** POST /v1/auth/dev { email } — local development sign-in as a seeded user */
  @Public()
  @Post('dev')
  devLogin(@Body() body: unknown) {
    const { email, ...info } = parse(DevLoginBody, body);
    return this.auth.devLogin(email, info);
  }

  /** POST /v1/auth/refresh { refreshToken } → new access + refresh token */
  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() body: unknown) {
    return this.auth.refresh(parse(RefreshBody, body).refreshToken);
  }

  /** POST /v1/auth/logout { refreshToken } */
  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(@Body() body: unknown) {
    await this.auth.logout(parse(RefreshBody, body).refreshToken);
  }
}
