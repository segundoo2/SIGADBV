import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  surname!: string;

  @Column({ type: 'varchar', length: 50, nullable: false, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  role!: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  password!: string;
}
