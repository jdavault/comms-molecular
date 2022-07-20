import { Context } from "moleculer";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import { INBOUND_VOICEMAIL_MESSAGE_CONSULTANT, INBOUND_VOICEMAIL_MESSAGE_LAB, VOICE_STATUS } from "../voice.constants";
import { InboundAmdStatusCallbackEvent } from "../voice.models";
import { DirectToVMError } from "../Errors/DirectToVMError";

async function directToVoiceMail(ctx: Context<InboundAmdStatusCallbackEvent>) {
  this.logger.debug(
    "Answering Machine Detection determined the caller has reached voicemail"
  );
  const { ClientCallSid, CallSid } = ctx.params;
  this.logger.debug("Asking caller to leave voicemail!");

  let inboundVoiceMailMesssage: string = INBOUND_VOICEMAIL_MESSAGE_CONSULTANT;
  if (ctx.params.AliasNumber === process.env.TWILIO_LAB_TEAM_NUMBER || ctx.params.AliasNumber === process.env.TWILIO_LAB_MANAGER) {
    inboundVoiceMailMesssage = INBOUND_VOICEMAIL_MESSAGE_LAB;
  };

  try {

    const response = await this.schema
      .getClient()
      .calls(ClientCallSid)
      .update({
        twiml: generateDirectToVoicemailTWIML(ctx.params, inboundVoiceMailMesssage),
      });
    if (CallSid !== "") {
      await this.schema
        .getClient()
        .calls(CallSid)
        .update({ status: VOICE_STATUS.COMPLETED });
    }
  } catch (e) {
    throw new DirectToVMError(e.message, e);
  } finally {
    if (CallSid !== "") {
      this.logger.debug("Ending call with callee");
      await this.schema
        .getClient()
        .calls(CallSid)
        .update({ status: VOICE_STATUS.COMPLETED });
    }
  }
}

function convertCalleeNameForVoicemail(unconverted: string): string {
  if (unconverted.length) {
    if (unconverted.includes("_")) {
      return unconverted.replaceAll("_", " ");
    }
    return unconverted;
  }
  return "";
}

function generateDirectToVoicemailTWIML(
  callParameter: any,
  inboundVoiceMailMesssage: any,
): string {
  const { ClientCallSid, CallSid } = callParameter;
  const baseURL = process.env.APP_URL;
  const twiml = new VoiceResponse();

  twiml.say({ voice: "Polly.Salli" }, inboundVoiceMailMesssage);
  let voicemailCallback = `\
${baseURL}/v1/voicemail/completed\
?Id=${CallSid}\
&CustomerType=${callParameter.CustomerType}\
&CustomerPhoneNumber=${callParameter.CustomerPhoneNumber}\
&CustomerName=${callParameter.ClientName}\
&CustomerSfId=${callParameter.ClientSfId}\
&UserPhoneNumber=${callParameter.UserPhoneNumber}\
&UserName=${callParameter.UserName}\
&UserSfId=${callParameter.UserSfId}\
&UserFedId=${callParameter.UserFedId}`;
  if (callParameter?.RelatedSurgeonSfId) {
    voicemailCallback += `&RelatedSurgeonSfId=${callParameter.RelatedSurgeonSfId}`;
  }

  voicemailCallback = voicemailCallback.replaceAll(" ", "_");

  twiml.record({
    timeout: 10,
    maxLength: 20,
    action: `${baseURL}/v1/voice/conference/endCall`,
    transcribe: true,
    transcribeCallback: voicemailCallback,
  });
  return twiml.toString();
}

export default directToVoiceMail;
