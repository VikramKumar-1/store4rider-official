import { describe, it, expect } from 'vitest';
import { AppError, NotFoundError } from './AppError';

describe('AppError', () => {
  it('should create an error with correct status code and message', () => {
    const error = new AppError('Custom Error', 400);
    expect(error.message).toBe('Custom Error');
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
  });
});

describe('NotFoundError', () => {
  it('should default to 404 status code', () => {
    const error = new NotFoundError('Resource missing');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Resource missing not found');
  });
});
