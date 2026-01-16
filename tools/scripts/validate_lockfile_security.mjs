#!/usr/bin/env node

/**
 * Lockfile Security Validation Script
 * 
 * This script validates the yarn.lock file for security issues including:
 * - HTTPS protocol enforcement
 * - Package name integrity (prevents typosquatting)
 * - Trusted registry sources
 * - Package name aliases validation
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const config = {
  type: 'yarn',
  path: join(__dirname, '..', '..', 'yarn.lock'),
  validateHttps: true,
  allowedHosts: [
    'yarn',
    'npm',
    'registry.yarnpkg.com',
    'npm.fontawesome.com'
  ],
  validatePackageNames: true,
  allowedPackageNameAliases: [
    'string-width-cjs:string-width',
    'strip-ansi-cjs:strip-ansi',
    'wrap-ansi-cjs:wrap-ansi'
  ]
};

// Build the lockfile-lint command
const buildCommand = () => {
  const args = [
    'npx',
    'lockfile-lint@4.14.0',
    `--type ${config.type}`,
    `--path ${config.path}`
  ];

  if (config.validateHttps) {
    args.push('--validate-https');
  }

  if (config.allowedHosts.length > 0) {
    args.push(`--allowed-hosts ${config.allowedHosts.join(' ')}`);
  }

  if (config.validatePackageNames) {
    args.push('--validate-package-names');
  }

  if (config.allowedPackageNameAliases.length > 0) {
    args.push(`--allowed-package-name-aliases ${config.allowedPackageNameAliases.join(' ')}`);
  }

  return args.join(' ');
};

// Run the validation
try {
  console.log('🔒 Running lockfile security validation...\n');
  
  const command = buildCommand();
  execSync(command, { 
    stdio: 'inherit',
    cwd: join(__dirname, '..', '..')
  });
  
  console.log('\n✅ Lockfile security validation passed!');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Lockfile security validation failed!');
  process.exit(1);
}
