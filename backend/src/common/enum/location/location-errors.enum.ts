export enum ELocationErrorsMessage {
  CONFLICT = 'Está localização já foi criada.',
  CONFLICT_TRANSFER = 'A localização de origem e destino não podem ser iguais',
  POSITION_ORIGIN = 'Transferências para uma posição de mostruário (DISPLAY) devem vir obrigatoriamente de um estoque (STORAGE)',
  POSITION_ALLOCATION = 'A posição de mostruário (DISPLAY) já possui outro produto alocado e só permite um único SKU',
  CAPACITY_NULL = 'Posições do tipo DISPLAY (Mostruário) devem obrigatoriamente possuir uma capacidade máxima definida',
  CAPACITY_POSITION = `A quantidade alocada excede a capacidade máxima da posição. Capacidade da posição: `,
  INSUFFICIENT_QUANTITY = 'Saldo insuficiente na localização de origem. Disponível:  ',
  OVER_ALLOCATION = 'Quantidade a alocar excede o saldo não alocado disponível. ',
  NOT_FOUND = 'Localização não encontrada',
  CONFLICT_DELETE = 'Não é possível deletar a localização, pois ela tem produtos associados.',
}
