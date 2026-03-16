# Changelog

## 0.1.0 (2026-03-16)

Initial release — drop-in replacement for log4js.

### Features
- Full log4js-compatible API: `configure()`, `getLogger()`, `shutdown()`, `addLayout()`, `connectLogger()`
- Logger with all log methods: trace, debug, info, warn, error, fatal, mark
- Category hierarchy with dot-separated level inheritance
- 11 built-in appenders: stdout, stderr, console, file, dateFile, multiFile, logLevelFilter, categoryFilter, noLogFilter, recording, tcp
- 6 built-in layouts: basic, colored, pattern, json, messagePassThrough, dummy
- Custom layout registration via `addLayout()`
- Context support on loggers (`addContext`, `removeContext`, `clearContext`)
- Clustering and PM2 support
- Express/Connect middleware (`connectLogger`)
- Compatibility layer at `@agentine/pyre/compat/log4js`
- TypeScript-first with full type definitions
- ESM + CJS dual package
- Zero dependencies
- Node.js 18+
