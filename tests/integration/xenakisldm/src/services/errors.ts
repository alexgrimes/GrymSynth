export class BaseServiceError extends Error {
  constructor(
    public message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'BaseServiceError';

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BaseServiceError);
    }
  }
}

export class AudioServiceError extends BaseServiceError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, details);
    this.name = 'AudioServiceError';
  }
}

export class ValidationError extends BaseServiceError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class ConfigurationError extends BaseServiceError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
  }
}

export class ResourceError extends BaseServiceError {
  constructor(message: string, details?: any) {
    super(message, 'RESOURCE_ERROR', details);
    this.name = 'ResourceError';
  }
}

export class TestError extends BaseServiceError {
  constructor(message: string, details?: any) {
    super(message, 'TEST_ERROR', details);
    this.name = 'TestError';
  }
}
