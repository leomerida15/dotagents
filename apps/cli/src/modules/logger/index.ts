// Domain — public contracts
export { LogLevel } from './domain/log-level.vo';
export type { LogEntry } from './domain/log-entry.vo';
export type { ILogger } from './domain/logger.port';
export type { IErrorFormatter } from './domain/error-formatter.port';

// Infrastructure — ready-to-use implementations
export { CliLogger } from './infrastructure/cli-logger';
export { DaemonFileLogger } from './infrastructure/daemon-file-logger';
export { PrettyErrorFormatter } from './infrastructure/pretty-error-formatter';

// Module — factory function
export { createLoggerModule } from './logger.module';

// Utils — shared utilities (for internal use and advanced scenarios)
export { safeSerialize } from './utils/safe-serialize';
export { LEVEL_SEVERITY, shouldLog } from './utils/level-severity';
