export enum EPermission {
  USERS_CREATE = 'users.create',
  USERS_READ = 'users.read',
  USERS_UPDATE = 'users.update',
  USERS_DELETE = 'users.delete',

  PRODUCTS_CREATE = 'products.create',
  PRODUCTS_READ = 'products.read',
  PRODUCTS_UPDATE = 'products.update',
  PRODUCTS_DELETE = 'products.delete',

  CATEGORIES_CREATE = 'categories.create',
  CATEGORIES_READ = 'categories.read',
  CATEGORIES_UPDATE = 'categories.update',
  CATEGORIES_DELETE = 'categories.delete',

  ROLES_CREATE = 'roles.create',
  ROLES_READ = 'roles.read',
  ROLES_UPDATE = 'roles.update',
  ROLES_DELETE = 'roles.delete',

  LOCATION_CREATE = 'locations.create',
  LOCATION_READ = 'locations.read',
  LOCATION_UPDATE = 'locations.update',
  LOCATION_DELETE = 'locations.delete',

  MOVEMENT_REGISTER = 'movement.register',
  MOVEMENT_ALLOCATE = 'movement.allocate',
  MOVIMENT_READ = 'movement.read',
}

export const ALL_PERMISSIONS = Object.values(EPermission);

export const SYSTEM_ADMIN_ROLE_NAME = 'Admin';
