import {ApiProperty} from '@nestjs/swagger'
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsString,
  IsUUID,
  MaxLength,
  MinLength
} from 'class-validator'

export class CreateGroupDto {
  @ApiProperty({minLength: 1, maxLength: 150, example: 'Project Falcon'})
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  title!: string

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'User ids to add as members (the creator is added automatically)',
    example: []
  })
  @IsArray()
  @ArrayMaxSize(200)
  @ArrayUnique()
  @IsUUID('4', {each: true})
  memberIds!: string[]
}
