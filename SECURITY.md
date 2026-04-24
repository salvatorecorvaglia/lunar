# Security Policy

## Supported Versions

The following versions of Lunar are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| v0.0.x  | :white_check_mark: |
| < v0.0  | :x:                |

## Reporting a Vulnerability

We take the security of our project seriously. If you believe you have found a security vulnerability, please report it to us as soon as possible.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please follow these steps:

1.  **Provide Details**: Include as much information as possible, including:
    - Description of the vulnerability.
    - Steps to reproduce the issue.
    - Potential impact.
    - Any suggested fixes or mitigations.
2.  **Wait for Response**: We will acknowledge your report within 48 hours and provide a timeline for a fix if necessary.

## Security Features

**Lunar** implements several security best practices out of the box:

- **Secure Key Storage**: SSH keys and connection details are stored locally using SQLite and are never transmitted to third parties.
- **Local Execution**: Operations are performed securely over SSH/SFTP directly to your servers.
- **Dependency Management**: Dependencies are regularly audited and updated.
- **No Telemetry**: Lunar does not track user behavior or send telemetry data.

## Security Best Practices for Users

- **Update Regularly**: Keep your Lunar installation up to date to receive the latest security patches.
- **Secure Your Machine**: Ensure the local machine running Lunar is secured, as connection data and local settings are stored on your device.
- **Use Strong SSH Keys**: Use modern, secure key formats (e.g., Ed25519) and protect your private keys with strong passphrases.
