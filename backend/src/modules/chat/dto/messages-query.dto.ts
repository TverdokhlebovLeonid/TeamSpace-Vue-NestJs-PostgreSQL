import {ApiPropertyOptional} from '@nestjs/swagger'
import {IsInt, IsOptional, IsUUID, Max, Min} from 'class-validator'
export class MessagesQueryDto {
  @ApiPropertyOptional({minimum: 1, maximum: 100, default: 30})
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Return messages created strictly before this message id (cursor pagination)'
  })
  @IsOptional()
  @IsUUID('4')
  before?: string
}
