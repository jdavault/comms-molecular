import twilio, { Twilio } from "twilio";
import base64 = require("base-64");
import dotenv from "dotenv-flow";
dotenv.config();

/**
 * @typedef {import('moleculer').Context} Context Moleculer's Context
 */

export default {
  name: "twilio-client",

  getClient(): Twilio {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    return twilio(accountSid, authToken);
  },
	getBasicAuthHeader(): string {
		return "Basic " + base64.encode(process.env.TWILIO_ACCOUNT_SID + ":" + process.env.TWILIO_AUTH_TOKEN);
	},
};
