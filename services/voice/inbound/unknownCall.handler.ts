import { Context } from "moleculer";
import {
  CASE_MANAGER,
  UNKNOWN,
  ENGINEER,
  PUB_SUB_VOICE,
} from "../voice.constants";
import { InboundCallEvent } from "../voice.models";
import createUserCall from "./createUserCall.handler";
import { NO_ROUTE_FOUND } from "./error.constants";
import findRandomUserByType from "./findRandomUserByType";

async function unknownCall(
  callerNumber: string,
  twilioNumber: string,
  ctx: Context<InboundCallEvent>,
  customers?: any,
) {
  this.logger.debug("Handling unknown call");
  const customer: any = (customers)
    ? {
      Id: customers.records[0].Id,
      Name: customers.records[0].Name,
      Record: customers.records[0],
      Type: customers.type,
    }
    : {
      Id: UNKNOWN,
      Name: UNKNOWN,
      Record: null,
      Type: UNKNOWN,
    };
  try {
    const randomCaseManager = await findRandomUserByType.call(
      this,
      CASE_MANAGER
    );
    this.logger.debug(`Found ${randomCaseManager.Name} to handle call`);
    customer.User = {
      Id: randomCaseManager.Id,
      Name: randomCaseManager.Name,
      MobilePhone: randomCaseManager.MobilePhone,
      Phone: randomCaseManager.Phone,
      FederationIdentifier: randomCaseManager.FederationIdentifier,
    };
    return createUserCall.call(
      this,
      callerNumber,
      twilioNumber,
      customer,
      ctx
    );
  } catch (error) {
    try {
      const randomEngineer = await findRandomUserByType.call(this, ENGINEER);
      customer.User = {
        Id: randomEngineer.Id,
        Name: randomEngineer.Name,
        MobilePhone: randomEngineer.MobilePhone,
        Phone: randomEngineer.Phone,
        FederationIdentifier: randomEngineer.FederationIdentifier,
      };
      return createUserCall.call(
        this,
        callerNumber,
        twilioNumber,
        customer,
        ctx
      );
    } catch (e) {
      const errorData = { error, arguments: ctx.params, ctx };
      this.broadcastPubSubMessage(errorData, PUB_SUB_VOICE.VOICE_ERROR);
      throw new Error(NO_ROUTE_FOUND);
    }
  }
}
export default unknownCall;
