export interface User {
  id: string;
  alias: string;
  role: 'PATIENT' | 'PSYCHOLOGIST' | 'ADMIN';
  email?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface Session {
  id: string;
  patientId: string;
  psychologistId: string;
  serviceId: string;
  scheduledAt: string;
  duration: number;
  status: string;
  roomName?: string;
  roomToken?: string;
}

export interface Psychologist {
  id: string;
  alias: string;
  bio?: string;
  specialization?: string;
  rating?: number;
  reviewCount?: number;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
}
