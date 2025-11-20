# ECL MCP Server - Installation Guide

Complete installation instructions for the ECL MCP Server across different MCP clients and platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
- [MCP Client Configuration](#mcp-client-configuration)
  - [Claude Desktop](#claude-desktop)
  - [Cline (VS Code)](#cline-vs-code)
  - [Cursor IDE](#cursor-ide)
  - [Other MCP Clients](#other-mcp-clients)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Updating](#updating)

## Prerequisites

- **Node.js** version 18.0.0 or higher
- **npm** (comes with Node.js)
- An MCP-compatible client (Claude Desktop, Cline, Cursor, etc.)

Check your Node.js version:

```bash
node --version
```

If you need to install or upgrade Node.js, visit [nodejs.org](https://nodejs.org/).

## Installation Methods

### Method 1: Direct from GitHub (Recommended)

Install directly from the GitHub repository using npm:

```bash
npm install -g git+https://github.com/brownrl/eco_mcp.git
```

The `-g` flag installs globally, making the `ecl-mcp` command available system-wide.

### Method 2: Local Installation

For project-specific installation:

```bash
npm install git+https://github.com/brownrl/eco_mcp.git
```

Then use `npx ecl-mcp` to run the server.

### Method 3: Clone and Install (Development)

For development or contributing:

```bash
git clone https://github.com/brownrl/eco_mcp.git
cd eco_mcp
npm install
```

## MCP Client Configuration

After installation, configure your MCP client to use the ECL MCP server.

### Claude Desktop

Claude Desktop is an AI assistant application that supports MCP servers.

#### Configuration File Location

The configuration file location depends on your operating system:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

#### Configuration Steps

1. **Locate or create** the configuration file at the path above
2. **Add the ECL server** to the `mcpServers` object:

```json
{
  "mcpServers": {
    "ecl": {
      "command": "npx",
      "args": ["ecl-mcp"]
    }
  }
}
```

If you installed globally, you can also use:

```json
{
  "mcpServers": {
    "ecl": {
      "command": "ecl-mcp",
      "args": []
    }
  }
}
```

3. **Restart Claude Desktop** for the changes to take effect

#### Multiple Servers

If you already have other MCP servers configured:

```json
{
  "mcpServers": {
    "existing-server": {
      "command": "some-other-server"
    },
    "ecl": {
      "command": "npx",
      "args": ["ecl-mcp"]
    }
  }
}
```

### Cline (VS Code)

Cline is a VS Code extension that brings AI assistance directly into your editor.

#### Configuration Steps

1. **Open VS Code Settings**:
   - Press `Cmd+,` (macOS) or `Ctrl+,` (Windows/Linux)
   - Or go to: File → Preferences → Settings

2. **Search for "Cline MCP"** in the settings search bar

3. **Edit settings.json** directly:
   - Click the "Edit in settings.json" link
   - Add the ECL server configuration:

```json
{
  "cline.mcpServers": {
    "ecl": {
      "command": "npx",
      "args": ["ecl-mcp"]
    }
  }
}
```

4. **Reload VS Code** or restart Cline for the changes to take effect

#### Workspace vs User Settings

You can configure the server at different levels:

- **User Settings**: Available in all VS Code workspaces
- **Workspace Settings**: Only available in the current project

To add to workspace settings:

1. Open `.vscode/settings.json` in your project root
2. Add the same configuration as above

### Cursor IDE

Cursor is an AI-first code editor with built-in MCP support.

#### Configuration Steps

1. **Open Cursor Settings**:
   - Go to: Cursor → Settings → MCP Servers
   - Or press `Cmd+,` (macOS) / `Ctrl+,` (Windows/Linux)

2. **Add MCP Server**:
   - Click "Add MCP Server"
   - Enter the following details:
     - **Name**: ECL
     - **Command**: `npx`
     - **Args**: `ecl-mcp`

Or edit the Cursor configuration file directly:

**macOS/Linux**: `~/.cursor/mcp_config.json`  
**Windows**: `%APPDATA%\Cursor\mcp_config.json`

```json
{
  "mcpServers": {
    "ecl": {
      "command": "npx",
      "args": ["ecl-mcp"]
    }
  }
}
```

3. **Restart Cursor** for the changes to take effect

### Other MCP Clients

For any MCP-compatible client, use these standard configuration parameters:

**Using npx (recommended)**:
- Command: `npx`
- Args: `["ecl-mcp"]`

**Using global installation**:
- Command: `ecl-mcp`
- Args: `[]`

**Using direct path** (after cloning repo):
- Command: `node`
- Args: `["/absolute/path/to/eco_mcp/index.js"]`

## Verification

After configuring your MCP client, verify the server is working:

### Test the Server Directly

Run the server from the command line:

```bash
ecl-mcp --version
```

Should output:
```
ECL MCP Server v2.0.0
```

Show help information:

```bash
ecl-mcp --help
```

### Test in Your MCP Client

1. Open your MCP client (Claude Desktop, Cline, etc.)
2. Start a new conversation
3. Try a simple query:

```
Can you search for ECL button components?
```

Or directly invoke a tool (depending on client):

```
Use the ecl_search_components tool to find all form components
```

### Expected Behavior

You should see:
- The server listed in your client's MCP servers list
- 40+ ECL tools available
- Successful responses to ECL-related queries

## Troubleshooting

### "Command not found: ecl-mcp"

**Solution**: Install the package globally:

```bash
npm install -g git+https://github.com/brownrl/eco_mcp.git
```

Or use `npx ecl-mcp` instead.

### "Cannot find module '@modelcontextprotocol/sdk'"

**Solution**: Dependencies not installed. Run:

```bash
cd /path/to/eco_mcp
npm install
```

### Server Not Showing in MCP Client

**Solutions**:
1. Check configuration file syntax (valid JSON)
2. Verify file paths are correct
3. Restart the MCP client application
4. Check client logs for error messages

### Database Errors

**Solution**: Ensure the database file exists:

```bash
ls -la /path/to/eco_mcp/ecl-database.sqlite
```

If missing, you may need to run the crawler:

```bash
npm run crawl
npm run extract
```

### Permission Errors

**macOS/Linux**: Make sure the CLI script is executable:

```bash
chmod +x /path/to/eco_mcp/bin/ecl-mcp.js
```

### Node Version Issues

**Solution**: Upgrade Node.js to version 18.0.0 or higher:

```bash
node --version
```

Visit [nodejs.org](https://nodejs.org/) to download the latest LTS version.

## Updating

### Update from GitHub

To update to the latest version:

```bash
npm update -g git+https://github.com/brownrl/eco_mcp.git
```

Or reinstall:

```bash
npm uninstall -g ecl-mcp-server
npm install -g git+https://github.com/brownrl/eco_mcp.git
```

### Update ECL Data

If the Europa Component Library has been updated:

```bash
cd /path/to/eco_mcp
npm run crawl    # Crawl latest ECL documentation
npm run extract  # Extract structured data
```

This will update the database with the latest ECL information.

## Advanced Configuration

### Environment Variables

Set environment variables to customize behavior:

```bash
# Use JSON data instead of SQLite (legacy mode)
export ECL_DATA_SOURCE=json

# Custom database path
export ECL_DATABASE_PATH=/path/to/custom.sqlite

# Enable debug logging
export ECL_LOG_LEVEL=debug
```

### Custom Port (if applicable)

Some MCP clients support custom ports:

```json
{
  "mcpServers": {
    "ecl": {
      "command": "ecl-mcp",
      "args": [],
      "env": {
        "PORT": "3000"
      }
    }
  }
}
```

## Getting Help

If you encounter issues not covered here:

1. Check the [GitHub Issues](https://github.com/brownrl/eco_mcp/issues)
2. Review the [README.md](README.md) for general usage
3. Check the [TOOLS.md](TOOLS.md) for tool documentation
4. Review server logs in the `logs/` directory

## Next Steps

- Read [TOOLS.md](TOOLS.md) for detailed tool documentation
- Explore [examples/](examples/) for usage patterns
- Review [AGENTS.md](AGENTS.md) for AI agent guidance
- Check [PROGRESS.md](PROGRESS.md) for development history

---

**ECL MCP Server** - Making Europa Component Library knowledge accessible to AI coding assistants.

For more information about ECL itself, visit the [official documentation](https://ec.europa.eu/component-library/).
