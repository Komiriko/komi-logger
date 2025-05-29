import { EventEmitter } from 'events';

import type { EventMap } from './types/eventMap';

/**
 * A generic event emitter class that allows for type-safe event handling.
 *
 * @template TEvents - The type of events and their payloads.
 */
export class TypedEventEmitter<TEvents extends EventMap> extends EventEmitter {
    /**
     * Emits an event with the specified payload.
     *
     * @template KEvent - The type of event to emit.
     * @param event - The event name to emit.
     * @param payload - The data to send with the event.
     * @returns Whether the event had listeners.
     *
     * @example
     * ```typescript
     * class MyEmitter extends TypedEventEmitter<{ foo: [string] }> {}
     * const emitter = new MyEmitter();
     * emitter.emit('foo', 'hello');
     * ```
     */
    public override emit<KEvent extends keyof TEvents>(event: KEvent, ...args: TEvents[KEvent]): boolean {
        return super.emit(event as string, ...args as unknown[]);
    }

    /**
     * Registers an event listener for the specified event.
     *
     * @template KEvent - The type of event to listen for.
     * @param event - The event name to listen for.
     * @param listener - The callback function that handles the event.
     * @returns This instance for chaining.
     *
     * @example
     * ```typescript
     * class MyEmitter extends TypedEventEmitter<{ foo: [string] }> {}
     * const emitter = new MyEmitter();
     * emitter.on('foo', payload => {
     *   console.log(payload); // payload is string
     * });
     * ```
     */
    public override on<KEvent extends keyof TEvents>(event: KEvent, listener: (...args: TEvents[KEvent]) => void): this {
        return super.on(event as string, listener);
    }

    /**
     * Registers a one-time event listener for the specified event.
     *
     * @template KEvent - The type of event to listen for.
     * @param event - The event name to listen for.
     * @param listener - The callback function that handles the event.
     * @returns This instance for chaining.
     *
     * @example
     * ```typescript
     * class MyEmitter extends TypedEventEmitter<{ bar: [number] }> {}
     * const emitter = new MyEmitter();
     * emitter.once('bar', payload => {
     *   console.log(payload); // payload is number
     * });
     * ```
     */
    public override once<KEvent extends keyof TEvents>(event: KEvent, listener: (...args: TEvents[KEvent]) => void): this {
        return super.once(event as string, listener);
    }

    /**
     * Registers an event listener for the specified event (alias for on).
     *
     * @template KEvent - The type of event to listen for.
     * @param event - The event name to listen for.
     * @param listener - The callback function that handles the event.
     * @returns This instance for chaining.
     *
     * @example
     * ```typescript
     * class MyEmitter extends TypedEventEmitter<{ baz: [boolean] }> {}
     * const emitter = new MyEmitter();
     * emitter.addListener('baz', payload => {
     *   console.log(payload); // payload is boolean
     * });
     * ```
     */
    public override addListener<KEvent extends keyof TEvents>(event: KEvent, listener: (...args: TEvents[KEvent]) => void): this {
        return super.addListener(event as string, listener);
    }

    /**
     * Removes an event listener for the specified event.
     *
     * @template KEvent - The type of event.
     * @param event - The event name.
     * @param listener - The callback function to remove.
     * @returns This instance for chaining.
     *
     * @example
     * ```typescript
     * class MyEmitter extends TypedEventEmitter<{ foo: string }> {}
     * const emitter = new MyEmitter();
     * const handler = (payload: string) => {};
     * emitter.on('foo', handler);
     * emitter.removeListener('foo', handler);
     * ```
     */
    public override removeListener<KEvent extends keyof TEvents>(event: KEvent, listener: (...args: TEvents[KEvent]) => void): this {
        return super.removeListener(event as string, listener);
    }

    /**
     * Removes an event listener for the specified event (alias for removeListener).
     *
     * @template KEvent - The type of event.
     * @param event - The event name.
     * @param listener - The callback function to remove.
     * @returns This instance for chaining.
     *
     * @example
     * ```typescript
     * class MyEmitter extends TypedEventEmitter<{ foo: [string] }> {}
     * const emitter = new MyEmitter();
     * const handler = (payload: string) => {};
     * emitter.on('foo', handler);
     * emitter.off('foo', handler);
     * ```
     */
    public override off<KEvent extends keyof TEvents>(event: KEvent, listener: (...args: TEvents[KEvent]) => void): this {
        return super.off(event as string, listener);
    }

    /**
     * Returns the number of listeners for the specified event.
     *
     * @template KEvent - The type of event.
     * @param event - The event name.
     * @returns The number of listeners.
     *
     * @example
     * ```typescript
     * class MyEmitter extends TypedEventEmitter<{ foo: [string] }> {}
     * const emitter = new MyEmitter();
     * emitter.on('foo', () => {});
     * const count = emitter.listenerCount('foo');
     * ```
     */
    public override listenerCount<KEvent extends keyof TEvents>(event: KEvent): number {
        return super.listenerCount(event as string);
    }

    /**
     * Returns a copy of the array of listeners for the specified event.
     *
     * @template KEvent - The type of event.
     * @param event - The event name.
     * @returns An array of listener functions.
     *
     * @example
     * ```typescript
     * class MyEmitter extends TypedEventEmitter<{ foo: [string] }> {}
     * const emitter = new MyEmitter();
     * emitter.on('foo', () => {});
     * const listeners = emitter.listeners('foo');
     * ```
     */
    public override listeners<KEvent extends keyof TEvents>(event: KEvent): ((...args: TEvents[KEvent]) => void)[] {
        return super.listeners(event as string) as ((...args: TEvents[KEvent]) => void)[];
    }

    /**
     * Returns a copy of the array of raw listeners for the specified event.
     *
     * @template KEvent - The type of event.
     * @param event - The event name.
     * @returns An array of raw listener functions.
     *
     * @example
     * ```typescript
     * class MyEmitter extends TypedEventEmitter<{ foo: [string] }> {}
     * const emitter = new MyEmitter();
     * emitter.on('foo', () => {});
     * const rawListeners = emitter.rawListeners('foo');
     * ```
     */
    public override rawListeners<KEvent extends keyof TEvents>(event: KEvent): ((...args: TEvents[KEvent]) => void)[] {
        return super.rawListeners(event as string) as ((...args: TEvents[KEvent]) => void)[];
    }

    /**
     * Adds a listener to the beginning of the listeners array for the specified event.
     *
     * @template KEvent - The type of event.
     * @param event - The event name.
     * @param listener - The callback function to add.
     * @returns This instance for chaining.
     *
     * @example
     * ```typescript
     * class MyEmitter extends TypedEventEmitter<{ foo: [string] }> {}
     * const emitter = new MyEmitter();
     * emitter.prependListener('foo', payload => {
     *   console.log(payload);
     * });
     * ```
     */
    public override prependListener<KEvent extends keyof TEvents>(event: KEvent, listener: (...args: TEvents[KEvent]) => void): this {
        return super.prependListener(event as string, listener);
    }

    /**
     * Adds a one-time listener to the beginning of the listeners array for the specified event.
     *
     * @template KEvent - The type of event.
     * @param event - The event name.
     * @param listener - The callback function to add.
     * @returns This instance for chaining.
     *
     * @example
     * ```typescript
     * class MyEmitter extends TypedEventEmitter<{ foo: [string] }> {}
     * const emitter = new MyEmitter();
     * emitter.prependOnceListener('foo', payload => {
     *   console.log(payload);
     * });
     * ```
     */
    public override prependOnceListener<KEvent extends keyof TEvents>(event: KEvent, listener: (...args: TEvents[KEvent]) => void): this {
        return super.prependOnceListener(event as string, listener);
    }
}