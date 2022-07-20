import PhoneNumber from "awesome-phonenumber";
import { Context } from "moleculer";
import { CustomerRecord } from "../../models/QuerySchemas";
import { CALL_TYPE, UNKNOWN } from "../voice.constants";
import { InboundCallEvent } from "../voice.models";
import directUserCall from "./directUserCall.handler";
import labTeamCall from "./labTeamCall.handler";
import unknownCall from "./unknownCall.handler";

async function inboundHandler(ctx: Context<InboundCallEvent>) {
  this.logger.info(
    `Inbound call from ${ctx.params.From} to Twilio phone ${ctx.params.To}`
  );
  this.logger.debug("Inbound call params: ", JSON.stringify(ctx.params));

  try {
    const customers = (await this.broker.call(
      "v1.sfdc-query.retrieveCustomers",
      {
        phoneNumber: ctx.params.From,
      }
    )) as CustomerRecord;
    this.logger.debug("Customer Record: ", JSON.stringify(customers));

    const twilioNumber = PhoneNumber(ctx.params.To, "US").getNumber(
      "significant"
    );
    const fromNumber = PhoneNumber(ctx.params.From, "US").getNumber(
      "significant"
    );

    if ((customers.totalSize === 0 || customers.type === UNKNOWN) && ctx.params.CallType) {
      this.logger.info(`Unknown caller ${ctx.params.From}`);
      return unknownCall.call(this, fromNumber, twilioNumber, ctx);
    }

    try {
      if (ctx.params.CallType) {
        if (
          ctx.params.CallType === CALL_TYPE.LAB_TEAM_SEARCH_TYPE ||
          ctx.params.CallType === CALL_TYPE.CASE_MANAGER_SEARCH_TYPE
        ) {
          this.logger.info(
            `Attempting to route ${ctx.params.From} to Lab Team`
          );
          return await labTeamCall.call(
            this,
            customers,
            fromNumber,
            twilioNumber,
            ctx
          );
        }
        throw Error("Call Type Not Supported");
      }
    } catch (error) {
      return unknownCall.call(this, fromNumber, twilioNumber, ctx, customers);
    }

    try {
      this.logger.info(
        `Attempting to route ${ctx.params.From} to direct number`
      );
      return directUserCall.call(
        this,
        customers,
        fromNumber,
        twilioNumber,
        ctx
      );
    } catch (error) {
      return unknownCall.call(this, fromNumber, twilioNumber, ctx, customers);
    }
  } catch (error) {
    this.logger.error(error);
  }
}

export default inboundHandler;
