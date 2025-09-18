import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) throw new BadRequestException('Invalid credentials');
    return this.authService.login(user);
  }

  // optionally allow register here or use /users/register
  @Post('register')
  async register(
    @Body() dto: { name: string; email: string; password: string },
  ) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new BadRequestException('Email exists');
    const user = await this.usersService.create(dto);
    const { password, ...rest } = user as any;
    return rest;
  }
}
