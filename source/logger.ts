import { once } from 'events';
import { Transform } from 'stream';

import { loggerErrorKeys } from './enums/loggerErrorKeys';
import { KomiError } from './error/komiError';
import type { LoggerEvent } from './events/loggerEvents';
import type { BodiesIntersection } from './types/bodiesIntersection';
import type { LogLevels } from './types/logLevels';
import type { LogStreamChunk } from './types/logStreamChunk';
import type { LoggerStrategy } from './types/loggerStrategy';
import type { StrategyMap } from './types/strategyMap';
import { TypedEventEmitter } from './utils/typedEventEmitter';

/**
 * Logger provides a flexible, type-safe logging system that allows multiple strategies for log output.
 * The logger uses a transform stream to process log entries and execute the logging strategies.
 *
 * Logger extends the TypedEventEmitter class to emit typed events when an error occurs or when the logger ends.
 * The logger can log messages with different levels: error, warn, info, debug, and log.
 *
 * @template TStrategies - The map of strategy names to LoggerStrategy types.
 */
export class Logger<TStrategies extends StrategyMap = {}> extends TypedEventEmitter<LoggerEvent> {
    /**
     * The map of strategies.
     */
    private readonly _strategies: TStrategies;

    /**
     * The transform stream for processing log entries.
     */

    private readonly _logStream: Transform;

    /**
     * The queue of pending log entries.
     */

    private readonly _pendingLogs: LogStreamChunk<unknown, TStrategies>[] = [];

    /**
     * The maximum number of pending logs.
     * @defaultValue 10_000
     */
    private readonly _maxPendingLogs;

    /**
     * Flag to indicate if the logger is currently writing logs.
     */
    private _isWriting = false;

    /**
     * Construct a Logger.
     *
     * @template TStrategies - The map of strategy names to LoggerStrategy types.
     *
     * @param strategies - Initial strategies map.
     *
     * @param maxPendingLogs - Maximum number of logs in the queue (default: 10_000)
     */
    public constructor(strategies: TStrategies = {} as TStrategies, maxPendingLogs = 10_000) {
        super();
        this._strategies = strategies;
        this._maxPendingLogs = maxPendingLogs;
        this._logStream = new Transform({
            objectMode: true,
            transform: (chunk: LogStreamChunk<unknown, TStrategies>, _, callback): void => {
                this._executeStrategies(chunk.level, new Date(chunk.date), chunk.object, chunk.strategiesNames)
                    .then(() => callback())
                    .catch((error: unknown) => {
                        this.emit('error', error as KomiError<{
                            strategyName: string;
                            object: unknown;
                            error: Error;
                        }>);
                        callback();
                    });
            }
        });
    }

    /**
     * Register a new logging strategy.
     *
     * @template Key - The name of the strategy.
     * @template Strategy - The strategy type.
     *
     * @param name - The name of the strategy.
     * @param strategy - The strategy to add. It must implement {@link LoggerStrategy}.
     *
     * @throws ({@link KomiError}): If the strategy is already added.
     *
     * @returns A new Logger instance with the added strategy.
     */
    public registerStrategy<Key extends string, Strategy extends LoggerStrategy>(
        name: Key,
        strategy: Strategy
    ): Logger<TStrategies & Record<Key, Strategy>> {
        if ((this._strategies as Record<string, LoggerStrategy>)[name])
            throw new KomiError({
                key: loggerErrorKeys.strategyAlreadyAdded,
                message: `The strategy "${name}" is already added.`,
                cause: { strategyName: name }
            });
        return new Logger({
            ...this._strategies,
            [name]: strategy
        }, this._maxPendingLogs);
    }

    /**
     * Unregister a logging strategy.
     *
     * @template Key - The name of the strategy.
     *
     * @param name - The name of the strategy to remove.
     *
     * @throws ({@link KomiError}): If the strategy is not found.
     *
     * @returns A new Logger instance without the removed strategy.
     */
    public unregisterStrategy<Key extends keyof TStrategies>(
        name: Key
    ): Logger<Omit<TStrategies, Key>> {
        if (!(name in this._strategies))
            throw new KomiError({
                key: loggerErrorKeys.strategyNotFound,
                message: `The strategy "${String(name)}" is not found.`,
                cause: { strategyName: name }
            });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [name]: _, ...rest } = this._strategies;
        return new Logger(rest, this._maxPendingLogs);
    }

    /**
     * Register multiple strategies at once.
     *
     * @template TNew - The new strategies to add.
     *
     * @param strategies - An array of tuples where each tuple contains the strategy name and the strategy instance.
     *
     * @throws ({@link KomiError}): If any strategy is already added.
     *
     * @returns A new Logger instance with the added strategies.
     */
    public registerStrategies<TNew extends [string, LoggerStrategy][] = [string, LoggerStrategy][]>(
        strategies: TNew
    ): Logger<TStrategies & { [K in TNew[number][0]]: Extract<TNew[number], [K, LoggerStrategy]>[1] }> {
        return strategies.reduce(
            (logger, [name, strategy]) => logger.registerStrategy(name, strategy), this as unknown as Logger<StrategyMap>
        ) as unknown as Logger<TStrategies & { [K in TNew[number][0]]: Extract<TNew[number], [K, LoggerStrategy]>[1] }>;
    }

    /**
     * Unregister multiple strategies at once.
     *
     * @template Keys - The names of the strategies to remove.
     *
     * @param names - An array of strategy names to remove.
     *
     * @throws ({@link KomiError}): If any strategy is not found.
     *
     * @returns A new Logger instance without the removed strategies.
     */
    public unregisterStrategies<Keys extends Extract<keyof TStrategies, string>>(
        names: Keys[]
    ): Logger<Omit<TStrategies, Keys>> {
        let logger: Logger<StrategyMap> = this as unknown as Logger<StrategyMap>;
        for (const name of names)
            logger = logger.unregisterStrategy(name) as unknown as Logger<StrategyMap>;
        return logger as unknown as Logger<Omit<TStrategies, Keys>>;
    }

    /**
     * Remove all strategies.
     *
     * @returns A new Logger instance without any strategies.
     */
    public clearStrategies(): Logger {
        return new Logger({}, this._maxPendingLogs);
    }

    /**
     * Log an error message.
     *
     * @template SNames - The names of the strategies to use.
     *
     * @param object - The object to log.
     * @param strategiesNames - The names of the strategies to use. If not provided, all strategies will be used.
     *
     * @throws ({@link KomiError}): If no strategy is added.
     */
    public error<SNames extends (keyof TStrategies)[] = (keyof TStrategies)[]>(
        object: BodiesIntersection<TStrategies, SNames[number]>,
        strategiesNames?: SNames
    ): void {
        this._out('ERROR', object, strategiesNames);
    }

    /**
     * Log a warning message.
     *
     * @template SNames - The names of the strategies to use.
     *
     * @param object - The object to log.
     * @param strategiesNames - The names of the strategies to use. If not provided, all strategies will be used.
     *
     * @throws ({@link KomiError}): If no strategy is added.
     */
    public warn<SNames extends (keyof TStrategies)[] = (keyof TStrategies)[]>(
        object: BodiesIntersection<TStrategies, SNames[number]>,
        strategiesNames?: SNames
    ): void {
        this._out('WARN', object, strategiesNames);
    }

    /**
     * Log an info message.
     *
     * @template SNames - The names of the strategies to use.
     *
     * @param object - The object to log.
     * @param strategiesNames - The names of the strategies to use. If not provided, all strategies will be used.
     *
     * @throws ({@link KomiError}): If no strategy is added.
     */
    public info<SNames extends (keyof TStrategies)[] = (keyof TStrategies)[]>(
        object: BodiesIntersection<TStrategies, SNames[number]>,
        strategiesNames?: SNames
    ): void {
        this._out('INFO', object, strategiesNames);
    }

    /**
     * Log a debug message.
     *
     * @template SNames - The names of the strategies to use.
     *
     * @param object - The object to log.
     * @param strategiesNames - The names of the strategies to use. If not provided, all strategies will be used.
     *
     * @throws ({@link KomiError}): If no strategy is added.
     */
    public debug<SNames extends (keyof TStrategies)[] = (keyof TStrategies)[]>(
        object: BodiesIntersection<TStrategies, SNames[number]>,
        strategiesNames?: SNames
    ): void {
        this._out('DEBUG', object, strategiesNames);
    }

    /**
     * Log a generic message.
     *
     * @template SNames - The names of the strategies to use.
     *
     * @param object - The object to log.
     * @param strategiesNames - The names of the strategies to use. If not provided, all strategies will be used.
     *
     * @throws ({@link KomiError}): If no strategy is added.
     */
    public log<SNames extends (keyof TStrategies)[] = (keyof TStrategies)[]>(
        object: BodiesIntersection<TStrategies, SNames[number]>,
        strategiesNames?: SNames
    ): void {
        this._out('LOG', object, strategiesNames);
    }

    /**
     * Internal: execute all strategies for a log event.
     *
     * @template TLogObject - The type of the log object.
     *
     * @param level - The log level.
     * @param date - The date of the log event.
     * @param object - The object to log.
     * @param strategiesNames - The names of the strategies to use. If not provided, all strategies will be used.
     *
     * @throws ({@link KomiError}): If a strategy throws.
     */
    private async _executeStrategies<TLogObject>(
        level: LogLevels,
        date: Date,
        object: TLogObject,
        strategiesNames: (keyof TStrategies)[]
    ): Promise<void> {
        await Promise.all(strategiesNames.map(async (name) => {
            try {
                await (this._strategies[name] as LoggerStrategy<TLogObject> | undefined)?.log(level, date, object);
            } catch (error) {
                throw new KomiError({
                    key: loggerErrorKeys.loggerStrategyError,
                    message: `An error occurred while executing the strategy "${String(name)}".`,
                    cause: { strategyName: name, object, error }
                });
            }
        }));
    }

    /**
     * Internal: queue a log event and start writing if not already.
     *
     * @template TLogObject - The type of the log object.
     *
     * @param level - The log level.
     * @param object - The object to log.
     * @param strategiesNames - The names of the strategies to use. If not provided, all strategies will be used.
     *
     * @throws ({@link KomiError}): If no strategy is added.
     */
    private _out<TLogObject>(
        level: LogLevels,
        object: TLogObject,
        strategiesNames?: (keyof TStrategies)[]
    ): void {
        const strategyKeys = Object.keys(this._strategies) as (keyof TStrategies)[];
        if (strategyKeys.length === 0)
            throw new KomiError({
                message: 'No strategy is added.',
                key: loggerErrorKeys.noStrategyAdded
            });
        if (this._pendingLogs.length >= this._maxPendingLogs)
            return;
        const log: LogStreamChunk<TLogObject, TStrategies> = {
            date: new Date().toISOString(),
            level,
            object,
            strategiesNames: strategiesNames ? strategiesNames : strategyKeys
        };
        this._pendingLogs.push(log);
        if (!this._isWriting) {
            this._isWriting = true;
            setImmediate(() => {
                void this._writeLog();
            });
        }
    }

    /**
     * Internal: process the log queue and emit 'end' when done.
     */
    private async _writeLog(): Promise<void> {
        while (this._pendingLogs.length > 0) {
            const pendingLog = this._pendingLogs.shift();
            if (!pendingLog) continue;
            const canWrite = this._logStream.write(pendingLog);
            if (!canWrite)
                await once(this._logStream, 'drain');
        }
        this._isWriting = false;
        this.emit('end');
    }
}