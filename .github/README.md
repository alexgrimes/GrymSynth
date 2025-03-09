# GitHub Configuration Guide

This directory contains GitHub-specific configurations and templates for the Audio Learning Hub project.

## Directory Structure

```
.github/
├── workflows/          # GitHub Actions workflows
│   └── ci.yml         # Main CI pipeline
├── ISSUE_TEMPLATE/    # Issue templates
│   ├── config.yml     # Template configuration
│   ├── bug_report.md  # Bug report template
│   └── feature_request.md # Feature request template
└── PULL_REQUEST_TEMPLATE.md # PR template
```

## Workflows

### CI Pipeline (`ci.yml`)
- Runs on push to main and pull requests
- Matrix testing across Node.js versions and operating systems
- Includes:
  - Linting
  - Building
  - Unit testing
  - Integration testing
  - Performance testing
  - Coverage reporting
  - Example verification
  - Automated deployment

### Deployment
- Automatic deployment on main branch
- NPM package publishing
- Requires `NPM_TOKEN` secret

## Issue Templates

### Bug Reports
- Structured format for reporting bugs
- Includes:
  - Reproduction steps
  - Environment details
  - Impact assessment
  - Performance implications

### Feature Requests
- Template for proposing new features
- Includes:
  - Problem description
  - Proposed solution
  - API design
  - Performance considerations

## Pull Request Template
- Comprehensive checklist
- Type of change classification
- Testing verification
- Documentation requirements
- Performance impact assessment

## Dependabot Configuration

### NPM Updates
- Weekly schedule
- Automated PR creation
- Dependency grouping
- Security updates prioritization

### GitHub Actions Updates
- Weekly schedule
- Automatic security patches
- Maintains workflow reliability

## Labels

Important labels used in the project:
- `bug`: Bug reports
- `enhancement`: Feature requests
- `documentation`: Documentation updates
- `performance`: Performance-related changes
- `security`: Security-related issues
- `breaking`: Breaking changes
- `testing`: Test-related changes

## Branch Protection Rules

Main branch is protected with:
- Required reviews
- Status checks
- Linear history
- No force pushes

## Actions Secrets

Required secrets:
- `NPM_TOKEN`: For package publishing
- `CODECOV_TOKEN`: For coverage reporting

## Maintenance

### Regular Tasks
1. Review and update workflow versions
2. Verify template relevance
3. Update documentation
4. Check branch protection rules
5. Audit GitHub Actions usage

### Best Practices
- Keep workflows focused and modular
- Maintain clear template instructions
- Regular security updates
- Document all configuration changes

## Support

For questions about:
- Workflows: Check CI documentation
- Templates: See template guides
- Security: Review security policy
- General: Open discussion thread

## Contributing

See main CONTRIBUTING.md for full guidelines.
