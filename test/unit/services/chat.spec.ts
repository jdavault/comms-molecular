"use strict";

import { Context, Errors, ServiceBroker } from "moleculer";
import TestService from "../../../services/chat/chat.service";
import {
  TwilioInboundMessage,
  TwilioMessageStatus,
} from "../../../services/chat/chat.models";
import OrchestratorCloudEvent from "../../../services/models/OrchestratorCloudEvent";

const enum PUB_SUB {
  QUEUED = "medicrea.chat.queued",
  SENT = "medicrea.chat.sent",
  DELIVERED = "medicrea.chat.delivered",
  ERROR = "medicrea.chat.error",
}

const inboundResponse: TwilioInboundMessage = {
  type: "lab-team",
  ToCountry: "US",
  ToState: "IA",
  SmsMessageSid: "SM47383ab41756f543466b61dd0553dbfb",
  NumMedia: "0",
  ToCity: "MUSCATINE",
  FromZip: "78232",
  SmsSid: "SM47383ab41756f543466b61dd0553dbfb",
  FromState: "TX",
  SmsStatus: "received",
  FromCity: "SAN ANTONIO",
  Body: "Test",
  FromCountry: "US",
  To: "+15636075966",
  MessagingServiceSid: "MG344318249d1144b4dbad9effa4904abe",
  ToZip: "52761",
  NumSegments: "1",
  MessageSid: "SM47383ab41756f543466b61dd0553dbfb",
  AccountSid: "AC11947859c8448f9015066e4d6d9858bf",
  From: "+12102867939",
  ApiVersion: "2010-04-01",
};

const statusResponse: TwilioMessageStatus = {
  type: "consultant",
  SmsSid: "SMXXXX",
  SmsStatus: "delivered",
  MessageStatus: "delivered",
  To: "+11231231234",
  MessagingServiceSid: "MGXXXX",
  MessageSid: "SMXXXX",
  AccountSid: "ACXXXX",
  From: "+11231231234",
  ApiVersion: "2010-04-01",
};

describe("Test 'chat' service", () => {
  describe("Test actions", () => {
    const broker = new ServiceBroker({ logger: false });
    const service = broker.createService(TestService);

    beforeAll(() => broker.start());
    afterAll(() => broker.stop());
    afterEach(() => {
      jest.clearAllMocks();
    });

    describe("Test 'chat.inbound'", () => {
      it("should call the inbound action successfully", async () => {
        jest.spyOn(service, "processInboundMessage");
        const emitSpy = jest.spyOn(broker, "emit");
        const response = await broker.call("v1.chat.inbound", inboundResponse);
        expect(emitSpy).toHaveBeenCalledTimes(1);
        expect(response).toHaveProperty("AccountSid");
        expect(response).toHaveProperty("SmsStatus");
        expect(response).toHaveProperty("FromState");
        expect(response).toHaveProperty("FromCity");
      });
      it("should call the inbound action and fail with wrong type", async () => {
        const badInboundResponse = { ...inboundResponse };
        badInboundResponse.type = "bad";
        jest.spyOn(service, "processInboundMessage");
        const emitSpy = jest.spyOn(broker, "emit");
        const response = await broker.call(
          "v1.chat.inbound",
          badInboundResponse
        );
        expect(response).toStrictEqual(
          "Received invalid receiver type: [bad]. Expected 'lab-team' or 'consultant'"
        );
        expect(emitSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe("Test 'chat.status'", () => {
      it("should call the status action successfully", async () => {
        jest.spyOn(service, "processMessageStatus");
        const emitSpy = jest.spyOn(broker, "emit");
        const response = await broker.call("v1.chat.status", statusResponse);
        expect(emitSpy).toHaveBeenCalledTimes(1);
        expect(response).toHaveProperty("AccountSid");
        expect(response).toHaveProperty("SmsStatus");
      });
      it("should call the status action and fail with wrong type", async () => {
        const badInboundResponse = { ...statusResponse };
        badInboundResponse.type = "bad";
        jest.spyOn(service, "processMessageStatus");
        const emitSpy = jest.spyOn(broker, "emit");
        const response = await broker.call(
          "v1.chat.status",
          badInboundResponse
        );
        expect(response).toStrictEqual(
          "Received invalid receiver type: [bad]. Expected 'lab-team' or 'consultant'"
        );
        expect(emitSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Test methods", () => {
    const broker = new ServiceBroker({ logger: false });
    const service = broker.createService(TestService);

    beforeAll(() => broker.start());
    afterAll(() => broker.stop());
    afterEach(() => {
      jest.clearAllMocks();
    });

    describe("Test 'isValidReceiverType method'", () => {
      it("should call isValidReceiverType method and return true", () => {
        const response = service.isValidReceiverType("consultant");
        expect(response).toStrictEqual(true);
      });
      it("should call isValidReceiverType method and return false", () => {
        const response = service.isValidReceiverType("bad");
        expect(response).toStrictEqual(false);
      });
    });
    describe("Test 'broadcastPubSubMessage method'", () => {
      it("should return a cloudEvent object", async () => {
        const response = await service.broadcastPubSubMessage(
          {
            type: "lab-team",
            SmsSid: "SMed7fb273a8068fa1715869a2f1b2bb06",
            SmsStatus: "delivered",
            MessageStatus: "delivered",
            To: "+12102867939",
            MessagingServiceSid: "MG344318249d1144b4dbad9effa4904abe",
            MessageSid: "SMed7fb273a8068fa1715869a2f1b2bb06",
            AccountSid: "AC11947859c8448f9015066e4d6d9858bf",
            From: "+18329815550",
            ApiVersion: "2010-04-01",
          },
          PUB_SUB.DELIVERED
        );
        expect(response).toBeInstanceOf(OrchestratorCloudEvent);
      });
    });

    describe("Test 'addConversationParticipants'", () => {
      let spy: any;
      beforeEach(() => {
        spy = jest
          .spyOn(service.schema, "getClient")
          .mockImplementationOnce(() => {
            return {
              conversations: {
                conversations: () => {
                  return {
                    participants: {
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
      it("should call twilio conversations api to create participants", () => {
        service.addConversationParticipants("test", "test", "test");
        expect(spy).toBeCalledTimes(1);
      });
    });

    describe("Test 'addConversationParticipants error'", () => {
      let spy: any;
      beforeEach(() => {
        spy = jest
          .spyOn(service.schema, "getClient")
          .mockImplementationOnce(() => {
            return {
              conversations: {
                conversations: () => {
                  return {
                    participants: {
                      create: () => {
                        throw new Error();
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
          await service.addConversationParticipants("test", "test", "test");
        } catch (error) {
          expect(error).toBeTruthy;
        }
      });
    });

    describe("Test 'updateConversationAttributes'", () => {
      let spy: any;
      beforeEach(() => {
        spy = jest
          .spyOn(service.schema, "getClient")
          .mockImplementationOnce(() => {
            return {
              conversations: {
                conversations: () => {
                  return {
                    update: () => {
                      Promise.resolve("success");
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

      it("should call twilio api to update conversation attributes", () => {
        service.updateConversationAttributes({ test: "test" }, "test");
        expect(spy).toBeCalledTimes(1);
      });
    });

    describe("Test 'updateConversationAttributes error'", () => {
      let spy: any;
      beforeEach(() => {
        spy = jest
          .spyOn(service.schema, "getClient")
          .mockImplementationOnce(() => {
            return {
              conversations: {
                conversations: () => {
                  return {
                    participants: {
                      create: () => {
                        throw new Error();
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
          await service.updateConversationAttributes({ test: "test" }, "test");
        } catch (error) {
          expect(error).toBeTruthy;
        }
      });
    });

    // describe("Test 'fetchInitialMessage' ", () => {
    // 	let spy: any;
    // 	beforeEach(() => {
    // 		spy = jest
    // 			.spyOn(service.schema, "getClient")
    // 			.mockImplementationOnce(() => {
    // 				return {
    // 					conversations: {
    // 						conversations: () => {
    // 							return {
    // 								messages: {
    // 									list: () => {
    // 										return Promise.resolve(
    // 											"success"
    // 										);
    // 									},
    // 								},
    // 							};
    // 						},
    // 					},
    // 				};
    // 			});
    // 	});

    // 	it("should call twilio api to get the last message", () => {
    // 		service.fetchInitialMessage("test");
    // 		expect(spy).toBeCalledTimes(1);
    // 	});
    // });

    // describe("Test 'fetchInitialMessage' error", () => {
    // 	let spy: any;
    // 	beforeEach(() => {
    // 		spy = jest
    // 			.spyOn(service.schema, "getClient")
    // 			.mockImplementationOnce(() => {
    // 				return {
    // 					conversations: {
    // 						conversations: () => {
    // 							return {
    // 								messages: {
    // 									list: () => {
    // 										throw new Error();
    // 									},
    // 								},
    // 							};
    // 						},
    // 					},
    // 				};
    // 			});
    // 	});

    // 	it("should return an error", async () => {
    // 		try {
    // 			await service.fetchInitialMessage("test");
    // 		} catch (error) {
    // 			expect(error).toBeTruthy;
    // 		}
    // 	});
    // });
  });
});
