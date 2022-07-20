import { Context } from "moleculer";
import { CustomerRecord } from "../../models/QuerySchemas";
import directToVoiceMail from "../callbacks/directToVoiceMail";
import {
  InboundAmdStatusCallbackEvent,
  InboundCallEvent,
  RouteUser,
} from "../voice.models";
import createUserCall from "./createUserCall.handler";
import { NO_USER_FOUND } from "./error.constants";
import findDirectUserRoute from "./findDirectUserRoute";

async function directUserCall(
  customers: CustomerRecord,
  caller: string,
  twilioNumber: string,
  ctx: Context<InboundCallEvent>
) {
  this.logger.debug("Routing as a direct call");
  const result = await this.broker.call(
    "v1.sfdc-query.retrieveUserByTwilioNumber",
    { phoneNumber: twilioNumber }
  );

  if (result.totalSize === 0) {
    throw Error(NO_USER_FOUND);
  }

  const routingInformation = (await findDirectUserRoute.call(
    this,
    customers.records[0],
    customers.type,
    result.records[0] as RouteUser,
    customers?.relatedSurgeonSfId
  )) as any;
  this.logger.debug(routingInformation);

  if (routingInformation.User.AvailabilityStatus === "Offline") {
    const updatedparams: InboundAmdStatusCallbackEvent = {
      ClientCallSid: ctx.params.CallSid,
      UserSfId: routingInformation.User.Id,
      CustomerType: routingInformation.Type,
      ClientSfId: routingInformation.Id,
      CustomerPhoneNumber: caller,
      ClientName: routingInformation.Name,
      UserPhoneNumber: routingInformation.User.Phone,
      UserName: routingInformation.User.Name,
      MachineDetectionDuration: "1200",
      CallSid: "",
      AnsweredBy: "",
      AccountSid: ctx.params.AccountSid,
      Direction: ctx.params.Direction,
      UserFedId: routingInformation.User.FederationIdentifier,
      AliasNumber: twilioNumber,
      RelatedSurgeonSfId: routingInformation.RelatedSurgeonSfId,
    };
    const updatedContext = { params: updatedparams };

    return directToVoiceMail.call(this, updatedContext);
  } else {
    return createUserCall.call(
      this,
      caller,
      twilioNumber,
      routingInformation,
      ctx
    );
  }
}
export default directUserCall;
