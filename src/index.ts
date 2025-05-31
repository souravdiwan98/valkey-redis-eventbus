import { createClient, RedisClientType } from "redis";

export class EventBus {
  private static _eventBusInstances: Map<string, EventBus> = new Map();

  private readonly _pub: RedisClientType<any>;
  private readonly _sub: RedisClientType<any>;
  private readonly _name: string;
  private readonly _prefix: string;

  /**
   * Private constructor for EventBus. Use EventBus.create() to instantiate.
   * @param name Name of the EventBus instance
   * @param prefix Prefix for Redis channels
   * @param pub Redis client for publishing
   * @param sub Redis client for subscribing
   */
  private constructor(
    name: string,
    prefix: string,
    pub: RedisClientType<any>,
    sub: RedisClientType<any>
  ) {
    this._name = name;
    this._prefix = prefix;
    this._pub = pub;
    this._sub = sub;
  }

  /**
   * Initializes the EventBus by subscribing to internal 'ping' events.
   */
  private async init(): Promise<void> {
    await this._on<void>(
      "ping",
      () => {
        this._emit("pong", "", true);
      },
      true
    );
  }

  /**
   * Registers a callback for a specific event.
   * @param event Event name to listen for
   * @param callback Function to call when the event is received
   */
  public async on<T>(
    event: string,
    callback: (payload: T) => void
  ): Promise<void> {
    return this._on<T>(event, callback, false);
  }

  /**
   * Internal method to subscribe to an event channel.
   * @param event Event name
   * @param callback Callback to execute on event
   * @param internalCall Whether this is an internal event
   */
  private async _on<T>(
    event: string,
    callback: (payload: T) => void,
    internalCall = true
  ): Promise<void> {
    if (!internalCall && this.isReservedEventName(event)) {
      throw new Error(`Reserved event name ${event} cannot be registered`);
    }

    const fullChannel = this.getPrefixedChannelName(event);

    // Subscribe to the event channel
    await this._sub.subscribe(fullChannel, (message: any) => {
      // Already an object
      callback(message);
    });
  }

  /**
   * Emits an event with the given payload.
   * @param event Event name
   * @param payload Data to send
   */
  public emit<T>(event: string, payload: T): void {
    this._emit(event, payload, false);
  }

  /**
   * Internal method to publish an event.
   * @param event Event name
   * @param payload Data to send
   * @param internalCall Whether this is an internal event
   */
  private _emit<T>(event: string, payload: T, internalCall = true): void {
    if (!internalCall && this.isReservedEventName(event)) {
      throw new Error(`Reserved event name ${event} cannot be emitted`);
    }
    const message =
      typeof payload === "string" ? payload : JSON.stringify(payload);
    this._pub.publish(this.getPrefixedChannelName(event), message);
  }

  /**
   * Pings all EventBus instances and waits for pong responses.
   * @param timeout Timeout in ms to wait for responses
   * @param minResponseCount Minimum number of responses required
   * @returns Promise resolving to true if enough responses are received
   */
  public ping(
    timeout: number = 3000,
    minResponseCount: number = 1
  ): Promise<boolean> {
    return new Promise<boolean>(async (resolve) => {
      let responseCount = 0;

      const timeoutRef = setTimeout(() => {
        //+1 because our instance itself will respond
        resolve(responseCount >= minResponseCount + 1);
      }, timeout);

      await this._on<void>(
        "pong",
        () => {
          responseCount++;

          //+1 because our instance itself will respond
          if (responseCount >= minResponseCount + 1) {
            //Cleat timeout
            clearTimeout(timeoutRef);
            resolve(true);
          }
        },
        true
      );

      this._emit("ping", "", true);
    });
  }

  /**
   * Cleans up the EventBus instance and closes Redis connections.
   */
  public async destroy(): Promise<void> {
    await this._sub.unsubscribe();
    await this._sub.quit();
    await this._pub.quit();
    EventBus._eventBusInstances.delete(this._name);
  }

  /**
   * Returns true if both Redis clients are connected.
   */
  public get connected(): boolean {
    return this._pub.isOpen && this._sub.isOpen;
  }

  /**
   * Returns the channel name with prefix applied.
   * @param channel Channel name
   * @returns Prefixed channel name
   */
  private getPrefixedChannelName(channel: string): string {
    return `${this._prefix.length > 0 ? `${this._prefix}:` : ""}${channel}`;
  }

  /**
   * Checks if the event name is reserved (internal use).
   * @param event Event name
   * @returns True if reserved
   */
  private isReservedEventName(event: string): boolean {
    return event === "ping" || event === "pong";
  }

  /**
   * Creates a new EventBus instance or returns an existing one.
   * @param name Name of the EventBus instance
   * @param clientOpts Redis client options
   * @returns EventBus instance
   */
  public static async create(
    name: string,
    clientOpts: RedisClientType<any>["options"] = {},
    prefix: string = ""
  ): Promise<EventBus> {
    const existing = EventBus._eventBusInstances.get(name);
    if (existing) return existing;

    const channelPrefix = `${
      prefix !== undefined ? prefix : ""
    }node-redis-eventbus:${name}`;
    const pub = createClient(clientOpts) as RedisClientType<any>;
    const sub = createClient(clientOpts) as RedisClientType<any>;

    await Promise.all([pub.connect(), sub.connect()]);

    const instance = new EventBus(name, channelPrefix, pub, sub);
    await instance.init();
    EventBus._eventBusInstances.set(name, instance);
    return instance;
  }

  /**
   * Retrieves an EventBus instance by name.
   * @param name Name of the EventBus instance
   * @returns EventBus instance
   */
  public static getByName(name: string): EventBus {
    const instance = EventBus._eventBusInstances.get(name);
    if (!instance) throw new Error(`EventBus ${name} not found.`);
    return instance;
  }
}
