export enum EErrors {
  // Generic errors
  INTERNAL_SERVER_ERROR = 'Ocorreu um erro interno do servidor. Por favor, tente novamente mais tarde.',

  // it's not a string
  NAME_MUST_BE_STRING = 'O nome deve ser uma string',
  SURNAME_MUST_BE_STRING = 'O sobrenome deve ser uma string',
  USERNAME_MUST_BE_STRING = 'O nome de usuário deve ser uma string',
  ROLE_MUST_BE_STRING = 'A função deve ser uma string',
  PASSWORD_MUST_BE_STRING = 'A senha deve ser uma string',

  // it's empty
  NAME_CANNOT_BE_EMPTY = 'O nome não pode ser vazio',
  SURNAME_CANNOT_BE_EMPTY = 'O sobrenome não pode ser vazio',
  USERNAME_CANNOT_BE_EMPTY = 'O nome de usuário não pode ser vazio',
  ROLE_CANNOT_BE_EMPTY = 'A função não pode ser vazia',
  PASSWORD_CANNOT_BE_EMPTY = 'A senha não pode ser vazia',

  // Length
  NAME_LENGTH_INVALID = 'O nome deve ter entre 2 e 255 caracteres',
  SURNAME_LENGTH_INVALID = 'O sobrenome deve ter entre 2 e 255 caracteres',
  USERNAME_LENGTH_INVALID = 'O nome de usuário deve ter entre 4 e 50 caracteres',
  ROLE_LENGTH_INVALID = 'A função deve ter entre 2 e 20 caracteres',
  PASSWORD_LENGTH_INVALID = 'A senha deve ter entre 8 e 20 caracteres',

  // already exists
  USERNAME_ALREADY_EXISTS = 'O nome de usuário já existe',

  // invalid data
  USER_DATA_INVALID = 'Dados do usuário inválidos',
}
