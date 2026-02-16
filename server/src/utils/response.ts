import { Response } from 'express';

interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

export const sendSuccess = <T>(res: Response, data: T, message?: string, statusCode = 200) => {
  const payload: ApiResponse<T> = {
    status: 'success',
    data,
    message
  };

  return res.status(statusCode).json(payload);
};

export default sendSuccess;

