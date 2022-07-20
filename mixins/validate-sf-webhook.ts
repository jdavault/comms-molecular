import { Context, ServiceSchema } from "moleculer";
import ApiGateway from "moleculer-web";

const ERR_INVALID_KEY = "Given API Key is invalid";

export const SFDCWebhookAuth: ServiceSchema = {
  name: "SFDCWebhookAuth",
  version: "v1",
  methods: {
    async validateSFWebhook(
      ctx: Context<any, any>,
      route: unknown,
      req: any
    ): Promise<any> {
      this.logger.trace("SF Webhook CHECK validateSFWebhook");
      const apiKey = req.query?.key;
      if (apiKey !== process.env.SF_WEBHOOK_API_KEY) {
        return Promise.reject(
          new ApiGateway.Errors.UnAuthorizedError(ERR_INVALID_KEY, {})
        );
      }
    },
  },
};
