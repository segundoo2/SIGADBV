export interface IUpdatePasswordDto {
  username: string;
  password: string;
  mustChangePassword: boolean;
}