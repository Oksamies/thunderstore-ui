# Security Audit Process

This document describes the security audit process implemented for the Thunderstore UI project, specifically for dependency management and lockfile security.

## Overview

A comprehensive security audit system has been implemented to protect against malicious dependencies, typosquatting attacks, and other supply chain security threats.

## Security Measures Implemented

### 1. Lockfile Validation with lockfile-lint

The project uses [lockfile-lint](https://github.com/lirantal/lockfile-lint) to validate the integrity of `yarn.lock`:

**What it checks:**
- ✅ All package URLs use HTTPS protocol
- ✅ Package names match their resolved URLs (prevents typosquatting)
- ✅ All packages come from trusted registries
- ✅ Package name aliases are explicitly allowed

**Trusted registries:**
- `registry.yarnpkg.com` - Official Yarn registry
- `registry.npmjs.org` - Official npm registry  
- `npm.fontawesome.com` - Font Awesome Pro private registry

**Allowed package name aliases:**
- `string-width-cjs:string-width`
- `strip-ansi-cjs:strip-ansi`
- `wrap-ansi-cjs:wrap-ansi`

These are legitimate npm compatibility aliases used for CommonJS versions.

### 2. Automated CI/CD Integration

A new job has been added to `.github/workflows/static-analysis.yml` that runs on:
- Every push to any branch
- Every pull request
- Scheduled daily runs (via existing cron)

The job validates the lockfile automatically without requiring dependencies to be installed.

### 3. Local Development Scripts

Developers can run security checks locally:

```bash
# Run lockfile security validation
yarn security:lockfile
```

This is useful for:
- Pre-commit validation
- Debugging security issues
- Manual security reviews

## How to Use

### Before Adding Dependencies

Before adding new dependencies:

1. Research the package to ensure it's legitimate
2. Check the package's npm page for:
   - Download statistics
   - Maintenance status
   - Known security issues
3. Review the package repository (if available)

### After Adding Dependencies

After running `yarn add <package>`:

1. Run the security check:
   ```bash
   yarn security:lockfile
   ```

2. If the check fails, investigate the issue:
   - Verify the package is from a trusted registry
   - Check if it's a typosquatting attempt
   - Review the resolved URL

3. Commit only if the check passes

### CI/CD Pipeline

The lockfile security check is part of the static analysis workflow. If it fails:

1. Review the CI logs to identify the issue
2. Fix the problem locally
3. Re-run the security check to verify
4. Push the fix

## Manual Security Audit

For comprehensive security audits (like checking for specific threats):

1. Review the [SECURITY_AUDIT_REPORT.md](../SECURITY_AUDIT_REPORT.md)
2. Run lockfile validation: `yarn security:lockfile`
3. Check for known malware patterns in yarn.lock
4. Validate critical package versions
5. Review any pre-release or beta versions

## Known Limitations

### Yarn v1 Audit Command

The native `yarn audit` command may fail due to npm registry API issues. This is a known problem with Yarn v1's audit implementation. We use lockfile-lint as a reliable alternative.

### Vulnerability Scanning

While lockfile-lint validates lockfile integrity and package sources, it does **not** scan for CVEs (Common Vulnerabilities and Exposures).

For CVE scanning, consider:
- GitHub Dependabot (already configured in `.github/dependabot.yml`)
- Snyk
- npm audit (after converting yarn.lock)
- OSV Scanner

### False Positives

The security checks may flag legitimate packages in rare cases:
- New private registries need to be added to allowed hosts
- Package aliases need to be explicitly allowed
- Monorepo packages with custom configurations may need exceptions

## Responding to Security Issues

### If a Malicious Package is Detected

1. **DO NOT** install dependencies
2. Remove the malicious package from `package.json`
3. Delete `node_modules` if it was installed
4. Run `yarn install` to regenerate `yarn.lock`
5. Verify with `yarn security:lockfile`
6. Report the package to npm: https://www.npmjs.com/support

### If a Vulnerable Package is Detected

1. Check if an updated version fixes the vulnerability
2. Update the package: `yarn upgrade <package>`
3. If no fix is available:
   - Check for alternative packages
   - Implement workarounds if possible
   - Document the risk in SECURITY_AUDIT_REPORT.md

### If a Typosquatting Attempt is Detected

1. Identify the legitimate package name
2. Fix the typo in `package.json`
3. Run `yarn install` to update `yarn.lock`
4. Verify with `yarn security:lockfile`
5. Report the typosquat to npm

## Maintenance

### Updating Allowed Hosts

If a new private registry is added (like Font Awesome):

1. Update the `security:lockfile` script in `package.json`
2. Update the GitHub Actions job in `.github/workflows/static-analysis.yml`
3. Document the registry in this file

### Updating Package Aliases

If new package aliases are needed:

1. Verify the alias is legitimate
2. Update the `security:lockfile` script with `--allowed-package-name-aliases`
3. Update the GitHub Actions job
4. Document the alias in this file

## References

- [lockfile-lint Documentation](https://github.com/lirantal/lockfile-lint)
- [npm Security Best Practices](https://docs.npmjs.com/security-best-practices)
- [OWASP Dependency Check](https://owasp.org/www-community/vulnerabilities/Vulnerable_Dependencies)
- [Snyk: Npm supply chain attacks](https://snyk.io/blog/npm-supply-chain-attacks/)

## Additional Resources

- Full security audit report: [SECURITY_AUDIT_REPORT.md](../SECURITY_AUDIT_REPORT.md)
- Project README: [README.md](../README.md)
- Dependabot configuration: [.github/dependabot.yml](../.github/dependabot.yml)
