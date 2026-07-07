import type {Request} from 'express'
import type {UserRole} from '@/common/enums/user-role.enum'
export interface JwtPayload {
  sub: string
  username: string
  role: UserRole
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload
}
