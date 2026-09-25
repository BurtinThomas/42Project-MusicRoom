import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MessageDto } from '../common/dto/message.dto';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AuthService } from './auth.service';
import { EmailDto } from './dto/email.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleLoginDto } from './dto/social-login.dto';
import { TokenPairDto } from './dto/token-pair.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

const AUTH_THROTTLE_LIMIT = Number(process.env.THROTTLE_AUTH_LIMIT) || 5;
const authThrottle = { default: { limit: AUTH_THROTTLE_LIMIT, ttl: 60_000 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle(authThrottle)
  @Post('register')
  @ApiCreatedResponse({
    type: MessageDto,
    description: 'Account created; a verification code is emailed',
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Throttle(authThrottle)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiBody({ type: LoginDto })
  @ApiCreatedResponse({
    type: TokenPairDto,
    description: '403 EMAIL_NOT_VERIFIED until the email is verified',
  })
  login(@Req() req: any) {
    return this.authService.issueTokens(req.user);
  }

  @Public()
  @Throttle(authThrottle)
  @Post('resend-verification')
  @ApiCreatedResponse({ type: MessageDto })
  resendVerification(@Body() dto: EmailDto) {
    return this.authService.resendVerification(dto.email);
  }

  @Public()
  @Post('verify-email')
  @ApiCreatedResponse({ type: MessageDto })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Public()
  @Get('verify-email')
  @ApiOkResponse({
    type: MessageDto,
    description: 'Same as POST, used by the link in the verification email',
  })
  verifyEmailFromLink(@Query() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Public()
  @Throttle(authThrottle)
  @Post('forgot-password')
  @ApiCreatedResponse({
    type: MessageDto,
    description: 'Emails a reset code if the account exists',
  })
  forgotPassword(@Body() dto: EmailDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @ApiCreatedResponse({ type: MessageDto })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Public()
  @Throttle(authThrottle)
  @Post('google')
  @ApiCreatedResponse({
    type: TokenPairDto,
    description: 'Signs in (or signs up) with a Google ID token',
  })
  async loginGoogle(@Body() dto: GoogleLoginDto) {
    const user = await this.authService.loginWithGoogle(dto.idToken);
    return this.authService.issueTokens(user);
  }

  @ApiBearerAuth()
  @Post('link/google')
  @ApiCreatedResponse({
    type: MessageDto,
    description: 'Links a Google account to the logged-in user',
  })
  linkGoogle(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GoogleLoginDto,
  ) {
    return this.authService.linkGoogle(user.id, dto.idToken);
  }

  @Public()
  @Post('refresh')
  @ApiCreatedResponse({
    type: TokenPairDto,
    description: 'The refresh token is single-use: a new pair is returned',
  })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  @ApiCreatedResponse({ type: MessageDto })
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refreshToken);
    return { message: 'Logged out' };
  }
}
