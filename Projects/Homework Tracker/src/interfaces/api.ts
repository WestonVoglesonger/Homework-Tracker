export interface ApiError {
  error: string;
}

export type ApiResult<T> = T | ApiError;


