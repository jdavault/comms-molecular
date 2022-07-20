export { SFTask };

interface SFTask {
  id?: string; // after create

  // required
  Type: string;
  Subject: string;
  Description: string;
  Status: string;
  ActivityDate: Date;
  OwnerId: string;
  Activity_Detail__c: string;
  Activity_Phone__c: string;

  // optional
  WhoId?: string;
  WhatId?: string;

  // visible in object manager
  Id?: string | null;
  CallDurationInSeconds?: string;
  CallType?: string;
  CallDisposition?: string;
  CallObject?: string;
  CompletedDateTime?: string;
  IsRecurrence?: string;
  CreatedById?: string;
  LastModifiedDate?: string;
  LastModifiedById?: string;
  Priority?: string;
  RecurrenceInterval?: string;
  IsReminderSet?: string;
  RecurrenceRegeneratedType?: string;
  RecordTypeId?: string;
  TaskSubtype?: string;

  // others
  WhoCount?: string;
  WhatCount?: string;
  IsHighPriority?: string;
  IsDeleted?: string;
  AccountId?: string;
  IsClosed?: string;
  CreatedDate?: string;
  SystemModstamp?: string;
  IsArchived?: string;
  ReminderDateTime?: string;
  ConnectionReceivedId?: string;
  ConnectionSentId?: string;
  RecurrenceActivityId?: string;
  RecurrenceStartDateOnly?: string;
  RecurrenceEndDateOnly?: string;
  RecurrenceTimeZoneSidKey?: string;
  RecurrenceType?: string;
  RecurrenceDayOfWeekMask?: string;
  RecurrenceDayOfMonth?: string;
  RecurrenceInstance?: string;
  RecurrenceMonthOfYear?: string;
  Follow_Up_Type__c?: string;
  Meeting_Arranged__c?: string;
  UNiD_HUB_Demo__c?: string;
  Offered_Onboarding_Case_Interview__c?: string;
  Key_Planning_Questions_Completed__c?: string;
  Account_Provisioning_and_Linking__c?: string;
  Identification_of_Staff_Uploader__c?: string;
  Identification_of_Calibration_Method_s__c?: string;
  Uploader_Capabilities_Confirmed__c?: string;
  Staff_uploader_case_creation_demo__c?: string;
  Radiology_contact_identified__c?: string;
  Calibration_sphere_demo__c?: string;
  Demo_request_for_calibration_spheres__c?: string;
  Shipment_address_identified__c?: string;
  First_UNiD_case_brief__c?: string;
  BAA_submitted__c?: string;
  Case_ID__c?: string;
}
