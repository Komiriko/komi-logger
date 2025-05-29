import type { LoggerStrategy } from '#/types/loggerStrategy';
import type { LogLevels } from '#/types/logLevels';

/**
 * ConsoleLoggerStrategy implements LoggerStrategy to provide logging functionality to the console. ({@link LoggerStrategy})
 */
export class ConsoleLoggerStrategy implements LoggerStrategy {
    private readonly _colorize: boolean;

    /**
     * Initializes the ConsoleLoggerStrategy.
     *
     * @param colorize - Indicates if the output should be colorized. (Default is false.)
     */
    public constructor(colorize = false) {
        this._colorize = colorize;
    }

    /**
     * Logs a message to the console with the specified log level.
     *
     * @param level - The log level at which the message should be logged. ({@link LogLevels})
     * @param date - The date at which the message was logged.
     * @param object - The object to log.
     */
    public log(level: LogLevels, date: Date, object: unknown): void {
        const colors: Record<LogLevels, string> = {
            ERROR: '\x1b[31m',
            WARN: '\x1b[33m',
            INFO: '\x1b[36m',
            DEBUG: '\x1b[34m',
            LOG: '\x1b[35m'
        };

        const dateColor = this._colorize ? '\x1b[33m' : '';
        const colorReset = this._colorize ? '\x1b[0m' : '';
        const logLevelColor = this._colorize ? colors[level] : '';
        const sanitizedObject: string = typeof object === 'string' ? object : JSON.stringify(object);
        const prefixDate = `[${dateColor}${date.toISOString().replace(/T/, ' ').replace(/\..+/, '')}${colorReset}]`;
        const message = `${prefixDate} ${logLevelColor}${level}${colorReset} : ${sanitizedObject}`;

        console[level.toLowerCase() as 'error' | 'warn' | 'info' | 'debug' | 'log'](message);
    }
}
