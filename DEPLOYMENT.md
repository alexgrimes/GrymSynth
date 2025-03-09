# Audio Learning Hub Deployment Guide

This document provides comprehensive information about deploying the Audio Learning Hub application to various environments.

## Table of Contents

1. [Overview](#overview)
2. [Deployment Architecture](#deployment-architecture)
3. [Prerequisites](#prerequisites)
4. [Configuration Files](#configuration-files)
5. [Deployment Process](#deployment-process)
6. [Environment Configuration](#environment-configuration)
7. [Kubernetes Resources](#kubernetes-resources)
8. [Monitoring and Health Checks](#monitoring-and-health-checks)
9. [Security Considerations](#security-considerations)
10. [Scaling and Performance](#scaling-and-performance)
11. [Troubleshooting](#troubleshooting)
12. [CI/CD Integration](#cicd-integration)

## Overview

The Audio Learning Hub application is designed to be deployed as a containerized application using Docker and Kubernetes. The deployment configuration supports multiple environments (development, staging, production) with appropriate resource allocations and security settings for each environment.

## Deployment Architecture

The application is deployed using the following architecture:

- **Containerization**: Docker containers for application packaging
- **Orchestration**: Kubernetes for container orchestration
- **Configuration**: Environment-specific configuration via ConfigMaps and Secrets
- **Networking**: Kubernetes Services and Ingress for network access
- **Storage**: Persistent Volumes for data storage
- **Scaling**: Horizontal Pod Autoscaler for automatic scaling
- **Monitoring**: Health checks and Prometheus metrics

## Prerequisites

Before deploying the application, ensure you have the following:

- Docker installed and configured
- Kubernetes cluster access configured
- kubectl installed and configured
- Access to a Docker registry
- Appropriate permissions to create Kubernetes resources

## Configuration Files

The deployment configuration consists of the following files:

### Docker Configuration

- `Dockerfile`: Multi-stage Docker build for the application
- `docker-compose.yml`: Docker Compose configuration for local development
- `.dockerignore`: Files to exclude from Docker builds

### Kubernetes Manifests

Located in `deployment/kubernetes/`:

- `deployment.yaml`: Deployment configuration
- `service.yaml`: Service configuration
- `configmap.yaml`: ConfigMap for environment variables
- `secrets.yaml`: Secret management approach
- `storage.yaml`: Persistent volume claims and storage classes
- `namespace.yaml`: Namespace and resource quota configuration
- `hpa.yaml`: Horizontal Pod Autoscaler configuration
- `ingress.yaml`: Ingress configuration for external access
- `kustomization.yaml`: Kustomize configuration for managing all resources

### Environment Configuration

Located in `deployment/env-templates/`:

- `development.env`: Development environment variables
- `staging.env`: Staging environment variables
- `production.env`: Production environment variables
- `README.md`: Documentation on required environment variables

### Deployment Scripts

Located in `scripts/`:

- `build.sh`: Script for building Docker images
- `deploy.sh`: Script for deploying to Kubernetes
- `healthcheck.js`: Script for verifying deployment health

## Deployment Process

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

### Verifying the Deployment

After deployment, verify the health of the application:

```bash
# Check pod status
kubectl get pods -n audio-learning-hub

# Check service status
kubectl get services -n audio-learning-hub

# Run health check
kubectl exec <pod-name> -n audio-learning-hub -- node scripts/healthcheck.js
```

## Environment Configuration

The application supports three deployment environments:

### Development Environment

- Purpose: Local development and testing
- Resource allocation: Minimal
- Features: Debug logging, hot reloading, mock services
- Configuration file: `deployment/env-templates/development.env`

### Staging Environment

- Purpose: Pre-production testing and validation
- Resource allocation: Moderate
- Features: Debug logging, feature flags, A/B testing
- Configuration file: `deployment/env-templates/staging.env`

### Production Environment

- Purpose: Production deployment
- Resource allocation: High
- Features: Performance optimizations, caching, security hardening
- Configuration file: `deployment/env-templates/production.env`

## Kubernetes Resources

### Resource Allocation

Resource allocation varies by environment:

| Resource       | Development | Staging | Production |
| -------------- | ----------- | ------- | ---------- |
| CPU Request    | 0.5 cores   | 1 core  | 2 cores    |
| CPU Limit      | 1 core      | 2 cores | 4 cores    |
| Memory Request | 512 MB      | 1 GB    | 2 GB       |
| Memory Limit   | 1 GB        | 2 GB    | 4 GB       |
| Storage        | 1 GB        | 5 GB    | 10 GB      |

### Namespace and Quotas

The application is deployed in a dedicated namespace with resource quotas to prevent resource exhaustion:

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: audio-learning-hub-quota
spec:
  hard:
    requests.cpu: "8"
    requests.memory: 16Gi
    limits.cpu: "16"
    limits.memory: 32Gi
```

### Autoscaling

The application uses Horizontal Pod Autoscaler to automatically scale based on CPU and memory usage:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: audio-learning-hub-hpa
spec:
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Monitoring and Health Checks

### Health Endpoints

The application provides the following health endpoints:

- `/health`: Overall health status
- `/health/ready`: Readiness status
- `/metrics`: Prometheus metrics

### Health Check Script

The `scripts/healthcheck.js` script performs comprehensive health checks:

- API health check
- Disk space check
- Memory usage check
- Required files check

## Security Considerations

### Secret Management

Sensitive information is managed using:

- Kubernetes Secrets for basic secrets
- External Secrets Operator for integration with external secret managers
- Environment-specific secret files (not committed to version control)

### Network Security

- TLS encryption for all external traffic
- Network policies to restrict pod-to-pod communication
- Ingress configuration with security headers

### Pod Security

- Non-root user for running the application
- Read-only file system where possible
- Resource limits to prevent DoS attacks

## Scaling and Performance

### Vertical Scaling

Resource requests and limits can be adjusted in `deployment.yaml` based on application needs.

### Horizontal Scaling

The Horizontal Pod Autoscaler automatically scales the number of pods based on CPU and memory usage.

### Performance Optimization

- Response caching for frequently accessed endpoints
- Memory limits to prevent excessive memory usage
- CPU limits to ensure fair resource allocation

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

### Debugging

For detailed debugging:

```bash
# Enable verbose logging
kubectl set env deployment/audio-learning-hub -n audio-learning-hub LOG_LEVEL=debug

# Get detailed pod information
kubectl describe pod <pod-name> -n audio-learning-hub

# Check recent logs
kubectl logs <pod-name> -n audio-learning-hub --tail=100
```

## CI/CD Integration

The deployment scripts are designed to be used in CI/CD pipelines. Examples for GitHub Actions and Azure DevOps are provided in `scripts/deployment-README.md`.

### Deployment Workflow

A typical CI/CD workflow includes:

1. Build and test the application
2. Build and push the Docker image
3. Deploy to the appropriate environment
4. Run health checks to verify the deployment
5. Notify the team of deployment status

### Rollback Procedure

In case of deployment issues:

```bash
# Rollback to previous deployment
kubectl rollout undo deployment/audio-learning-hub -n audio-learning-hub

# Verify rollback
kubectl rollout status deployment/audio-learning-hub -n audio-learning-hub
```

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Kustomize Documentation](https://kubectl.docs.kubernetes.io/references/kustomize/)
- Project-specific documentation in the `docs/` directory
