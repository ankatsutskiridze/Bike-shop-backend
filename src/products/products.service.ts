import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Category } from '../categories/category.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private repo: Repository<Product>,
    @InjectRepository(Category) private catRepo: Repository<Category>,
  ) {}

  async create(dto: CreateProductDto) {
    let category: Category | null = null;
    if (dto.categoryId) {
      category = await this.catRepo.findOne({ where: { id: dto.categoryId } });
      if (!category) throw new BadRequestException('Invalid category');
    }

    const product = this.repo.create({
      ...dto,
      category: category ?? undefined, // ✅ null გავუშვით undefined-ზე
    });

    return this.repo.save(product);
  }

  findAll() {
    return this.repo.find({ relations: ['category'] });
  }

  async findOne(id: number) {
    const p = await this.repo.findOne({
      where: { id },
      relations: ['category'],
    });
    if (!p) throw new NotFoundException('Product not found');
    return p;
  }

  async update(id: number, dto: UpdateProductDto) {
    let category: Category | null | undefined = undefined;
    if (dto.categoryId !== undefined) {
      category = dto.categoryId
        ? await this.catRepo.findOne({ where: { id: dto.categoryId } })
        : null;
      if (dto.categoryId && !category)
        throw new BadRequestException('Invalid category');
    }

    const updateData: any = { ...dto };
    if (category !== undefined) updateData.category = category ?? undefined;

    await this.repo.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.repo.delete(id);
    return { deleted: true };
  }
}
