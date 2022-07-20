import { Context } from "moleculer";
import PhoneNumber from "awesome-phonenumber";

import {
  CALL_COULD_NOT_BE_COMPLETED_MESSAGE,
  PUB_SUB_VOICE,
  VOICE_STATUS,
  CALL_DIRECTION,
} from "../voice.constants";
import { InboundAmdStatusCallbackEvent, StatusCallbackEvent } from "../voice.models";
import notifyCallerOfErrorAndEndCall from "./notifyCallerOfErrorAndEndCall";
import createInboundConference from "./createInboundConference";

async function sfStatusHandler(
  ctx: Context<StatusCallbackEvent, { $responseType: string }>
) {
  try {
    let mobileCall: any;
    if (ctx.params?.MobilePhoneNumber) {
      const twilioNumberFormatted = PhoneNumber(
        ctx.params?.AliasPhoneNumber,
        "US"
      ).getNumber("e164");
      const mobileNumberFormatted = PhoneNumber(
        ctx.params?.MobilePhoneNumber,
        "US"
      ).getNumber("e164");
      const otherActiveCalls = await this.schema.getClient().calls.list({
        from: `${twilioNumberFormatted}`,
        to: `${mobileNumberFormatted}`,
        limit: 10,
      });
      otherActiveCalls.forEach((c: any) => {
        if (
          c.status === VOICE_STATUS.QUEUED ||
          c.status === VOICE_STATUS.RINGING
        ) {
          mobileCall = c;
        }
      });
    }

    if (mobileCall) {
      await this.schema
        .getClient()
        .calls(mobileCall.sid)
        .update({ status: VOICE_STATUS.COMPLETED });
    }
    await this.schema
      .getClient()
      .calls(ctx.params?.CallSid)
      .update({
        twiml: createInboundConference.call(this, ctx),
      });
  } catch (error) {
    try {
      const message = CALL_COULD_NOT_BE_COMPLETED_MESSAGE;
      await notifyCallerOfErrorAndEndCall.call(
        this,
        message,
        ctx.params?.CallSid
      );
    } catch (e) {
      this.logger.error("unable to notify caller of call errors");
    } finally {
      const errorData = { error, arguments: ctx.params, ctx };
      this.logger.error(error);
      this.broadcastPubSubMessage(errorData, PUB_SUB_VOICE.VOICE_ERROR);
    }
  }
}

export default sfStatusHandler;

