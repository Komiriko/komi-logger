/**
 * Gets the appropriate UUID function based on the runtime environment.
 * @returns A function that generates UUIDs (v7 for Bun, v4 for Node.js).
 */
export const randomUUID = async (): Promise<() => string> => (
    process.versions.bun
        ? await import('bun').then((bun) => bun.randomUUIDv7)
        : await import('crypto').then((crypto) => crypto.randomUUID)
);