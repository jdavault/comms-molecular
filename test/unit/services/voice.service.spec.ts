"use strict";

import { ServiceBroker } from "moleculer";

import VoiceService from "../../../services/voice/voice.service";
import {
  noCustomerUserRecord,
  unidContactRecord,
  validCaseManagerUserRecord,
  validSurgeonRecord,
  userAvailabilityAvailable,
  userAvailabilityOutOfOffice,
  userRecord,
} from "./fixtures/voice.fixtures";

describe("test 'voice' service", () => {
  describe("Test actions", () => {
    const broker = new ServiceBroker({ logger: false });
    const voiceService = broker.createService(VoiceService);
    const realBroker = broker.call.bind(broker);

    beforeAll(() => broker.start());
    afterAll(() => broker.stop());
    afterEach(() => {
      jest.clearAllMocks();
    });

    describe("test inbound surgeon logic flow", () => {
      beforeEach(() => {
        broker.call = jest
          .fn()
          .mockImplementation(async (actionName, params) => {
            if (actionName === "v1.sfdc-query.retrieveCustomers") {
              return Promise.resolve(validSurgeonRecord);
            }
            if (
              actionName === "v1.sfdc-query.retrieveUserAvailabilityDetails"
            ) {
              return Promise.resolve(userAvailabilityAvailable);
            }
            if (actionName === "v1.sfdc-query.retrieveUserById") {
              return Promise.resolve(userRecord);
            }
            return realBroker(actionName, params);
          });
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it("should call the inbound action succesfully given surgeon record", async () => {
        let spy = jest
          .spyOn(voiceService.schema, "getClient")
          .mockImplementation(() => {
            return {
              calls: {
                create: async (params: any) => {
                  return true;
                },
              },
            };
          });

        await broker.call("v1.voice.startInboundConference", {
          CallSid: "CA12345678",
          Direction: "inbound",
          From: "9845648971",
          To: "8005551234",
          CallType: "lab-team",
        });

        expect(spy).toHaveBeenCalledTimes(2);
      });
    });

    describe("test inbound unid contact logic flow", () => {
      beforeEach(() => {
        broker.call = jest
          .fn()
          .mockImplementation(async (actionName, params) => {
            if (actionName === "v1.sfdc-query.retrieveCustomers") {
              return Promise.resolve(unidContactRecord);
            }
            if (
              actionName === "v1.sfdc-query.retrieveUserAvailabilityDetails"
            ) {
              return Promise.resolve(userAvailabilityAvailable);
            }
            if (actionName === "v1.sfdc-query.retrieveUserById") {
              return Promise.resolve(userRecord);
            }

            return realBroker(actionName, params);
          });
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it("should call the inbound action succesfully given unid contact record", async () => {
        let spy = jest
          .spyOn(voiceService.schema, "getClient")
          .mockImplementation(() => {
            return {
              calls: {
                create: async (params: any) => {
                  return true;
                },
              },
            };
          });

        await broker.call("v1.voice.startInboundConference", {
          CallSid: "CA12345678",
          Direction: "inbound",
          From: "8048407345",
          To: "8005551234",
          CallType: "lab-team",
        });

        expect(spy).toHaveBeenCalledTimes(2);
      });
    });

    describe("test inbound logic flow with no customer results", () => {
      beforeEach(() => {
        broker.call = jest
          .fn()
          .mockImplementation(async (actionName, params) => {
            if (actionName === "v1.sfdc-query.retrieveCustomers") {
              return Promise.resolve(noCustomerUserRecord);
            }
            if (actionName === "v1.sfdc-query.retrieveUsers") {
              return Promise.resolve(validCaseManagerUserRecord);
            }
            return realBroker(actionName, params);
          });
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it("should call the inbound action succesfully given no contact record", async () => {
        let spy = jest
          .spyOn(voiceService.schema, "getClient")
          .mockImplementation(() => {
            return {
              calls: {
                create: async (params: any) => {
                  return true;
                },
              },
            };
          });

        await broker.call("v1.voice.startInboundConference", {
          CallSid: "CA12345678",
          Direction: "inbound",
          From: "8005554321",
          To: "8005551234",
          CallType: "lab-team",
        });

        expect(spy).toHaveBeenCalledTimes(2);
      });
    });

    describe("test inbound surgeon logic flow", () => {
      const userRecord: any = {
        totalSize: 1,
        done: true,
        records: [
          {
            attributes: {
              type: "User",
              url: "/services/data/v42.0/sobjects/User/0050R000009GL9ZQAW",
            },
            Id: "0050R000009GL9ZQAW",
            Name: "Luke Zbinden",
            Phone: "8041234567",
            MobilePhone: "8045673297",
            FederationIdentifier: "zbindenl3",
          },
        ] as any[],
      };

      beforeEach(() => {
        broker.call = jest
          .fn()
          .mockImplementation(async (actionName, params) => {
            if (actionName === "v1.sfdc-query.retrieveCustomers") {
              return Promise.resolve(validSurgeonRecord);
            }
            if (actionName === "v1.sfdc-query.retrieveUserByTwilioNumber") {
              return Promise.resolve(userRecord);
            }
            if (
              actionName === "v1.sfdc-query.retrieveUserAvailabilityDetails"
            ) {
              return Promise.resolve(userAvailabilityAvailable);
            }
            if (actionName === "v1.sfdc-query.retrieveUserById") {
              return Promise.resolve(userRecord);
            }

            return realBroker(actionName, params);
          });
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it("should call the inbound action succesfully given surgeon record", async () => {
        let spy = jest
          .spyOn(voiceService.schema, "getClient")
          .mockImplementation(() => {
            return {
              calls: {
                create: async (params: any) => {
                  return true;
                },
              },
            };
          });

        await broker.call("v1.voice.startInboundConference", {
          CallSid: "CA12345678",
          Direction: "inbound",
          From: "9845648971",
          To: "8005551234",
          CallType: "case manager",
        });

        expect(spy).toHaveBeenCalledTimes(2);
      });
    });

    describe("test inbound surgeon forwarded user logic flow", () => {
      beforeEach(() => {
        broker.call = jest
          .fn()
          .mockImplementation(async (actionName, params) => {
            if (actionName === "v1.sfdc-query.retrieveCustomers") {
              return Promise.resolve(validSurgeonRecord);
            }
            if (
              actionName === "v1.sfdc-query.retrieveUserAvailabilityDetails"
            ) {
              return Promise.resolve(userAvailabilityOutOfOffice);
            }
            if (actionName === "v1.sfdc-query.retrieveUserById") {
              return Promise.resolve(userRecord);
            }

            return realBroker(actionName, params);
          });
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it("should call the inbound action succesfully given surgeon record", async () => {
        let spy = jest
          .spyOn(voiceService.schema, "getClient")
          .mockImplementation(() => {
            return {
              calls: {
                create: async (params: any) => {
                  return true;
                },
              },
            };
          });

        await broker.call("v1.voice.startInboundConference", {
          CallSid: "CA12345678",
          Direction: "inbound",
          From: "9845648971",
          To: "8005551234",
          CallType: "lab-team",
        });
        expect(spy).toHaveBeenCalledTimes(2);
      });
    });

    describe("test inbound logic flow with no customer results and direct phone number", () => {
      beforeEach(() => {
        broker.call = jest
          .fn()
          .mockImplementation(async (actionName, params) => {
            if (actionName === "v1.sfdc-query.retrieveCustomers") {
              return Promise.resolve(noCustomerUserRecord);
            }
            if (actionName === "v1.sfdc-query.retrieveUsers") {
              return Promise.resolve(validCaseManagerUserRecord);
            }
            if (actionName === "v1.sfdc-query.retrieveUserByTwilioNumber") {
              return Promise.resolve(userRecord);
            }

            return realBroker(actionName, params);
          });
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it("should call the inbound action succesfully given no contact record", async () => {
        let spy = jest
          .spyOn(voiceService.schema, "getClient")
          .mockImplementation(() => {
            return {
              calls: {
                create: async (params: any) => {
                  return true;
                },
              },
            };
          });

        await broker.call("v1.voice.startInboundConference", {
          CallSid: "CA12345678",
          Direction: "inbound",
          From: "8005554321",
          To: "8005551234",
        });

        expect(spy).toHaveBeenCalledTimes(1);
      });
    });

    describe("test inbound logic flow with surgeon and direct phone number", () => {
      beforeEach(() => {
        broker.call = jest
          .fn()
          .mockImplementation(async (actionName, params) => {
            if (actionName === "v1.sfdc-query.retrieveCustomers") {
              return Promise.resolve(validSurgeonRecord);
            }
            if (actionName === "v1.sfdc-query.retrieveUsers") {
              return Promise.resolve(validCaseManagerUserRecord);
            }
            if (actionName === "v1.sfdc-query.retrieveUserByTwilioNumber") {
              return Promise.resolve(userRecord);
            }

            return realBroker(actionName, params);
          });
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it("should call the inbound action succesfully given surgeon record", async () => {
        let spy = jest
          .spyOn(voiceService.schema, "getClient")
          .mockImplementation(() => {
            return {
              calls: {
                create: async (params: any) => {
                  return true;
                },
              },
            };
          });

        await broker.call("v1.voice.startInboundConference", {
          CallSid: "CA12345678",
          Direction: "inbound",
          From: "8005554321",
          To: "8005551234",
        });

        expect(spy).toHaveBeenCalledTimes(1);
      });
    });

    describe("test inbound logic flow with unid contact and direct phone number", () => {
      beforeEach(() => {
        broker.call = jest
          .fn()
          .mockImplementation(async (actionName, params) => {
            if (actionName === "v1.sfdc-query.retrieveCustomers") {
              return Promise.resolve(unidContactRecord);
            }
            if (actionName === "v1.sfdc-query.retrieveUsers") {
              return Promise.resolve(validCaseManagerUserRecord);
            }
            if (actionName === "v1.sfdc-query.retrieveUserByTwilioNumber") {
              return Promise.resolve(userRecord);
            }

            return realBroker(actionName, params);
          });
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it("should call the inbound action succesfully given unid contact record", async () => {
        let spy = jest
          .spyOn(voiceService.schema, "getClient")
          .mockImplementation(() => {
            return {
              calls: {
                create: async (params: any) => {
                  return true;
                },
              },
            };
          });

        await broker.call("v1.voice.startInboundConference", {
          CallSid: "CA12345678",
          Direction: "inbound",
          From: "8005554321",
          To: "8005551234",
        });

        expect(spy).toHaveBeenCalledTimes(1);
      });
    });
  });
});
