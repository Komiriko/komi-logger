import type { LoggerStrategy } from './loggerStrategy';

export type StrategyBody<TStrategies, Key extends keyof TStrategies> =TStrategies[Key] extends LoggerStrategy<infer TBody> ? TBody : never;
