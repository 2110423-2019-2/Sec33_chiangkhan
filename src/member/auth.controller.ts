import { Controller, Post, Body, UseInterceptors, ValidationPipe, ForbiddenException, HttpStatus, Get } from '@nestjs/common';
import { MemberService } from './member.service';
import { CookieInterceptor, CookieClearerInterceptor } from '../interceptor/cookie.interceptor';
import { AuthenticationDto } from './dto/auth.dto';
import { EntityNotFoundError } from "typeorm/error/EntityNotFoundError";


@Controller('auth')
export class AuthenticationController {

  constructor(
    private readonly memberService: MemberService,
  ) { }

  @Post('login')
  @UseInterceptors(CookieInterceptor)
  async login(
    @Body(new ValidationPipe()) authDto: AuthenticationDto,
  ): Promise<string> {
    try {
      return await this.memberService.loginService(authDto.username, authDto.password);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        throw new ForbiddenException('invalid username or password', `${HttpStatus.FORBIDDEN}`)
      }
    }
  }

  @Get('logout')
  @UseInterceptors(CookieClearerInterceptor)
  logout() { }
}
