import { EventBus } from "../src/index";
import { setTimeout } from "timers";

test("create new instance", async () => {
  const eventBusInstance = await EventBus.create("myEventBus_test");
  await eventBusInstance.destroy();
});

test("send single message with one event", async () => {
  const eventBusInstance = await EventBus.create("myEventBus_test2");

  const MESSGAE_TO_SEND = "Hello";
  const EVENT = "msg";

  const result = await new Promise<string>(async (resolve, reject) => {
    await eventBusInstance.on<string>(EVENT, (payload) => {
      resolve(payload);
    });

    eventBusInstance.emit<string>(EVENT, MESSGAE_TO_SEND);
  });

  expect(result).toBe(MESSGAE_TO_SEND);

  await eventBusInstance.destroy();
});

test("send multiple messages with two event", async () => {
  const eventBusInstance = await EventBus.create("myEventBus_test3");

  const MESSGAE_TO_SEND1 = "Hello";
  const MESSGAE_TO_SEND2 = "World";
  const MESSGAE_TO_SEND3 = "How";
  const MESSGAE_TO_SEND4 = "are";
  const MESSGAE_TO_SEND5 = "you?";
  const EVENT1 = "hello";
  const EVENT2 = "ask";

  const result = await Promise.all([
    new Promise<string[]>(async (resolve, reject) => {
      let receivedMessages: string[] = [];

      await eventBusInstance.on<string>(EVENT1, (payload) => {
        receivedMessages.push(payload);

        if (receivedMessages.length === 2) {
          resolve(receivedMessages);
        }
      });

      eventBusInstance.emit<string>(EVENT1, MESSGAE_TO_SEND1);
      eventBusInstance.emit<string>(EVENT1, MESSGAE_TO_SEND2);
    }),
    new Promise<string[]>(async (resolve, reject) => {
      let receivedMessages: string[] = [];

      await eventBusInstance.on<string>(EVENT2, (payload) => {
        receivedMessages.push(payload);

        if (receivedMessages.length === 3) {
          resolve(receivedMessages);
        }
      });

      eventBusInstance.emit<string>(EVENT2, MESSGAE_TO_SEND3);
      eventBusInstance.emit<string>(EVENT2, MESSGAE_TO_SEND4);
      eventBusInstance.emit<string>(EVENT2, MESSGAE_TO_SEND5);
    }),
  ]);

  expect(result.length).toBe(2);
  expect(result[0].indexOf(MESSGAE_TO_SEND1) > -1).toBe(true);
  expect(result[0].indexOf(MESSGAE_TO_SEND2) > -1).toBe(true);
  expect(result[1].indexOf(MESSGAE_TO_SEND3) > -1).toBe(true);
  expect(result[1].indexOf(MESSGAE_TO_SEND4) > -1).toBe(true);
  expect(result[1].indexOf(MESSGAE_TO_SEND5) > -1).toBe(true);

  await eventBusInstance.destroy();
});

test("send multiple messages with two event on two buses", async () => {
  const eventBusInstanceA = await EventBus.create("myEventBus_testA");
  const eventBusInstanceB = await EventBus.create("myEventBus_testB");

  const MESSGAE_TO_SEND1 = "Hello";
  const MESSGAE_TO_SEND2 = "World";
  const MESSGAE_TO_SEND3 = "How";
  const MESSGAE_TO_SEND4 = "are";
  const MESSGAE_TO_SEND5 = "you?";
  const EVENT1 = "hello";
  const EVENT2 = "ask";

  const result = await Promise.all([
    new Promise<string[][]>(async (resolve, reject) => {
      let receivedMessagesInstanceA: string[] = [];
      let receivedMessagesInstanceB: string[] = [];

      await eventBusInstanceA.on<string>(EVENT1, (payload) => {
        receivedMessagesInstanceA.push(payload);

        if (
          receivedMessagesInstanceA.length === 1 &&
          receivedMessagesInstanceB.length === 1
        ) {
          resolve([receivedMessagesInstanceA, receivedMessagesInstanceB]);
        }
      });

      await eventBusInstanceB.on<string>(EVENT1, (payload) => {
        receivedMessagesInstanceB.push(payload);

        if (
          receivedMessagesInstanceA.length === 1 &&
          receivedMessagesInstanceB.length === 1
        ) {
          resolve([receivedMessagesInstanceA, receivedMessagesInstanceB]);
        }
      });

      eventBusInstanceA.emit<string>(EVENT1, MESSGAE_TO_SEND1);
      eventBusInstanceB.emit<string>(EVENT1, MESSGAE_TO_SEND2);
    }),
    new Promise<string[][]>(async (resolve, reject) => {
      let receivedMessagesInstanceA: string[] = [];
      let receivedMessagesInstanceB: string[] = [];

      await eventBusInstanceA.on<string>(EVENT2, (payload) => {
        receivedMessagesInstanceA.push(payload);

        if (
          receivedMessagesInstanceA.length === 2 &&
          receivedMessagesInstanceB.length === 1
        ) {
          resolve([receivedMessagesInstanceA, receivedMessagesInstanceB]);
        }
      });

      await eventBusInstanceB.on<string>(EVENT2, (payload) => {
        receivedMessagesInstanceB.push(payload);

        if (
          receivedMessagesInstanceA.length === 2 &&
          receivedMessagesInstanceB.length === 1
        ) {
          resolve([receivedMessagesInstanceA, receivedMessagesInstanceB]);
        }
      });

      eventBusInstanceA.emit<string>(EVENT2, MESSGAE_TO_SEND3);
      eventBusInstanceB.emit<string>(EVENT2, MESSGAE_TO_SEND4);
      eventBusInstanceA.emit<string>(EVENT2, MESSGAE_TO_SEND5);
    }),
  ]);

  //array [<event>][<instance>][<messages>]
  expect(result.length).toBe(2);
  expect(result[0].length).toBe(2);
  expect(result[1].length).toBe(2);
  expect(result[0][0].length).toBe(1);
  expect(result[0][1].length).toBe(1);
  expect(result[1][0].length).toBe(2);
  expect(result[1][1].length).toBe(1);

  expect(result[0][0].indexOf(MESSGAE_TO_SEND1) > -1).toBe(true);
  expect(result[0][1].indexOf(MESSGAE_TO_SEND1) > -1).toBe(false);
  expect(result[0][0].indexOf(MESSGAE_TO_SEND2) > -1).toBe(false);
  expect(result[0][1].indexOf(MESSGAE_TO_SEND2) > -1).toBe(true);

  expect(result[1][0].indexOf(MESSGAE_TO_SEND3) > -1).toBe(true);
  expect(result[1][1].indexOf(MESSGAE_TO_SEND3) > -1).toBe(false);
  expect(result[1][0].indexOf(MESSGAE_TO_SEND4) > -1).toBe(false);
  expect(result[1][1].indexOf(MESSGAE_TO_SEND4) > -1).toBe(true);
  expect(result[1][0].indexOf(MESSGAE_TO_SEND5) > -1).toBe(true);
  expect(result[1][1].indexOf(MESSGAE_TO_SEND5) > -1).toBe(false);

  await eventBusInstanceA.destroy();
  await eventBusInstanceB.destroy();
});

test("send single message with one event prefixed", async () => {
  const eventBusInstance = await EventBus.create("myEventBus_test5");

  const MESSGAE_TO_SEND = "Hello";
  const EVENT = "msg";

  const result = await new Promise<string>(async (resolve, reject) => {
    await eventBusInstance.on<string>(EVENT, (payload) => {
      resolve(payload);
    });

    eventBusInstance.emit<string>(EVENT, MESSGAE_TO_SEND);
  });

  expect(result).toBe(MESSGAE_TO_SEND);

  await eventBusInstance.destroy();
});

test("two independent prefixed instances with same event key", async () => {
  const eventBusInstance1 = await EventBus.create("myEventBus_test6_1");
  const eventBusInstance2 = await EventBus.create("myEventBus_test6_2");

  const MESSGAE_TO_SEND1 = "Hello";
  const MESSGAE_TO_SEND2 = "World";
  const EVENT = "msg";

  let messageReceived1: string[] = [];
  let messageReceived2: string[] = [];

  await eventBusInstance1.on<string>(EVENT, (payload) => {
    messageReceived1.push(payload);
  });

  await eventBusInstance2.on<string>(EVENT, (payload) => {
    messageReceived2.push(payload);
  });

  eventBusInstance1.emit(EVENT, MESSGAE_TO_SEND1);
  eventBusInstance2.emit(EVENT, MESSGAE_TO_SEND2);

  //Wait 3 seconds
  await new Promise((resolve) => setTimeout(resolve, 3000));

  expect(messageReceived1.indexOf(MESSGAE_TO_SEND1) > -1).toBe(true);
  expect(messageReceived1.indexOf(MESSGAE_TO_SEND2) > -1).toBe(false);

  expect(messageReceived2.indexOf(MESSGAE_TO_SEND1) > -1).toBe(false);
  expect(messageReceived2.indexOf(MESSGAE_TO_SEND2) > -1).toBe(true);

  await eventBusInstance1.destroy();
  await eventBusInstance2.destroy();
}, 10000);

test("ping successful", async () => {
  const eventBusInstance1 = await EventBus.create("myEventBus_test7_1");
  const eventBusInstance2 = await EventBus.create("myEventBus_test7_2");

  const result = await eventBusInstance1.ping();

  expect(result).toBe(true);

  await eventBusInstance1.destroy();
  await eventBusInstance2.destroy();
}, 10000);

test("ping failed", async () => {
  const eventBusInstance = await EventBus.create("myEventBus_test8_1");

  const result = await eventBusInstance.ping();

  expect(result).toBe(false);

  await eventBusInstance.destroy();
}, 10000);

test("reserved ping event error", async () => {
  const eventBusInstance = await EventBus.create("myEventBus_test9_1");

  const wrapperFunctionEmit = async () => {
    eventBusInstance.emit("ping", "");
  };

  const wrapperFunctionOn = async () => {
    await eventBusInstance.on("ping", () => {
      //Empty
    });
  };

  wrapperFunctionEmit().catch((e) =>
    expect(e.message).toBe("Reserved event name ping cannot be emitted")
  );
  wrapperFunctionOn().catch((e) =>
    expect(e.message).toBe("Reserved event name ping cannot be registered")
  );
});

test("reserved pong event error", async () => {
  const eventBusInstance = await EventBus.create("myEventBus_test10_1");

  const wrapperFunctionEmit = async () => {
    eventBusInstance.emit("pong", "");
  };

  const wrapperFunctionOn = async () => {
    await eventBusInstance.on("pong", () => {
      //Empty
    });
  };

  wrapperFunctionEmit().catch((e) =>
    expect(e.message).toBe("Reserved event name pong cannot be emitted")
  );
  wrapperFunctionOn().catch((e) =>
    expect(e.message).toBe("Reserved event name pong cannot be registered")
  );
});
