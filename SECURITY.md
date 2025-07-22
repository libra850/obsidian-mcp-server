# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** create a public GitHub issue
2. Email the maintainers directly or use GitHub's security reporting feature
3. Include detailed information about the vulnerability
4. Wait for acknowledgment before public disclosure

## Security Considerations

This MCP server:
- Accesses local file system within the configured Obsidian vault
- Does NOT make network requests
- Validates file paths to prevent directory traversal
- Uses TypeScript for type safety

### File System Access
The server only operates within the configured `OBSIDIAN_VAULT_PATH` and includes path validation to prevent access to files outside the vault.

### No Network Access
This server does not make any external network requests and only communicates via the MCP protocol.

## Best Practices for Users

1. Set `OBSIDIAN_VAULT_PATH` to your actual vault directory
2. Do not run with elevated privileges unless necessary
3. Keep the software updated
4. Review file permissions on your vault directory