export enum ERolesErrors {
  ROLE_NOT_FOUND = 'Role não encontrada.',
  ROLES_NOT_FOUND = 'Nenhuma role cadastrada para este tenant.',
  ROLE_EXIST = 'Já existe uma role com este nome cadastrada no tenant.',
  ROLE_INVALID = 'Identificador de role inválido ou inexistente.',
  ROLE_IN_USE = 'Não é possível remover uma Role associada a um ou mais usuários',
}
