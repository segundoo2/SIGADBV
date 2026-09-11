interface ITokens {
  accessToken: string;
  refreshToken: string;
}

export interface IAuthPayload {
  message: string;
  data: ITokens;
}
