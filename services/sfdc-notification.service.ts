// Third-party
import { Service, ServiceBroker } from "moleculer";

// First-party
import { SFDCAuthService } from "../mixins/sfdc-auth.mixin";
import {
  VOICEMAIL_ACTIVITY_CREATED,
  MEDICREA_TASK_CREATED,
} from "./constants/sfdc-tasks.constants";
import { PUB_SUB_FWD_USER } from "./constants/sfdc-users.constants";
import OrchestratorCloudEvent from "./models/OrchestratorCloudEvent";

export const NOTIFICATION_SENT: string = "sfdc-notification.sent";
export const NOTIFICATION_ERROR: string = "sfdc-notification.error";
export const SF_CUSTOM_NOTIFICATION_ACTION_ENDPOINT: string =
  "/services/data/v46.0/actions/standard/customNotificationAction";

export default class SFDCNotificationService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker);
    this.parseServiceSchema({
      name: "sfdc-notification",
      version: "v1",
      mixins: [SFDCAuthService],
      actions: {
        sendNotification: {
          params: {
            recipientIds: "array",
            title: "string",
            body: "string",
            targetId: "string",
          },
          async handler(ctx): Promise<any> {
            this.logger.trace("sendNotification handler: Entry");
            this.logger.debug("ctx = " + JSON.stringify(ctx));

            const SF_CUSTOM_NOTIFICATION_ID =
              process.env.SF_CUSTOM_NOTIFICATION_ID;
            this.logger.debug(
              "SF_CUSTOM_NOTIFICATION_ID = " + SF_CUSTOM_NOTIFICATION_ID
            );

            const conn = await this.getClient();
            const body = {
              inputs: [
                {
                  customNotifTypeId: SF_CUSTOM_NOTIFICATION_ID,
                  recipientIds: [...ctx.params.recipientIds],
                  title: ctx.params.title,
                  body: ctx.params.body,
                  targetId: ctx.params.targetId,
                },
              ],
            };
            this.logger.debug("body = " + JSON.stringify(body));

            const requestInfo = {
              url: SF_CUSTOM_NOTIFICATION_ACTION_ENDPOINT,
              method: "post",
              body: JSON.stringify(body),
              headers: {
                "Content-Type": "application/json",
              },
            };

            this.logger.debug("requestInfo = " + JSON.stringify(requestInfo));

            return conn.request(requestInfo, (err: any, res: any) => {
              if (err) {
                this.logger.error("err = " + JSON.stringify(err));
                ctx.emit(NOTIFICATION_ERROR, err);

                throw new Error(NOTIFICATION_ERROR);
              }

              this.logger.debug("res = " + JSON.stringify(res));
              ctx.emit(NOTIFICATION_SENT, res);

              return res;
            });
          },
        },
      },
      events: {
        async [MEDICREA_TASK_CREATED](message: OrchestratorCloudEvent) {
          this.logger.trace(MEDICREA_TASK_CREATED + " Event Enter:");
          this.logger.debug("message = " + JSON.stringify(message));

          this.broker.call(
            "v1.sfdc-notification.sendNotification",
            message.data
          );

          this.logger.trace(MEDICREA_TASK_CREATED + " Event Exit:");
        },
        async [VOICEMAIL_ACTIVITY_CREATED](message: OrchestratorCloudEvent) {
          this.logger.trace(VOICEMAIL_ACTIVITY_CREATED + " Event Enter:");
          this.logger.debug("message = " + JSON.stringify(message));

          this.broker.call(
            "v1.sfdc-notification.sendNotification",
            message.data
          );

          this.logger.trace(VOICEMAIL_ACTIVITY_CREATED + " Event Exit:");
        },
        async [PUB_SUB_FWD_USER.COMPLETED](message: OrchestratorCloudEvent) {
          this.logger.debug(PUB_SUB_FWD_USER.COMPLETED + "Event Enter:");
          this.logger.debug("message = " + JSON.stringify(message));

          const data: any = message.data;

          const forwardUserSfId: string = data.forwardUserSfId;

          const userSfId: string = data.userSfId;

          let userName: string = data.userName;
          userName = userName.split(", ").reverse().join(" ");

          const body: string = `${userName} is forwarding all communications to you`;

          const params: any = {
            recipientIds: [forwardUserSfId],
            title: "Communications Notification",
            body,
            targetId: userSfId,
          };

          this.broker.call("v1.sfdc-notification.sendNotification", params);

          this.logger.debug(PUB_SUB_FWD_USER.COMPLETED + "Event Exit:");
        },
      },
      methods: {},
    });
  }
}
