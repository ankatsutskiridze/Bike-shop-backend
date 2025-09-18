import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Product } from '../products/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../users/user.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private itemRepo: Repository<OrderItem>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private dataSource: DataSource,
  ) {}

  // Create order: validate stock, compute total, reduce stock, save order + items in transaction
  async create(dto: CreateOrderDto) {
    const user = await this.userRepo.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!dto.items || dto.items.length === 0)
      throw new BadRequestException('No items');

    return this.dataSource.transaction(async (manager) => {
      let total = 0;
      const order = manager.create(Order, {
        user,
        totalPrice: 0,
        status: 'pending',
      });
      const savedOrder = await manager.save(order);

      for (const it of dto.items) {
        const product = await manager.findOne(Product, {
          where: { id: it.productId },
        });
        if (!product)
          throw new NotFoundException(`Product id ${it.productId} not found`);
        if (product.stock < it.quantity)
          throw new BadRequestException(
            `Not enough stock for product ${product.name}`,
          );

        const price = Number(product.price) * it.quantity;
        total += price;

        // reduce stock
        product.stock = product.stock - it.quantity;
        await manager.save(product);

        const orderItem = manager.create(OrderItem, {
          order: savedOrder,
          product: product,
          quantity: it.quantity,
          price: Number(product.price),
        });
        await manager.save(orderItem);
      }

      savedOrder.totalPrice = total;
      return manager.save(savedOrder);
    });
  }

  findAll() {
    return this.orderRepo.find();
  }

  async findOne(id: number) {
    const o = await this.orderRepo.findOne({ where: { id } });
    if (!o) throw new NotFoundException('Order not found');
    return o;
  }

  async remove(id: number) {
    await this.orderRepo.delete(id);
    return { deleted: true };
  }
}
