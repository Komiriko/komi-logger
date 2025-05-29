import type { LogLevels } from './logLevels';
import type { StrategyMap } from './strategyMap';

/**
 * Internal log stream object for the queue.
 */
export interface LogStreamChunk<TLogObject, TStrategies extends StrategyMap> {
    /** ISO date string of the log event. */
    date: string;
    /** Log level. */
    level: LogLevels;
    /** The object to log. */
    object: TLogObject;
    /** Names of strategies to use. */
    strategiesNames: (keyof TStrategies)[];
}