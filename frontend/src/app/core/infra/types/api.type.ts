// src/app/core/infra/types/api.ts

import type { operations, components } from './api.generated';

// ==========================================
// SCHEMAS & DTOs (Components)
// ==========================================

// Usuários e Autenticação
export type UserDto = components['schemas']['CreateUserDto'];
export type UpdatePasswordDto = components['schemas']['UpdatePasswordDto'];
export type LoginDto = components['schemas']['LoginDto'];

// Cargos e Permissões
export type RoleDto = components['schemas']['RoleDto'];
export type UpdateRoleDto = components['schemas']['UpdateRoleDto'];
export type PermissionsMetadataDto = components['schemas']['PermissionsMetadataDto'];
export type EPermission = components['schemas']['EPermission'];

// Produtos e Catálogo
export type Product = components['schemas']['Product'];
export type ProductDto = components['schemas']['ProductDto'];
export type UpdateProductDto = components['schemas']['UpdateProductDto'];
export type Category = components['schemas']['Category'];
export type CategoryDto = components['schemas']['CategoryDto'];
export type UpdateCategoryDto = components['schemas']['UpdateCategoryDto'];

// Localizações e Estoque
export type Location = components['schemas']['Location'];
export type LocationDto = components['schemas']['LocationDto'];
export type UpdateLocationDto = components['schemas']['UpdateLocationDto'];
export type ProductLocation = components['schemas']['ProductLocation'];

// Movimentações
export type MovementDto = components['schemas']['MovementDto'];
export type AllocateLocationDto = components['schemas']['AllocateLocationDto'];

// ==========================================
// OPERATION RESPONSES & REQUEST BODIES (Safe Helpers)
// ==========================================

// Helpers condicionais para extração segura de responses e request bodies
type ExtractResponse<T, Status extends number> = 
  T extends { responses: Record<Status, { content: { 'application/json': infer R } }> } ? R :
  T extends { responses: Partial<Record<Status, { content: { 'application/json': infer R } }>> } ? R : never;

type ExtractBody<T> = 
  T extends { requestBody?: { content: { 'application/json': infer B } } } ? B : never;

// Users
export type FindAllUsersResponse = ExtractResponse<operations['UsersController_findAllUsers'], 200>;
export type CreateUserBody = ExtractBody<operations['UsersController_createUser']>;
export type FindOneUserResponse = ExtractResponse<operations['UsersController_findOneByUsername'], 200>;

// Products
export type FindAllProductsResponse = ExtractResponse<operations['ProductsController_findAllProducts'], 200>;
export type CreateProductBody = ExtractBody<operations['ProductsController_createProduct']>;

// Auth
export type LoginBody = ExtractBody<operations['AuthController_login']>;
// Tenta pegar tanto do 200 quanto do 201 de forma segura
export type LoginResponse = 
  | ExtractResponse<operations['AuthController_login'], 200>
  | ExtractResponse<operations['AuthController_login'], 201>;

// Movements
export type RegisterMovementBody = ExtractBody<operations['MovementsController_registerMovement']>;
export type AllocateLocationBody = ExtractBody<operations['MovementsController_allocateLocation']>;