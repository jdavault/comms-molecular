"use strict";

import { ServiceBroker } from "moleculer";

import NotifyService from "../../../services/notify.service";

describe("Test 'notify service' ", () => {
  const broker = new ServiceBroker({ logger: false });
  const realBroker = broker.call.bind(broker);
  const service = broker.createService(NotifyService);

  let mockClient: any;

  describe("Test 'notify.createInitialBinding'", () => {
    let spy: any;

    beforeEach(() => {
      spy = jest.spyOn(service.schema, "getClient").mockImplementation(() => {
        return {
          notify: {
            services: () => {
              return {
                bindings: {
                  create: () => {
                    return Promise.resolve("success");
                  },
                },
              };
            },
          },
        };
      });
    });
    afterEach(() => {
      spy.mockRestore();
    });

    it("should call twilio notify api to create a binding", () => {
      service.createBinding("test", "test", "test");
      expect(spy).toBeCalledTimes(1);
    });
  });

  describe("Test 'notify.createInitialBinding error'", () => {
    let spy: any;

    beforeEach(() => {
      spy = jest.spyOn(service.schema, "getClient").mockImplementation(() => {
        return {
          notify: {
            services: () => {
              return {
                bindings: {
                  create: () => {
                    throw new Error("error");
                  },
                },
              };
            },
          },
        };
      });
    });
    afterEach(() => {
      spy.mockRestore();
    });

    it("should throw an error", async () => {
      try {
        await service.createBinding("test", "test", "test");
      } catch (error) {
        expect(error).toBeTruthy;
      }
    });
  });

  describe("Test 'notify.sendNotification' ", () => {
    let spy: any;

    beforeEach(() => {
      spy = jest.spyOn(service.schema, "getClient").mockImplementation(() => {
        return {
          notify: {
            services: () => {
              return {
                notifications: {
                  create: () => {
                    return Promise.resolve("success");
                  },
                },
              };
            },
          },
        };
      });
    });

    afterEach(() => {
      spy.mockRestore();
    });

    it("should call twilio notify api to send a notification", () => {
      service.sendNotification("test", "test");
      expect(spy).toBeCalledTimes(1);
    });
  });

  describe("Test 'notify.sendNotification' ", () => {
    let spy: any;

    beforeEach(() => {
      spy = jest.spyOn(service.schema, "getClient").mockImplementation(() => {
        return {
          notify: {
            services: () => {
              return {
                notifications: {
                  create: () => {
                    throw new Error("error");
                  },
                },
              };
            },
          },
        };
      });
    });

    afterEach(() => {
      spy.mockRestore();
    });

    it("should throw an error", async () => {
      try {
        await service.sendNotification("test", "test");
      } catch (error) {
        expect(error).toBeTruthy;
      }
    });
  });
});
