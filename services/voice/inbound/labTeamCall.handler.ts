import { Context } from "moleculer";
import { ParticipantType } from "../../chat/chat.models";
import { CustomerRecord } from "../../models/QuerySchemas";
import directToVoiceMail from "../callbacks/directToVoiceMail";
import {
  InboundAmdStatusCallbackEvent,
  InboundCallEvent,
  RoutingInformation,
} from "../voice.models";
import createUserCall from "./createUserCall.handler";
import findLabTeamRoute from "./findLabTeamRoute";

async function labTeamCall(
  customers: CustomerRecord,
  caller: string,
  twilio: string,
  ctx: Context<InboundCallEvent>
) {
  this.logger.debug("Routing to Lab Team");
  const routingInformation: RoutingInformation = await findLabTeamRoute.call(
    this,
    customers.records[0],
    customers.type,
    customers.relatedSurgeonSfId
  );

  if (routingInformation.User.AvailabilityStatus === "Offline") {
    const updatedparams: InboundAmdStatusCallbackEvent = {
      ClientCallSid: ctx.params.CallSid,
      UserSfId: routingInformation.User.Id,
      CustomerType: routingInformation.Type as ParticipantType,
      ClientSfId: routingInformation.Id,
      CustomerPhoneNumber: caller,
      ClientName: routingInformation.Name,
      UserPhoneNumber: routingInformation.User.Phone,
      UserName: routingInformation.User.Name,
      UserFedId: routingInformation.User.FederationIdentifier,
      MachineDetectionDuration: "1200",
      CallSid: "",
      AnsweredBy: "",
      AccountSid: ctx.params.AccountSid,
      Direction: ctx.params.Direction,
      AliasNumber: ctx.params.From,
      RelatedSurgeonSfId: routingInformation.RelatedSurgeonSfId,
    };
    const updatedContext = { params: updatedparams };

    return directToVoiceMail.call(this, updatedContext);
  } else {
    return createUserCall.call(this, caller, twilio, routingInformation, ctx);
  }
}
export default labTeamCall;
