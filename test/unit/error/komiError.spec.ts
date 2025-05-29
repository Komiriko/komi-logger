import { describe, expect, test } from 'bun:test';

import { KomiError } from '#/error/komiError';
import type { KomiErrorOptions } from '#/error/types/komiErrorOptions';

/**
 * Test data constants for consistent testing across all test suites.
 */
const testData = {
    completeErrorOptions: {
        message: 'An example error occurred',
        key: 'komi-logger.error.example',
        httpStatusCode: 400,
        cause: { errorCode: 'E001', details: 'Invalid input data' }
    } as const,
    minimalErrorOptions: {
        message: 'Minimal error'
    } as const,
    httpStatusCode: {
        badRequest: 400,
        unauthorized: 401,
        forbidden: 403,
        notFound: 404,
        INTERNAL_SERVER_ERROR: 500
    } as const,
    errorKeys: {
        validation: 'komi-logger.error.validation.failed',
        authentification: 'komi-logger.error.auth.invalid_token',
        database: 'komi-logger.error.database.connection_failed'
    } as const
} as const;

/**
 * Custom type definitions for testing purposes.
 */
interface DatabaseErrorCause {
    readonly connectionString: string;
    readonly timeoutMs: number;
}

interface ValidationErrorCause {
    readonly field: string;
    readonly value: unknown;
    readonly rule: string;
}

/**
 * Helper function to create a KomiError with complete options for testing purposes.
 * @returns A KomiError instance with all properties set.
 */
const _createCompleteError = (): KomiError<typeof testData.completeErrorOptions.cause> => new KomiError(testData.completeErrorOptions);

/**
 * Helper function to create a minimal KomiError for testing purposes.
 * @returns A KomiError instance with minimal configuration.
 */
const _createMinimalError = (): KomiError => new KomiError(testData.minimalErrorOptions);

/**
 * Helper function to get current timestamp for date comparison tests.
 * @returns Current timestamp in milliseconds.
 */
const _getCurrentTimestamp = (): number => Date.now();

describe('KomiError', () => {
    describe('when constructing with complete options', () => {
        test('should create instance with all specified properties', () => {
            const beforeCreation: number = _getCurrentTimestamp();
            const komiError: KomiError<typeof testData.completeErrorOptions.cause> = _createCompleteError();
            const afterCreation: number = _getCurrentTimestamp();

            expect(komiError).toBeInstanceOf(KomiError);
            expect(komiError).toBeInstanceOf(Error);
            expect(komiError.message).toBe(testData.completeErrorOptions.message);
            expect(komiError.name).toBe('KomiError');
            expect(komiError.key).toBe(testData.completeErrorOptions.key);
            expect(komiError.httpStatusCode).toBe(testData.completeErrorOptions.httpStatusCode);
            expect(komiError.cause).toEqual(testData.completeErrorOptions.cause);
            expect(komiError.stack).toBeDefined();
            expect(komiError.uuid).toBeDefined();
            expect(komiError.date).toBeDefined();
            expect(komiError.date.getTime()).toBeGreaterThanOrEqual(beforeCreation);
            expect(komiError.date.getTime()).toBeLessThanOrEqual(afterCreation);
        });

        test('should create instance with typed cause', () => {
            const databaseCause: DatabaseErrorCause = {
                connectionString: 'mssql://localhost:1433',
                timeoutMs: 5000
            };

            const errorOptions: KomiErrorOptions<DatabaseErrorCause> = {
                message: 'Database connection failed',
                key: testData.errorKeys.database,
                httpStatusCode: testData.httpStatusCode.INTERNAL_SERVER_ERROR,
                cause: databaseCause
            };
            const komiError = new KomiError<DatabaseErrorCause>(errorOptions);

            expect(komiError.cause).toEqual(databaseCause);
            expect(komiError.cause?.connectionString).toBe('mssql://localhost:1433');
            expect(komiError.cause?.timeoutMs).toBe(5000);
        });

        test('should create instance with Error cause', () => {
            const originalError: Error = new Error('Original error message');
            const errorOptions: KomiErrorOptions<Error> = {
                message: 'Wrapped error',
                key: 'error.wrapper.example',
                httpStatusCode: testData.httpStatusCode.badRequest,
                cause: originalError
            };
            const komiError = new KomiError<Error>(errorOptions);

            expect(komiError.cause).toBe(originalError);
            expect(komiError.cause?.message).toBe('Original error message');
        });
    });

    describe('when constructing with partial options', () => {
        test('should create instance with minimal options and apply defaults', () => {
            const komiError: KomiError = _createMinimalError();

            expect(komiError).toBeInstanceOf(KomiError);
            expect(komiError.message).toBe(testData.minimalErrorOptions.message);
            expect(komiError.key).toBe('');
            expect(komiError.httpStatusCode).toBe(500);
            expect(komiError.cause).toBeUndefined();
        });

        test('should create instance with only key specified', () => {
            const errorOptions: KomiErrorOptions = {
                key: testData.errorKeys.validation
            };
            const komiError: KomiError = new KomiError(errorOptions);

            expect(komiError.message).toBe('');
            expect(komiError.key).toBe(testData.errorKeys.validation);
            expect(komiError.httpStatusCode).toBe(500);
            expect(komiError.cause).toBeUndefined();
        });

        test('should create instance with only httpStatusCode specified', () => {
            const errorOptions: KomiErrorOptions = {
                httpStatusCode: testData.httpStatusCode.notFound
            };
            const komiError: KomiError = new KomiError(errorOptions);

            expect(komiError.message).toBe('');
            expect(komiError.key).toBe('');
            expect(komiError.httpStatusCode).toBe(testData.httpStatusCode.notFound);
            expect(komiError.cause).toBeUndefined();
        });
    });

    describe('when constructing with default options', () => {
        test('should create instance with all default values when no options provided', () => {
            const komiError: KomiError = new KomiError();

            expect(komiError).toBeInstanceOf(KomiError);
            expect(komiError).toBeInstanceOf(Error);
            expect(komiError.message).toBe('');
            expect(komiError.name).toBe('KomiError');
            expect(komiError.key).toBe('');
            expect(komiError.httpStatusCode).toBe(500);
            expect(komiError.cause).toBeUndefined();
            expect(komiError.stack).toBeDefined();
            expect(komiError.uuid).toBeDefined();
            expect(komiError.date).toBeDefined();
        });

        test('should create instance with undefined options', () => {
            const komiError: KomiError = new KomiError(undefined);

            expect(komiError.message).toBe('');
            expect(komiError.key).toBe('');
            expect(komiError.httpStatusCode).toBe(500);
            expect(komiError.cause).toBeUndefined();
        });
    });

    describe('when testing instance properties', () => {
        test('should generate unique UUIDs for different instances', () => {
            const error1: KomiError = new KomiError();
            const error2: KomiError = new KomiError();
            const error3: KomiError = new KomiError();

            expect(error1.uuid).not.toBe(error2.uuid);
            expect(error2.uuid).not.toBe(error3.uuid);
            expect(error1.uuid).not.toBe(error3.uuid);
            // check if UUIDs are in valid format
            expect(error1.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        });

        test('should have creation dates close to current time', () => {
            const beforeCreation: number = _getCurrentTimestamp();
            const komiError: KomiError = new KomiError();
            const afterCreation: number = _getCurrentTimestamp();

            expect(komiError.date).toBeInstanceOf(Date);
            expect(komiError.date.getTime()).toBeGreaterThanOrEqual(beforeCreation);
            expect(komiError.date.getTime()).toBeLessThanOrEqual(afterCreation);
        });

        test('should have different creation dates for instances created at different times', async () => {
            const error1: KomiError = new KomiError();
            await new Promise((resolve: (value: unknown) => void): void => {
                setTimeout(resolve, 1);
            });
            const error2: KomiError = new KomiError();

            expect(error1.date.getTime()).toBeLessThan(error2.date.getTime());
        });
    });

    describe('when testing getter methods', () => {
        test('should return correct uuid value', () => {
            const komiError: KomiError = new KomiError();
            const uuid: string = komiError.uuid;

            expect(typeof uuid).toBe('string');
            expect(uuid).toHaveLength(36);
            expect(uuid).toBe(komiError.uuid); // Should be consistent
        });

        test('should return correct date value', () => {
            const komiError: KomiError = new KomiError();
            const date: Date = komiError.date;

            expect(date).toBeInstanceOf(Date);
            expect(date).toBe(komiError.date); // Should be the same reference
        });

        test('should return correct key value', () => {
            const komiError: KomiError = new KomiError({
                key: testData.errorKeys.authentification
            });

            expect(komiError.key).toBe(testData.errorKeys.authentification);
        });

        test('should return correct httpStatusCode value', () => {
            const komiError: KomiError = new KomiError({
                httpStatusCode: testData.httpStatusCode.unauthorized
            });

            expect(komiError.httpStatusCode).toBe(testData.httpStatusCode.unauthorized);
        });
    });

    describe('when testing Error inheritance', () => {
        test('should be throwable as Error', () => {
            expect(() => {
                throw new KomiError({
                    message: 'Test error',
                    key: 'error.test'
                });
            }).toThrow(KomiError);
        });

        test('should be catchable as Error', () => {
            try {
                throw new KomiError({
                    message: 'Test error for catching',
                    key: 'error.catch.test'
                });
            } catch (error: unknown) {
                expect(error).toBeInstanceOf(Error);
                expect(error).toBeInstanceOf(KomiError);
                if (error instanceof KomiError) {
                    expect(error.message).toBe('Test error for catching');
                    expect(error.key).toBe('error.catch.test');
                }
            }
        });

        test('should maintain Error properties', () => {
            const komiError: KomiError = new KomiError({
                message: 'Error with stack trace'
            });

            expect(komiError.name).toBe('KomiError');
            expect(komiError.message).toBe('Error with stack trace');
            expect(komiError.stack).toBeDefined();
            expect(typeof komiError.stack).toBe('string');
        });
    });

    describe('when testing with complex cause types', () => {
        test('should handle validation error cause', () => {
            const validationCause: ValidationErrorCause = {
                field: 'email',
                value: 'invalid-email',
                rule: 'email_format'
            };
            const komiError = new KomiError<ValidationErrorCause>({
                message: 'Validation failed',
                key: testData.errorKeys.validation,
                httpStatusCode: testData.httpStatusCode.badRequest,
                cause: validationCause
            });

            expect(komiError.cause).toEqual(validationCause);
            expect(komiError.cause?.field).toBe('email');
            expect(komiError.cause?.value).toBe('invalid-email');
            expect(komiError.cause?.rule).toBe('email_format');
        });

        test('should handle nested error objects as cause', () => {
            const nestedCause = {
                primaryError: new Error('Primary failure'),
                secondaryError: new Error('Secondary failure'),
                context: {
                    userId: 123,
                    action: 'update_profile'
                }
            } as const;
            const komiError = new KomiError<typeof nestedCause>({
                message: 'Multiple errors occurred',
                key: 'error.multiple.failures',
                httpStatusCode: testData.httpStatusCode.INTERNAL_SERVER_ERROR,
                cause: nestedCause
            });

            expect(komiError.cause?.primaryError).toBeInstanceOf(Error);
            expect(komiError.cause?.secondaryError).toBeInstanceOf(Error);
            expect(komiError.cause?.context.userId).toBe(123);
            expect(komiError.cause?.context.action).toBe('update_profile');
        });
    });

    describe('when testing edge cases', () => {
        test('should handle empty string values and fallback to defaults for falsy numbers', () => {
            const komiError: KomiError = new KomiError({
                message: '',
                key: '',
                httpStatusCode: 0 // Should fallback to 500 since 0 is falsy
            });

            expect(komiError.message).toBe('');
            expect(komiError.key).toBe('');
            expect(komiError.httpStatusCode).toBe(500); // Defaults to 500 for falsy values
        });

        test('should handle null cause', () => {
            const komiError = new KomiError<null>({
                message: 'Error with null cause',
                cause: null
            });

            expect(komiError.cause).toBeNull();
        });

        test('should handle primitive cause types', () => {
            const stringCause = 'Simple string error';
            const numberCause = 404;
            const booleanCause = false;

            const stringError = new KomiError<string>({
                message: 'String cause error',
                cause: stringCause
            });
            const numberError = new KomiError<number>({
                message: 'Number cause error',
                cause: numberCause
            });
            const booleanError = new KomiError<boolean>({
                message: 'Boolean cause error',
                cause: booleanCause
            });

            expect(stringError.cause).toBe(stringCause);
            expect(numberError.cause).toBe(numberCause);
            expect(booleanError.cause).toBe(booleanCause);
        });
    });
});
