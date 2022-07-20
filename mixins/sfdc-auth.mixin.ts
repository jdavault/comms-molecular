// Third-party imports
import { existsSync, readFileSync } from "fs";
import jsforce from "jsforce";
import { ServiceBroker, ServiceSchema } from "moleculer";
import { getToken } from "sf-jwt-token";

const conn: jsforce.Connection = new jsforce.Connection({});
const privateKey = getPrivateKeyFile();

function getPrivateKeyFile() {
  if (process.env.NODE_ENV === "trueproduction") {
    const fileLocation = "/run/secrets/salesforce/salesforce.key";
    if (!existsSync(fileLocation)) { throw new Error("unable to load Salesforce private key"); }
    return readFileSync(fileLocation, "UTF-8");
  } else {
    const fileLocation = "salesforce.key";
    if (!existsSync(fileLocation)) { throw new Error("unable to load Salesforce private key"); }
    return readFileSync(fileLocation, "UTF-8");
  }
}


export const SFDCAuthService: ServiceSchema = {
  name: "SFDCAuthService",
  methods: {
    async getClient() {
      const jwt: any = await jwtToken(this);

      conn.initialize({
        instanceUrl: (await jwt).instance_url,
        accessToken: (await jwt).access_token,
      });

      return conn;
    },
  },
};

export async function jwtToken(ctx: ServiceBroker) {
  let token;

  try {
    token = await getToken({
      iss: process.env.CLIENT_ID,
      sub: process.env.SF_USERNAME,
      aud: process.env.SF_LOGIN_URL,
      privateKey,
    });
  } catch (e) {
    ctx.logger.error(e);
    throw e;
  }

  return token;
}
