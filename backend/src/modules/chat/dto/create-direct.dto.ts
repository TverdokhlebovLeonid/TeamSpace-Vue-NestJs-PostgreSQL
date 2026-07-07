import {ApiProperty} from '@nestjs/swagger'
import {IsUUID} from 'class-validator'
export class CreateDirectDto {
  @ApiProperty({format: 'uuid', description: 'The other participant of the 1:1 conversation'})
  @IsUUID('4')
  userId!: string
}
