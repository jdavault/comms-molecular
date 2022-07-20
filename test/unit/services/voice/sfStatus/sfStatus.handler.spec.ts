import { sfEvent } from "../../fixtures/voice.fixtures";

// deps
import notifyCallerOfErrorAndEndCall from "../../../../../services/voice/callbacks/notifyCallerOfErrorAndEndCall";
import { CALL_COULD_NOT_BE_COMPLETED_MESSAGE } from "../../../../../services/voice/voice.constants";
import { ServiceBroker } from "moleculer";
import VoiceService from "../../../../../services/voice/voice.service";
import { CreateInboundConfError } from "../../../../../services/voice/Errors/CreateInboundConfError";

jest.mock("../../../../../services/voice/callbacks/directToVoiceMail", () => ({
  call: jest.fn().mockReturnValue(() => Promise.resolve(true)),
}));

jest.mock(
  "../../../../../services/voice/callbacks/createInboundConference",
  () => ({
    call: jest.fn().mockReturnValue(() => Promise.resolve(true)),
  })
);

jest.mock(
  "../../../../../services/voice/callbacks/notifyCallerOfErrorAndEndCall",
  () => ({
    call: jest.fn().mockReturnValue(() => Promise.resolve(true)),
  })
);

describe("sfStatus Handler", () => {
  let testEvent: any;

  const broker = new ServiceBroker({ logger: false });
  const voiceService = broker.createService(VoiceService);

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());

  beforeEach(() => {
    testEvent = { ...sfEvent };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("On inbound calls", () => {
    describe("When a human is detected", () => {
      it("invoked handle to create the conference", async () => {
        let spy = jest
          .spyOn(voiceService.schema, "getClient")
          .mockImplementationOnce(() => {
            return {
              calls: {
                update: jest.fn(),
              },
            };
          });
        let spy2 = jest
          .spyOn(voiceService.schema, "getClient")
          .mockImplementationOnce(() => {
            return {
              calls: {
                list: jest.fn().mockImplementation(() => {
                  return [{ status: "completed" }, { status: "completed" }];
                }),
              },
            };
          });
        let spy3 = jest
          .spyOn(voiceService.schema, "getClient")
          .mockImplementationOnce(() => {
            return {
              calls: {
                update: jest.fn(),
              },
            };
          });
        await broker.call("v1.voice.statusCallback", testEvent);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
        expect(spy3).toHaveBeenCalledTimes(1);
      });

      describe("And an error occurs when handling", () => {
        it("Invokes handler to notify the caller and end the call", async () => {
          jest
            .spyOn(voiceService.schema, "getClient")
            .mockImplementation(() => {
              throw new CreateInboundConfError("test", {});
            });
          await broker.call("v1.voice.statusCallback", testEvent);
          expect(notifyCallerOfErrorAndEndCall.call).toHaveBeenCalledWith(
            expect.anything(), // 'this'
            CALL_COULD_NOT_BE_COMPLETED_MESSAGE,
            expect.anything() // 'ctx'
          );
        });
      });
    });
  });
});
