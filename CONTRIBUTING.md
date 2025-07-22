# Contributing to Obsidian MCP Server

Thank you for your interest in contributing to Obsidian MCP Server!

## How to Contribute

### Reporting Issues
- Use the GitHub issue tracker
- Provide detailed steps to reproduce
- Include system information (OS, Node.js version, etc.)

### Pull Requests
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Ensure the code builds (`npm run build`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to your branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Setup
```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/obsidian-mcp-server.git
cd obsidian-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

### Code Style
- Use TypeScript
- Follow existing code conventions
- Add JSDoc comments for public APIs
- Ensure proper error handling

### Testing
- Test your changes with a real Obsidian vault
- Test all affected MCP tools
- Verify both successful and error cases

## Code of Conduct
Please be respectful and inclusive in all interactions.