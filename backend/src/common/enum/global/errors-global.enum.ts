export const EErrorsGlobal = {
  SERVER_ERROR:
    'Ocorreu um erro interno no servidor. Por favor, tente novamente mais tarde!',
  INVALID_DATA: 'Dados inválidos fornecidos.',
  INVALID_USER_JWT:
    'Payload de usuário inválido ou não encontrado na requisição.',
  FAILED_RETRIEVE_SESSION:
    'Falha ao recuperar a sessão: usuário não autenticado.',
  TENANT_INVALID: `O slug é inválido ou não existe. Acesse o sistema através do link: ${process.env.FRONTEND_URL}`,
} as const;
