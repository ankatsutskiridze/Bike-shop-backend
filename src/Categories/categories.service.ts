import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Category) private repo: Repository<Category>) {}

  create(dto: CreateCategoryDto) {
    const c = this.repo.create(dto);
    return this.repo.save(c);
  }

  findAll() {
    return this.repo.find({ relations: ['products'] });
  }

  async findOne(id: number) {
    const category = await this.repo.findOne({
      where: { id },
      relations: ['products'],
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}
