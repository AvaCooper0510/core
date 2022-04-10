/*
 * @Author: Innei
 * @Date: 2020-11-24 16:20:37
 * @LastEditTime: 2021-03-21 18:13:17
 * @LastEditors: Innei
 * @FilePath: /server/apps/server/src/auth/roles.guard.ts
 * Mark: Coding with Love
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

import { AuthService } from '~/modules/auth/auth.service'
import { getNestExecutionContextRequest } from '~/transformers/get-req.transformer'

/**
 * 区分游客和主人的守卫
 */

@Injectable()
export class RolesGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private readonly authService: AuthService) {
    super(authService)
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    let isMaster = false
    const request = this.getRequest(context)
    const authorization = request.headers.authorization
    if (authorization) {
      try {
        isMaster = (await super.canActivate(context)) as boolean
      } catch {}
      if (!isMaster) {
        const [isValidToken, userModel] =
          await this.authService.verifyCustomToken(authorization as string)
        if (isValidToken) {
          request.user = userModel!
          isMaster = true
          return true
        }
      }
    }

    request.isGuest = !isMaster
    request.isMaster = isMaster
    return true
  }

  getRequest(context: ExecutionContext) {
    return getNestExecutionContextRequest(context)
  }
}
