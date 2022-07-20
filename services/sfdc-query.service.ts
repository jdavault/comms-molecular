// Third-party imports
import { Service, ServiceBroker } from "moleculer";
import PhoneNumber from "awesome-phonenumber";

// First-party imports
import { SFDCAuthService } from "../mixins/sfdc-auth.mixin";
import OrchestratorCloudEvent from "./models/OrchestratorCloudEvent";
import { PUB_SUB_SFDC_QUERY } from "./constants/sfdc-query.constants";
import {
  SURGEON,
  UNID_CONTACT,
  UNKNOWN,
  UNID_CONTACT_SOBJECT,
} from "./voice/voice.constants";
import { CustomerRecord, UserRecord } from "./models/QuerySchemas";
import standardNumber from "./utils/standardNumber";

export const EXCEPT_INVALID_NUMBER =
  "The provided phone number to query by is not a valid US number";
export const EXCEPT_INVALID_PUO_ID =
  "The provided Planning Unit Organization Id to query by is not valid";
export const EXCEPT_INVALID_USER_TYPE =
  "The provided user type to query by is not valid";

export default class SFDCQueryService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker);
    this.parseServiceSchema({
      name: "sfdc-query",
      version: "v1",
      mixins: [SFDCAuthService],
      actions: {
        getAllContacts: {
          async handler(ctx) {
            const conn = await this.getClient();
            let contactQueryString;
            // Filter contacts by planning unit user is a part of (for case manager and engineer), and get the unid contacts
            if (ctx.params.planningUnitIds) {
              const ids = ctx.params.planningUnitIds
                .map((num: any) => `'${num}'`)
                .toString();
              contactQueryString = `
							SELECT Id, Name, Phone, MobilePhone, Email, Secondary_Email__c, Account.Name,
              Approval_Reminder_Contact__r.Id,
                  Approval_Reminder_Contact__r.Name,
                  Approval_Reminder_Contact__r.Phone_Number__c,
                  Approval_Reminder_Contact__r.Email__c,
                  Approval_Reminder_Contact__r.Alternative_Email__c,
                  Approval_Reminder_Contact__r.Type__c,
                  Case_Discovery_Contact_Primary__r.Id,
                  Case_Discovery_Contact_Primary__r.Name,
                  Case_Discovery_Contact_Primary__r.Phone_Number__c,
                  Case_Discovery_Contact_Primary__r.Email__c,
                  Case_Discovery_Contact_Primary__r.Alternative_Email__c,
                  Case_Discovery_Contact_Primary__r.Type__c,
                  Case_Discovery_Contact_Secondary__r.Id,
                  Case_Discovery_Contact_Secondary__r.Name,
                  Case_Discovery_Contact_Secondary__r.Phone_Number__c,
                  Case_Discovery_Contact_Secondary__r.Email__c,
                  Case_Discovery_Contact_Secondary__r.Alternative_Email__c,
                  Case_Discovery_Contact_Secondary__r.Type__c,
                  Case_Discovery_Contact_Tertiary__r.Id,
                  Case_Discovery_Contact_Tertiary__r.Name,
                  Case_Discovery_Contact_Tertiary__r.Phone_Number__c,
                  Case_Discovery_Contact_Tertiary__r.Email__c,
                  Case_Discovery_Contact_Tertiary__r.Alternative_Email__c,
                  Case_Discovery_Contact_Tertiary__r.Type__c,
                  Imaging_Contact_Primary__r.Id,
                  Imaging_Contact_Primary__r.Name,
                  Imaging_Contact_Primary__r.Phone_Number__c,
                  Imaging_Contact_Primary__r.Email__c,
                  Imaging_Contact_Primary__r.Alternative_Email__c,
                  Imaging_Contact_Primary__r.Type__c,
                  Imaging_Contact_Secondary__r.Id,
                  Imaging_Contact_Secondary__r.Name,
                  Imaging_Contact_Secondary__r.Phone_Number__c,
                  Imaging_Contact_Secondary__r.Email__c,
                  Imaging_Contact_Secondary__r.Alternative_Email__c,
                  Imaging_Contact_Secondary__r.Type__c,
                  Imaging_Contact_Tertiary__r.Id,
                  Imaging_Contact_Tertiary__r.Name,
                  Imaging_Contact_Tertiary__r.Phone_Number__c,
                  Imaging_Contact_Tertiary__r.Email__c,
                  Imaging_Contact_Tertiary__r.Alternative_Email__c,
                  Imaging_Contact_Tertiary__r.Type__c,
                  Sales_Rep_Primary__r.Id,
                  Sales_Rep_Primary__r.Name,
                  Sales_Rep_Primary__r.Phone_Number__c,
                  Sales_Rep_Primary__r.Email__c,
                  Sales_Rep_Primary__r.Alternative_Email__c,
                  Sales_Rep_Primary__r.Type__c,
                  Sales_Rep_Secondary__r.Id,
                  Sales_Rep_Secondary__r.Name,
                  Sales_Rep_Secondary__r.Phone_Number__c,
                  Sales_Rep_Secondary__r.Email__c,
                  Sales_Rep_Secondary__r.Alternative_Email__c,
                  Sales_Rep_Secondary__r.Type__c
							FROM Contact
							WHERE UNiD_Status__c != null
              AND UNiD_Status__c != 'Non-User'
              AND Planning_Unit_Organization__c IN (${ids})
              ORDER BY LastName ASC`;
            } else {
              // Else get all the contacts
              contactQueryString = `
							SELECT Id, Name, Phone, MobilePhone, Email, Secondary_Email__c, Account.Name
							FROM Contact
							WHERE UNiD_Status__c != null
              AND UNiD_Status__c != 'Non-User'
              ORDER BY LastName ASC`;
            }
            const unidContactQueryString = `
							SELECT Id, Name, Phone_Number__c, Email__c, Alternative_Email__c, Type__c
							FROM UNiD_Contacts__c
              ORDER BY Name ASC
						`;
            let contacts = [];
            this.logger.debug("Retrieving all contacts...");
            if (
              (ctx.params.planningUnitIds &&
                ctx.params.planningUnitIds.length > 0) ||
              !ctx.params.sfId
            ) {
              contacts = await conn.query(contactQueryString);
            }
            // Map for consistent field values returned
            this.logger.debug("Retrieving all UNiD Contacts...");
            let unidContacts = [];
            // Only execute the standard unidContactQueryString if the user is not lab engineer / case-manager
            if (
              (ctx.params.planningUnitIds &&
                ctx.params.planningUnitIds.length > 0) ||
              !ctx.params.sfId
            ) {
              unidContacts = await conn.query(unidContactQueryString);
            }
            return {
              contacts: contacts.records ? contacts.records : [],
              unidContacts: unidContacts.records ? unidContacts.records : [],
            };
          },
        },
        getPlanningUnitIdsByUserId: {
          async handler(ctx) {
            const conn = await this.getClient();
            const planningUnitQuery = `
							SELECT Planning_Unit_Organization__c
							FROM Planning_Unit_Membership__c
              WHERE User__c = '${ctx.params.sfId}'
						`;
            const planningUnitOrgs = await conn.query(planningUnitQuery);
            return planningUnitOrgs.records.map(
              (pu: any) => pu.Planning_Unit_Organization__c
            );
          },
        },
        retrieveCustomers: {
          async handler(ctx): Promise<CustomerRecord> {
            this.logger.debug("RetrieveCustomers invoked with: ", ctx);
            const conn = await this.getClient();
            const phoneNumber = PhoneNumber(
              ctx.params.phoneNumber.toString(),
              "US"
            );
            this.validatePhoneNumber(phoneNumber);

            let customerType;
            let customerRecords: CustomerRecord | any;
            let unidContactRecords;
            const unidContactSOSLQuery = `
              FIND {${phoneNumber.getNumber("significant")}}
              IN PHONE FIELDS RETURNING UNiD_Contacts__c(Id)
            `;

            try {
              unidContactRecords = await conn.search(unidContactSOSLQuery);

              if (unidContactRecords.searchRecords.length !== 0) {
                customerType = UNID_CONTACT;
                const unidID = unidContactRecords.searchRecords[0].Id;
                const contactSOQLQuery = `
                  SELECT Id, Name, Phone, MobilePhone,
                  Planning_Unit_Organization__r.Id,
                  Assigned_LAB_Engineer__r.Id,
                  Assigned_LAB_Engineer__r.Name,
                  Assigned_LAB_Engineer__r.Phone,
                  Assigned_LAB_Engineer__r.MobilePhone,
                  Assigned_LAB_Engineer__r.FederationIdentifier,
                  Assigned_LAB_Engineer__r.Forwarding_User__r.FederationIdentifier,
                  Assigned_LAB_Engineer__r.Forwarding_User__r.Name,
                  Handles_Calls_for_UNiD_Contact__r.Id,
                  Handles_Calls_for_UNiD_Contact__r.Name,
                  Handles_Calls_for_UNiD_Contact__r.Phone,
                  Handles_Calls_for_UNiD_Contact__r.MobilePhone,
                  Handles_Calls_for_UNiD_Contact__r.FederationIdentifier,
                  Handles_Texts_for_UNiD_Contact__r.Id,
                  Handles_Texts_for_UNiD_Contact__r.Name,
                  Handles_Texts_for_UNiD_Contact__r.Phone,
                  Handles_Texts_for_UNiD_Contact__r.MobilePhone,
                  Handles_Texts_for_UNiD_Contact__r.FederationIdentifier,
                  Handles_Texts_for_UNiD_Contact__r.Forwarding_User__r.FederationIdentifier,
                  Handles_Texts_for_UNiD_Contact__r.Forwarding_User__r.Name,
                  Approval_Reminder_Contact__r.Id,
                  Approval_Reminder_Contact__r.Name,
                  Approval_Reminder_Contact__r.Phone_Number__c,
                  Case_Discovery_Contact_Primary__r.Id,
                  Case_Discovery_Contact_Primary__r.Name,
                  Case_Discovery_Contact_Primary__r.Phone_Number__c,
                  Case_Discovery_Contact_Secondary__r.Id,
                  Case_Discovery_Contact_Secondary__r.Name,
                  Case_Discovery_Contact_Secondary__r.Phone_Number__c,
                  Case_Discovery_Contact_Tertiary__r.Id,
                  Case_Discovery_Contact_Tertiary__r.Name,
                  Case_Discovery_Contact_Tertiary__r.Phone_Number__c,
                  Imaging_Contact_Primary__r.Id,
                  Imaging_Contact_Primary__r.Name,
                  Imaging_Contact_Primary__r.Phone_Number__c,
                  Imaging_Contact_Secondary__r.Id,
                  Imaging_Contact_Secondary__r.Name,
                  Imaging_Contact_Secondary__r.Phone_Number__c,
                  Imaging_Contact_Tertiary__r.Id,
                  Imaging_Contact_Tertiary__r.Name,
                  Imaging_Contact_Tertiary__r.Phone_Number__c,
                  Sales_Rep_Primary__r.Id,
                  Sales_Rep_Primary__r.Name,
                  Sales_Rep_Primary__r.Phone_Number__c,
                  Sales_Rep_Secondary__r.Id,
                  Sales_Rep_Secondary__r.Name,
                  Sales_Rep_Secondary__r.Phone_Number__c
                  FROM Contact
                  WHERE Approval_Reminder_Contact__r.Id = '${unidID}'
                  OR Case_Discovery_Contact_Primary__r.Id = '${unidID}'
                  OR Case_Discovery_Contact_Secondary__r.Id = '${unidID}'
                  OR Case_Discovery_Contact_Tertiary__r.Id = '${unidID}'
                  OR Imaging_Contact_Primary__r.Id = '${unidID}'
                  OR Imaging_Contact_Secondary__r.Id = '${unidID}'
                  OR Imaging_Contact_Tertiary__r.Id = '${unidID}'
                  OR Sales_Rep_Primary__r.Id = '${unidID}'
                  OR Sales_Rep_Secondary__r.Id = '${unidID}'
                `;

                customerRecords = await conn.query(contactSOQLQuery);

                // We need to remove all unrelated unid contacts for later relationship lookups
                if (customerRecords.records.length > 0) {
                  for (const customerRecord of customerRecords.records) {
                    if (customerRecord) {
                      for (const property in customerRecord) {
                        if (
                          customerRecord[property]?.attributes?.type ===
                          UNID_CONTACT_SOBJECT &&
                          customerRecord[property]?.Id &&
                          customerRecord[property]?.Id !== unidID
                        ) {
                          customerRecord[property] = null;
                        }
                      }
                    }
                  }
                }
              } else {
                const contactSOSLQuery = `
                  FIND {${phoneNumber.getNumber("significant")}}
                  IN PHONE FIELDS RETURNING Contact(
                  Id, Name, Phone, MobilePhone,
                  Planning_Unit_Organization__r.Id,
                  Assigned_LAB_Engineer__r.Id,
                  Assigned_LAB_Engineer__r.Name,
                  Assigned_LAB_Engineer__r.Phone,
                  Assigned_LAB_Engineer__r.MobilePhone,
                  Assigned_LAB_Engineer__r.Forwarding_User__r.FederationIdentifier,
                  Assigned_LAB_Engineer__r.Forwarding_User__r.Name,
                  Assigned_LAB_Engineer__r.FederationIdentifier,
                  Handles_Calls_for_UNiD_Contact__r.Id,
                  Handles_Calls_for_UNiD_Contact__r.Name,
                  Handles_Calls_for_UNiD_Contact__r.Phone,
                  Handles_Calls_for_UNiD_Contact__r.MobilePhone,
                  Handles_Calls_for_UNiD_Contact__r.FederationIdentifier,
                  Handles_Texts_for_UNiD_Contact__r.Id,
                  Handles_Texts_for_UNiD_Contact__r.Name,
                  Handles_Texts_for_UNiD_Contact__r.Phone,
                  Handles_Texts_for_UNiD_Contact__r.MobilePhone,
                  Handles_Texts_for_UNiD_Contact__r.FederationIdentifier,
                  Handles_Texts_for_UNiD_Contact__r.Forwarding_User__r.FederationIdentifier,
                  Handles_Texts_for_UNiD_Contact__r.Forwarding_User__r.Name,
                  Approval_Reminder_Contact__r.Id,
                  Approval_Reminder_Contact__r.Name,
                  Approval_Reminder_Contact__r.Phone_Number__c,
                  Case_Discovery_Contact_Primary__r.Id,
                  Case_Discovery_Contact_Primary__r.Name,
                  Case_Discovery_Contact_Primary__r.Phone_Number__c,
                  Case_Discovery_Contact_Secondary__r.Id,
                  Case_Discovery_Contact_Secondary__r.Name,
                  Case_Discovery_Contact_Secondary__r.Phone_Number__c,
                  Case_Discovery_Contact_Tertiary__r.Id,
                  Case_Discovery_Contact_Tertiary__r.Name,
                  Case_Discovery_Contact_Tertiary__r.Phone_Number__c,
                  Imaging_Contact_Primary__r.Id,
                  Imaging_Contact_Primary__r.Name,
                  Imaging_Contact_Primary__r.Phone_Number__c,
                  Imaging_Contact_Secondary__r.Id,
                  Imaging_Contact_Secondary__r.Name,
                  Imaging_Contact_Secondary__r.Phone_Number__c,
                  Imaging_Contact_Tertiary__r.Id,
                  Imaging_Contact_Tertiary__r.Name,
                  Imaging_Contact_Tertiary__r.Phone_Number__c,
                  Sales_Rep_Primary__r.Id,
                  Sales_Rep_Primary__r.Name,
                  Sales_Rep_Primary__r.Phone_Number__c,
                  Sales_Rep_Secondary__r.Id,
                  Sales_Rep_Secondary__r.Name,
                  Sales_Rep_Secondary__r.Phone_Number__c)
                  `;

                customerRecords = await conn.search(contactSOSLQuery);
                if (customerRecords.searchRecords.length !== 0) {
                  customerType = SURGEON;
                }
              }
            } catch (error) {
              this.logger.error(error);
              this.processError("sfdc-query.retrieveCustomers");
              throw error;
            }

            const customerRecordResp: CustomerRecord = {
              records:
                unidContactRecords.searchRecords.length !== 0
                  ? customerRecords.records
                  : customerRecords.searchRecords,
              totalSize:
                unidContactRecords.searchRecords.length !== 0
                  ? customerRecords.records.length
                  : customerRecords.searchRecords.length,
              type: customerType ? customerType : UNKNOWN,
              done: true,
            };

            if (customerType === UNID_CONTACT && customerRecords.records.length === 1) {
              customerRecordResp.relatedSurgeonSfId = customerRecords.records[0].Id;
            }

            return customerRecordResp;
          },
        },
        retrieveUsers: {
          async handler(ctx): Promise<UserRecord> {
            const conn = await this.getClient();
            const userType = ctx.params.userType;
            this.validateUserType(userType);
            const queryString = `\
              SELECT Id, Name, Phone, MobilePhone, FederationIdentifier, Twilio_Number__c, User_Role__c\
                FROM User\
                WHERE User_Role__c = '${userType}'\
                AND Availability_Status__c = 'Available'\
                AND (\
                  Phone != null\
                  OR MobilePhone != null\
                )\
              `;
            let userRecords;

            try {
              userRecords = await conn.query(queryString);
            } catch (error) {
              this.logger.error(error);
              this.processError("sfdc-query.retrieveUsers");
              throw error;
            }

            return userRecords;
          },
        },
        retrieveAllDirectTwilioNumberUsers: {
          async handler(ctx): Promise<UserRecord> {
            const conn = await this.getClient();
            try {
              const queryString = `\
              SELECT Id, Name, Phone, MobilePhone, FederationIdentifier, Twilio_Number__c\
              FROM User\
              WHERE User_Role__c in ('Consultant', 'Manager')\
              AND Twilio_Number__c != null
              `;
              return await conn.query(queryString);
            } catch (error) {
              this.logger.error(error);
              this.processError("sfdc-query.retrieveAllUsers");
            }
          },
        },
        retrieveUserByTwilioNumber: {
          async handler(ctx): Promise<UserRecord> {
            try {
              this.logger.debug("Retrieving by Twilio Number");
              const conn = await this.getClient();
              const phoneNumber = PhoneNumber(
                ctx.params.phoneNumber.toString(),
                "US"
              );
              this.validatePhoneNumber(phoneNumber);
              // Get formatted numbers to account for field formatting in different SFDC fields
              const nationalNumber = phoneNumber.getNumber("national");
              const international = phoneNumber
                .getNumber("international")
                .replace("+1 ", "");
              const condensedNational = international.replace(/-/g, "");
              const numbers = [nationalNumber, international, condensedNational]
                .map((num: any) => `'${num}'`)
                .toString();

              const queryString = `
                SELECT Id, Name, Phone, MobilePhone, FederationIdentifier, Twilio_Number__c, User_Role__c
                FROM User
                WHERE Twilio_Number__c IN (${numbers})
              `;
              return await conn.query(queryString);
            } catch (error) {
              this.logger.error(error);
              this.processError("sfdc-query.retrieveUserByTwilioNumber");
              throw error;
            }
          },
        },
        retrieveUsersByTwilioNumber: {
          async handler(ctx): Promise<UserRecord> {
            try {
              const phoneNumbers: string[] = ctx.params.phoneNumbers;
              this.logger.debug("Retrieving by Twilio Number");
              const conn = await this.getClient();
              let numberString = "";
              phoneNumbers.forEach((n: string, i: number) => {
                numberString +=
                  i === 0 ? `${standardNumber(n)}` : ` OR ${standardNumber(n)}`;
              });
              const queryString = `
FIND {${numberString}} IN PHONE FIELDS
RETURNING User(Id, Name, Phone, MobilePhone, FederationIdentifier, Twilio_Number__c, User_Role__c, Forwarding_User__c)`;
              return await conn.search(queryString);
            } catch (error) {
              this.logger.debug(error);
              this.processError("sfdc-query.retrieveUserByTwilioNumber");
              throw error;
            }
          },
        },
        retrieveUserAvailabilityDetails: {
          async handler(ctx) {
            this.logger.debug("Retrieving user's availability");
            const conn = await this.getClient();
            const id = ctx.params.id;
            const queryString = `
							SELECT Availability_Status__c, Forwarding_User__c
							FROM User
              WHERE Id = '${id}'
						`;

            try {
              return conn.query(queryString);
            } catch (error) {
              this.logger.error(error);
              this.processError("sfdc-query.retrieveUserAvailabilityDetails");
              throw error;
            }
          },
        },

        retrieveUserById: {
          async handler(ctx) {
            this.logger.debug("Retrieving user by ID");
            const conn = await this.getClient();
            const id = ctx.params.id;
            const queryString = `
SELECT
  Id,
  Name,
  Phone,
  MobilePhone,
  FederationIdentifier,
  Availability_Status__c,
  User_Role__c,
  Twilio_Number__c
FROM User
WHERE Id = '${id}'
						`;

            try {
              return conn.query(queryString);
            } catch (error) {
              this.logger.error(error);
              this.processError("sfdc-query.retrieveUserById");
              throw error;
            }
          },
        },

        retrievePlanningUnitUsers: {
          async handler(ctx) {
            const conn = await this.getClient();
            const PUOId = ctx.params.PUOId;
            this.validatePUO_Id(PUOId);
            const queryString = `SELECT Id, Name, (SELECT Role__c, User__r.Id, User__r.Name, User__r.Phone
              , User__r.MobilePhone, User__r.FederationIdentifier, User__r.Twilio_Number__c FROM Planning_Unit_Memberships__r)
							FROM Planning_Unit_Organization__c
              WHERE Id = '${PUOId}'
						`;

            let planningUnitUserRecords;

            try {
              planningUnitUserRecords = await conn.query(queryString);
            } catch (error) {
              this.logger.error(error);
              this.processError("sfdc-query.retrievePlanningUnitUsers");
              throw error;
            }
            return planningUnitUserRecords.records[0]
              .Planning_Unit_Memberships__r.records;
          },
        },
      },

      events: {},

      methods: {
        processError(error: unknown, eventType: string) {
          this.broker.emit(
            PUB_SUB_SFDC_QUERY.SFDC_QUERY_ERROR,
            new OrchestratorCloudEvent({
              type: `${eventType}.${this.version}`,
              data: { error },
            })
          );
        },

        validatePhoneNumber(phoneNumber: PhoneNumber) {
          // Validate number
          if (!phoneNumber.isValid()) {
            const exceptMessage = `${EXCEPT_INVALID_NUMBER}: ${phoneNumber}`;
            this.logger.error(exceptMessage);
            this.processError(exceptMessage);
            throw new Error(exceptMessage);
          }
        },
        validatePUO_Id(PUO_Id: string) {
          // Validate PUO_Id
          if (!PUO_Id || PUO_Id.length !== 18) {
            const exceptMessage = `${EXCEPT_INVALID_PUO_ID}: ${PUO_Id}`;
            this.logger.error(exceptMessage);
            this.processError(exceptMessage);
            throw new Error(exceptMessage);
          }
        },
        validateUserType(userType: string) {
          // Validate userType
          if (
            !(
              userType === "Engineer" ||
              userType === "Case Manager" ||
              userType === "Consultant"
            )
          ) {
            const exceptMessage = `${EXCEPT_INVALID_USER_TYPE}: ${userType}`;
            this.logger.error(exceptMessage);
            this.processError(exceptMessage);
            throw new Error(exceptMessage);
          }
        },
      },
    });
  }
}
