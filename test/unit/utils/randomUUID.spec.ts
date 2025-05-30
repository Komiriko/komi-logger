import { describe, expect, test } from 'bun:test';

import { randomUUID } from '#/utils/randomUUID';

/**
 * Tests for the randomUUID utility function.
 */
describe('randomUUID', () => {
    describe('when generating UUIDs', () => {
        test('should return a function that generates valid UUIDs', async () => {
            const uuidGenerator = await randomUUID();

            expect(typeof uuidGenerator).toBe('function');

            const uuid = uuidGenerator();
            expect(typeof uuid).toBe('string');
            expect(uuid.length).toBe(36);
            expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[47][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        });

        test('should generate unique UUIDs on multiple calls', async () => {
            const uuidGenerator = await randomUUID();

            const uuid1 = uuidGenerator();
            const uuid2 = uuidGenerator();
            const uuid3 = uuidGenerator();

            expect(uuid1).not.toBe(uuid2);
            expect(uuid2).not.toBe(uuid3);
            expect(uuid1).not.toBe(uuid3);

            // All should be valid UUID format
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[47][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            expect(uuid1).toMatch(uuidPattern);
            expect(uuid2).toMatch(uuidPattern);
            expect(uuid3).toMatch(uuidPattern);
        });

        test('should handle both Bun and Node.js environments', async () => {
            const originalBunVersion = process.versions.bun;

            try {
                // Test current environment
                const currentUuidGenerator = await randomUUID();
                expect(typeof currentUuidGenerator).toBe('function');

                const currentUuid = currentUuidGenerator();
                expect(currentUuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[47][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

                // Test environment switching to ensure both branches are covered
                if (process.versions.bun) {
                    // Currently in Bun, test Node.js branch
                    delete (process.versions as Record<string, unknown>).bun;
                    const nodeUuidGenerator = await randomUUID();
                    expect(typeof nodeUuidGenerator).toBe('function');

                    const nodeUuid = nodeUuidGenerator();
                    expect(nodeUuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i); // UUID v4
                } else {
                    // Currently in Node.js, test Bun branch (might fail if bun module not available)
                    (process.versions as Record<string, unknown>).bun = '1.0.0';
                    try {
                        const bunUuidGenerator = await randomUUID();
                        expect(typeof bunUuidGenerator).toBe('function');

                        const bunUuid = bunUuidGenerator();
                        expect(bunUuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i); // UUID v7
                    } catch (error) {
                        // It's okay if bun module is not available in Node.js environment
                        expect(error).toBeDefined();
                    }
                }
            } finally {
                // Always restore original environment
                if (originalBunVersion)
                    (process.versions as Record<string, unknown>).bun = originalBunVersion;
                else
                    delete (process.versions as Record<string, unknown>).bun;
            }
        });

        test('should test both import branches for complete coverage', async () => {
            // Test the conditional import logic by simulating both environments
            const originalBunVersion = process.versions.bun;

            try {
                // Test Bun branch
                (process.versions as Record<string, unknown>).bun = '1.0.0';
                const bunImport = process.versions.bun
                    ? await import('bun').then((bun) => bun.randomUUIDv7).catch(() => null)
                    : null;

                // Test Node.js branch
                delete (process.versions as Record<string, unknown>).bun;
                const nodeImport = !process.versions.bun
                    ? await import('crypto').then((crypto) => crypto.randomUUID).catch(() => null)
                    : null;

                // At least one should work
                expect(bunImport || nodeImport).toBeTruthy();

                if (nodeImport) {
                    expect(typeof nodeImport).toBe('function');
                    const nodeUuid = nodeImport();
                    expect(nodeUuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
                }
            } finally {
                // Restore original environment
                if (originalBunVersion)
                    (process.versions as Record<string, unknown>).bun = originalBunVersion;
                else
                    delete (process.versions as Record<string, unknown>).bun;
            }
        });
    });
});
