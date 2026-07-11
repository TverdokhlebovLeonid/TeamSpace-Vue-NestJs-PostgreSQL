import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger'
import {CurrentUser} from '@/common/decorators/current-user.decorator'
import {Roles} from '@/common/decorators/roles.decorator'
import {UserRole} from '@/common/enums/user-role.enum'
import {ChangePasswordDto, MessageResponseDto} from '@/modules/users/dto/change-password.dto'
import {ContactDto} from '@/modules/users/dto/contact.dto'
import {CreateUserDto} from '@/modules/users/dto/create-user.dto'
import {UpdateProfileDto} from '@/modules/users/dto/update-profile.dto'
import {UpdateRoleDto} from '@/modules/users/dto/update-role.dto'
import {UpdateUserDto} from '@/modules/users/dto/update-user.dto'
import {UserDto} from '@/modules/users/dto/user.dto'
import {UsersService} from '@/modules/users/users.service'

@ApiTags('users')
@ApiBearerAuth()
@Controller('auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({summary: 'Get the current authenticated user'})
  @ApiOkResponse({type: UserDto})
  async me(@CurrentUser('sub') userId: string): Promise<UserDto> {
    const user = await this.usersService.getByIdOrThrow(userId)
    return UserDto.fromEntity(user)
  }

  @Patch('me')
  @ApiOperation({summary: 'Update the current user profile'})
  @ApiOkResponse({type: UserDto})
  async updateMe(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateProfileDto
  ): Promise<UserDto> {
    const user = await this.usersService.updateProfile(userId, dto)
    return UserDto.fromEntity(user)
  }

  @Post('me/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({summary: 'Change the current user password'})
  @ApiOkResponse({type: MessageResponseDto})
  async changePassword(
    @CurrentUser('sub') userId: string,
    @Body() dto: ChangePasswordDto
  ): Promise<MessageResponseDto> {
    await this.usersService.changePassword(userId, dto)
    return {detail: 'Password updated.'}
  }

  @Get('contacts')
  @ApiOperation({summary: 'List other users (to start chats / build groups)'})
  @ApiOkResponse({type: [ContactDto]})
  async contacts(@CurrentUser('sub') userId: string): Promise<ContactDto[]> {
    const users = await this.usersService.findContacts(userId)
    return users.map((user) => ContactDto.fromEntity(user))
  }

  @Get('users')
  @Roles(UserRole.ADMIN)
  @ApiOperation({summary: 'List all users (admin only)'})
  @ApiOkResponse({type: [UserDto]})
  async list(): Promise<UserDto[]> {
    const users = await this.usersService.findAll()
    return users.map((user) => UserDto.fromEntity(user))
  }

  @Post('users')
  @Roles(UserRole.ADMIN)
  @ApiOperation({summary: 'Create a user (admin only)'})
  @ApiCreatedResponse({type: UserDto})
  async create(@Body() dto: CreateUserDto): Promise<UserDto> {
    const user = await this.usersService.create(dto)
    return UserDto.fromEntity(user)
  }

  @Patch('users/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({summary: 'Update a user (admin only)'})
  @ApiOkResponse({type: UserDto})
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('sub') requesterId: string
  ): Promise<UserDto> {
    const user = await this.usersService.updateByAdmin(id, dto, requesterId)
    return UserDto.fromEntity(user)
  }

  @Patch('users/:id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({summary: 'Change a user role, e.g. promote to admin (admin only)'})
  @ApiOkResponse({type: UserDto})
  async changeRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser('sub') requesterId: string
  ): Promise<UserDto> {
    const user = await this.usersService.changeRole(id, dto.role, requesterId)
    return UserDto.fromEntity(user)
  }

  @Delete('users/:id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({summary: 'Delete a user (admin only)'})
  @ApiNoContentResponse()
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser('sub') requesterId: string
  ): Promise<void> {
    await this.usersService.remove(id, requesterId)
  }
}
