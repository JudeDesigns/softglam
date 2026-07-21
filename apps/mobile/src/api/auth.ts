import { request, setTokens } from './client';
import type { ApiAuthResponse, ApiUser } from './types';

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput {
  email: string;
  password: string;
  display_name: string;
  role: 'client' | 'artist';
}

export async function apiSignIn(input: SignInInput): Promise<ApiAuthResponse> {
  return request<ApiAuthResponse>('/auth/sign-in', {
    method: 'POST',
    body: input,
    auth: false,
  });
}

export async function apiSignUp(input: SignUpInput): Promise<ApiAuthResponse> {
  return request<ApiAuthResponse>('/auth/sign-up', {
    method: 'POST',
    body: input,
    auth: false,
  });
}

export async function apiGetMe(): Promise<ApiUser> {
  return request<ApiUser>('/users/me');
}
