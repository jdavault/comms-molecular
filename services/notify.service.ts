// Third-party
import { Context, Service, ServiceBroker } from "moleculer";

// First-party
import twilioClientService from "../mixins/twilio-client.service";
import { PUB_SUB_FWD_USER } from "./constants/sfdc-users.constants";
import { PUB_SUB_VOICEMAIL } from "./constants/voicemail.constants";
import OrchestratorCloudEvent from "./models/OrchestratorCloudEvent";
import { PUB_SUB_VOICE } from "./voice/voice.constants";

/**
 * Moleculer service that enables sending push notifications using Twilio Notify API. (not apart of conversations nofitications)
 */
export default class NotifyService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker);
    this.parseServiceSchema({
      name: "notify",
      version: "v1",
      mixins: [twilioClientService],
      actions: {
        createInitialBinding: {
          async handler(ctx: Context<any, any>): Promise<any> {
            const params: any = ctx.params;
            const notifyServiceSid: string =
              process.env.TWILIO_NOTIFY_SERVICE_SID;
            try {
              return await this.createBinding(
                ctx.meta.user.fedId,
                params.deviceToken,
                notifyServiceSid
              );
            } catch (error) {
              this.logger.error(error);
            }
          },
        },
        sendNotification: {
          async handler(ctx: Context) {
            const params: any = ctx.params;
            const body: string = params.body;

            try {
              return await this.sendNotification(
                params.primaryContactFedId,
                body
              );
            } catch (error) {
              this.logger.error(error);
            }
          },
        },
      },
      events: {
        async [PUB_SUB_VOICE.VOICE_COMPLETED](message: OrchestratorCloudEvent) {
          const data: any = message.data;

          if (data.Direction === "inbound") {
            this.handleInbound(data);
          } else {
            this.handleOutbound(data);
          }
        },
        async [PUB_SUB_VOICEMAIL.COMPLETED](message: OrchestratorCloudEvent) {
          const data: any = message.data;
          let customerName: string = data.CustomerName;
          const primaryContactFedId: string = data.UserFedId;

          // Regex to remove underscore in customer name
          customerName = customerName.replaceAll("_", " ");

          const body: string = `Received voicemail from ${customerName}`;

          return await this.actions.sendNotification({
            primaryContactFedId,
            body,
          });
        },
        async [PUB_SUB_FWD_USER.COMPLETED](message: OrchestratorCloudEvent) {
          const data: any = message.data;

          let userName: string = data.userName;
          userName = userName.split(", ").reverse().join(" ");

          const forwardUserFedId: string = data.forwardUserFedId;

          const body: string = `${userName} is forwarding all communications to you`;

          return await this.actions.sendNotification({
            primaryContactFedId: forwardUserFedId,
            body,
          });
        },
      },
      methods: {
        async createBinding(
          fedId: string,
          deviceToken: string,
          notifyServiceSid: string
        ) {
          try {
            await this.schema
              .getClient()
              .notify.services(notifyServiceSid)
              .bindings.create({
                identity: fedId,
                bindingType: "apn",
                address: deviceToken,
              });
          } catch (error) {
            this.logger.error(error);
          }
        },
        async sendNotification(fedId: string, body: string) {
          try {
            const notifyServiceSid = process.env.TWILIO_NOTIFY_SERVICE_SID;
            const service = this.schema
              .getClient()
              .notify.services(notifyServiceSid);

            return await service.notifications.create({
              identity: fedId,
              body,
              sound: "aps.sound",
            });
          } catch (error) {
            this.logger.error(error);
          }
        },
        async handleInbound(data) {
          const from: string = data.ClientName;
          let to: string = data.UserName;
          to = to.split(", ").reverse().join(" ");
          const userFedId: string = data.UserFedId;

          const notificationBody: string = `${from} just called ${to}.`;

          switch (data.CustomerType) {
            case "Surgeon":
              let primaryContactFedId: string;
              if (data.PrimaryContactFedId) {
                primaryContactFedId = data.PrimaryContactFedId;
              }

              if (userFedId !== primaryContactFedId) {
                this.actions.sendNotification({
                  primaryContactFedId,
                  body: notificationBody,
                });
              }
              break;

            case "Unid Contact":
              const unidContactPrimary: string = data.PrimaryContactFedId;
              if (userFedId !== unidContactPrimary) {
                await this.actions.sendNotification({
                  primaryContactFedId: unidContactPrimary,
                  body: notificationBody,
                });
              }
              break;
          }
        },
        async handleOutbound(data) {
          let from: string = data.UserName;
          from = from.split(", ").reverse().join(" ");

          const to: string = data.ClientName;

          const notificationBody: string = `${from} just called ${to}.`;

          switch (data.CustomerType) {
            case "Surgeon":
              const clientRecord = await this.broker.call(
                "v1.sfdc-query.retrieveCustomers",
                { phoneNumber: data.CustomerPhoneNumber }
              );

              const primaryContactForSurgeon: string =
                clientRecord.records[0].Assigned_LAB_Engineer__r
                  .FederationIdentifier;

              if (data.UserFedId !== primaryContactForSurgeon) {
                this.actions.sendNotification({
                  primaryContactFedId: primaryContactForSurgeon,
                  body: notificationBody,
                });
              }
              break;

            case "Unid Contact":
              let unidContactPrimary = await this.broker.call(
                "v1.sfdc-query.retrieveCustomers",
                { phoneNumber: data.CustomerPhoneNumber }
              );

              unidContactPrimary =
                unidContactPrimary.records[0].Handles_Calls_for_UNiD_Contact__r
                  .FederationIdentifier;

              if (data.UserFedId !== unidContactPrimary) {
                this.actions.sendNotification({
                  primaryContactFedId: unidContactPrimary,
                  body: notificationBody,
                });
              }
              break;
          }
        },
      },
    });
  }
}
