# valkey-redis-eventbus

![NPM Version](https://img.shields.io/npm/v/valkey-redis-eventbus)
![Bundle Size](https://badgen.net/bundlephobia/minzip/valkey-redis-eventbus)
![Downloads](https://img.shields.io/npm/dw/valkey-redis-eventbus)

**Keywords:** redis, valkey, eventbus, event-bus, pubsub, nodejs, typescript, inter-process-communication, messaging, distributed, microservices

## Inspiration

This project is inspired by the excellent work in [yss14/node-redis-eventbus](https://github.com/yss14/node-redis-eventbus).

## Why It Exists

Modern distributed Node.js applications often require a simple, scalable, and reliable way to communicate between multiple processes or services. Traditional in-memory event emitters do not work across different instances or servers, and building a custom solution for inter-process communication can be complex and error-prone.

`valkey-redis-eventbus` solves this problem by leveraging Redis (Valkey) as a fast, robust pub/sub backend, enabling seamless event-based communication between multiple Node.js processes, containers, or microservices. This allows you to:
- Broadcast events to all listening services, regardless of where they run
- Decouple services and scale horizontally without losing event delivery
- Use a familiar event-driven API with the reliability and performance of Redis

A lightweight event bus implementation using Redis (Valkey) for scalable inter-process communication in Node.js applications.

## What's New
- Migrated to use the latest `redis` client (Valkey compatible)
- Improved TypeScript support and typings
- Updated build and test scripts
- Enhanced documentation and usage examples
- Bug fixes and performance improvements
- Fixed vulnerabilities present in old libraries and removed deprecated dependencies

## Installation
```bash
npm install --save valkey-redis-eventbus
# or
yarn add valkey-redis-eventbus
```

## Usage
### Async/Await Pattern
```typescript
import { EventBus } from 'valkey-redis-eventbus';

(async () => {
  // Create a new event bus instance with a unique identifier
  const eventBus = await EventBus.create('myEventBus');

  // Add listener and wait until it's bound successfully
  await eventBus.on('msg', (payload) => {
    console.log(`Received message: ${payload}`);
    eventBus.destroy();
    process.exit();
  });

  console.log('Listening to msg event');

  setTimeout(() => {
    // Emit event to all listeners on the 'msg' event
    eventBus.emit('msg', 'Hello');
  }, 5000);
})();

// Somewhere else in your code get reference to the event bus
const eventBus = EventBus.getByName('myEventBus');
eventBus.emit('msg', 'Hello?');
```

### Promise Style
```typescript
import { EventBus } from 'valkey-redis-eventbus';

EventBus.create('myEventBus').then((eventBus) => {
  eventBus.on('msg', (payload) => {
    console.log(`Received message: ${payload}`);
    eventBus.destroy();
    process.exit();
  }).then(() => {
    console.log('Listening to msg event');
    setTimeout(() => {
      eventBus.emit('msg', 'Hello');
    }, 5000);
  });
});

// Somewhere else in your code get reference to the event bus
const eventBus = EventBus.getByName('myEventBus');
eventBus.emit('msg', 'Hello?');
```

## API
```typescript
// Register listener for specific event. To avoid side effects, you have to wait for the promise to resolve
on<T>(event: string, callback: (payload: T) => void): Promise<void>;

// Emit event on the event bus with passed payload
emit<T>(event: string, payload: T): void;

// Sends ping to all listeners and waits maximum <timeout> milliseconds
// Returns true if at least <minResponseCount> clients responded, false otherwise
ping(timeout?: number, minResponseCount?: number): Promise<boolean>;

// Destroy this event bus instance and disconnect from redis
// Watch out: If there are other clients connected, these instances will not be destroyed!
destroy(): void;

// Property which indicates whether the event bus is connected
connected: boolean;

// Creates a new event bus with a unique name and optional redis client options
static create(name: string, clientOpts?: Redis.ClientOptions): Promise<EventBus>;

// Access existing event bus instance by unique name
static getByName(name: string): EventBus;
```

## TypeScript Support
This package ships with full TypeScript definitions.

## License
MIT
