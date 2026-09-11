export enum EUsersErrors {
  USERNAME = 'Nome de usuário',
  USERNAME_LENGTH = 'O username deve ter entre 3 e 50 caracteres.',
  USERNAME_CHARACTERS = 'O username deve conter apenas letras minúsculas, números e ponto final.',
  USERNAME_EXIST = 'O usuário informado já está cadastrado. Solicite um reset de senha a um administrador, se precisar.',
  USERNAME_INVALID = 'Nome de usuário inválido.',

  CARACTERS_INVALID = 'contém caracteres inválidos',

  ROLE_INVALID = 'Role inválida.',
  ROLE_NOT_FOUND = 'Role não encontrada para este tenant.',

  PASSWORD_INCORRECT = 'Nome de usuário ou senha inválido.',
  MUST_CHANGE_PASSWORD_INVALID = 'Must change password inválido.',

  USER_NOT_FOUND = 'Usuário não encontrado.',
  USERS_NOT_FOUND = 'Lista de usuários não encontrada.',

  USER_ALREADY_HAS_ROLE = 'O usuário já possui esta Role atribuída',
  USER_DOES_NOT_HAVE_ROLE = 'O usuário não possui esta Role para ser removida',
}
