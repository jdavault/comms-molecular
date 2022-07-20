import { amdEvent } from "../../fixtures/voice.fixtures";

// deps
import directToVoiceMail from "../../../../../services/voice/callbacks/directToVoiceMail";
import createInboundConference from "../../../../../services/voice/callbacks/createInboundConference";
import notifyCallerOfErrorAndEndCall from "../../../../../services/voice/callbacks/notifyCallerOfErrorAndEndCall";
import {
  CALL_COULD_NOT_BE_COMPLETED_MESSAGE,
  UNKNOWN,
  VMAIL_UNREACHABLE_MESSAGE,
} from "../../../../../services/voice/voice.constants";
import { ServiceBroker } from "moleculer";
import VoiceService from "../../../../../services/voice/voice.service";
import { CreateInboundConfError } from "../../../../../services/voice/Errors/CreateInboundConfError";
import { DirectToVMError } from "../../../../../services/voice/Errors/DirectToVMError";

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

describe("amdStatus Handler", () => {
  let testEvent: any;

  const broker = new ServiceBroker({ logger: false });
  const voiceService = broker.createService(VoiceService);

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());

  beforeEach(() => {
    testEvent = { ...amdEvent };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("On inbound calls", () => {
    describe("When a human is detected", () => {
      it("invoked handle to create the conference", async () => {
        let spy = jest
          .spyOn(voiceService.schema, "getClient")
          .mockImplementation(() => {
            return {
              calls: {
                list: jest.fn().mockImplementation(() => {
                  return [{ status: "completed" }, { status: "completed" }];
                }),
              },
            };
          });
        await broker.call("v1.voice.amdStatus", testEvent);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(createInboundConference.call).toHaveBeenCalled();
      });

      describe("And an error occurs when handling", () => {
        it("Invokes handler to notify the caller and end the call", async () => {
          createInboundConference.call = jest.fn().mockImplementation(() => {
            throw new CreateInboundConfError("test", {});
          });
          await broker.call("v1.voice.amdStatus", testEvent);
          expect(notifyCallerOfErrorAndEndCall.call).toHaveBeenCalledWith(
            expect.anything(), // 'this'
            CALL_COULD_NOT_BE_COMPLETED_MESSAGE,
            expect.anything() // 'ctx'
          );
        });
      });
    });

    describe("When something else is detected", () => {
      it("invokes handle to direct caller to voicemail", async () => {
        testEvent.AnsweredBy = UNKNOWN;
        await broker.call("v1.voice.amdStatus", testEvent);
        expect(directToVoiceMail.call).toHaveBeenCalled();
      });

      describe("And an error occurs when handling", () => {
        it("Invokes handler to notify the caller and end the call", async () => {
          createInboundConference.call = jest.fn().mockImplementation(() => {
            throw new DirectToVMError("test", {});
          });
          await broker.call("v1.voice.amdStatus", testEvent);
          expect(notifyCallerOfErrorAndEndCall.call).toHaveBeenCalledWith(
            expect.anything(), // 'this'
            VMAIL_UNREACHABLE_MESSAGE,
            expect.anything() // 'ctx'
          );
        });
      });
    });
  });
});
