import { Context } from "moleculer";
import PhoneNumber from "awesome-phonenumber";

import {
  CALL_COULD_NOT_BE_COMPLETED_MESSAGE,
  HUMAN,
  PUB_SUB_VOICE,
  CALL_DIRECTION,
  VMAIL_UNREACHABLE_MESSAGE,
  VOICE_STATUS,
} from "../voice.constants";

import { InboundAmdStatusCallbackEvent } from "../voice.models";
import { DirectToVMError } from "../Errors/DirectToVMError";
import { CreateInboundConfError } from "../Errors/CreateInboundConfError";
import createInboundConference from "./createInboundConference";
import directToVoiceMail from "./directToVoiceMail";
import notifyCallerOfErrorAndEndCall from "./notifyCallerOfErrorAndEndCall";

async function amdStatusHandler(
  ctx: Context<InboundAmdStatusCallbackEvent, { $responseType: string }>
) {
  ctx.meta.$responseType = "text/xml";

  try {

    const params = ctx.params as InboundAmdStatusCallbackEvent;
    let salesforceCall: any;
    const twilioNumberFormatted = PhoneNumber(
      params.AliasNumber,
      "US"
    ).getNumber("e164");
    const otherActiveCalls = await this.schema.getClient().calls.list({
      from: `${twilioNumberFormatted}`,
      to: `client:${params.ClientName}:${params.CustomerType}:${params.ClientSfId}`,
      limit: 10,
    });
    otherActiveCalls.forEach((c: any) => {
      if (
        c.status === VOICE_STATUS.QUEUED ||
        c.status === VOICE_STATUS.RINGING
      ) {
        salesforceCall = c;
      }
    });

    if (salesforceCall) {
      await this.schema
        .getClient()
        .calls(salesforceCall.sid)
        .update({ status: VOICE_STATUS.COMPLETED });
    }

    if (ctx.params?.AnsweredBy !== HUMAN) {
      return await directToVoiceMail.call(this, ctx);
    } else {
      return await createInboundConference.call(this, ctx);
    }
  } catch (error) {
    let message;
    if (error instanceof DirectToVMError) {
      message = VMAIL_UNREACHABLE_MESSAGE;
    } else if (error instanceof CreateInboundConfError) {
      message = CALL_COULD_NOT_BE_COMPLETED_MESSAGE;
    }
    try {
      await notifyCallerOfErrorAndEndCall.call(
        this,
        message,
        ctx.params?.CallSid
      );
    } catch (e) {
      this.logger.error("unable to notify caller of call errors");
    } finally {
      this.logger.error(error);
      const params = ctx.params as InboundAmdStatusCallbackEvent;
      const voiceErrorTaskData = {
        Direction: CALL_DIRECTION.INBOUND,
        CallStatus: "participant-leave",
        CustomerType: params.CustomerType.replaceAll("_", " "),
        CustomerPhoneNumber: params.CustomerPhoneNumber,
        To: params.CustomerPhoneNumber,
        ClientName: params.ClientName.replaceAll("_", " "),
        ClientSfId: params.ClientSfId,
        UserPhoneNumber: params.UserPhoneNumber,
        UserName: params.UserName.replaceAll("_", " "),
        UserSfId: params.UserSfId, // 0052f000003CafAAAS
        UserFedId: params.UserFedId, // davauj2
        RelatedSurgeonSfId: params?.RelatedSurgeonSfId,
      };
      console.log("Well See");
      this.broadcastPubSubMessage(voiceErrorTaskData, PUB_SUB_VOICE.VOICE_ERROR);
    }
  }
}

export default amdStatusHandler;
