import type { KomiError } from '#/error/komiError';

export interface LoggerEvent {
	error: [KomiError<{
		strategyName: string;
		object: unknown;
		error: Error;
	}>];
	end: [];
}