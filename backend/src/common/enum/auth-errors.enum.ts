export enum EAuthErrors {
  ACCESS_DENIED = 'Acesso negado:',
  SESSION_EXPIRED = `${ACCESS_DENIED} sessão inválida ou expirada.`,
  USER_NOT_FOUND = 'Usuário não encontrado ou credenciais inválidas.',
}
