MCP client setup

1. Copy `config.example.json` to `config.json` and fill `mcp_server`, `client_id`, and `client_secret`.
2. Keep secrets out of source control (use environment variables or a secrets manager).
3. If your MCP client requires a CLI or package, install it in your environment (project or global).
4. After configuring, run your MCP client as documented by your MCP provider.

Notes
- This repo includes an example config only. Replace placeholders with real values before use.
- If you want, I can attempt an automated MCP client install next (requires knowing which MCP client/CLI you use).
