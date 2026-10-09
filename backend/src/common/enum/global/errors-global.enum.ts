export const EErrorsGlobal = {
  SERVER_ERROR:
    'Ocorreu um erro interno no servidor. Por favor, tente novamente mais tarde!',
  INVALID_DATA: 'Dados inválidos fornecidos.',
  FAILED_RETRIEVE_SESSION:
    'Falha ao recuperar a sessão: usuário não autenticado.',
  TENANT_INVALID: `O slug é inválido ou não existe. Acesse o sistema através do link: ${process.env.FRONTEND_URL}`,
  MANY_REQUESTS:
    'Muitas requisições realizadas em pouco tempo. Por favor, aguarde um momento antes de tentar novamente.',
} as const;
