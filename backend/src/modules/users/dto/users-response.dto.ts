import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

export class UsersResponseDto {
  @ApiProperty({
    description: 'Mensagem informativa sobre o status da operação',
    example: 'Usuário encontrado com sucesso.',
  })
  message!: string;

  @ApiProperty({
    description: 'Os dados do usuário encontrado, ou null se não existir',
    type: User,
    nullable: true,
  })
  data!: Partial<User> | Partial<User>[] | string | null;
}
