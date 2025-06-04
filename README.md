# 📦 komi-logger

[![npm version](https://badge.fury.io/js/komi-logger.svg)](https://badge.fury.io/js/komi-logger)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-Ready-orange.svg)](https://bun.sh/)

## 📌 Table of contents

- [📦 komi-logger](#-komi-logger)
    - [📌 Table of contents](#-table-of-contents)
    - [📝 Description](#-description)
        - [✨ Key Features](#-key-features)
        - [🏗️ Architecture](#-architecture)
    - [🚀 Usage](#-usage)
        - [Basic Setup](#basic-setup)
        - [Multiple Strategies](#multiple-strategies)
        - [Custom Strategies with Advanced Type Safety](#custom-strategies-with-advanced-type-safety)
            - [Typed Strategy Implementation](#typed-strategy-implementation)
            - [Body Intersection with Multiple Strategies](#body-intersection-with-multiple-strategies)
            - [Mixed Strategy Types](#mixed-strategy-types)
        - [Error Handling](#error-handling)
        - [Strategy Management](#strategy-management)
        - [Available Log Levels](#available-log-levels)
        - [Configuration Options](#configuration-options)
    - [🌟 Documentation](#-Documentation)
    - [⚖️ License](#-license)
    - [📧 Contact](#-contact)

## 📝 Description

**komi-logger** is a modular, type-safe, and strategy-based logging library designed specifically for Bun. It provides a flexible and high-performance logging system with the following key features:

### ✨ Key Features

- **🔄 Non-blocking Architecture**: Uses transform streams and async processing for optimal performance
- **🎯 Strategy Pattern**: Multiple logging strategies (console, file, custom) that can be used individually or combined
- **🛡️ Type Safety**: Full TypeScript support with strict typing for better development experience
- **⚡ High Performance**: Queue-based system with configurable buffer limits (default: 10,000 logs)
- **🎨 Flexible Logging Levels**: Support for ERROR, WARN, INFO, DEBUG, and LOG levels
- **🔗 Event-Driven**: Emits typed events for error handling and lifecycle management
- **🔧 Immutable API**: Each operation returns a new logger instance for better state management
- **📦 Built-in Strategies**: Console logger with colorization and file logger included
- **🛠️ Custom Strategy Support**: Easily create and register custom logging strategies with advanced type safety
- **📜 Body Intersection**: Automatically infers and enforces correct types based on selected strategies using TypeScript's body intersection feature

### 🏗️ Architecture

The logger uses a transform stream to process log entries asynchronously. Each log is queued and processed through the configured strategies. The system handles backpressure automatically and provides error isolation between strategies.

## 🚀 Usage

### Basic Setup

```typescript
import { Logger } from 'komi-logger';
import { ConsoleLoggerStrategy, FileLoggerStrategy } from 'komi-logger/strategies';

// Create a logger with console strategy
const logger = new Logger()
    .registerStrategy('console', new ConsoleLoggerStrategy(true)); // with colors

// Log messages
logger.info('Application started successfully');
logger.error('An error occurred');
logger.debug('Debug information', ['console']); // specific strategy
```

### Multiple Strategies

```typescript
// Combine multiple strategies
const logger = new Logger()
    .registerStrategy('console', new ConsoleLoggerStrategy(true))
    .registerStrategy('file', new FileLoggerStrategy('./app.log'));

// Logs to both console and file
logger.info('This goes to both strategies');

// Log to specific strategies only
logger.error('Critical error', ['file']); // only to file
logger.warn('Warning message', ['console']); // only to console
```

### Custom Strategies with Advanced Type Safety

The most powerful feature of komi-logger is its **advanced type safety system**. You can create custom logging strategies with typed objects, and TypeScript will automatically infer and enforce the correct types based on your selected strategies through **body intersection**.

#### Typed Strategy Implementation

When you implement `LoggerStrategy<TLogObject>`, you specify the exact type of object that strategy expects:

```typescript
import { Logger } from 'komi-logger';
import type { LoggerStrategy, LogLevels } from 'komi-logger/types';

// Define specific interfaces for different logging contexts
interface DatabaseLog {
    userId: number;
    action: string;
    metadata?: Record<string, unknown>;
}

interface ApiLog {
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
}

// Create typed strategies
class DatabaseLoggerStrategy implements LoggerStrategy<DatabaseLog> {
    public async log(level: LogLevels, date: Date, object: DatabaseLog): Promise<void> {
        // object is strictly typed as DatabaseLog
        await saveToDatabase({ 
            level, 
            date, 
            userId: object.userId,
            action: object.action,
            metadata: object.metadata 
        });
    }
}


// You can just put the type directly in the log method and it will be automatically inferred
class ApiLoggerStrategy implements LoggerStrategy {
    public async log(level: LogLevels, date: Date, object: ApiLog): Promise<void> {
        // object is strictly typed as ApiLog
        await sendToMonitoring(`${object.method} ${object.endpoint} - ${object.statusCode} (${object.responseTime}ms)`);
    }
}

// Register typed strategies
const logger = new Logger()
    .registerStrategy('database', new DatabaseLoggerStrategy())
    .registerStrategy('api', new ApiLoggerStrategy())
    .registerStrategy('console', new ConsoleLoggerStrategy()); // ConsoleLoggerStrategy<unknown>

// ✅ TypeScript enforces the correct types based on selected strategies
logger.info({ 
    userId: 123, 
    action: 'login',
    metadata: { ip: '192.168.1.1' } 
}, ['database']); // Only DatabaseLog type required

logger.error({
    endpoint: '/api/users',
    method: 'POST',
    statusCode: 500,
    responseTime: 1250
}, ['api']); // Only ApiLog type required

// ❌ TypeScript error: Missing required properties
logger.info({
    userId: 123,
    action: 'login'
    // Error: object doesn't match ApiLog interface
}, ['api']);
```

#### Body Intersection with Multiple Strategies

When using multiple strategies simultaneously, komi-logger creates a **type intersection** of all selected strategy types using the `BodiesIntersection` utility type:

```typescript
// ✅ TypeScript requires intersection of both types when using multiple strategies
logger.warn({
    userId: 123,
    action: 'failed_request',
    endpoint: '/api/users',
    method: 'POST', 
    statusCode: 400,
    responseTime: 200
}, ['database', 'api']); // Both DatabaseLog & ApiLog types required

// ❌ TypeScript error: Missing ApiLog properties
logger.error({
    userId: 123,
    action: 'error'
    // Error: Missing endpoint, method, statusCode, responseTime
}, ['database', 'api']);

// ✅ When no strategies specified, uses all strategies (intersection of all types)
logger.log({
    userId: 123,
    action: 'system_event',
    endpoint: '/health',
    method: 'GET',
    statusCode: 200,
    responseTime: 50
}); // DatabaseLog & ApiLog & unknown (console) intersection required
```

#### Mixed Strategy Types

You can mix typed and untyped strategies. The intersection will include `unknown` for untyped strategies:

```typescript
// Using typed + untyped strategies  
logger.info({
    userId: 123,
    action: 'mixed_log',
    additionalData: 'any value' // ✅ Allowed due to intersection with unknown
}, ['database', 'console']); // Type: DatabaseLog & unknown

// TypeScript allows additional properties when unknown is in the intersection
logger.debug({
    userId: 123,
    action: 'debug_info',
    debugLevel: 3,
    stackTrace: ['frame1', 'frame2'],
    customField: { nested: 'data' }
}, ['database', 'console']); // ✅ Extra properties allowed due to unknown intersection
```

### Error Handling

```typescript
const logger = new Logger()
    .registerStrategy('console', new ConsoleLoggerStrategy());

// Listen for errors
logger.on('error', (error) => {
    console.error('Logger error:', error);
});

// Listen for completion
logger.on('end', () => {
    console.log('All pending logs processed');
});
```

### Strategy Management

```typescript
let logger = new Logger();

// Add strategies
logger = logger
    .registerStrategy('console', new ConsoleLoggerStrategy())
    .registerStrategy('file', new FileLoggerStrategy('./app.log'));

// Add multiple strategies at once
logger = logger.registerStrategies([
    ['database', new DatabaseLoggerStrategy()],
    ['remote', new RemoteLoggerStrategy()]
]);

// Remove strategies
logger = logger.unregisterStrategy('database');
logger = logger.unregisterStrategies(['file', 'remote']);

// Clear all strategies
logger = logger.clearStrategies();
```

### Available Log Levels

```typescript
logger.error('Error message');   // ERROR level
logger.warn('Warning message');  // WARN level  
logger.info('Info message');     // INFO level
logger.debug('Debug message');   // DEBUG level
logger.log('Generic message');   // LOG level
```

### Configuration Options

```typescript
// Custom queue size (default: 10,000)
const logger = new Logger({}, 5000);

// With initial strategies
const logger = new Logger({
    console: new ConsoleLoggerStrategy(true),
    file: new FileLoggerStrategy('./app.log')
});
```

## 🌟 Documentation

- [Reference Documentation](https://komiriko.github.io/komi-logger)


## ⚖️ License

Distributed under the MIT License. See LICENSE for more information.

## 📧 Contact

Mail - [komiriko@pm.me](komiriko@pm.me)

[Project link](https://github.com/Komiriko/komi-logger)

