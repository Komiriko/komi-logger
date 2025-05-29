import { appendFile } from 'fs/promises';

import type { LoggerStrategy } from '#/types/loggerStrategy';
import type { LogLevels } from '#/types/logLevels';

/**
 * FileLoggerStrategy implements LoggerStrategy to provide logging functionality to the file system. ({@link LoggerStrategy})
 */
export class FileLoggerStrategy implements LoggerStrategy {
    /**
     * Path to the file to log to.
     */
    private readonly _path: string;

    /**
     * Constructor FileLoggerStrategy
     *
     * @param path - Path to the file to log to.
     */
    public constructor(path: string) {
        this._path = path;
    }

    /**
     * Logs a message to the file system with the specified log level.
     *
     * @param level - The log level at which the message should be logged. {@link LogLevels}
     * @param date - The date at which the message was logged.
     * @param object - The object to log.
     */
    public async log(level: LogLevels, date: Date, object: unknown): Promise<void> {
        const prefixDate = `[${date.toISOString().replace(/T/, ' ').replace(/\..+/, '')}]`;
        const sanitizedObject: string = typeof object === 'string' ? object : JSON.stringify(object);
        const message = `${prefixDate} ${level} : ${sanitizedObject}`;
        await appendFile(this._path, `${message}\n`);
    }
}
