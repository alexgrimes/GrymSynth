# Environment Variables Documentation

This document describes all environment variables used in the Audio Learning Hub application. These variables control various aspects of the application's behavior, performance, and security settings.

## Environment Configuration Files

The following environment configuration files are available:

- `development.env`: Used for local development environments
- `staging.env`: Used for staging/testing environments
- `production.env`: Used for production environments

## Required Environment Variables

### Core Application Settings

| Variable      | Description                                                       | Default | Required |
| ------------- | ----------------------------------------------------------------- | ------- | -------- |
| `ENVIRONMENT` | Current deployment environment (development, staging, production) | -       | Yes      |
| `NODE_ENV`    | Node.js environment                                               | -       | Yes      |
| `PORT`        | Port the application listens on                                   | 3000    | Yes      |
| `LOG_LEVEL`   | Logging level (debug, info, warn, error)                          | info    | Yes      |
| `DOMAIN`      | Domain name for the application                                   | -       | Yes      |

### Feature Flags

| Variable                 | Description                           | Default | Required |
| ------------------------ | ------------------------------------- | ------- | -------- |
| `ENABLE_METRICS`         | Enable performance metrics collection | true    | No       |
| `METRICS_PORT`           | Port for metrics server               | 9090    | No       |
| `FEATURE_MEMORY_ENABLED` | Enable feature memory system          | true    | No       |
| `VISUALIZATION_ENABLED`  | Enable audio visualization features   | true    | No       |

### Performance Settings

| Variable                        | Description                                         | Default | Required |
| ------------------------------- | --------------------------------------------------- | ------- | -------- |
| `MEMORY_LIMIT_MB`               | Memory limit in MB                                  | 768     | No       |
| `AUDIO_PROCESSING_THREADS`      | Number of threads for audio processing              | 4       | No       |
| `FEATURE_MEMORY_CACHE_SIZE`     | Maximum number of items in feature memory cache     | 1000    | No       |
| `FEATURE_MEMORY_TTL`            | Time-to-live for feature memory items in seconds    | 86400   | No       |
| `VISUALIZATION_QUALITY`         | Quality of audio visualizations (low, medium, high) | medium  | No       |
| `PATTERN_RECOGNITION_THRESHOLD` | Threshold for pattern recognition (0.0-1.0)         | 0.75    | No       |
| `PATTERN_LEARNING_RATE`         | Learning rate for pattern recognition (0.0-1.0)     | 0.05    | No       |

### Error Handling

| Variable               | Description                                    | Default | Required |
| ---------------------- | ---------------------------------------------- | ------- | -------- |
| `ERROR_RETRY_ATTEMPTS` | Number of retry attempts for failed operations | 3       | No       |
| `ERROR_RETRY_DELAY`    | Delay between retry attempts in milliseconds   | 1000    | No       |

### API Settings

| Variable                | Description                                  | Default | Required |
| ----------------------- | -------------------------------------------- | ------- | -------- |
| `CORS_ALLOWED_ORIGINS`  | Comma-separated list of allowed CORS origins | *       | No       |
| `API_RATE_LIMIT`        | Maximum number of requests per window        | 100     | No       |
| `API_RATE_LIMIT_WINDOW` | Rate limit window in milliseconds            | 60000   | No       |

### Health Check

| Variable                | Description                                | Default | Required |
| ----------------------- | ------------------------------------------ | ------- | -------- |
| `HEALTH_CHECK_INTERVAL` | Interval for health checks in milliseconds | 30000   | No       |

### Security Settings

| Variable                         | Description                                   | Default | Required |
| -------------------------------- | --------------------------------------------- | ------- | -------- |
| `JWT_SECRET`                     | Secret for JWT token generation               | -       | Yes      |
| `API_KEY`                        | API key for external service authentication   | -       | Yes      |
| `ENABLE_HELMET`                  | Enable Helmet security middleware             | true    | No       |
| `ENABLE_CONTENT_SECURITY_POLICY` | Enable Content Security Policy                | true    | No       |
| `ENABLE_RATE_LIMITING`           | Enable API rate limiting                      | true    | No       |
| `ENABLE_BRUTE_FORCE_PROTECTION`  | Enable protection against brute force attacks | true    | No       |

### Database Configuration

| Variable      | Description       | Default | Required |
| ------------- | ----------------- | ------- | -------- |
| `DB_HOST`     | Database host     | -       | Yes      |
| `DB_PORT`     | Database port     | -       | Yes      |
| `DB_NAME`     | Database name     | -       | Yes      |
| `DB_USER`     | Database username | -       | Yes      |
| `DB_PASSWORD` | Database password | -       | Yes      |

### External Services

| Variable                | Description                          | Default | Required |
| ----------------------- | ------------------------------------ | ------- | -------- |
| `AUDIO_SERVICE_API_KEY` | API key for audio processing service | -       | Yes      |
| `ML_SERVICE_API_KEY`    | API key for machine learning service | -       | Yes      |

## Environment-Specific Settings

### Development Environment

| Variable                 | Description                                    | Default | Required |
| ------------------------ | ---------------------------------------------- | ------- | -------- |
| `ENABLE_HOT_RELOAD`      | Enable hot reloading for development           | true    | No       |
| `ENABLE_DEBUG_LOGGING`   | Enable detailed debug logging                  | true    | No       |
| `MOCK_EXTERNAL_SERVICES` | Use mock implementations for external services | true    | No       |

### Production Environment

| Variable                  | Description                      | Default | Required |
| ------------------------- | -------------------------------- | ------- | -------- |
| `ENABLE_RESPONSE_CACHING` | Enable HTTP response caching     | true    | No       |
| `CACHE_TTL`               | Cache time-to-live in seconds    | 3600    | No       |
| `CACHE_MAX_SIZE`          | Maximum number of items in cache | 100     | No       |

## Secret Management

For security reasons, sensitive environment variables (marked as "Yes" in the Required column) should be managed using a secrets management solution:

- In development: Use `.env.local` files (not committed to version control)
- In Kubernetes: Use Kubernetes Secrets or an external secrets manager
- In other environments: Use the appropriate secrets management solution for your platform

## Adding New Environment Variables

When adding new environment variables:

1. Add the variable to the appropriate environment files
2. Document the variable in this README
3. Update the Kubernetes ConfigMap and/or Secret definitions if needed
4. Update the application code to use the new variable with appropriate defaults
