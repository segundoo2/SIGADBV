import { isDevMode } from '@angular/core';

declare global {
  interface Window {
    __SIGADBV_API_URL__?: string;
  }
}

const runtimeApiUrl =
  typeof window !== 'undefined' ? window.__SIGADBV_API_URL__ : undefined;

export const URL =
  runtimeApiUrl ??
  (isDevMode() ? 'http://localhost:3000' : 'https://api.sigadbv.sgcode.com.br');
