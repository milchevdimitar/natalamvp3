import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { CONFIG, Config } from '../config';

export interface AuthUser {
  id: string;
  sessionId: string;
}

const IS_PUBLIC = 'isPublic';
/** Marks a route as reachable without an access token. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** The signed-in user, taken from the verified access token (never from the body). */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user,
);

/** Registered globally: every route requires a valid access token unless marked @Public(). */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    @Inject(CONFIG) private readonly config: Config,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers['authorization'];
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Missing access token');

    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; sid: string }>(header.slice(7), {
        secret: this.config.JWT_SECRET,
        algorithms: ['HS256'],
      });
      req.user = { id: payload.sub, sessionId: payload.sid } satisfies AuthUser;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
