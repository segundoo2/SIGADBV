import { isDevMode } from '@angular/core';

export const URL = isDevMode()
  ? 'http://localhost:3000'
  : 'https://api.sigadbv.sgcode.com.br';
