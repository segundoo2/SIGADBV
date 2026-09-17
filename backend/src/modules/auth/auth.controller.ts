import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseInterceptors,
  Body,
  Inject,
  Headers,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
  ApiHeader,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { IAuthController } from './interfaces/auth.controller.interface';
import type { IAuthService } from './interfaces/auth.service.interface';
import { SetCookiesInterceptor } from '../../common/interceptors/set-cookie.interceptor';
import type { IJwtPayloadWithExpiry } from './interfaces/jwt-payload.interface';
import { EAuthSuccess } from '../../common/enum/auth-success.enum';
import { LoginDto } from './dtos/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtRefreshGuard } from '../../common/guards/jwt-refresh.guard';
import { IResponse } from '../../common/interfaces/response.interface';
import { ITokens } from './interfaces/token.interface';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController implements IAuthController {
  constructor(
    @Inject('IAuthService') private readonly authService: IAuthService,
  ) {}

  @Post()
  @Public()
  @UseInterceptors(SetCookiesInterceptor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Realiza a autenticação do usuário' })
  @ApiBody({ type: LoginDto })
  @ApiHeader({
    name: 'x-tenant-slug',
    required: true,
    description: 'Slug do tenant extraído do subdomínio',
    example: 'empresa-abc',
  })
  @ApiHeader({
    name: 'x-device-id',
    required: false,
    description: 'ID único do hardware do dispositivo móvel (Flutter)',
    example: 'uuid-1234-5678-9101',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login efetuado com sucesso e tokens gerados.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuário não encontrado.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Senha incorreta ou cabeçalho x-tenant-slug ausente.',
  })
  async login(
    @Headers('x-tenant-slug') tenantSlug: string | undefined,
    @Headers('x-device-id') deviceId: string | undefined,
    @Headers('user-agent') userAgent: string | undefined,
    @Body() loginDto: LoginDto,
  ): Promise<IResponse<ITokens> & { mustChangePassword }> {
    if (!tenantSlug) {
      throw new BadRequestException('O cabeçalho x-tenant-slug é obrigatório.');
    }

    const fingerprint = deviceId || userAgent || 'unknown';

    return await this.authService.login(
      { ...loginDto, slug: tenantSlug },
      fingerprint,
    );
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(SetCookiesInterceptor)
  @ApiCookieAuth('refresh_token')
  @ApiHeader({
    name: 'x-device-id',
    required: false,
    description: 'ID único do hardware do dispositivo móvel (Flutter)',
    example: 'uuid-1234-5678-9101',
  })
  @ApiOperation({
    summary: 'Renova os tokens de acesso a partir do cookie de refresh',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tokens renovados com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Refresh token inválido, expirado ou dispositivo divergente.',
  })
  async refresh(
    @CurrentUser() userPayload: IJwtPayloadWithExpiry,
    @Headers('x-device-id') deviceId: string | undefined,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<ITokens> {
    const fingerprint = deviceId || userAgent || 'unknown';

    return await this.authService.refresh(userPayload, fingerprint);
  }

  @Post('logout')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refresh_token')
  @ApiOperation({
    summary:
      'Invalida a sessão removendo os cookies de autenticação e revogando o token',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logout realizado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Não autorizado.',
  })
  async logout(
    @CurrentUser() userPayload: IJwtPayloadWithExpiry,
    @Res() res: Response,
  ): Promise<Response> {
    await this.authService.logout(userPayload);

    const isProd = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict' as const,
    };

    res.clearCookie('access_token', {
      ...cookieOptions,
      path: '/',
    });
    res.clearCookie('refresh_token', {
      ...cookieOptions,
      path: '/auth',
    });

    return res.json({ message: EAuthSuccess.LOGOUT });
  }
}
