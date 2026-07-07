import {ApiProperty} from '@nestjs/swagger'
export class TokensDto {
  access!: string
  refresh!: string
}

export class AccessTokenDto {
  @ApiProperty({description: 'Short-lived JWT access token (store in memory only)'})
  access!: string
}
