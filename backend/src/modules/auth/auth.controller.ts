import {Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {Throttle} from '@nestjs/throttler'
import {
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger'
import type {Request, Response} from 'express'
import {
  clearAuthCookies,
  durationToMs,
  generateCsrfToken,
  REFRESH_COOKIE,
  setAuthCookies
} from '@/common/auth-cookies'
import {Public} from '@/common/decorators/public.decorator'
import {CsrfGuard} from '@/common/guards/csrf.guard'
import type {AppConfig, JwtConfig} from '@/config/configuration'
import {AuthService} from '@/modules/auth/auth.service'
import {AccessTokenDto, type TokensDto} from '@/modules/auth/dto/tokens.dto'
import {LoginDto} from '@/modules/auth/dto/login.dto'

@ApiTags('auth')
@Controller('auth/jwt')
export class AuthController {
  private readonly refreshMaxAgeMs: number
  private readonly secureCookies: boolean

  constructor(
    private readonly authService: AuthService,
    configService: ConfigService
  ) {
    this.refreshMaxAgeMs = durationToMs(configService.getOrThrow<JwtConfig>('jwt').refreshTtl)
    this.secureCookies = configService.getOrThrow<AppConfig>('app').isProduction
  }

  @Public()
  @Post('create')
  @HttpCode(HttpStatus.OK)
  @Throttle({default: {limit: 10, ttl: 60_000}})
  @ApiOperation({
    summary: 'Log in: returns the access token and sets the refresh/CSRF cookies'
  })
  @ApiOkResponse({type: AccessTokenDto})
  async login(
    @Body() dto: LoginDto,
    @Res({passthrough: true}) res: Response
  ): Promise<AccessTokenDto> {
    const tokens = await this.authService.login(dto)
    this.issueCookies(res, tokens)
    return {access: tokens.access}
  }

  @Public()
  @UseGuards(CsrfGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({default: {limit: 30, ttl: 60_000}})
  @ApiCookieAuth(REFRESH_COOKIE)
  @ApiOperation({
    summary: 'Rotate tokens using the refresh cookie (requires X-CSRF-Token header)'
  })
  @ApiOkResponse({type: AccessTokenDto})
  async refresh(
    @Req() req: Request,
    @Res({passthrough: true}) res: Response
  ): Promise<AccessTokenDto> {
    const cookies = req.cookies as Record<string, string | undefined> | undefined
    const refreshToken = cookies?.[REFRESH_COOKIE] ?? ''
    const tokens = await this.authService.refresh(refreshToken)
    this.issueCookies(res, tokens)
    return {access: tokens.access}
  }

  @Public()
  @UseGuards(CsrfGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiCookieAuth(REFRESH_COOKIE)
  @ApiOperation({summary: 'Log out: clears the refresh/CSRF cookies'})
  @ApiNoContentResponse()
  logout(@Res({passthrough: true}) res: Response): void {
    clearAuthCookies(res, this.secureCookies)
  }

  private issueCookies(res: Response, tokens: TokensDto): void {
    setAuthCookies({
      res,
      refreshToken: tokens.refresh,
      csrfToken: generateCsrfToken(),
      maxAgeMs: this.refreshMaxAgeMs,
      secure: this.secureCookies
    })
  }
}
