export enum ELocationErrorsMessage {
  CONFLICT = 'Está localização já foi criada.',
  CAPACITY_NULL = 'Posições do tipo DISPLAY (Mostruário) devem obrigatoriamente possuir uma capacidade máxima definida',
  NOT_FOUND = 'Localização não encontrada',
  CONFLICT_DELETE = 'Não é possível deletar a localização, pois ela tem produtos associados.',
}
