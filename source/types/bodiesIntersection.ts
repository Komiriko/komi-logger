import type { StrategyBody } from './strategyBody';

export type BodiesIntersection<TStrategies, K extends keyof TStrategies> =
    (
        K extends unknown
            ? (object: StrategyBody<TStrategies, K>) => void
            : never
    ) extends (object: infer I) => void ? I : never;