import { describe, expect, mock, test } from 'bun:test';

import { TypedEventEmitter } from '#/utils/typedEventEmitter';
import type { EventMap } from '#/utils/types/eventMap';

/**
 * Test data constants for consistent testing across all test suites.
 */
const testData = {
    eventNames: {
        testEvent: 'testEvent',
        dataEvent: 'dataEvent',
        stringEvent: 'stringEvent',
        objectEvent: 'objectEvent'
    } as const,
    payloads: {
        string: 'test payload',
        stringFirst: 'first emission',
        stringSecond: 'second emission',
        stringAgain: 'test payload again',
        object: { id: 123, value: 'test value' }
    } as const
} as const;

/**
 * Event map interfaces for type safety in tests.
 */
interface NoPayloadEventMap extends EventMap {
    testEvent: [];
}

interface StringEventMap extends EventMap {
    testEvent: [string];
}

interface ObjectEventMap extends EventMap {
    dataEvent: [{ id: number; value: string }];
}

interface MultiEventMap extends EventMap {
    testEvent: [string];
    dataEvent: [{ id: number; value: string }];
}

/**
 * Helper function to create a new TypedEventEmitter instance.
 */
function createEmitter<TEvents extends EventMap>(): TypedEventEmitter<TEvents> {
    return new TypedEventEmitter<TEvents>();
}

describe('TypedEventEmitter', (): void => {
    describe('Core Event Emission and Listening', (): void => {
        describe('emit and on', (): void => {
            test('should emit an event with no payload', (): void => {
                const emitter = createEmitter<NoPayloadEventMap>();
                const mockListener = mock();

                emitter.on(testData.eventNames.testEvent, mockListener);
                emitter.emit(testData.eventNames.testEvent);

                expect(mockListener).toHaveBeenCalledTimes(1);
                expect(mockListener).toHaveBeenCalledWith();
            });

            test('should emit an event with string payload', (): void => {
                const emitter = createEmitter<StringEventMap>();
                const mockListener = mock();

                emitter.on(testData.eventNames.testEvent, mockListener);
                emitter.emit(testData.eventNames.testEvent, testData.payloads.string);

                expect(mockListener).toHaveBeenCalledTimes(1);
                expect(mockListener).toHaveBeenCalledWith(testData.payloads.string);
            });

            test('should emit an event with object payload', (): void => {
                const emitter = createEmitter<ObjectEventMap>();
                const mockListener = mock();

                emitter.on(testData.eventNames.dataEvent, mockListener);
                emitter.emit(testData.eventNames.dataEvent, testData.payloads.object);

                expect(mockListener).toHaveBeenCalledTimes(1);
                expect(mockListener).toHaveBeenCalledWith(testData.payloads.object);
            });

            test('should handle multiple different event types', (): void => {
                const emitter = createEmitter<MultiEventMap>();
                const stringListener = mock();
                const objectListener = mock();

                emitter.on(testData.eventNames.testEvent, stringListener);
                emitter.on(testData.eventNames.dataEvent, objectListener);

                emitter.emit(testData.eventNames.testEvent, testData.payloads.string);
                emitter.emit(testData.eventNames.dataEvent, testData.payloads.object);

                expect(stringListener).toHaveBeenCalledTimes(1);
                expect(stringListener).toHaveBeenCalledWith(testData.payloads.string);
                expect(objectListener).toHaveBeenCalledTimes(1);
                expect(objectListener).toHaveBeenCalledWith(testData.payloads.object);
            });
        });

        describe('once', (): void => {
            test('should listen to an event only once', (): void => {
                const emitter = createEmitter<StringEventMap>();
                const mockListener = mock();

                emitter.once(testData.eventNames.testEvent, mockListener);
                emitter.emit(testData.eventNames.testEvent, testData.payloads.stringFirst);
                emitter.emit(testData.eventNames.testEvent, testData.payloads.stringSecond);

                expect(mockListener).toHaveBeenCalledTimes(1);
                expect(mockListener).toHaveBeenCalledWith(testData.payloads.stringFirst);
            });

            test('should work with multiple once listeners', (): void => {
                const emitter = createEmitter<StringEventMap>();
                const firstListener = mock();
                const secondListener = mock();

                emitter.once(testData.eventNames.testEvent, firstListener);
                emitter.once(testData.eventNames.testEvent, secondListener);

                emitter.emit(testData.eventNames.testEvent, testData.payloads.string);
                emitter.emit(testData.eventNames.testEvent, testData.payloads.stringAgain);

                expect(firstListener).toHaveBeenCalledTimes(1);
                expect(secondListener).toHaveBeenCalledTimes(1);
                expect(firstListener).toHaveBeenCalledWith(testData.payloads.string);
                expect(secondListener).toHaveBeenCalledWith(testData.payloads.string);
            });
        });
    });

    describe('Listener Management', (): void => {
        describe('addListener', (): void => {
            test('should add a listener for an event', (): void => {
                const emitter = createEmitter<StringEventMap>();
                const mockListener = mock();

                emitter.addListener(testData.eventNames.testEvent, mockListener);
                emitter.emit(testData.eventNames.testEvent, testData.payloads.string);

                expect(mockListener).toHaveBeenCalledTimes(1);
                expect(mockListener).toHaveBeenCalledWith(testData.payloads.string);
            });

            test('should add multiple listeners for the same event', (): void => {
                const emitter = createEmitter<StringEventMap>();
                const firstListener = mock();
                const secondListener = mock();

                emitter.addListener(testData.eventNames.testEvent, firstListener);
                emitter.addListener(testData.eventNames.testEvent, secondListener);
                emitter.emit(testData.eventNames.testEvent, testData.payloads.string);

                expect(firstListener).toHaveBeenCalledTimes(1);
                expect(firstListener).toHaveBeenCalledWith(testData.payloads.string);
                expect(secondListener).toHaveBeenCalledTimes(1);
                expect(secondListener).toHaveBeenCalledWith(testData.payloads.string);
            });

            test('should allow the same listener to be added multiple times', (): void => {
                const emitter = createEmitter<StringEventMap>();
                const mockListener = mock();

                emitter.addListener(testData.eventNames.testEvent, mockListener);
                emitter.addListener(testData.eventNames.testEvent, mockListener);
                emitter.emit(testData.eventNames.testEvent, testData.payloads.string);

                expect(mockListener).toHaveBeenCalledTimes(2);
            });
        });

        describe('removeListener', (): void => {
            test('should remove a specific listener', (): void => {
                const emitter = createEmitter<StringEventMap>();
                const firstListener = mock();
                const secondListener = mock();

                emitter.addListener(testData.eventNames.testEvent, firstListener);
                emitter.addListener(testData.eventNames.testEvent, secondListener);
                emitter.removeListener(testData.eventNames.testEvent, firstListener);
                emitter.emit(testData.eventNames.testEvent, testData.payloads.string);

                expect(firstListener).not.toHaveBeenCalled();
                expect(secondListener).toHaveBeenCalledTimes(1);
                expect(secondListener).toHaveBeenCalledWith(testData.payloads.string);
            });

            test('should handle removal of non-existent listener gracefully', (): void => {
                const emitter = createEmitter<StringEventMap>();
                const existingListener = mock();
                const nonExistentListener = mock();

                emitter.addListener(testData.eventNames.testEvent, existingListener);
                emitter.removeListener(testData.eventNames.testEvent, nonExistentListener);
                emitter.emit(testData.eventNames.testEvent, testData.payloads.string);

                expect(existingListener).toHaveBeenCalledTimes(1);
                expect(nonExistentListener).not.toHaveBeenCalled();
            });
        });

        describe('off', (): void => {
            test('should remove a specific listener (alias for removeListener)', (): void => {
                const emitter = createEmitter<StringEventMap>();
                const firstListener = mock();
                const secondListener = mock();

                emitter.addListener(testData.eventNames.testEvent, firstListener);
                emitter.addListener(testData.eventNames.testEvent, secondListener);
                emitter.off(testData.eventNames.testEvent, firstListener);
                emitter.emit(testData.eventNames.testEvent, testData.payloads.string);

                expect(firstListener).not.toHaveBeenCalled();
                expect(secondListener).toHaveBeenCalledTimes(1);
                expect(secondListener).toHaveBeenCalledWith(testData.payloads.string);
            });

            test('should behave identically to removeListener', (): void => {
                const emitter1 = createEmitter<StringEventMap>();
                const emitter2 = createEmitter<StringEventMap>();
                const listener1 = mock();
                const listener2 = mock();
                const listener3 = mock();
                const listener4 = mock();

                // Set up identical scenarios
                emitter1.addListener(testData.eventNames.testEvent, listener1);
                emitter1.addListener(testData.eventNames.testEvent, listener2);
                emitter2.addListener(testData.eventNames.testEvent, listener3);
                emitter2.addListener(testData.eventNames.testEvent, listener4);

                // Use different methods
                emitter1.removeListener(testData.eventNames.testEvent, listener1);
                emitter2.off(testData.eventNames.testEvent, listener3);

                // Verify identical behavior
                expect(emitter1.listenerCount(testData.eventNames.testEvent))
                    .toBe(emitter2.listenerCount(testData.eventNames.testEvent));
            });
        });
    });

    describe('Listener Introspection', (): void => {
        describe('listenerCount', (): void => {
            test('should return the number of listeners for an event', (): void => {
                const emitter = createEmitter<StringEventMap>();
                const firstListener = mock();
                const secondListener = mock();

                expect(emitter.listenerCount(testData.eventNames.testEvent)).toBe(0);

                emitter.addListener(testData.eventNames.testEvent, firstListener);
                emitter.addListener(testData.eventNames.testEvent, secondListener);
                expect(emitter.listenerCount(testData.eventNames.testEvent)).toBe(2);

                emitter.removeListener(testData.eventNames.testEvent, firstListener);
                expect(emitter.listenerCount(testData.eventNames.testEvent)).toBe(1);

                emitter.removeListener(testData.eventNames.testEvent, secondListener);
                expect(emitter.listenerCount(testData.eventNames.testEvent)).toBe(0);
            });

            test('should return zero for non-existent events', (): void => {
                const emitter = createEmitter<StringEventMap>();
                expect(emitter.listenerCount(testData.eventNames.testEvent)).toBe(0);
            });
        });

        describe('listeners', (): void => {
            test('should return the listeners for an event', (): void => {
                const emitter = createEmitter<StringEventMap>();
                const firstListener = mock();
                const secondListener = mock();

                expect(emitter.listeners(testData.eventNames.testEvent)).toHaveLength(0);

                emitter.addListener(testData.eventNames.testEvent, firstListener);
                emitter.addListener(testData.eventNames.testEvent, secondListener);
                const listeners = emitter.listeners(testData.eventNames.testEvent);
                expect(listeners).toHaveLength(2);
                expect(listeners).toContain(firstListener);
                expect(listeners).toContain(secondListener);

                emitter.removeListener(testData.eventNames.testEvent, firstListener);
                const updatedListeners = emitter.listeners(testData.eventNames.testEvent);
                expect(updatedListeners).toHaveLength(1);
                expect(updatedListeners).not.toContain(firstListener);
                expect(updatedListeners).toContain(secondListener);

                emitter.removeListener(testData.eventNames.testEvent, secondListener);
                const finalListeners = emitter.listeners(testData.eventNames.testEvent);
                expect(finalListeners).toHaveLength(0);
                expect(finalListeners).not.toContain(firstListener);
                expect(finalListeners).not.toContain(secondListener);
            });

            test('should return a copy of the listeners array', (): void => {
                const emitter = createEmitter<StringEventMap>();
                const mockListener = mock();

                emitter.addListener(testData.eventNames.testEvent, mockListener);
                const listeners1 = emitter.listeners(testData.eventNames.testEvent);
                const listeners2 = emitter.listeners(testData.eventNames.testEvent);

                expect(listeners1).not.toBe(listeners2); // Different array instances
                expect(listeners1).toEqual(listeners2); // Same content
            });
        });

        describe('rawListeners', (): void => {
            test('should return the raw listeners for an event', (): void => {
                const emitter = createEmitter<StringEventMap>();
                const firstListener = mock();
                const secondListener = mock();

                expect(emitter.rawListeners(testData.eventNames.testEvent)).toHaveLength(0);

                emitter.addListener(testData.eventNames.testEvent, firstListener);
                emitter.addListener(testData.eventNames.testEvent, secondListener);
                const rawListeners = emitter.rawListeners(testData.eventNames.testEvent);
                expect(rawListeners).toHaveLength(2);
                expect(rawListeners).toContain(firstListener);
                expect(rawListeners).toContain(secondListener);

                emitter.removeListener(testData.eventNames.testEvent, firstListener);
                const updatedRawListeners = emitter.rawListeners(testData.eventNames.testEvent);
                expect(updatedRawListeners).toHaveLength(1);
                expect(updatedRawListeners).not.toContain(firstListener);
                expect(updatedRawListeners).toContain(secondListener);

                emitter.removeListener(testData.eventNames.testEvent, secondListener);
                const finalRawListeners = emitter.rawListeners(testData.eventNames.testEvent);
                expect(finalRawListeners).toHaveLength(0);
                expect(finalRawListeners).not.toContain(firstListener);
                expect(finalRawListeners).not.toContain(secondListener);
            });

            test('should behave consistently with listeners method', (): void => {
                const emitter = createEmitter<StringEventMap>();
                const mockListener = mock();

                emitter.addListener(testData.eventNames.testEvent, mockListener);

                const listeners = emitter.listeners(testData.eventNames.testEvent);
                const rawListeners = emitter.rawListeners(testData.eventNames.testEvent);

                expect(listeners).toEqual(rawListeners);
                expect(listeners.length).toBe(rawListeners.length);
            });
        });
    });

    describe('Advanced Listener Management', (): void => {
        describe('prependListener', (): void => {
            test('should add a listener to the beginning of the listeners array', (): void => {
                const emitter = createEmitter<StringEventMap>();
                const firstListener = mock();
                const secondListener = mock();

                emitter.addListener(testData.eventNames.testEvent, firstListener);
                emitter.prependListener(testData.eventNames.testEvent, secondListener);

                const listeners = emitter.listeners(testData.eventNames.testEvent);
                expect(listeners).toHaveLength(2);
                expect(listeners[0]).toBe(secondListener);
                expect(listeners[1]).toBe(firstListener);

                emitter.emit(testData.eventNames.testEvent, testData.payloads.string);
                expect(secondListener).toHaveBeenCalledTimes(1);
                expect(secondListener).toHaveBeenCalledWith(testData.payloads.string);
                expect(firstListener).toHaveBeenCalledTimes(1);
                expect(firstListener).toHaveBeenCalledWith(testData.payloads.string);
            });

            test('should maintain correct order with multiple prepended listeners', (): void => {
                const emitter = createEmitter<StringEventMap>();
                const firstListener = mock();
                const secondListener = mock();
                const thirdListener = mock();

                emitter.addListener(testData.eventNames.testEvent, firstListener);
                emitter.prependListener(testData.eventNames.testEvent, secondListener);
                emitter.prependListener(testData.eventNames.testEvent, thirdListener);

                const listeners = emitter.listeners(testData.eventNames.testEvent);
                expect(listeners).toHaveLength(3);
                expect(listeners[0]).toBe(thirdListener);
                expect(listeners[1]).toBe(secondListener);
                expect(listeners[2]).toBe(firstListener);

                emitter.emit(testData.eventNames.testEvent, testData.payloads.string);
                expect(thirdListener).toHaveBeenCalledTimes(1);
                expect(secondListener).toHaveBeenCalledTimes(1);
                expect(firstListener).toHaveBeenCalledTimes(1);
            });
        });

        describe('prependOnceListener', (): void => {
            test('should add a one-time listener to the beginning of the listeners array', (): void => {
                const emitter = createEmitter<StringEventMap>();
                const permanentListener = mock();
                const onceListener = mock();

                emitter.addListener(testData.eventNames.testEvent, permanentListener);
                emitter.prependOnceListener(testData.eventNames.testEvent, onceListener);

                const listenersBeforeEmit = emitter.listeners(testData.eventNames.testEvent);
                expect(listenersBeforeEmit).toHaveLength(2);
                expect(listenersBeforeEmit[0]).toBe(onceListener);
                expect(listenersBeforeEmit[1]).toBe(permanentListener);

                // First emission
                emitter.emit(testData.eventNames.testEvent, testData.payloads.string);
                expect(onceListener).toHaveBeenCalledTimes(1);
                expect(onceListener).toHaveBeenCalledWith(testData.payloads.string);
                expect(permanentListener).toHaveBeenCalledTimes(1);
                expect(permanentListener).toHaveBeenCalledWith(testData.payloads.string);

                // Verify once listener was removed
                const listenersAfterFirstEmit = emitter.listeners(testData.eventNames.testEvent);
                expect(listenersAfterFirstEmit).toHaveLength(1);
                expect(listenersAfterFirstEmit[0]).toBe(permanentListener);

                // Second emission
                emitter.emit(testData.eventNames.testEvent, testData.payloads.stringAgain);
                expect(onceListener).toHaveBeenCalledTimes(1); // Should not be called again
                expect(permanentListener).toHaveBeenCalledTimes(2); // Should be called again
            });

            test('should handle multiple prepended once listeners correctly', (): void => {
                const emitter = createEmitter<StringEventMap>();
                const permanentListener = mock();
                const firstOnceListener = mock();
                const secondOnceListener = mock();

                emitter.addListener(testData.eventNames.testEvent, permanentListener);
                emitter.prependOnceListener(testData.eventNames.testEvent, firstOnceListener);
                emitter.prependOnceListener(testData.eventNames.testEvent, secondOnceListener);

                const listenersBeforeEmit = emitter.listeners(testData.eventNames.testEvent);
                expect(listenersBeforeEmit).toHaveLength(3);
                expect(listenersBeforeEmit[0]).toBe(secondOnceListener);
                expect(listenersBeforeEmit[1]).toBe(firstOnceListener);
                expect(listenersBeforeEmit[2]).toBe(permanentListener);

                // First emission
                emitter.emit(testData.eventNames.testEvent, testData.payloads.string);
                expect(secondOnceListener).toHaveBeenCalledTimes(1);
                expect(firstOnceListener).toHaveBeenCalledTimes(1);
                expect(permanentListener).toHaveBeenCalledTimes(1);

                // Verify both once listeners were removed
                const listenersAfterFirstEmit = emitter.listeners(testData.eventNames.testEvent);
                expect(listenersAfterFirstEmit).toHaveLength(1);
                expect(listenersAfterFirstEmit[0]).toBe(permanentListener);

                // Second emission
                emitter.emit(testData.eventNames.testEvent, testData.payloads.stringAgain);
                expect(secondOnceListener).toHaveBeenCalledTimes(1); // Should not be called again
                expect(firstOnceListener).toHaveBeenCalledTimes(1); // Should not be called again
                expect(permanentListener).toHaveBeenCalledTimes(2); // Should be called again
            });
        });
    });

    describe('Edge Cases and Error Handling', (): void => {
        test('should handle events with no listeners gracefully', (): void => {
            const emitter = createEmitter<StringEventMap>();

            expect((): void => {
                emitter.emit(testData.eventNames.testEvent, testData.payloads.string);
            }).not.toThrow();

            expect(emitter.listenerCount(testData.eventNames.testEvent)).toBe(0);
        });

        test('should handle removing listeners that were never added', (): void => {
            const emitter = createEmitter<StringEventMap>();
            const neverAddedListener = mock();

            expect((): void => {
                emitter.removeListener(testData.eventNames.testEvent, neverAddedListener);
                emitter.off(testData.eventNames.testEvent, neverAddedListener);
            }).not.toThrow();
        });

        test('should maintain listener order consistency across operations', (): void => {
            const emitter = createEmitter<StringEventMap>();
            const listeners = Array.from({ length: 5 }, () => mock());

            // Add listeners in specific order
            listeners.forEach((listener, index): void => {
                if (index % 2 === 0)
                    emitter.addListener(testData.eventNames.testEvent, listener);
                else
                    emitter.prependListener(testData.eventNames.testEvent, listener);
            });

            // Verify order is maintained
            const currentListeners = emitter.listeners(testData.eventNames.testEvent);
            expect(currentListeners).toHaveLength(5);

            // Remove some listeners and verify order is still consistent
            emitter.removeListener(testData.eventNames.testEvent, listeners[1]);
            emitter.removeListener(testData.eventNames.testEvent, listeners[3]);

            const remainingListeners = emitter.listeners(testData.eventNames.testEvent);
            expect(remainingListeners).toHaveLength(3);
            expect(remainingListeners).toContain(listeners[0]);
            expect(remainingListeners).toContain(listeners[2]);
            expect(remainingListeners).toContain(listeners[4]);
        });
    });
});

