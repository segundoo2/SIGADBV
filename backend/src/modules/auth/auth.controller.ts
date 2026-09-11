import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  Body,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
  ApiHeader,
} from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { IAuthController } from './interfaces/auth.controller.interface';
import type { IAuthService } from './interfaces/auth.service.interface';
import { IAuthPayload } from './interfaces/auth-payload.interface';
import { AuthGuard } from '@nestjs/passport';
import { SetCookiesInterceptor } from '../../common/interceptors/set-cookie.interceptor';
import { IJwtPayloadWithExpiry } from './interfaces/jwt-payload.interface';
import type { RequestWithCookies } from './interfaces/req-with-cookies.interface';
import { EAuthSuccess } from '../../common/enum/auth-success.enum';
import { LoginDto } from './dtos/login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController implements IAuthController {
  constructor(
    @Inject('IAuthService') private readonly authService: IAuthService,
  ) {}

  @Post()
  @UseInterceptors(SetCookiesInterceptor)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Realiza a autenticação do usuário' })
  @ApiBody({ type: LoginDto })
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
    description: 'Senha incorreta.',
  })
  async login(
    @Req() req: Request,
    @Body() loginDto: LoginDto,
  ): Promise<IAuthPayload> {
    const fingerprint =
      (req.headers['x-device-id'] as string) ||
      (req.headers['user-agent'] as string) ||
      'unknown';

    return await this.authService.login(loginDto, fingerprint);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt-refresh'))
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
  async refresh(@Req() req: RequestWithCookies): Promise<IAuthPayload> {
    const userPayload = req.user as IJwtPayloadWithExpiry;

    const fingerprint =
      (req.headers['x-device-id'] as string) ||
      (req.headers['user-agent'] as string) ||
      'unknown';

    return await this.authService.refresh(userPayload, fingerprint);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt-refresh'))
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
    @Req() req: RequestWithCookies,
    @Res() res: Response,
  ): Promise<Response> {
    const userPayload = req.user as IJwtPayloadWithExpiry;

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
