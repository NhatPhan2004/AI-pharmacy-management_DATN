import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { LoginDto, RefreshTokenDto } from '@pharmacy/shared';

interface JwtPayload {
  sub: string;
  username: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // get password
  async login(dto: LoginDto) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .addSelect('user.password_hash')
      .where('user.username = :username', { username: dto.username })
      .getOne();

    // check password and status
    if (!user || !(await bcrypt.compare(dto.password, user.password_hash))) {
      throw new UnauthorizedException('Invalid username or password');
    }
    if (!user.is_active) {
      throw new UnauthorizedException('Account has been temporarily locked');
    }

    return this.generateTokens(user);
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'pharm_ai_refresh_secret',
      });
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
        relations: ['role'],
      });
      if (!user || !user.is_active) throw new UnauthorizedException();
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired refresh token. Please log in again to obtain a new token.',
      );
    }
  }

  private generateTokens(user: User) {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role.code,
    };
    const accessToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>('JWT_SECRET') ||
        'pharm_ai_access_secret',
      expiresIn: '1h',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        'pharm_ai_refresh_secret',
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role.code,
      },
    };
  }
}
