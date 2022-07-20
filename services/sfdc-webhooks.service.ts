// Third-party
import PhoneNumber from "awesome-phonenumber";
import { Service, ServiceBroker } from "moleculer";
import { SFDCWebhookAuth } from "../mixins/validate-sf-webhook";
import {
  CONTACT_FIELD_MAP,
  RECORD_TYPE,
  SFDC_CONTACT_RECORD_UPDATED,
  SFDC_USER_RECORD_UPDATED,
  USER_FIELD_MAP,
} from "./constants/sfdc-webhooks.constants";
import OrchestratorCloudEvent from "./models/OrchestratorCloudEvent";
import {
  ContactUpdatedRecord,
  UpdatedRecordPayload,
  UserUpdatedRecord,
} from "./models/sfdc-webhooksSchemas";

export default class SFDCTWebhooksService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker);
    this.parseServiceSchema({
      name: "sfdc-webhooks",
      version: "v1",
      mixins: [SFDCWebhookAuth],
      actions: {
        /**
         * Receive inbound message callback
         *
         */
        sfdcTrigger: {
          rest: "/sfdc/trigger",
          method: "POST",
          async handler(ctx: any) {
            this.processWebhook(ctx.params);
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
        processWebhook(params: any): UpdatedRecordPayload {
          this.logger.debug(JSON.stringify("Processing Webhook"));
          this.logger.debug(JSON.stringify(params));
          let payload: UpdatedRecordPayload = null;

          if (params.new) {
            for (let i = 0; i < params.new.length; i++) {
              const completeNewRecords = params.new[i];
              const recordType: string =
                this.getUpdatedRecordType(completeNewRecords);

              if (recordType === RECORD_TYPE.USER) {
                payload = this.processUserChangedWebhook(params, i);
              } else if (recordType === RECORD_TYPE.CONTACT) {
                payload = this.processContactChangedWebhook(params, i);
              }
            }
          }

          return payload;
        },
        processUserChangedWebhook(
          params: any,
          recordNumber
        ): UpdatedRecordPayload {
          this.logger.debug(JSON.stringify("Processing User Changed Webhook"));
          this.logger.debug(JSON.stringify(params));
          let payload: UpdatedRecordPayload = null;

          if (params.new && params.new.length > recordNumber) {
            const completeNewRecord = params.new[recordNumber];
            const completeOldRecord =
              params.old && params.old.length > recordNumber
                ? params.old[recordNumber]
                : {};

            const newValues: UserUpdatedRecord =
              this.getPertinentUserValues(completeNewRecord);
            const oldValues: UserUpdatedRecord =
              this.getPertinentUserValues(completeOldRecord);

            const changedFields: string[] = this.getChangedFields(
              RECORD_TYPE.USER,
              params.changed
            );
            payload = {
              type: RECORD_TYPE.USER,
              new: newValues,
              old: oldValues,
              changed: changedFields,
            };
            this.logger.debug(JSON.stringify(payload));
            this.broadcastPubSubMessage(payload, SFDC_USER_RECORD_UPDATED);
          }
          return payload;
        },
        processContactChangedWebhook(
          params: any,
          recordNumber
        ): UpdatedRecordPayload {
          this.logger.debug(
            JSON.stringify("Processing Contact Changed Webhook")
          );
          this.logger.debug(JSON.stringify(params));
          let payload: UpdatedRecordPayload = null;

          if (params.new && params.new.length > recordNumber) {
            const completeNewRecord = params.new[recordNumber];
            const completeOldRecord =
              params.old && params.old.length > recordNumber
                ? params.old[recordNumber]
                : {};

            const newValues: ContactUpdatedRecord =
              this.getPertinentContactValues(completeNewRecord);
            const oldValues: ContactUpdatedRecord =
              this.getPertinentContactValues(completeOldRecord);

            const changedFields: string[] = this.getChangedFields(
              RECORD_TYPE.CONTACT,
              params.changed
            );
            payload = {
              type: RECORD_TYPE.CONTACT,
              new: newValues,
              old: oldValues,
              changed: changedFields,
            };
            this.logger.debug(JSON.stringify(payload));
            this.broadcastPubSubMessage(payload, SFDC_CONTACT_RECORD_UPDATED);
          }
          return payload;
        },
        getPertinentUserValues(userValues: any): UserUpdatedRecord {
          const pertinentValues: UserUpdatedRecord = {
            userFedId: userValues.FederationIdentifier,
            userSfId: userValues.Id,
            firstName: userValues.FirstName,
            lastName: userValues.LastName,
            phone:
              userValues.Phone &&
              this.getNormalizedPhoneNumber(userValues.Phone),
            mobilePhone:
              userValues.MobilePhone &&
              this.getNormalizedPhoneNumber(userValues.MobilePhone),
            assignedTwilioNumber: this.getNormalizedPhoneNumber(
              userValues.Twilio_Number__c
            ),
            email: userValues.Email,
            userRole: userValues.User_Role__c,
            availabilityStatus: userValues.Availability_Status__c,
            isForwarded: userValues.Forwarding_User__c ? true : false,
            forwardingUser: userValues.Forwarding_User__c
              ? userValues.Forwarding_User__c
              : null,
          };

          return pertinentValues;
        },
        getPertinentContactValues(contactValues: any): ContactUpdatedRecord {
          const pertinentValues: ContactUpdatedRecord = {
            userSfId: contactValues.Id,
            firstName: contactValues.FirstName,
            lastName: contactValues.LastName,
            fullName: contactValues.Full_Name__c,
            phone:
              contactValues.Phone &&
              this.getNormalizedPhoneNumber(contactValues.Phone),
            mobilePhone:
              contactValues.MobilePhone &&
              this.getNormalizedPhoneNumber(contactValues.MobilePhone),
            email: contactValues.Email,
            assignedConsultantId: contactValues.Assigned_Consultant__c,
            unidPhoneNumber: this.getNormalizedPhoneNumber(
              contactValues.UNiD_Phone_Number__c
            ),
            assignedLabEngineerId: contactValues.Assigned_LAB_Engineer__c,
            handlesCallsForUnidContactId:
              contactValues.Handles_Calls_for_UNiD_Contact__c,
            assignedCaseManagerId: contactValues.Assigned_Case_Manager__c,
            handlesTextsForUnidContactId:
              contactValues.Handles_Texts_for_UNiD_Contact__c,
          };

          return pertinentValues;
        },
        getChangedFields(
          recordType: RECORD_TYPE,
          changedFields: string[]
        ): string[] {
          const mappedChangedFields: string[] = [];

          for (let i = 0; i < changedFields.length; i++) {
            if (recordType === RECORD_TYPE.USER) {
              mappedChangedFields[i] = USER_FIELD_MAP.get(changedFields[i]);
            } else if (recordType === RECORD_TYPE.CONTACT) {
              mappedChangedFields[i] = CONTACT_FIELD_MAP.get(changedFields[i]);
            }
          }

          if (
            recordType === RECORD_TYPE.USER &&
            mappedChangedFields.includes("forwardingUser") &&
            !mappedChangedFields.includes("isForwarded")
          ) {
            mappedChangedFields.push("isForwarded");
          }

          return mappedChangedFields;
        },
        getNormalizedPhoneNumber(phoneNumber: string): string {
          try {
            return (phoneNumber && phoneNumber.length !== 0)
              ? PhoneNumber(phoneNumber, "US").getNumber("significant")
              : null;
          } catch (e) {
            this.logger.error(`could not format phone number: ${e.message}`);
            return null;
          }
        },
        getUpdatedRecordType(completeNewRecord: any): string {
          let recordType = RECORD_TYPE.UNKNOWN;

          if (
            completeNewRecord.attributes &&
            completeNewRecord.attributes.type
          ) {
            recordType = completeNewRecord.attributes.type;
          }

          return recordType;
        },
      },
    });
  }
}
