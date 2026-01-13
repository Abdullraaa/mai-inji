import { Response } from 'express';
import { ApiResponse } from '../types';

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200) {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
}

export function sendError(res: Response, error: string, statusCode: number = 400) {
  const response: ApiResponse<null> = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
}
