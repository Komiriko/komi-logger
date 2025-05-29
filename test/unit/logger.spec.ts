/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-empty-function */
import { describe, expect, test } from 'bun:test';

import { KomiError } from '#/error/komiError';
import { Logger } from '#/logger';
import type { LoggerStrategy } from '#/types/loggerStrategy';
import type { LogLevels } from '#/types/logLevels';

/**
 * Tests for the Logger class (immutable API).
 */
describe('Logger', () => {
    describe('constructor', () => {
        test('should create a new instance of Logger with default maxPendingLogs', () => {
            const logger: Logger = new Logger();
            expect(logger).toBeInstanceOf(Logger);
        });

        test('should create a new instance of Logger with custom maxPendingLogs', () => {
            const logger: Logger = new Logger({}, 10);
            expect(logger).toBeInstanceOf(Logger);
        });
    });

    describe('registerStrategy', () => {
        test('should add a strategy and return a new Logger instance', () => {
            const logger: Logger = new Logger();
            const strategy: LoggerStrategy = { log: () => {} };
            const logger2 = logger.registerStrategy('test', strategy);
            expect(Object.keys((logger2 as unknown as { _strategies: object })._strategies)).toContain('test');
        });

        test('should throw an error if the strategy is already added', () => {
            const logger: Logger = new Logger();
            const strategy: LoggerStrategy = { log: () => {} };
            const logger2 = logger.registerStrategy('test', strategy);
            expect(() => logger2.registerStrategy('test', strategy)).toThrow('The strategy "test" is already added.');
        });
    });

    describe('unregisterStrategy', () => {
        test('should remove a strategy and return a new Logger instance', () => {
            const logger: Logger = new Logger();
            const strategy: LoggerStrategy = { log: () => {} };
            const logger2 = logger.registerStrategy('test', strategy);
            // The key type is now 'test' only
            const logger3 = logger2.unregisterStrategy('test');
            expect(Object.keys((logger3 as unknown as { _strategies: object })._strategies)).not.toContain('test');
        });

        test('should throw an error if the strategy is not found', () => {
            const logger: Logger = new Logger();
            // Type is never, so we must cast
            expect(() => (logger as unknown as { unregisterStrategy: (name: string) => void }).unregisterStrategy('test')).toThrow('The strategy "test" is not found.');
        });
    });

    describe('registerStrategies', () => {
        test('should add multiple strategies and return a new Logger instance', () => {
            const logger: Logger = new Logger();
            const strategies: [string, LoggerStrategy][] = [
                ['test1', { log: () => {} }],
                ['test2', { log: () => {} }]
            ];
            const logger2 = logger.registerStrategies(strategies);
            const keys = Object.keys((logger2 as unknown as { _strategies: object })._strategies);
            expect(keys).toContain('test1');
            expect(keys).toContain('test2');
        });

        test('should throw an error if a strategy is already added', () => {
            const logger: Logger = new Logger();
            const strategies: [string, LoggerStrategy][] = [
                ['test1', { log: () => {} }],
                ['test2', { log: () => {} }]
            ];
            const logger2 = logger.registerStrategies(strategies);
            expect(() => logger2.registerStrategies(strategies)).toThrow('The strategy "test1" is already added.');
        });
    });

    describe('unregisterStrategies', () => {
        test('should remove multiple strategies and return a new Logger instance', () => {
            const logger: Logger = new Logger();
            const strategies: [string, LoggerStrategy][] = [
                ['test1', { log: () => {} }],
                ['test2', { log: () => {} }]
            ];
            const logger2 = logger.registerStrategies(strategies);
            // The keys are now 'test1' and 'test2'
            const logger3 = (logger2 as unknown as { unregisterStrategies: (names: string[]) => Logger }).unregisterStrategies(['test1', 'test2']);
            expect(Object.keys((logger3 as unknown as { _strategies: object })._strategies)).toHaveLength(0);
        });

        test('should throw an error if a strategy is not found', () => {
            const logger: Logger = new Logger();
            const strategies: [string, LoggerStrategy][] = [
                ['test1', { log: () => {} }],
                ['test2', { log: () => {} }]
            ];
            const logger2 = logger.registerStrategies(strategies);
            expect(() => (logger2 as unknown as { unregisterStrategies: (names: string[]) => Logger }).unregisterStrategies(['test1', 'test3'])).toThrow('The strategy "test3" is not found.');
        });
    });

    describe('clearStrategies', () => {
        test('should clear all strategies and return a new Logger instance', () => {
            const logger: Logger = new Logger();
            const strategy: LoggerStrategy = { log: () => {} };
            const logger2 = logger.registerStrategy('test', strategy);
            const logger3 = logger2.clearStrategies();
            expect(Object.keys((logger3 as unknown as { _strategies: object })._strategies)).toHaveLength(0);
        });
    });

    describe('logging', () => {
        test.each([
            ['error', 'ERROR'],
            ['warn', 'WARN'],
            ['info', 'INFO'],
            ['debug', 'DEBUG'],
            ['log', 'LOG']
        ])('should log a %s message and queue it', (method: string, level: string) => {
            const strategy: LoggerStrategy = {
                log: (logLevel: LogLevels, _: Date, object: unknown) => {
                    expect(logLevel).toBe(level as LogLevels);
                    expect(object).toBe('test');
                }
            };
            const logger = new Logger().registerStrategy('test', strategy);
            ((logger as unknown) as Record<string, (object: unknown) => void>)[method]('test');
            const pendingLogs = (logger as unknown as { _pendingLogs: unknown[] })._pendingLogs;
            expect(pendingLogs).toHaveLength(1);
            expect(pendingLogs[0]).toMatchObject({ level, object: 'test' });
        });

        test.each([
            ['error'],
            ['warn'],
            ['info'],
            ['debug'],
            ['log']
        ])('should throw if no strategy is added (method: %s)', (method: string) => {
            const logger = new Logger();
            expect(() => ((logger as unknown) as Record<string, (object: unknown) => void>)[method]('test')).toThrow('No strategy is added.');
        });
    });

    describe('event emission', () => {
        test('should emit an error when a strategy throws', (done) => {
            const strategy: LoggerStrategy = {
                log: () => {
                    throw new Error('test');
                }
            };
            const logger = new Logger().registerStrategy('test', strategy);
            logger.on('error', (error: Error) => {
                expect(error).toBeInstanceOf(Error);
                expect(error).toBeInstanceOf(KomiError);
                done();
            });
            logger.log('test');
        });

        test('should emit end when no more logs are pending', (done) => {
            const strategy: LoggerStrategy = { log: () => {} };
            const logger = new Logger().registerStrategy('test', strategy);
            logger.on('end', () => done());
            logger.log('test');
        });
    });

    describe('internal behavior', () => {
        test('should ignore logs when maxPendingLogs is reached', () => {
            const strategy: LoggerStrategy = { log: () => {} };
            const logger = new Logger().registerStrategy('test', strategy);
            // Fill the buffer
            for (let i = 0; i < 10; i++)
                logger.log(`log${i}`);
            const loggerFull = new Logger({}, 1).registerStrategy('test', strategy);
            loggerFull.log('first');
            loggerFull.log('second');
            const pendingLogs = (loggerFull as unknown as { _pendingLogs: unknown[] })._pendingLogs;
            expect(pendingLogs).toHaveLength(1);
        });

        test('should handle backpressure in _writeLog', async () => {
            const mockStrategy: LoggerStrategy = {
                log: (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 100))
            };
            const logger = new Logger().registerStrategy('test', mockStrategy);
            logger.log('test1');
            logger.log('test2');
            // @ts-expect-error _writeLog is private
            await logger._writeLog();
        });
    });
});