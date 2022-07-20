import { Context } from "moleculer";
import { v4 as uuidv4 } from "uuid";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import { InboundAmdStatusCallbackEvent } from "../voice.models";
import { SURGEON, UNID_CONTACT, VOICE_STATUS } from "../voice.constants";
import { CreateInboundConfError } from "../Errors/CreateInboundConfError";

async function createInboundConference(
  ctx: Context<InboundAmdStatusCallbackEvent>
) {
  this.logger.debug("Connecting the callee to conference with caller");
  const { CallSid } = ctx.params;
  try {
    await this.schema
      .getClient()
      .calls(CallSid)
      .update({
        twiml: addAgentToConference(ctx),
      });
  } catch (e) {
    this.logger.debug(
      "Some error occurred, ending call with callee and throwing"
    );
    await this.schema
      .getClient()
      .calls(CallSid)
      .update({ status: VOICE_STATUS.COMPLETED });
    throw new CreateInboundConfError(e.message, e);
  }
}

function addAgentToConference(
  ctx: Context<InboundAmdStatusCallbackEvent>
): string {
  const baseURL = process.env.APP_URL;
  const {
    ClientCallSid,
    ClientSfId,
    UserSfId,
    CustomerType,
    CustomerPhoneNumber,
    ClientName,
    UserPhoneNumber,
    UserName,
    PrimaryContactFedId,
    UserFedId,
  } = ctx.params;
  const agentLabel = `user:${UserName}:${UserFedId}`;
  const twiml = new VoiceResponse();
  let message = (CustomerType === SURGEON || CustomerType === UNID_CONTACT.replace(" ", "_"))
    ? `Connecting to ${CustomerType.replaceAll("_", " ")}, ${ClientName.replaceAll("_", " ")}`
    : "Connecting to unknown caller.";
  if (ctx.params.ForwardingUserName) {
    message += `, forwarded by ${ctx.params.ForwardingUserName.replaceAll("_", " ")}`;
  }
  if (ctx.params.TransferrerUserName) {
    message += `, transferred by ${ctx.params.TransferrerUserName.replaceAll("_", " ")}`;
  }

  let callbackUrl = `\
${baseURL}/v1/voice/inbound/conference/status\
?ClientCallSid=${ClientCallSid}\
&CustomerType=${CustomerType}\
&ClientSfId=${ClientSfId}\
&UserSfId=${UserSfId}\
&UserFedId=${UserFedId}\
&CustomerPhoneNumber=${CustomerPhoneNumber}\
&ClientName=${ClientName}\
&PrimaryContactFedId=${PrimaryContactFedId}\
&UserPhoneNumber=${UserPhoneNumber}\
&UserName=${UserName}`;
  if (ctx.params?.RelatedSurgeonSfId) {
    callbackUrl += `&RelatedSurgeonSfId=${ctx.params.RelatedSurgeonSfId}`;
  }
  if (ctx.params?.TransferrerUserName) {
    callbackUrl += `&TransferrerUserName=${ctx.params.TransferrerUserName.replaceAll(" ", "_")}`;
  }

  twiml.say({ voice: "Polly.Salli" }, message);
  const dial = twiml.dial();
  dial.conference(
    {
      beep: "true",
      participantLabel: `${agentLabel}`,
      endConferenceOnExit: true,
      statusCallback: callbackUrl,
      statusCallbackMethod: "POST",
      statusCallbackEvent: ["join", "leave", "end"],
    },
    agentLabel
  );
  return twiml.toString();
}

export default createInboundConference;
