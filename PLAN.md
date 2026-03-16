# Pyre — Drop-in Replacement for log4js

**Package:** `@agentine/pyre`
**Replaces:** [log4js](https://github.com/log4js-node/log4js-node) (~7.4M weekly npm downloads, 5.8k stars, 4,183 dependents)
**Language:** TypeScript (Node.js)
**License:** Apache-2.0

## Why

log4js is the most popular Log4j-inspired logging framework for Node.js. It has been effectively unmaintained for 3+ years (last release v6.9.1). The single npm maintainer (csausdev) has not responded to any of the 83 open issues or 15 open PRs. Issue #1440 ("When will the new version be released?") from April 2025 received no response.

No drop-in replacement exists. log4js2 (@log4js2/core) is even more stale (6 years). Winston, pino, and bunyan have completely different APIs and are not migration-compatible.

## Scope

Full log4js API compatibility with modern improvements:

### Core API
- `configure(config)` — configure logging from object or JSON file path
- `getLogger(category?)` — return a Logger instance for a category
- `shutdown(callback?)` — graceful shutdown of all appenders
- `addLayout(name, factory)` — register custom layout
- `levels` — access log level definitions
- `connectLogger(logger, options)` — Express/Connect middleware

### Logger
- Log methods: `trace()`, `debug()`, `info()`, `warn()`, `error()`, `fatal()`, `mark()`
- `isLevelEnabled(level)`, `isTraceEnabled()`, `isDebugEnabled()`, etc.
- `level` property (get/set)
- `category` property (read-only)
- `addContext(key, value)`, `removeContext(key)`, `clearContext()`

### Log Levels
ALL, TRACE, DEBUG, INFO, WARN, ERROR, FATAL, MARK, OFF — plus custom level support.

### Built-in Appenders
- **stdout** / **stderr** — write to process streams
- **console** — use console.log/error
- **file** — rolling file appender (maxLogSize, backups, compress)
- **dateFile** — date-based rolling (pattern, keepFileExt, compress, alwaysIncludePattern)
- **multiFile** — route logs to different files by property
- **logLevelFilter** — filter by level range
- **categoryFilter** — filter by category
- **noLogFilter** — exclude matching messages
- **recording** — capture logs in memory (for testing)
- **tcp** — send logs over TCP

### Built-in Layouts
- **basic** — `[timestamp] [LEVEL] category - message`
- **colored** / **coloured** — basic with ANSI colors
- **pattern** — configurable format string (`%d`, `%p`, `%c`, `%m`, `%n`, `%x{token}`, etc.)
- **json** — structured JSON output
- **messagePassThrough** — raw message only
- **dummy** — no formatting

### Configuration
- Object-based configuration with `appenders`, `categories`, `levels`
- File-based configuration (JSON path)
- Default category required
- Category inheritance via dot-separated hierarchy
- `pm2: true` and `pm2InstanceVar` for PM2 clustering
- `disableClustering: true` option

### Compatibility Layer
- `pyre/compat/log4js` module that re-exports the full API under the log4js name
- Migration guide documenting any behavioral differences

## Architecture

```
src/
  index.ts              — public API (configure, getLogger, shutdown, addLayout)
  logger.ts             — Logger class
  levels.ts             — LogLevel definitions and custom levels
  configuration.ts      — config validation and normalization
  categories.ts         — category hierarchy and level inheritance
  appenders/
    index.ts            — appender registry and factory
    stdout.ts           — stdout appender
    stderr.ts           — stderr appender
    console.ts          — console appender
    file.ts             — rolling file appender
    dateFile.ts         — date-rolling file appender
    multiFile.ts        — multi-file routing appender
    logLevelFilter.ts   — level filter wrapper
    categoryFilter.ts   — category filter wrapper
    noLogFilter.ts      — exclusion filter
    recording.ts        — in-memory recording appender
    tcp.ts              — TCP appender
  layouts/
    index.ts            — layout registry and factory
    basic.ts            — basic layout
    colored.ts          — colored layout
    pattern.ts          — pattern layout (%d, %p, %c, %m, etc.)
    json.ts             — JSON layout
    messagePassThrough.ts
    dummy.ts
  clustering.ts         — worker/primary message passing, PM2 support
  connect-logger.ts     — Express/Connect middleware
  compat/
    log4js.ts           — drop-in compatibility module
```

## Key Improvements Over log4js
- TypeScript-first with full type definitions
- ESM + CJS dual package
- Zero dependencies (log4js depends on date-format, debug, flatted, rfdc, streamroller)
- Fix known bugs (multi-process file handling, #1436; multiFile bundling, #1442)
- Modern Node.js APIs (fs.promises, worker_threads, streams)
- Node.js 18+ (drop legacy support)

## Deliverables
1. Scaffolded Node.js project (TypeScript, ESM+CJS, vitest)
2. Core types, levels, configuration system
3. Logger class with all log methods and context
4. All built-in appenders (stdout, stderr, console, file, dateFile, multiFile, filters, recording, tcp)
5. All built-in layouts (basic, colored, pattern, json, messagePassThrough, dummy)
6. Category hierarchy with level inheritance
7. Clustering/PM2 support
8. Express/Connect middleware (connectLogger)
9. Compatibility layer (pyre/compat/log4js)
10. Comprehensive test suite + CI + release
