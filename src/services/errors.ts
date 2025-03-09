export interface ServiceError {
  code: string;
  message: string;
  details?: any;
}

export class BaseServiceError extends Error implements ServiceError {
  constructor(
    public message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ServiceNotFoundError extends BaseServiceError {
  constructor(message: string) {
    super(message, 'SERVICE_NOT_FOUND');
  }
}

export class AudioLDMServiceError extends BaseServiceError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, details);
  }
}

export class XenakisLDMError extends BaseServiceError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, details);
  }
}

export function wrapError(error: Error): ServiceError {
  if ('code' in error) {
    return error as ServiceError;
  }
  return new BaseServiceError(
    error.message,
    'UNKNOWN_ERROR',
    { originalError: error }
  );
}
