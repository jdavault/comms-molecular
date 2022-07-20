import axios from "axios";
import * as base64 from "base-64";
import { Context, Errors } from "moleculer";
import { Twilio } from "twilio";
import { IncomingPhoneNumberInstance } from "twilio/lib/rest/api/v2010/account/incomingPhoneNumber";
import standardNumber from "./standardNumber";


export default async function getActiveTwilioNumbers(ctx: Context<any, any>): Promise<string[]> {
  const twilio: Twilio = ctx.service.schema.getClient();
  const numbers: IncomingPhoneNumberInstance[] = await twilio.incomingPhoneNumbers.list();
  return numbers.map((n: IncomingPhoneNumberInstance) => standardNumber(n.phoneNumber));
  // const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;

  // try {
  //   const response = await axios.get("https://preview.twilio.com/Numbers/ActiveNumbers", {
  //     headers: {
  //       Authorization: `Basic ${base64.encode(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`
  //     }
  //   });
  //   if (response.status !== 200) {
  //     throw new Errors.MoleculerServerError(
  //       `attempt to get twilio numbers not successful: ${response.toString()}`,
  //       500
  //     );
  //   }
  //   const result = response.data?.items;
  //   return result.map((n: any) => standardNumber(n.phone_number));
  // } catch (e) {
  //   throw new Errors.MoleculerServerError(
  //     `error occurred attempting to fetch twilio numbers: ${e.message}`,
  //     500
  //   );
  // }
}
