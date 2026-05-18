import api from './client'
import type { LoginRequest, LoginResponse } from '../types'

export const login = (data: LoginRequest) =>
  api.post<LoginResponse>('/auth/login', data).then((r) => r.data)
