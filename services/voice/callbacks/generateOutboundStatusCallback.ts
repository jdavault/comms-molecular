import { OutboundCallEvent } from "../voice.models";

function generateOutboundStatusCallbackURL(callParams: OutboundCallEvent, relatedSurgeonSfId?: string) {
  // Reverse the name so it becomes first last
  const userName = callParams.UserName.split(",").reverse().join(" ").replaceAll(" ", "_");
  let callBackString = `\
${process.env.APP_URL}/v1/voice/outbound/conference/status\
?UserName=${userName}\
&UserPhoneNumber=${callParams.UserNumber.replaceAll(" ", "_")}\
&UserSfId=${callParams.UserSfId}\
&UserFedId=${callParams.UserFedId}\
&ClientName=${callParams.ClientName.replaceAll(" ", "_").replaceAll(",", "")}\
&ClientSfId=${callParams.ClientSfId}\
&CustomerType=${callParams.CustomerType.replaceAll(" ", "_")}\
&CustomerPhoneNumber=${callParams.CustomerPhoneNumber.replaceAll(" ", "_")}\
&AliasPhoneNumber=${callParams.AliasNumber.replaceAll(" ", "_")}`;

  if (relatedSurgeonSfId) {
    callBackString += `&RelatedSurgeonSfId=${relatedSurgeonSfId}`;
  }

  this.logger.debug(`Outbound Mobile Callback : ${callBackString}`);
  console.log(callBackString);
  return callBackString;
}
export default generateOutboundStatusCallbackURL;
