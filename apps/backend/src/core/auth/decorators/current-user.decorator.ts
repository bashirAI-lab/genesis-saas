import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract the current authenticated user from the request.
 *
 * Usage:
 *   @Get('profile')
 *   async getProfile(@CurrentUser() user: JwtPayload) {
 *     return user;
 *   }
 *
 *   // Extract a specific property:
 *   @Get('my-id')
 *   async getMyId(@CurrentUser('userId') userId: string) {
 *     return userId;
 *   }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);
