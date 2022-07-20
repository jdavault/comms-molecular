import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import { VOICE_STATUS } from "../voice.constants";

async function notifyCallerOfErrorAndEndCall(message: string, callSid: string) {
  this.logger.debug(`Attempting to gracefully terminate caller's ${callSid}`);
  await this.schema
    .getClient()
    .calls(callSid)
    .update({
      twiml: new VoiceResponse().say(message).toString(),
    });
  await this.schema.getClient().calls(callSid).update({
    status: VOICE_STATUS.COMPLETED,
  });
}

export default notifyCallerOfErrorAndEndCall;
