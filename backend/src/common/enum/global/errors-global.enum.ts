export const EErrorsGlobal = {
  SERVER_ERROR: 'Erro interno no servidor.',
  INVALID_DATA: 'Dados inválidos fornecidos.',
  FAILED_RETRIEVE_SESSION: 'Falha ao recuperar a sessão.',
  TENANT_INVALID: `O slug é inválido ou não existe. Acesse o sistema através do link: ${process.env.FRONTEND_URL}`,
} as const;
