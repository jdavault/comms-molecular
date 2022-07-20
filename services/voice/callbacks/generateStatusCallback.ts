import { Context } from "moleculer";
import { InboundCallEvent, RoutingInformation } from "../voice.models";

function generateStatusCallbackURL(
  from: string,
  to: RoutingInformation,
  twilio: string,
  mobileNumber: string,
  ctx: Context<InboundCallEvent>
): string {
  let callBackString = `\
${process.env.APP_URL}/v1/voice/sf/status\
?Direction=${ctx.params.Direction}\
&ClientCallSid=${ctx.params.CallSid}\
&UserFedId=${to.User.FederationIdentifier}\
&ClientSfId=${to.Id}\
&UserSfId=${to.User.Id}\
&CustomerPhoneNumber=${from}\
&UserPhoneNumber=client:${to.User.FederationIdentifier}\
&ClientName=${to.Name.replaceAll(" ", "_")}\
&UserName=${to.User.Name.replaceAll(" ", "_")}\
&CustomerType=${to.Type.replaceAll(" ", "_")}\
&AliasPhoneNumber=${twilio}\
&MobilePhoneNumber=${mobileNumber}`;

  if (to.RelatedSurgeonSfId) {
    callBackString += `&RelatedSurgeonSfId=${to.RelatedSurgeonSfId}`;
  }
  if (to.User.ForwardedBy) {
    callBackString += `&ForwardingUserName=${to.User.ForwardedBy.Name.replaceAll(" ", "_")}`;
  }
  if (to.User.TransferredBy) {
    callBackString += `&TransferrerUserName=${to.User.TransferredBy.replaceAll(" ", "_")}`;
  }

  this.logger.debug(`Salesforce Callback : ${callBackString}`);
  return callBackString;
}
export default generateStatusCallbackURL;
