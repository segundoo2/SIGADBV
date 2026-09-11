export enum ECategoryErrors {
  CONFLICT_CATEGORY = 'Categoria já criada.',
  INVALID_CATEGORY = 'Categoria com dados inválidos.',
  CATEGORY_NOT_FOUND = 'Nenhuma categoria encontrada.',

  NAME_STRING_REQUIRED = 'Name deve ser string',
  NAME_CATEGORY = 'O nome da categoria deve ter entre 2 a 50 caracteres.',
  DESCRIPTION_STRING_REQUIRED = 'Description deve ser string',
  DESCRIPTION_CATEGORY = 'A descrição da categoria deve ter no máximo 100 caracteres',
  BOOLEAN_REQUIRED = 'isActive deve ser booleano',
}
