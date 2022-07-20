import { Context } from "moleculer";
import { InboundCallEvent, RoutingInformation } from "../voice.models";

function generateAMDCallbackURL(
  from: string,
  to: RoutingInformation,
  twilio: string,
  toNumber: string,
  ctx: Context<InboundCallEvent>
): string {
  let primaryContactfederationIdentifier = "";
  if (
    to.Record &&
    to.Record.Assigned_LAB_Engineer__r &&
    to.Record.Assigned_LAB_Engineer__r.FederationIdentifier
  ) {
    primaryContactfederationIdentifier =
      to.Record.Assigned_LAB_Engineer__r.FederationIdentifier;
  }
  let callBackString = `\
${process.env.APP_URL}/v1/voice/amd/status\
?Direction=${ctx.params.Direction}\
&ClientCallSid=${ctx.params.CallSid}\
&UserSfId=${to.User.Id}\
&UserFedId=${to.User.FederationIdentifier}\
&ClientSfId=${to.Id}\
&PrimaryContactFedId=${primaryContactfederationIdentifier}\
&CustomerPhoneNumber=${from}\
&UserPhoneNumber=${toNumber}\
&ClientName=${to.Name.replaceAll(" ", "_")}\
&UserName=${to.User.Name.replaceAll(" ", "_")}\
&CustomerType=${to.Type.replaceAll(" ", "_")}\
&AliasNumber=${twilio}`;

  if (to.RelatedSurgeonSfId) {
    callBackString += `&RelatedSurgeonSfId=${to.RelatedSurgeonSfId}`;
  }

  if (to.User.ForwardedBy) {
    callBackString += `&ForwardingUserName=${to.User.ForwardedBy.Name.replaceAll(" ", "_")}`;
  }
  if (to.User.TransferredBy) {
    callBackString += `&TransferrerUserName=${to.User.TransferredBy.replaceAll(" ", "_")}`;
  }
  this.logger.debug(`AMD Callback : ${callBackString}`);
  return callBackString;
}
export default generateAMDCallbackURL;
