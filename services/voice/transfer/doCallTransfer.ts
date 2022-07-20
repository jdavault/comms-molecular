import { Context } from "moleculer";
import { ParticipantType } from "../../chat/chat.models";
import directToVoiceMail from "../callbacks/directToVoiceMail";
import createUserCall from "../inbound/createUserCall.handler";
import { InboundAmdStatusCallbackEvent } from "../voice.models";
import { TransferRoutingInformation } from "./findTransferRoutingInfo";

export default async function doCallTransfer(ctx: Context<any, any>, routingInformation: TransferRoutingInformation): Promise<void> {
  if (routingInformation.User.AvailabilityStatus === "Offline") {
    const updatedparams: InboundAmdStatusCallbackEvent = {
      ClientCallSid: ctx.params.CallSid,
      UserSfId: routingInformation.User.Id,
      CustomerType: routingInformation.Type as ParticipantType,
      ClientSfId: routingInformation.Id,
      CustomerPhoneNumber: ctx.params.ClientPhone,
      ClientName: routingInformation.Name,
      UserPhoneNumber: routingInformation.User.Phone,
      UserName: routingInformation.User.Name,
      MachineDetectionDuration: "1200",
      CallSid: "",
      AnsweredBy: "",
      AccountSid: ctx.params.AccountSid,
      Direction: ctx.params.Direction,
      UserFedId: routingInformation.User.FederationIdentifier,
      AliasNumber: routingInformation.TwilioNumber,
      RelatedSurgeonSfId: routingInformation.RelatedSurgeonSfId,
    };
    const updatedContext = { params: updatedparams };

    return directToVoiceMail.call(this, updatedContext);
  } else {
    return createUserCall.call(
      this,
      ctx.params.ClientPhone,
      routingInformation.TwilioNumber,
      routingInformation,
      ctx
    );
  };
}
