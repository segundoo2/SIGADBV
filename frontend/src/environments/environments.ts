const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

export const environment = {
  production: isProduction,
  apiUrl: isProduction ? 'https://api.sgcode.com.br' : 'http://localhost:3000'
};