// Third-party
import { Context, Service, ServiceBroker } from "moleculer";
import * as _ from "lodash";

// First-party
import tokenService from "../mixins/token.mixin";
import { LoggedInUser, UserRecord } from "./models/QuerySchemas";

/**
 * Moleculer Service
 */

export default class MedicreaAppService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker);
    this.parseServiceSchema({
      name: "medicrea-app",
      version: "v1",
      mixins: [tokenService],
      actions: {
        /**
         * Get list of contacts
         */
        contacts: {
          rest: {
            path: "/contacts",
            params: {
              sfId: "string|optional",
            },
          },
          async handler(ctx: any) {
            this.logger.trace("invoking /contacts inside medicrea-app");
            return this.getContactsForUser(ctx);
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
        getHealth: {
          rest: {
            path: "/health",
            method: "GET",
          },
          async handler(ctx: Context): Promise<any> {
            const version = process.env.npm_package_version;
            const appUrl = process.env.APP_URL;
            const sfLogin = process.env.SF_LOGIN_URL;
            const sfuserName = process.env.SF_USERNAME;
            const nodeEnv = process.env.NODE_ENV;
            return Promise.resolve(
              {
                APP_VERSION: version,
                NODE_ENV: nodeEnv,
                APP_URL: appUrl,
                SF_LOGIN_URL: sfLogin,
                SF_USERNAME: sfuserName,
              }
            );
          },
        },
        getVoiceToken: {
          rest: {
            path: "/twilio/voiceToken",
          },
          params: {
            fedId: "string",
          },
          async handler(ctx: Context) {
            const params: any = ctx.params;
            const fedId: string = params.fedId;
            return this.schema.getVoiceToken(fedId);
          },
        },

        /**
         * Get a SalesForce User by their federation identifier
         */
        getUser: {
          rest: {
            path: "/user",
            method: "GET",
          },
          async handler(ctx: Context<any, any>): Promise<LoggedInUser> {
            this.logger.trace("inside medicrea-app getUser method");
            const user = await this.broker.call(
              "v1.sfdc-users.getUser",
              ctx.params,
              { meta: ctx.meta }
            );
            this.logger.debug(user);
            return {
              fedId: user.FederationIdentifier,
              username: user.Username,
              name: user.Name,
              availStatus: user.Availability_Status__c,
              forwardingUser: user.Forwarding_User__c,
              isForwarded: user.isForwarded__c,
              sfId: user.Id,
              phone: user.MobilePhone,
              role: user.User_Role__c,
              assignedTwilioNumber: user.Twilio_Number__c,
            };
          },
        },
        /**
         * Get a SalesForce User by their sf identifier
         */
        getUserBySfId: {
          rest: {
            path: "/sfUser",
            method: "GET",
            params: {
              sfId: "string",
            },
          },
          async handler(ctx): Promise<any> {
            this.logger.trace("inside medicrea-app getUser method");
            const response = await this.broker.call(
              "v1.sfdc-users.getUserBySfId",
              ctx.params
            );
            const user = response.records[0];
            return {
              fedId: user.FederationIdentifier,
              username: user.Username,
              name: user.Name,
              availStatus: user.Availability_Status__c,
              forwardingUser: user.Forwarding_User__c,
              sfId: user.Id,
              phone: user.MobilePhone ? user.MobilePhone : user.Phone,
              role: user.User_Role__c,
              assignedTwilioNumber: user.Twilio_Number__c,
            };
          },
        },
        /**
         * Get all available SalesForcer Users
         */
        getUsers: {
          rest: {
            path: "/users",
            method: "GET",
            params: {
              fedId: "string",
            },
          },
          async handler(ctx): Promise<any> {
            this.logger.trace("inside medicrea-app getUsers method");
            const response = await this.broker.call(
              "v1.sfdc-users.getUsers",
              ctx.params
            );
            this.logger.debug(response);
            return response;
          },
        },
        retrieveAllDirectTwilioNumberUsers: {
          rest: {
            path: "/users/direct",
            method: "GET",
          },
          async handler(ctx: Context<any, any>): Promise<UserRecord> {
            return await ctx.broker.call(
              "v1.sfdc-query.retrieveAllDirectTwilioNumberUsers"
            );
          },
        },
        /**
         * Update a SalesForce User's status
         */
        updateUserStatus: {
          rest: {
            path: "/user",
            method: "PUT",
            params: {
              id: "string",
              status: "string",
              userForwardId: "string",
            },
          },
          async handler(ctx): Promise<any> {
            this.logger.trace("inside medicrea-app updateUserStatus method");
            this.logger.debug("params: ", ctx.params);
            const params = { ...ctx.params, userName: ctx.meta.user.name };

            const response = await this.broker.call(
              "v1.sfdc-users.updateUserStatus",
              params
            );
            this.logger.debug(response);
            return response;
          },
        },
        createConversation: {
          rest: {
            path: "/conversations",
            method: "POST",
          },
          params: {
            participants: "string[]",
            subject: "string",
            senderTwilioNumber: "string",
          },
          // type will be ConversationInstance
          async handler(ctx: Context<any, any>): Promise<any> {
            this.logger.debug(ctx.params.participants);
            this.logger.debug(ctx.meta);

            return ctx.broker.call("v1.chat.createConversation", ctx.params, {
              meta: ctx.meta,
            });
          },
        },
        retrieveNewMessageSubjects: {
          rest: {
            path: "/message/subjects",
            method: "GET",
          },
          async handler(ctx: Context): Promise<any> {
            return this.broker.call("v1.sfdc-tasks.retrieveTaskSubjects");
          },
        },
        createInitialNotifyBinding: {
          rest: {
            path: "/notify/binding/create",
            method: "POST",
            params: {
              deviceToken: "string",
            },
          },
          async handler(ctx: Context) {
            return this.broker.call(
              "v1.notify.createInitialBinding",
              ctx.params,
              { meta: { ...ctx.meta } }
            );
          },
        },
      },
      events: {},
      methods: {
        async getContactsForUser(ctx) {
          let contactsResponse;
          let planningUnitIds = [];
          let planningUnitUnidContacts = [];

          if (ctx.params.sfId) {
            // Retrieve customers where the user's phone is linked to
            planningUnitIds = await this.broker.call(
              "v1.sfdc-query.getPlanningUnitIdsByUserId",
              { sfId: ctx.params.sfId }
            );
          }
          // If there is a sfId (user is a lab engineer or case manager), retrieving contacts filtered by it
          if (ctx.params.sfId) {
            contactsResponse = await this.broker.call(
              "v1.sfdc-query.getAllContacts",
              { planningUnitIds, sfId: ctx.params.sfId }
            );
            planningUnitUnidContacts = contactsResponse.contacts
              ? this.getUnidContactsFromSurgeon(contactsResponse.contacts)
              : [];
            // Otherwise, get all the contacts
          } else {
            contactsResponse = await this.broker.call(
              "v1.sfdc-query.getAllContacts"
            );
          }

          const contactList = [];
          if (contactsResponse.contacts) {
            contactList.push(
              ...contactsResponse.contacts.map((c: any) => {
                if (c) {
                  return {
                    attributes: c.attributes,
                    Id: c.Id,
                    Name: c.Name,
                    MobilePhone: c.MobilePhone,
                    Phone: c.Phone,
                    Email: c.Email,
                    AltEmail: c.Secondary_Email__c,
                    Location: c.Account?.Name,
                  };
                }
              })
            );
          }
          const unidContacts =
            planningUnitUnidContacts && planningUnitUnidContacts.length > 0
              ? planningUnitUnidContacts
              : contactsResponse.unidContacts;

          if (unidContacts) {
            contactList.push(
              ...unidContacts.map((uc: any) => {
                if (uc) {
                  return {
                    attributes: uc.attributes,
                    Id: uc.Id,
                    Name: uc.Name,
                    Phone: uc.Phone_Number__c,
                    Email: uc.Email__c,
                    AltEmail: uc.Alternative_Email__c,
                    Type: uc.Type__c,
                  };
                }
              })
            );
          }

          // Remove duplicate objects (possible when filtering by PU due to extracing unid contacts from surgeon)
          return _.uniqWith(
            contactList
              // Remove undefined / null records
              .filter((x: any) => x)
              .sort((a, b) => a.Name.localeCompare(b.Name)),
            _.isEqual
          );
        },

        getUnidContactsFromSurgeon(records) {
          const planningUnitUnidContacts: any[] = [];
          records.forEach((record: any) => {
            // Retrieve the planningUnitIds so that we can filter contacts
            // Extract UniD contacts tied to Surgeon, to be added as contacts to contactList
            planningUnitUnidContacts.push(record.Sales_Rep_Primary__r);
            planningUnitUnidContacts.push(record.Sales_Rep_Secondary__r);
            planningUnitUnidContacts.push(record.Imaging_Contact_Primary__r);
            planningUnitUnidContacts.push(record.Imaging_Contact_Secondary__r);
            planningUnitUnidContacts.push(record.Imaging_Contact_Tertiary__r);
            planningUnitUnidContacts.push(
              record.Case_Discovery_Contact_Primary__r
            );
            planningUnitUnidContacts.push(
              record.Case_Discovery_Contact_Secondary__r
            );
            planningUnitUnidContacts.push(
              record.Case_Discovery_Contact_Tertiary__r
            );
            planningUnitUnidContacts.push(record.Approval_Reminder_Contact__r);
          });
          return planningUnitUnidContacts;
        },
      },
    });
  }
}
