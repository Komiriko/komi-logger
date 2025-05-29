import type { LogLevels } from './logLevels';

export interface LoggerStrategy<TLogObject = unknown> {
    /**
     * Logs a message with the strategy's implementation.
     *
     * @param level - The log level at which the message should be logged. ({@link LogLevels})
     * @param date - The date at which the message was logged.
     * @param object - The object to log.
     */
    log(level: LogLevels, date: Date, object: TLogObject): Promise<void> | void;
}
