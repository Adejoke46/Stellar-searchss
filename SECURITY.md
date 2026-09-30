# Security Policy

## Reporting a Vulnerability

If you believe you have found a security vulnerability in this project, please do not open a public issue. Instead, email the maintainers at security@stellarsearch.dev or use GitHub's [Private Vulnerability Reporting](https://docs.github.com/code-security/security-advisories/repository-security-advisories) feature. We aim to acknowledge reports within 48 hours.

## Secret Scanning

This repository enforces secret hygiene through three layers:

1. **GHactions CI** - [gitleaks](https://gitleaks.com/) runs on every push and pull request via `.github/workflows/security.yml`. A committed API key fails the build.
2. **Pre-commit hook** - `.husky/pre-commit` runs `gitleaks protect --staged` before any commit is created.
3. **GitHub secret scanning and push protection** - enabled on the repository to block known secret patterns at the GitHub layer.

## What to Do If a Key Is Leaked

**Rotate first, then scrub.** Never the reverse order - a rewritten history does not invalidate a key that has already been exposed.

1. **Contain** - Revoke the leaked credential immediately in the provider console (Stellar, Groq, Vercel, etc.).
2. **Rotate** - Generate a replacement credential and update it in GitHub Actions secrets and your local `.env`. Verify the new key works before continuing.
3. **Assess** - Review provider access logs for unauthorized use between the leak and rotation.
4. **Scrub** - Only after rotation, purge the secret from history using `git filter-repo --install --force --path <path>`, then force-push and notify collaborators to re-clone.
5. **Prevent** - Add a gitleaks allowlist entry or regex only if the value is genuinely a placeholder, never to silence a real key.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |
