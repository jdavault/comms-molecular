// Third-party
import { Context, Service, ServiceBroker, Errors } from "moleculer";
import AccessToken, { ChatGrant } from "twilio/lib/jwt/AccessToken";
import { ConversationInstance } from "twilio/lib/rest/conversations/v1/conversation";
import PhoneNumber from "awesome-phonenumber";
import { Twilio } from "twilio";
import { ParticipantConversationInstance } from "twilio/lib/rest/conversations/v1/service/participantConversation";
import twilioClientService from "../../mixins/twilio-client.service";

// First-party
import OrchestratorCloudEvent from "../models/OrchestratorCloudEvent";
import { UserRecord } from "../models/QuerySchemas";
import {
  SFDC_CONTACT_RECORD_UPDATED,
  SFDC_USER_RECORD_UPDATED,
} from "../constants/sfdc-webhooks.constants";
import {
  UpdatedRecordPayload,
  UserUpdatedRecord,
} from "../models/sfdc-webhooksSchemas";
import { NotificationPayload } from "../models/types";
import { PUB_SUB_FWD_USER } from "../constants/sfdc-users.constants";
import {
  ConversationAttr,
  PrimaryUserConversationAttr,
  ParticipantAttr,
  ParticipantType,
  ParticipantAttributes,
  PostOnConversationAdd,
  PostOnMessageAdded,
} from "./chat.models";

/**
 * Handlers
 */
import handleNewInboundConversation from "./inbound/newInboundConversation.handler";
import handleNewOutboundConversation from "./outbound/newOutboundConversation.handler";
import onMessageAddedHandler from "./webhooks/onMessageAdded";
import generateAddressMapping from "./shared/generateAddressMapping";


/**
 * Moleculer Service that drives chat functionality (SMS/MMS) between respective parties.
 */
export default class ChatService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker);
    this.parseServiceSchema({
      name: "chat",
      version: "v1",
      requestTimeout: 60 * 1000,
      mixins: [twilioClientService],
      actions: {
        test: {
          async handler(ctx: Context<any, any>) {
            return await generateAddressMapping(ctx, ctx.params.addresses);
          },
        },
        grantToken: {
          rest: {
            path: "/grant",
            method: "GET",
          },
          params: {},
          async handler(ctx: Context<any, any>): Promise<string> {
            // TODO: replace outboundGetToken here and outboundGetToken from medicrea-app
            return ctx.broker.call("v1.chat.outboundGetToken", {
              identity: ctx.meta.user.fedId,
            });
          },
        },
        outboundGetToken: {
          async handler(ctx: Context): Promise<string> {
            const params: any = ctx.params;
            const twilioAccountSid: string = process.env.TWILIO_ACCOUNT_SID;
            const twilioApiKey: string = process.env.TWILIO_API_KEY_SID;
            const twilioApiSecret: string = process.env.TWILIO_API_SECRET;

            const serviceSid: string =
              process.env.TWILIO_CONVERSATIONS_SERVICE_SID;

            const pushCredentialSid: string =
              process.env.TWILIO_PUSH_CREDENTIAL_SID;

            const identity: string = params.identity;

            const chatGrant: AccessToken.ChatGrant = new ChatGrant({
              serviceSid,
              pushCredentialSid,
            });

            const token: AccessToken = new AccessToken(
              twilioAccountSid,
              twilioApiKey,
              twilioApiSecret,
              { identity }
            );

            token.addGrant(chatGrant);

            return token.toJwt();
          },
        },
        twilioWebhookHandler: {
          rest: {
            path: "/conversations",
          },
          async handler(
            ctx: Context<PostOnConversationAdd | PostOnMessageAdded | any>
          ) {
            const params: any = ctx.params;
            switch (params.EventType) {
              case "onConversationAdded":
                if (this.isInboundMessage(params)) {
                  this.logger.debug(
                    "New conversation is from an SMS device, configuring new inbound convo"
                  );
                  this.actions.onConversationAdded(ctx.params);
                }
                break;
              case "onMessageAdded":
                await this.onMessageAdded(ctx);
                break;
              default:
                this.logger.error(
                  "Switch statement is not handling eventType:" +
                  params.EventType
                );
            }
          },
        },
        /**
         * There is an issue with onConversationAdd pre-hook event signature validation
         * Adding participants as a post-hook is a workaround
         */
        onConversationAdded: handleNewInboundConversation,

        /**
         * Creates a new conversation or finds an existing conversation and returns the sid
         * Participants from the planning unit will also be added to the conversation
         * Performs similar function to onConversationAdded Webhook event.
         */
        createConversation: handleNewOutboundConversation,

        /**
         * Temporary endpoint to cleanup Twilio conversations
         * TODO: Remove before release
         */
        clearConversations: {
          rest: {
            path: "/remove/all",
            method: "DELETE",
          },
          async handler(ctx: Context): Promise<any> {
            return this.clearConversations();
          },
        },
      },
      events: {
        async [SFDC_USER_RECORD_UPDATED](message: OrchestratorCloudEvent) {
          this.logger.debug("User record was updated.");
          try {
            if (message.data) {
              this.logger.debug(JSON.stringify(message.data));
              this.processUserRecordChange(message.data);
            }
          } catch (e) {
            this.logger.error(e);
            this.processError(e, SFDC_USER_RECORD_UPDATED);
          }
        },
        async [SFDC_CONTACT_RECORD_UPDATED](message: OrchestratorCloudEvent) {
          this.logger.debug("Contact record was updated.");
          try {
            if (message.data) {
              this.logger.debug(JSON.stringify(message.data));
              this.processContactRecordChange(message.data);
            }
          } catch (e) {
            this.logger.error(e);
            this.processError(e, SFDC_CONTACT_RECORD_UPDATED);
          }
        },
      },
      methods: {
        /**
         * Post Webhook event to handle task import into Salesforce
         */
        onMessageAdded: onMessageAddedHandler,

        /**
         * Below are all Twilio function that may be deprecated
         */

        async addConversationParticipants(
          conversationSid,
          identity,
          twilioNumber,
          participantDetail: ParticipantAttributes
        ) {
          const phoneNumber = new PhoneNumber(twilioNumber, "US");
          // try {
          await this.schema
            .getClient()
            .conversations.conversations(conversationSid)
            .participants.create({
              identity,
              "attributes": JSON.stringify({ ...participantDetail }),
              "messagingBinding.projectedAddress":
                phoneNumber.getNumber("e164"),
              "xTwilioWebhookEnabled": true,
            });
          // need to catch this error in createConversation
          // } catch (error) {
          //   // Group MMS with given participant list already exists as Conversation CHXXXX
          //   if (error.code === 50438)
          //     // the existing conversation sid appears as the end of the error message
          //     const existingConversationSid = error.message.slice(-34)
          //   this.logger.error(error);
          // }
        },
        async fetchConversationObject(
          conversationSid: string
        ): Promise<ConversationInstance> {
          try {
            return await this.schema
              .getClient()
              .conversations.conversations(conversationSid)
              .fetch();
          } catch (error) {
            this.logger.error(error);
            throw new Error(error);
          }
        },
        async addSMSParticipant(
          conversationSid: string,
          phoneNumber: PhoneNumber,
          participantAttr: ParticipantAttributes
        ) {
          try {
            return await this.schema
              .getClient()
              .conversations.conversations(conversationSid)
              .participants.create({
                "attributes": JSON.stringify({ ...participantAttr }),
                "messagingBinding.address": phoneNumber.getNumber("e164"),
                "xTwilioWebhookEnabled": true,
              });
          } catch (error) {
            this.logger.error(error);
            throw new Error(error);
          }
        },
        async fetchMessage(
          conversationSid: string,
          messageSid: string
        ): Promise<any> {
          try {
            return await this.schema
              .getClient()
              .conversations.conversations(conversationSid)
              .messages(messageSid)
              .fetch();
          } catch (error) {
            this.logger.error(error);
            throw new Error(error);
          }
        },

        async addContactParticipant(
          conversationSid: string,
          contactNumber: string
        ) {
          try {
            await this.schema
              .getClient()
              .conversations.conversations(conversationSid)
              .participants.create({
                "messagingBinding.address": contactNumber,
              });
          } catch (error) {
            this.logger.error(error);
            throw new Error(error);
          }
        },
        async createConversation(friendlyName: string) {
          try {
            return await this.schema
              .getClient()
              .conversations.conversations.create({
                friendlyName,
                xTwilioWebhookEnabled: true,
              });
          } catch (error) {
            this.logger.error(error);
            throw new Error(error);
          }
        },
        async fetchParticipant(
          participantSid: string,
          conversationSid: string
        ) {
          try {
            return await this.schema
              .getClient()
              .conversations.conversations(conversationSid)
              .participants(participantSid)
              .fetch();
          } catch (error) {
            this.logger.error(error);
            throw new Error(error);
          }
        },
        async clearConversations() {
          try {
            const conversations = await this.schema
              .getClient()
              .conversations.conversations.list();
            conversations.forEach(async (conversation: any) => {
              const convoSid = conversation.sid;
              await this.schema
                .getClient()
                .conversations.conversations(convoSid)
                .remove();
            });
            return {
              message: "Successfully removed all conversations from Twilio",
            };
          } catch (error) {
            this.logger.error(error);
            throw new Error(error);
          }
        },
        isInboundMessage(params: PostOnConversationAdd) {
          return params.Source === "SMS";
        },
        async processUserRecordChange(payload: UpdatedRecordPayload) {
          this.logger.debug(JSON.stringify(payload));
          if (isForwardingRelated(payload.changed)) {
            const oldVal: UserUpdatedRecord = payload.old as UserUpdatedRecord;
            const newVal: UserUpdatedRecord = payload.new as UserUpdatedRecord;
            if (newVal.availabilityStatus === "Out of Office") {
              const userFedId = newVal.userFedId;
              const userSfId = newVal.userSfId;
              const userName = `${newVal.firstName} ${newVal.lastName}`;
              const forwardingUserDetail = newVal.forwardingUser;
              await this.updateUsersConversationsWithForwardedUser(
                userFedId,
                newVal.assignedTwilioNumber,
                forwardingUserDetail,
                userSfId,
                userName,
              );
            } else if (
              !newVal.forwardingUser &&
              newVal.availabilityStatus === "Available" &&
              oldVal.forwardingUser &&
              oldVal.availabilityStatus === "Out of Office"
            ) {
              const userFedId = newVal.userFedId;
              await this.removeForwardedUserFromConversation(userFedId);
            }
          }

          function isForwardingRelated(changes: string[]): boolean {
            return (
              changes.includes("availabilityStatus") &&
              changes.includes("forwardingUser")
            );
          }
        },
        processContactRecordChange(payload: UpdatedRecordPayload) {
          this.logger.debug(JSON.stringify(payload));
        },
        async updateUsersConversationsWithForwardedUser(
          originalUserFedId: string,
          originalUserTwilioNumber: string,
          forwardUserSfId: string,
          userSfId: string,
          userName: string,
        ) {
          const forwardedUserQuery: UserRecord = await this.broker.call(
            "v1.sfdc-query.retrieveUserById",
            { id: forwardUserSfId }
          );
          if (forwardedUserQuery.totalSize !== 1) {
            throw new Errors.MoleculerServerError(
              `forwarded user with SF Id ${forwardUserSfId} could not be found`,
              500
            );
          }
          const forwardeduser = forwardedUserQuery.records[0];
          const twilio: Twilio = this.schema.getClient();
          const existingConversations =
            await twilio.conversations.participantConversations.list({
              identity: originalUserFedId,
              limit: 100,
            });
          let isPartOfLab = false;
          for (const c of existingConversations) {
            const currConvo: ParticipantConversationInstance =
              c as ParticipantConversationInstance;
            // Add the forwarded user as a participant
            let partiResult;
            try {
              const partiAttr: ParticipantAttr = {
                isInternal: true,
                sfId: forwardeduser.Id,
                type: forwardeduser.User_Role__c as ParticipantType,
                name: forwardeduser.Name,
                primaryPhone: forwardeduser.MobilePhone || forwardeduser.Phone,
                fedId: forwardeduser.FederationIdentifier,
                twilioNumber: forwardeduser.Twilio_Number__c,
              };
              partiResult = await twilio.conversations
                .conversations(currConvo.conversationSid)
                .participants.create({
                  attributes: JSON.stringify(partiAttr),
                  identity: forwardeduser.FederationIdentifier,
                  messagingBinding: {
                    projectedAddress: `+1${originalUserTwilioNumber}`,
                  },
                  xTwilioWebhookEnabled: "true",
                });
            } catch (e) {
              isPartOfLab = true;
              this.logger.debug(
                "error adding participant, they may already exist, skipping"
              );
            }
            // Update conversation attributes
            try {
              const existingConvo: ConversationInstance =
                await twilio.conversations
                  .conversations(currConvo.conversationSid)
                  .fetch();
              const currConvoAttr: ConversationAttr = JSON.parse(
                existingConvo.attributes
              );
              const targetIdx = currConvoAttr.primaryUsers.findIndex(
                (u: PrimaryUserConversationAttr) =>
                  u.fedId === originalUserFedId
              );
              const forwardedUserConvoAttr: PrimaryUserConversationAttr = {
                isLab: isPartOfLab,
                name: forwardeduser.Name,
                fedId: forwardeduser.FederationIdentifier,
                sfId: forwardeduser.Id,
                type: forwardeduser.User_Role__c as ParticipantType,
                twilioNumber: forwardeduser.Twilio_Number__c,
                forwardedUser: null, // todo
                participantSid: partiResult ? partiResult.sid : null,
              };
              currConvoAttr.primaryUsers[targetIdx].forwardedUser =
                forwardedUserConvoAttr;
              await twilio.conversations
                .conversations(currConvo.conversationSid)
                .update({
                  attributes: JSON.stringify(currConvoAttr),
                });
            } catch (e) {
              throw new Errors.MoleculerServerError(
                "unable to update conversation participant for forwarded user",
                500
              );
            }
          }
          const payload: NotificationPayload = {
            userName,
            forwardUserFedId: forwardeduser.FederationIdentifier,
            forwardUserSfId,
            userSfId,
          };
          this.broadcastPubSubMessage(
            payload,
            PUB_SUB_FWD_USER.COMPLETED
          );
          this.logger.debug("Finished processing user event");
        },
        async removeForwardedUserFromConversation(originalUserFedId: string) {
          try {
            const twilio: Twilio = this.schema.getClient();
            const existingConversations =
              await twilio.conversations.participantConversations.list({
                identity: originalUserFedId,
                limit: 100,
              });
            for (const c of existingConversations) {
              const currConvo: ParticipantConversationInstance = c;
              const existingConvo: ConversationInstance =
                await twilio.conversations
                  .conversations(currConvo.conversationSid)
                  .fetch();
              const existingConvAttr: ConversationAttr = JSON.parse(
                existingConvo.attributes
              );
              const targetIdx = existingConvAttr.primaryUsers.findIndex(
                (u: PrimaryUserConversationAttr) =>
                  u.fedId === originalUserFedId
              );
              const forwardedUser =
                existingConvAttr.primaryUsers[targetIdx].forwardedUser;
              if (!forwardedUser?.isLab) {
                // remove the participant
                const partiSid = forwardedUser.participantSid;
                await twilio.conversations
                  .conversations(currConvo.conversationSid)
                  .participants(partiSid)
                  .remove();
              }
              existingConvAttr.primaryUsers[targetIdx].forwardedUser = null;
              await twilio.conversations
                .conversations(currConvo.conversationSid)
                .update({
                  attributes: JSON.stringify(existingConvAttr),
                });
            }
          } catch (e) {
            throw new Errors.MoleculerServerError(
              `error occurred removing the forwarded user: ${e.message}`,
              500
            );
          }
          // add notification event
        },
        async broadcastPubSubMessage(payload, type) {
          this.logger.debug("broadcasting message: ", type);
          const cloudEvent = new OrchestratorCloudEvent({
            type: `${type}.${this.version}`,
            data: payload,
          });
          this.logger.debug("payload: ", cloudEvent);
          this.broker.emit(type, cloudEvent);
          return cloudEvent;
        },
      },
    });
  }
}
