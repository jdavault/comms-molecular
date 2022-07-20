import { Context, Errors } from "moleculer";
import { Twilio } from "twilio";
import { CallInstance } from "twilio/lib/rest/api/v2010/account/call";
import { ParticipantInstance } from "twilio/lib/rest/api/v2010/account/conference/participant";
import VoiceResponse from "twilio/lib/twiml/VoiceResponse";
import OrchestratorCloudEvent from "../../models/OrchestratorCloudEvent";
import standardNumber from "../../utils/standardNumber";
import { INBOUND_CALL_WAIT_URL, PUB_SUB_VOICE, USER_LABEL } from "../voice.constants";
import doCallTransfer from "./doCallTransfer";
import findTransferRoutingInfo, { TransferRoutingInformation } from "./findTransferRoutingInfo";

const TRANSFER_UNSUPPORTED = `\
Transferring a call while in two active call sessions is currently not supported. \
Please end one of the calls and try again.
`;

export default async function handleCallTransfer(ctx: Context<any, any>) {
  const fromFedID = ctx.meta.user.fedId;
  const transfererName = ctx.meta.user.name.split(",").reverse().join(" ").trim();
  const twilioNumber = ctx.params.twilioNumber;
  const transfereeSfId = ctx.params.transfereeSfId;
  const client: Twilio = this.schema.getClient();
  try {

    let clientParticipant: any;
    let clientCallSid;
    let clientFromNumber;

    const conferences = await client.conferences.list({
      status: "in-progress",
      limit: 20,
    });
    let confParticipants: ParticipantInstance[];
    let moreThanOneConferenceFound = false;
    for (const conference of conferences) {
      const confDetail = parseConferenceParticipantLabel(conference.friendlyName, false);
      if (confDetail.fedId === fromFedID) {
        if (confParticipants != null) {
          moreThanOneConferenceFound = true;
          break;
        } else if (confParticipants == null) {
          confParticipants = (await client
            .conferences(conference.sid)
            .participants.list());
        }
      }
    }
    if (moreThanOneConferenceFound) {
      throw new Errors.MoleculerClientError(TRANSFER_UNSUPPORTED, 409);
    }

    for (const participant of confParticipants) {
      if (!participant.label.includes(USER_LABEL)) {
        clientCallSid = participant.callSid;
        const call: CallInstance = await client.calls(clientCallSid).fetch();
        clientFromNumber = (call.direction === "outbound-api")
          ? standardNumber(call.to)
          : standardNumber(call.from);
        clientParticipant = parseConferenceParticipantLabel(participant.label, true);
      }
    }
    const routingInformation: TransferRoutingInformation =
      await findTransferRoutingInfo.call(this, transfereeSfId, clientFromNumber);
    routingInformation.TwilioNumber = twilioNumber;
    routingInformation.User.TransferredBy = transfererName;
    const params: any = {
      TransfererUserName: transfererName,
      TransfererFedId: fromFedID,
      TransfereeSfId: transfereeSfId,
      ClientPhone: clientFromNumber,
      ClientName: clientParticipant.name,
      CallSid: clientCallSid,
      ClientType: clientParticipant.type,
      ClientSfId: clientParticipant.sfId,
      Direction: "inbound", // Any transferred call is an inbound call
    };
    ctx.params = params;
    // Move customer to transfer callwait
    await client.calls(clientCallSid)
      .update({
        twiml: transferCallwait(ctx, routingInformation.User.Name),
      });
    const notificationBody = (clientParticipant?.type != null)
      ? `${transfererName} is transferring ${clientParticipant.name} (${clientParticipant.type}) to you.`
      : `${transfererName} is transferring ${clientParticipant.name} to you.`;

    const notifyPayload = {
      primaryContactFedId: routingInformation.User.FederationIdentifier,
      body: notificationBody,
    };
    this.logger.debug(
      "Sending notification for forwarded call: ",
      JSON.stringify(notifyPayload)
    );
    this.broker.call("v1.notify.sendNotification", notifyPayload);
    doCallTransfer.call(this, ctx, routingInformation);
  } catch (error) {
    const errorData = { error, arguments: ctx.params, ctx };
    this.logger.error(error);
    await broadcastPubSubMessage.call(this, errorData, PUB_SUB_VOICE.VOICE_ERROR);
    throw new Errors.MoleculerClientError(error.message, 500);
  }
}

function transferCallwait(ctx: Context<any, any>, transfereeName: string) {
  ctx.meta.$responseType = "text/xml";
  const twiml = new VoiceResponse();
  const message = transfereeName
    ? `Now transferring to ${transfereeName}. Please hold.`
    : "Now transferring. Please hold.";
  twiml.say(message);
  twiml.play({ loop: 1 }, INBOUND_CALL_WAIT_URL);
  return twiml.toString();
}

function parseConferenceParticipantLabel(labelIn: string, isCustomer: boolean): {
  label: string;
  name: string;
  fedId?: string;
  type?: string;
  sfId?: string;
} {
  if (isCustomer) {
    const [label, name, type, sfId] = labelIn.split(":");
    return { label, name: name.replaceAll("_", " "), type: type.replaceAll("_", " "), sfId };
  } else {
    const [label, name, fedId] = labelIn.split(":");
    return { label, name: name.replaceAll("_", " "), fedId };
  }
}

async function broadcastPubSubMessage(payload: any, type: any) {
  this.logger.debug("broadcasting message: ", type);
  const cloudEvent = new OrchestratorCloudEvent({
    type: `${type}.${this.version}`,
    data: payload,
  });
  this.logger.debug("payload: ", cloudEvent);
  this.broker.emit(type, cloudEvent);
  return cloudEvent;
}
