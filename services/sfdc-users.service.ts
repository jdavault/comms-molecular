// Third-party
import { Errors, Service, ServiceBroker } from "moleculer";

// First-party
import { SFDCAuthService } from "../mixins/sfdc-auth.mixin";
import OrchestratorCloudEvent from "./models/OrchestratorCloudEvent";
import { UserRecordEntry } from "./models/QuerySchemas";

/**
 * Moleculer service that enable querying SalesForce database for retrieval and updates to
 * the User object.
 */
export default class SFDCUsersService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker);
    this.parseServiceSchema({
      name: "sfdc-users",
      version: "v1",
      mixins: [SFDCAuthService],
      actions: {
        /**
         * Get a user by their Federation Identifier
         */
        getUser: {
          async handler(ctx): Promise<UserRecordEntry> {
            try {
              const conn = await this.getClient();
              const contactQueryString = `
						  		SELECT
						  		  Id, FederationIdentifier, Username, Phone,
                    			  MobilePhone, User_Role__c, Name,
                    			  Twilio_Number__c, Availability_Status__c, Forwarding_User__c, isForwarded__c
						  		FROM User
						  		WHERE FederationIdentifier = '${ctx.meta.user.fedId}'
							`;
              const response = await conn.query(contactQueryString);
              if (response.records.length !== 1) {
                throw new Errors.MoleculerError(
                  "salesforce user not found with fedId"
                );
              }
              return response.records[0];
            } catch (error) {
              this.logger.error(error);
            }
          },
        },
        getUserBySfId: {
          params: {
            sfId: "string",
          },
          async handler(ctx): Promise<any> {
            try {
              const conn = await this.getClient();
              const contactQueryString = `
						  		SELECT
						  		  Id, FederationIdentifier, Username,
                    Phone, MobilePhone, User_Role__c, Name,
                    Twilio_Number__c, Availability_Status__c, Forwarding_User__c
						  		FROM User
						  		WHERE Id = '${ctx.params.sfId}'
							`;
              return conn.query(contactQueryString);
            } catch (error) {
              return error;
            }
          },
        },
        /**
         * Get all users where availbility status is 'Available'.
         */
        getUsers: {
          async handler(ctx): Promise<any> {
            try {
              const conn = await this.getClient();
              const contactQueryString = `
						  		SELECT
						  		  Id, FederationIdentifier, Username,
                    			  MobilePhone, User_Role__c, Name,
                    			  Twilio_Number__c, Availability_Status__c, Forwarding_User__c
						  		FROM User
						  		WHERE Availability_Status__c = 'Available'
							`;
              return conn.query(contactQueryString);
            } catch (error) {
              return error;
            }
          },
        },
        /**
         * Update a User's availability status by Id
         */
        updateUserStatus: {
          params: {
            id: "string",
            status: "string",
            userForwardId: "string",
            userName: "string|optional",
          },
          async handler(ctx): Promise<any> {
            try {
              const conn = await this.getClient();
              await conn.sobject("User").update({
                Id: ctx.params.id,
                // eslint-disable-next-line camelcase
                Availability_Status__c: ctx.params.status,
                // eslint-disable-next-line camelcase
                Forwarding_User__c: ctx.params.userForwardId,
              });
              return {
                msg: `Status for id: ${ctx.params.id} updated to : ${ctx.params.status}`,
              };
            } catch (error) {
              return error;
            }
          },
        },
        updateForwardContact: {
          // TODO: this will likely get removed and combined w/ update status per new story.
          // We will enforce setting forwarding contact immediately after setting OOO state
          params: {
            id: "string",
            forwardingUserId: "string",
          },
          async handler(ctx): Promise<any> {
            try {
              this.logger.trace("inside sfdc-users updateForwardContact");
              const conn = await this.getClient();
              const response = await conn.sobject("User").update({
                Id: ctx.params.id,
                // eslint-disable-next-line camelcase
                Forwarding_User__c: ctx.params.forwardingUserId,
              });
              this.logger.debug("response", response);
              // The conn.sobject.update query does not return anything for existing record
              return {
                msg: `Contact for id: ${ctx.params.id} updated to : ${ctx.params.forwardingUserId}`,
              };
            } catch (error) {
              return error;
            }
          },
        },
      },
      events: {},
      methods: {
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
