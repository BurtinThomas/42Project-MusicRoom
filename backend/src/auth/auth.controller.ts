import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { GoogleLoginDto, FacebookLoginDto } from './dto/social-login.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

const AUTH_THROTTLE_LIMIT = Number(process.env.THROTTLE_AUTH_LIMIT) || 5;

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: 60_000 } })
  @UseGuards(LocalAuthGuard)
  @ApiBody({ type: LoginDto })
  @Post('login')
  async login(@Req() req: any) {
    return this.authService.issueTokens(req.user);
  }

  @Public()
  @Post('resend-verification')
  resendVerification(@Body() dto: ForgotPasswordDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Public()
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Public()
  @Throttle({ default: { limit: AUTH_THROTTLE_LIMIT, ttl: 60_000 } })
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('google')
  async loginGoogle(@Body() dto: GoogleLoginDto) {
    const user = await this.authService.loginWithGoogle(dto.idToken);
    return this.authService.issueTokens(user);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('facebook')
  async loginFacebook(@Body() dto: FacebookLoginDto) {
    const user = await this.authService.loginWithFacebook(dto.accessToken);
    return this.authService.issueTokens(user);
  }

  @ApiBearerAuth()
  @Post('link/google')
  linkGoogle(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GoogleLoginDto,
  ) {
    return this.authService.linkGoogle(user.id, dto.idToken);
  }

  @ApiBearerAuth()
  @Post('link/facebook')
  linkFacebook(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: FacebookLoginDto,
  ) {
    return this.authService.linkFacebook(user.id, dto.accessToken);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refreshToken);
    return { message: 'Logged out' };
  }
}
