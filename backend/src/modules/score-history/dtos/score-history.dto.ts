import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ScoreHistoryDto {
  @ApiProperty({
    description:
      'Quantidade de pontos a ser ajustada. ' +
      'Use valores **positivos** para somar pontos (ex: 10) ou **negativos** para subtrair pontos (ex: -10).',
    example: -15,
  })
  @IsInt()
  @IsNotEmpty()
  score!: number;

  @ApiProperty({
    description: 'Motivo ou descrição detalhada do ajuste de pontuação',
    example: 'Atraso na formação geral',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description!: string;
}
