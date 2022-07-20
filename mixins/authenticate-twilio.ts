import { IncomingMessage } from "http";
import { Context } from "moleculer";
import ApiGateway from "moleculer-web";
import { validateRequest } from "twilio";

interface MolecularIncomingMessage extends IncomingMessage {
  $params: unknown;
}

const AuthenticateTwilio = {
  methods: {
    async validateTwilio(
      ctx: Context,
      route: unknown,
      req: MolecularIncomingMessage
    ): Promise<void> {
      this.logger.debug("******** TWILIO WEBHOOK AUTH");
      const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
      const APP_URL = process.env.APP_URL;
      const twilioSignature = req.headers["x-twilio-signature"] as string;
      const url = `${APP_URL}${req.url}`;
      const params = req.$params as any;
      let queryArgs: any = req.url.split("?")[1];

      // We strip the query arguments from the parameters
      let valid;
      if (queryArgs) {
        queryArgs = queryArgs.split("&");
        const queryArgsToRemove = queryArgs.map(
          (arg: any) => arg.split("=")[0]
        );
        const alteredParams = { ...params };
        for (const arg of queryArgsToRemove) {
          delete alteredParams[arg];
        }
        valid = validateRequest(
          TWILIO_AUTH_TOKEN,
          twilioSignature,
          url,
          alteredParams
        );
      } else {
        valid = validateRequest(
          TWILIO_AUTH_TOKEN,
          twilioSignature,
          url,
          params
        );
      }
      if (!valid) {
        throw new ApiGateway.Errors.UnAuthorizedError(ApiGateway.Errors.ERR_INVALID_TOKEN, null);
      }
      return;
    },
  },
};

export default AuthenticateTwilio;
