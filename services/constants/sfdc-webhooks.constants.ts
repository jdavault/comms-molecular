export const SFDC_USER_RECORD_UPDATED = "medicrea.sfdc_webhook.user_updated";
export const SFDC_CONTACT_RECORD_UPDATED = "medicrea.sfdc_webhook.contact_updated";
export const enum RECORD_TYPE {
  USER = "User",
  CONTACT = "Contact",
  UNKNOWN = "Unknown",
}
export const USER_FIELD_MAP = new Map<string, string>([
  ["FederationIdentifier", "userFedId"],
  ["Id", "userSfId"],
  ["FirstName", "firstName"],
  ["LastName", "lastName"],
  ["Phone", "phone"],
  ["MobilePhone", "mobilePhone"],
  ["Twilio_Number__c", "assignedTwilioNumber"],
  ["Email", "email"],
  ["User_Role__c", "userRole"],
  ["Availability_Status__c", "availabilityStatus"],
  ["isForwarded__c", "isForwarded"],
  ["Forwarding_User__c", "forwardingUser"],
]);

export const CONTACT_FIELD_MAP = new Map<string, string>([
  ["Id", "userSfId"],
  ["FirstName", "firstName"],
  ["LastName", "lastName"],
  ["Full_Name__c", "fullName"],
  ["Phone", "phone"],
  ["MobilePhone", "mobilePhone"],
  ["Email", "email"],
  ["Assigned_Consultant__c", "assignedConsultantId"],
  ["UNiD_Phone_Number__c", "unidPhoneNumber"],
  ["Assigned_LAB_Engineer__c", "assignedLabEngineerId"],
  ["Handles_Calls_for_UNiD_Contact__c", "handlesCallsForUnidContactId"],
  ["Assigned_Case_Manager__c", "assignedCaseManagerId"],
  ["Handles_Texts_for_UNiD_Contact__c", "handlesTextsForUnidContactId"],
]);
