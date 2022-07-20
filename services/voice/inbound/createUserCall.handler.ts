import PhoneNumber from "awesome-phonenumber";
import { Context } from "moleculer";
import {
  VOICE_PROGRESS_EVENTS,
  MACHINE_DETECTION_TWIML,
  VOICE_STATUS,
} from "../voice.constants";
import {
  InboundCallEvent,
  RoutingInformation,
  RouteUser,
} from "../voice.models";

import generateAMDCallbackURL from "../callbacks/generateAMDCallback";
import generateStatusCallbackURL from "../callbacks/generateStatusCallback";

async function createUserCall(
  caller: string,
  twilio: string,
  callee: RoutingInformation,
  ctx: Context<InboundCallEvent>
) {
  const toNumber = findUserNumber(callee.User);
  callCarrier.call(this, caller, twilio, callee, toNumber, ctx);
  callSalesforce.call(this, caller, twilio, callee, toNumber, ctx);
}

async function callSalesforce(
  caller: string,
  twilio: string,
  callee: RoutingInformation,
  mobileNumber: string,
  ctx: Context<InboundCallEvent>
) {
  if (await isSalesforceAvailable.call(this, callee)) {
    this.logger.info(`Creating call to salesforce for User ${callee.User.Id}`);
    let toWithParams = `\
client:${callee.User.FederationIdentifier}\
?CallerName=${callee.Name.replaceAll("_", " ")}`;
    if (callee.User.TransferredBy) {
      toWithParams += `&TransferrerUserName=${callee.User.TransferredBy}`;
    }
    const result = this.schema.getClient().calls.create({
      // We return Twiml on the agent call to wait for an agent response, each w is 0.5 seconds long
      twiml: MACHINE_DETECTION_TWIML,
      from: twilio,
      to: toWithParams,
      statusCallback: generateStatusCallbackURL.call(
        this,
        caller,
        callee,
        twilio,
        mobileNumber,
        ctx
      ),
      statusCallbackEvent: [VOICE_PROGRESS_EVENTS.ANSWERED],
      statusCallbackMethod: "GET",
      // some how send back to front end
    });
    this.logger.trace("Inbound call handling completed");
    this.logger.debug(result);
  } else {
    // route to voicemail
  }
}

async function callCarrier(
  caller: string,
  twilio: string,
  callee: RoutingInformation,
  toNumber: string,
  ctx: Context<InboundCallEvent>
) {
  this.logger.trace("Creating call to carrier");
  this.logger.info(`Creating call to ${toNumber} from Twilio number ${twilio}`);
  const result = await this.schema.getClient().calls.create({
    machineDetection: "Enable",
    twiml: MACHINE_DETECTION_TWIML,
    from: twilio,
    to: toNumber,
    asyncAmd: true,
    asyncAmdStatusCallback: generateAMDCallbackURL.call(
      this,
      caller,
      callee,
      twilio,
      toNumber,
      ctx
    ),
    asyncAmdStatusCallbackMethod: "GET",
  });
  this.logger.trace("Inbound call handling completed");
  this.logger.debug(result);

  const notifyPayload = {
    primaryContactFedId: callee.User.FederationIdentifier,
    body: `Incoming call from ${callee.Name}`,
  };
  this.logger.debug(
    "Sending notification for caller ID: ",
    JSON.stringify(notifyPayload)
  );
  this.broker.call("v1.notify.sendNotification", notifyPayload);
}

async function isSalesforceAvailable(callee: RoutingInformation) {
  try {
    const activeOutboundConnections = await this.schema.getClient().calls.list({
      from: `client:${callee.User.FederationIdentifier}`,
      status: [
        VOICE_STATUS.QUEUED,
        VOICE_STATUS.RINGING,
        VOICE_STATUS.IN_PROGRESS,
      ],
      limit: 10,
    });
    const activeInboundConnections = await this.schema.getClient().calls.list({
      to: `client:${callee.User.FederationIdentifier}`,
      status: [
        VOICE_STATUS.QUEUED,
        VOICE_STATUS.RINGING,
        VOICE_STATUS.IN_PROGRESS,
      ],
      limit: 10,
    });
    if (
      activeOutboundConnections.length > 0 ||
      activeInboundConnections.length > 0
    ) {
      return false;
    } else {
      return true;
    }
  } catch (error) {
    this.logger.debug("Error occured while inferring call availability");
    this.logger.debug(error);
  }
}

export function findUserNumber(user: RouteUser): string {
  if (user.MobilePhone) {
    return PhoneNumber(user.MobilePhone, "US").getNumber("significant");
  }
  if (user.Phone) {
    return PhoneNumber(user.Phone, "US").getNumber("significant");
  }
  throw new Error(`No number found for user ${user.Name}`);
}

export default createUserCall;
