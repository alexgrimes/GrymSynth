# Audio Learning Hub Deployment Configuration

This directory contains all the necessary configuration files and templates for deploying the Audio Learning Hub application to various environments.

## Directory Structure

- `kubernetes/`: Kubernetes manifests for deploying the application
  - `deployment.yaml`: Deployment configuration
  - `service.yaml`: Service configuration
  - `configmap.yaml`: ConfigMap for environment variables
  - `secrets.yaml`: Secret management approach
  - `storage.yaml`: Persistent volume claims and storage classes
  - `namespace.yaml`: Namespace and resource quota configuration
  - `hpa.yaml`: Horizontal Pod Autoscaler configuration
  - `ingress.yaml`: Ingress configuration for external access
  - `kustomization.yaml`: Kustomize configuration for managing all resources

- `env-templates/`: Environment-specific configuration templates
  - `development.env`: Development environment variables
  - `staging.env`: Staging environment variables
  - `production.env`: Production environment variables
  - `README.md`: Documentation on required environment variables

## Deployment Environments

The deployment configuration supports three environments:

1. **Development**: For local development and testing
   - Lower resource requirements
   - Debug logging enabled
   - Mock external services
   - Hot reloading enabled

2. **Staging**: For pre-production testing
   - Moderate resource allocation
   - Debug logging enabled
   - Real external services
   - Feature flags and A/B testing enabled

3. **Production**: For production deployment
   - Higher resource allocation
   - Minimal logging (info level)
   - Real external services
   - Performance optimizations enabled

## Deployment Process

### Prerequisites

- Docker installed and configured
- Kubernetes cluster access configured
- kubectl installed and configured
- Access to a Docker registry

### Building the Docker Image

Use the build script to build the Docker image:

```bash
./scripts/build.sh --environment production --registry your-registry.com --tag v1.0.0 --push
```

### Deploying to Kubernetes

Use the deploy script to deploy the application to Kubernetes:

```bash
./scripts/deploy.sh --environment production --namespace audio-learning-hub --registry your-registry.com --tag v1.0.0
```

For a dry run without making changes:

```bash
./scripts/deploy.sh --environment production --dry-run
```

### Manual Deployment

If you prefer to deploy manually:

1. Build the Docker image:
   ```bash
   docker build -t your-registry.com/audio-learning-hub:v1.0.0 .
   docker push your-registry.com/audio-learning-hub:v1.0.0
   ```

2. Apply Kubernetes manifests:
   ```bash
   # Set environment variables
   export ENVIRONMENT=production
   export DOCKER_REGISTRY=your-registry.com
   export IMAGE_TAG=v1.0.0

   # Apply manifests using kustomize
   kubectl apply -k deployment/kubernetes --namespace audio-learning-hub
   ```

## Resource Requirements

### Development Environment
- CPU: 0.5 cores (request), 1 core (limit)
- Memory: 512 MB (request), 1 GB (limit)
- Storage: 1 GB

### Staging Environment
- CPU: 1 core (request), 2 cores (limit)
- Memory: 1 GB (request), 2 GB (limit)
- Storage: 5 GB

### Production Environment
- CPU: 2 cores (request), 4 cores (limit)
- Memory: 2 GB (request), 4 GB (limit)
- Storage: 10 GB

## Security Considerations

- Secrets are managed using Kubernetes Secrets or external secrets managers
- TLS is enabled for all external endpoints
- Network policies restrict pod-to-pod communication
- Resource quotas prevent resource exhaustion
- Pod security policies enforce security best practices
- RBAC controls access to Kubernetes resources

## Monitoring and Health Checks

- Liveness probe: `/health` endpoint
- Readiness probe: `/health/ready` endpoint
- Prometheus metrics: `/metrics` endpoint
- Health check script: `scripts/healthcheck.js`

## Troubleshooting

### Common Issues

1. **Pod fails to start**:
   - Check pod logs: `kubectl logs <pod-name> -n audio-learning-hub`
   - Check pod events: `kubectl describe pod <pod-name> -n audio-learning-hub`

2. **Health check fails**:
   - Run health check manually: `kubectl exec <pod-name> -n audio-learning-hub -- node scripts/healthcheck.js`
   - Check application logs for errors

3. **Performance issues**:
   - Check resource usage: `kubectl top pods -n audio-learning-hub`
   - Adjust resource limits in `deployment.yaml`

### Getting Help

For additional assistance, please refer to the project documentation or contact the development team.
