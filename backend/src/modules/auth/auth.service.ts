import {Injectable, UnauthorizedException} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {JwtService, type JwtSignOptions} from '@nestjs/jwt'
import type {JwtConfig} from '@/config/configuration'
import type {JwtPayload} from '@/common/types/authenticated-request'
import {LoginDto} from '@/modules/auth/dto/login.dto'
import {TokensDto} from '@/modules/auth/dto/tokens.dto'
import {User} from '@/modules/users/user.entity'
import {UsersService} from '@/modules/users/users.service'

@Injectable()
export class AuthService {
  private readonly jwtConfig: JwtConfig

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    configService: ConfigService
  ) {
    this.jwtConfig = configService.getOrThrow<JwtConfig>('jwt')
  }

  async login(dto: LoginDto): Promise<TokensDto> {
    const user = await this.usersService.findByUsername(dto.username)
    if (!user || !(await this.usersService.verifyPassword(user, dto.password))) {
      throw new UnauthorizedException('Invalid username or password.')
    }
    return this.issueTokens(user)
  }

  async refresh(refreshToken: string): Promise<TokensDto> {
    let payload: JwtPayload
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.jwtConfig.refreshSecret
      })
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.')
    }
    const user = await this.usersService.findById(payload.sub)
    if (!user) throw new UnauthorizedException('User no longer exists.')
    return this.issueTokens(user)
  }

  private async issueTokens(user: User): Promise<TokensDto> {
    const payload: JwtPayload = {sub: user.id, username: user.username, role: user.role}
    const accessTtl = this.jwtConfig.accessTtl as JwtSignOptions['expiresIn']
    const refreshTtl = this.jwtConfig.refreshTtl as JwtSignOptions['expiresIn']
    const [access, refresh] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.jwtConfig.accessSecret,
        expiresIn: accessTtl
      }),
      this.jwtService.signAsync(payload, {
        secret: this.jwtConfig.refreshSecret,
        expiresIn: refreshTtl
      })
    ])
    return {access, refresh}
  }
}
