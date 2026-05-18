import api from './client'
import type { User, CreateUserRequest } from '../types'

export const getUsers = () => api.get<User[]>('/users').then((r) => r.data)

export const createUser = (data: CreateUserRequest) =>
  api.post<User>('/users', data).then((r) => r.data)

export const deleteUser = (id: string) => api.delete(`/users/${id}`)
