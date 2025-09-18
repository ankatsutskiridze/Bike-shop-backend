import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto) {
    const exists = await this.usersRepo.findOne({
      where: { email: dto.email },
    });
    if (exists) throw new BadRequestException('Email already registered');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({ ...dto, password: hashed });
    return this.usersRepo.save(user);
  }

  findAll() {
    return this.usersRepo.find({
      select: ['id', 'name', 'email', 'createdAt'],
    });
  }

  async findOne(id: number) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const { password, ...rest } = user as any;
    return rest;
  }

  async findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }

  async update(id: number, dto: UpdateUserDto) {
    if (dto.password) dto.password = await bcrypt.hash(dto.password, 10);
    await this.usersRepo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.usersRepo.delete(id);
    return { deleted: true };
  }
}
