import {Controller, Get, HttpStatus, Res} from '@nestjs/common'
import type {Response} from 'express'
import {ApiOkResponse, ApiOperation, ApiServiceUnavailableResponse, ApiTags} from '@nestjs/swagger'
import {InjectDataSource} from '@nestjs/typeorm'
import {DataSource} from 'typeorm'
import {Public} from '@/common/decorators/public.decorator'
import {HealthDto} from '@/modules/health/health.dto'

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  @Public()
  @Get(['health', 'auth/health'])
  @ApiOperation({summary: 'Service and database health check'})
  @ApiOkResponse({type: HealthDto})
  @ApiServiceUnavailableResponse({type: HealthDto})
  async check(@Res() res: Response): Promise<void> {
    try {
      await this.dataSource.query('SELECT 1')
    } catch {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({status: 'error', database: 'unavailable'})
      return
    }
    res.status(HttpStatus.OK).json({status: 'ok', database: 'ok'})
  }
}
