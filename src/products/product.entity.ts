import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Category } from '../categories/category.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('decimal')
  price: number;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: 0 }) // ✅ აქ დავამატე მარაგის ველი
  stock: number;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
  })
  category: Category | null;
}
