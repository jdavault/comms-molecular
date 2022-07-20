"use strict";

import ServiceSchema from "../../../services/sfdc-webhooks.service";
import { ServiceBroker } from "moleculer";
import {
  ContactUpdatedRecord,
  UpdatedRecordPayload,
  UserUpdatedRecord,
} from "../../../services/models/sfdc-webhooksSchemas";
import { RECORD_TYPE } from "../../../services/constants/sfdc-webhooks.constants";

describe("Test 'sfdc-webhooks service' for User records ", () => {
  const broker = new ServiceBroker({ logger: false });
  const service = broker.createService(ServiceSchema);

  const newValues = {
    attributes: {
      type: RECORD_TYPE.USER,
      url: "/services/data/v53.0/sobjects/User/0050R00000A28pYQAR",
    },
    ProfileId: "00e300000019o0cAAA",
    LastModifiedDate: "2022-01-25T19:53:44.000+0000",
    Email: "luis.lopez2@medtronic.com",
    LanguageLocaleKey: "en_US",
    LastLoginDate: "2022-01-25T18:04:40.000+0000",
    IsExtIndicatorVisible: false,
    Twilio_Number__c: "8329815550",
    DigestFrequency: "D",
    MobilePhone: "+1 9194132055",
    IsProfilePhotoActive: false,
    CommunityNickname: "llope",
    CreatedById: "0050M00000DHOGbQAP",
    CheckCentral__c: false,
    FederationIdentifier: "lopezl194",
    NumberOfFailedLogins: 0,
    CreatedDate: "2021-11-01T13:35:35.000+0000",
    LastName: "Lopez",
    Id: "0050R00000A28pYQAR",
    UserType: "Standard",
    ReceivesAdminInfoEmails: false,
    TimeZoneSidKey: "America/New_York",
    UserRoleId: "00E0M000001DKbKUAW",
    IsActive: true,
    WorkspaceId: "1de0R0000055TNoQAM",
    ForecastEnabled: false,
    CheckEast__c: true,
    Phone: "9194132055",
    User_Role__c: "Engineer",
    LastPasswordChangeDate: "2021-11-02T13:51:54.000+0000",
    LocaleSidKey: "en_US",
    FirstName: "Luis",
    isForwarded__c: false,
    SalesforceID__c: "0050R00000A28pYQAR",
    EmailEncodingKey: "ISO-8859-1",
    ReceivesInfoEmails: true,
    SystemModstamp: "2022-01-25T19:53:44.000+0000",
    Availability_Status__c: "Available",
    Username: "llope.terazo@medtronic.com",
    Alias: "llope",
    DefaultGroupNotificationFrequency: "D",
    UserRegion__c: "East",
    CheckWest__c: false,
    LastModifiedById: "0050R00000A28pYQAR",
  };

  const newValuesUnknown = {
    attributes: {
      url: "/services/data/v53.0/sobjects/User/0050R00000A28pYQAR",
    },
    ProfileId: "00e300000019o0cAAA",
    LastModifiedDate: "2022-01-25T19:53:44.000+0000",
    Email: "luis.lopez2@medtronic.com",
    LanguageLocaleKey: "en_US",
    LastLoginDate: "2022-01-25T18:04:40.000+0000",
    IsExtIndicatorVisible: false,
    Twilio_Number__c: "8329815550",
    DigestFrequency: "D",
    MobilePhone: "+1 9194132055",
    IsProfilePhotoActive: false,
    CommunityNickname: "llope",
    CreatedById: "0050M00000DHOGbQAP",
    CheckCentral__c: false,
    FederationIdentifier: "lopezl194",
    NumberOfFailedLogins: 0,
    CreatedDate: "2021-11-01T13:35:35.000+0000",
    LastName: "Lopez",
    Id: "0050R00000A28pYQAR",
    UserType: "Standard",
    ReceivesAdminInfoEmails: false,
    TimeZoneSidKey: "America/New_York",
    UserRoleId: "00E0M000001DKbKUAW",
    IsActive: true,
    WorkspaceId: "1de0R0000055TNoQAM",
    ForecastEnabled: false,
    CheckEast__c: true,
    Phone: "9194132055",
    User_Role__c: "Engineer",
    LastPasswordChangeDate: "2021-11-02T13:51:54.000+0000",
    LocaleSidKey: "en_US",
    FirstName: "Luis",
    isForwarded__c: false,
    SalesforceID__c: "0050R00000A28pYQAR",
    EmailEncodingKey: "ISO-8859-1",
    ReceivesInfoEmails: true,
    SystemModstamp: "2022-01-25T19:53:44.000+0000",
    Availability_Status__c: "Available",
    Username: "llope.terazo@medtronic.com",
    Alias: "llope",
    DefaultGroupNotificationFrequency: "D",
    UserRegion__c: "East",
    CheckWest__c: false,
    LastModifiedById: "0050R00000A28pYQAR",
  };

  const pertinentNewValues = {
    userFedId: "lopezl194",
    userSfId: "0050R00000A28pYQAR",
    firstName: "Luis",
    lastName: "Lopez",
    phone: "9194132055",
    mobilePhone: "9194132055",
    assignedTwilioNumber: "8329815550",
    email: "luis.lopez2@medtronic.com",
    userRole: "Engineer",
    availabilityStatus: "Available",
    isForwarded: false,
    forwardingUser: null as string,
  };

  const oldValues = {
    attributes: {
      type: RECORD_TYPE.USER,
      url: "/services/data/v53.0/sobjects/User/0050R00000A28pYQAR",
    },
    ProfileId: "00e300000019o0cAAA",
    LastModifiedDate: "2022-01-25T18:06:05.000+0000",
    Email: "luis.lopez2@medtronic.com",
    LanguageLocaleKey: "en_US",
    LastLoginDate: "2022-01-25T18:04:40.000+0000",
    IsExtIndicatorVisible: false,
    Twilio_Number__c: "8329815550",
    DigestFrequency: "D",
    MobilePhone: "+1 9194132055",
    IsProfilePhotoActive: false,
    CommunityNickname: "llope",
    CreatedById: "0050M00000DHOGbQAP",
    CheckCentral__c: false,
    FederationIdentifier: "lopezl194",
    NumberOfFailedLogins: 0,
    CreatedDate: "2021-11-01T13:35:35.000+0000",
    Forwarding_User__c: "0053y00000GPmRxAAL",
    LastName: "Lopez",
    Id: "0050R00000A28pYQAR",
    UserType: "Standard",
    ReceivesAdminInfoEmails: false,
    TimeZoneSidKey: "America/New_York",
    UserRoleId: "00E0M000001DKbKUAW",
    IsActive: true,
    WorkspaceId: "1de0R0000055TNoQAM",
    ForecastEnabled: false,
    CheckEast__c: true,
    Phone: "9194132055",
    User_Role__c: "Engineer",
    LastPasswordChangeDate: "2021-11-02T13:51:54.000+0000",
    LocaleSidKey: "en_US",
    FirstName: "Luis",
    isForwarded__c: false,
    SalesforceID__c: "0050R00000A28pYQAR",
    EmailEncodingKey: "ISO-8859-1",
    ReceivesInfoEmails: true,
    SystemModstamp: "2022-01-25T18:06:05.000+0000",
    Availability_Status__c: "Out of Office",
    Username: "llope.terazo@medtronic.com",
    Alias: "llope",
    DefaultGroupNotificationFrequency: "D",
    UserRegion__c: "East",
    CheckWest__c: false,
    LastModifiedById: "0050R00000A28pYQAR",
  };

  const pertinentOldValues = {
    userFedId: "lopezl194",
    userSfId: "0050R00000A28pYQAR",
    firstName: "Luis",
    lastName: "Lopez",
    phone: "9194132055",
    mobilePhone: "9194132055",
    assignedTwilioNumber: "8329815550",
    email: "luis.lopez2@medtronic.com",
    userRole: "Engineer",
    availabilityStatus: "Out of Office",
    isForwarded: true,
    forwardingUser: "0053y00000GPmRxAAL",
  };

  const changedValuesSalesforceName: string[] = ["Availability_Status__c", "Forwarding_User__c"];
  const changedValuesUserUpdatedRecordName: string[] = [
    "availabilityStatus",
    "forwardingUser",
    "isForwarded",
  ];
  const changedValuesAllSalesforceName: string[] = [
    "FederationIdentifier",
    "Id",
    "FirstName",
    "LastName",
    "Phone",
    "MobilePhone",
    "Twilio_Number__c",
    "Email",
    "User_Role__c",
    "Availability_Status__c",
    "isForwarded__c",
    "Forwarding_User__c",
  ];
  const changedValuesAllUserUpdatedRecordName: string[] = [
    "userFedId",
    "userSfId",
    "firstName",
    "lastName",
    "phone",
    "mobilePhone",
    "assignedTwilioNumber",
    "email",
    "userRole",
    "availabilityStatus",
    "isForwarded",
    "forwardingUser",
  ];

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());

  describe("Test 'sfdc-webhooks.getPertinentUserValues' with available user", () => {
    let pertinentValues: UserUpdatedRecord;
    it("should remove all the fields that we are not interested in", async () => {
      pertinentValues = service.getPertinentUserValues(newValues);
      expect(pertinentValues).toStrictEqual(pertinentNewValues);
    });
  });

  describe("Test 'sfdc-webhooks.getPertinentUserValues' with out of office user", () => {
    let pertinentValues: UserUpdatedRecord;
    it("should remove all the fields that we are not interested in", async () => {
      pertinentValues = service.getPertinentUserValues(oldValues);
      expect(pertinentValues).toStrictEqual(pertinentOldValues);
    });
  });

  describe("Test 'sfdc-webhooks.getChangedFields' with all fields", () => {
    let changedFields: string[];
    it("should rename all the fields based on our map", async () => {
      changedFields = service.getChangedFields(RECORD_TYPE.USER, changedValuesAllSalesforceName);
      expect(changedFields).toStrictEqual(changedValuesAllUserUpdatedRecordName);
    });
  });

  describe("Test 'sfdc-webhooks.getChangedFields' with a subset of fields", () => {
    let changedFields: string[];
    it("should rename some of the fields based on our map", async () => {
      changedFields = service.getChangedFields(RECORD_TYPE.USER, changedValuesSalesforceName);
      expect(changedFields).toStrictEqual(changedValuesUserUpdatedRecordName);
    });
  });

  describe("Test 'sfdc-webhooks.processWebhook' which is end to end test", () => {
    const emitSpy = jest.spyOn(broker, "emit");

    const dataIn = { new: [newValues], old: [oldValues], changed: changedValuesSalesforceName };
    let expectedPayload: UpdatedRecordPayload = {
      type: RECORD_TYPE.USER,
      new: pertinentNewValues,
      old: pertinentOldValues,
      changed: changedValuesUserUpdatedRecordName,
    };
    let actualPayload: UpdatedRecordPayload;
    it("should translate a Salesforce payload to a pubsub payload", async () => {
      actualPayload = service.processWebhook(dataIn);
      expect(actualPayload).toStrictEqual(expectedPayload);
      expect(emitSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Test 'sfdc-webhooks.processWebhook' which is end to end test", () => {
    let emptyNew: any[] = [];
    const dataIn = { new: emptyNew, old: [oldValues], changed: changedValuesSalesforceName };
    let actualPayload: UpdatedRecordPayload;
    it("should return null since no new data is passed in", async () => {
      actualPayload = service.processWebhook(dataIn);
      expect(actualPayload).toBe(null);
    });
  });

  describe("Test 'sfdc-webhooks.processWebhook' which is end to end test", () => {
    const dataIn = {
      new: [newValuesUnknown],
      old: [oldValues],
      changed: changedValuesSalesforceName,
    };
    let actualPayload: UpdatedRecordPayload;
    it("should return null since the new data is passed in does not have a record type", async () => {
      actualPayload = service.processWebhook(dataIn);
      expect(actualPayload).toBe(null);
    });
  });

  describe("Test 'sfdc-webhooks.getUpdatedRecordType' with a valid type", () => {
    let actualType: string;
    it("should return 'User' since the new data has that type", async () => {
      actualType = service.getUpdatedRecordType(newValues);
      expect(actualType).toBe(RECORD_TYPE.USER);
    });
  });

  describe("Test 'sfdc-webhooks.getUpdatedRecordType' with a valid type", () => {
    let actualType: string;
    it("should return 'Unknown' since the new data has no type", async () => {
      actualType = service.getUpdatedRecordType(newValuesUnknown);
      expect(actualType).toBe(RECORD_TYPE.UNKNOWN);
    });
  });
});

describe("Test 'sfdc-webhooks service' for Contact records ", () => {
  const broker = new ServiceBroker({ logger: false });
  const service = broker.createService(ServiceSchema);

  const newValues = {
    attributes: {
      type: RECORD_TYPE.CONTACT,
      url: "/services/data/v53.0/sobjects/Contact/0030R00001KE7xKQAT",
    },
    Assigned_Consultant__c: "0050R00000A28pYQAR",
    LastModifiedDate: "2022-01-27T13:07:33.000+0000",
    Provider_UNiD__c: "Any",
    Capital_Account_RDT__c: "501.201.103",
    Sunshine_Act_Notes__c: false,
    Imaging_Acquisition_Score__c: 0,
    HasOptedOutOfFax: false,
    Imaging_Access_Type_Direct_Access__c: false,
    UNiD_Phone_Number__c: "(678) 520-8831",
    Surgeon_Engagement_Score__c: 4,
    Scheduling_Access_Direct_Access__c: false,
    Rep_Reliability_Some_Instances__c: false,
    SST_Account_Region__c: "Southeast",
    UNiD_Provider__c: "Any",
    Approved_for_VCP__c: false,
    Short_Advanced_Analysis_Offered__c: false,
    Rep_UNiD_Engagement_Very_Engaged__c: false,
    Surgeon_Case_Load_1_1_99__c: false,
    Email_2_2__c: "dpdevito@childrensortho.com",
    Surgeon_Case_Load_4__c: false,
    UNiD_Street__c: "Scottish Rite Hospital\nAttn: Brian Howell\n1001 Johnson Ferry Road NE",
    Post_Op_Imaging_Same_As_Pre_Op__c: false,
    IsDeleted: false,
    Surgeon_Status__c: "Uncontacted",
    Imaging_Timing_Next_Day__c: false,
    MailingCity: "Atlanta",
    Rep_UNiD_Engagement_Moderately_Engaged__c: false,
    Siebel_Contact_Row_ID__c: "1-1CSTW3X",
    Scheduling_Access_Direct_Request__c: false,
    Rank__c: 259,
    Shipment_address_identified__c: false,
    Uploader_Capabilities_Confirmed__c: false,
    Full_Name__c: "Dennis Devito",
    Identification_of_Post_Op_Timepoints__c: false,
    Id: "0030R00001KE7xKQAT",
    Surgeon_UNiD_Use_Percentage_100__c: false,
    Status__c: "Active",
    First_UNiD_case_debrief_requested__c: false,
    UNiD_State__c: "GA",
    Radiology_contact_identified__c: false,
    DoNotCall: false,
    MailingCountry: "USA",
    Imaging_Timing_3_Days__c: false,
    Siebel_Contact_ID__c: "1008844759920003",
    Imaging_Timing_Immediate__c: false,
    Surgeon_UNiD_Use_Percentage_50_75__c: false,
    Salutation: "Dr",
    MailingState: "GA",
    Rep_UNiD_Engagement_Somewhat_Engaged__c: false,
    Deceased__c: false,
    UNiD_HUB_Demo__c: false,
    OwnerId: "0050M00000DHOGbQAP",
    VuMedi__c: false,
    Assigned_LAB_Engineer__c: "0050R00000A28pYQAR",
    DEA__c: "BD1721516",
    RecordTypeId: "012300000019PdaAAE",
    Staff_uploader_case_creation_demo__c: false,
    Identification_of_Calibration_Method_s__c: false,
    Workflow_Cheat_Sheet_Complete__c: false,
    Surgeon_UNiD_Use_Percentage_75_99__c: true,
    PDC_Account_Manager__c: "Jake Ghannam",
    Surgeon_UNiD_Use_Percentage_25__c: false,
    Physician_Primary_Type__c: 1,
    FirstName: "Dennis",
    Owner_Name__c: "Franco Despoux",
    Face_to_Face__c: "No",
    Other_HCP__c: false,
    Relationship_Status__c: "Develop Relations",
    SystemModstamp: "2022-01-27T13:07:33.000+0000",
    UNiD_Name__c: "Brian Howell",
    Imaging_Access_Type_Direct_Request__c: false,
    Specialty__c: "Pediatric Scoli Surgeon",
    Scheduling_Access_3rd_Party_Request__c: false,
    Handles_Calls_for_UNiD_Contact__c: "0050R00000A2UB1QAN",
    Rep_Reliability_All_Instances__c: false,
    LastActivityDate: "2022-01-27",
    X1_Year__c: false,
    Scheduling_Visibility_UNiD_Cases_Only__c: false,
    UNiD_Status__c: "Active User - Post-Onboarding",
    Surgeon_Case_Load_1__c: false,
    UNiD_Country__c: "USA",
    Assigned_Case_Manager__c: "0050R00000A28pYQAR",
    Demo_request_for_calibration_spheres__c: false,
    Account_Provisioning_and_Linking__c: false,
    Primary_Account_SST_additional__c: "Steven Schneider",
    Limited_Use_Mobile__c: false,
    Email: "email@example.com",
    AccountId: "0010R00001FXcz2QAD",
    Rep_UNiD_Engagement_Low_Engagement__c: false,
    External_ID__c: "ID-024226",
    Zip_Code_Area__c: "30",
    MobilePhone: "55555555559",
    HCPIDSpinal__c: "2950800333",
    UNiD_Email_Notification__c: "pbhowell1221@gmail.com; lmaher@medicrea.com",
    Offered_Onboarding_Case_Interview__c: false,
    UNiD_Rod_KOLs__c: false,
    CreatedById: "0050M00000DHOGbQAP",
    Scheduling_Access_Scheduled_Communicatio__c: false,
    Publication_link__c: "DevitoDP",
    Not_Interested__c: false,
    Rep_Reliability_Most_Instances__c: false,
    UNiD_Email__c: "pbhowell1221@gmail.com",
    Surgeon_Case_Load_2_3_99__c: false,
    IsEmailBounced: false,
    Pricing_Approved__c: false,
    Preferred_Name__c: "Dennis P Devito",
    Practice_Type__c: "Hospital-Employed",
    X10_Cases_Complete_with_Post_Ops__c: false,
    HasOptedOutOfEmail: false,
    Rep_Reliability_Few_Instances__c: false,
    PDC_Account_Regions__c: "Southeast",
    Territory_Spine_Account_Rep_Associated__c: "HWANG/THOMAS/STUBLER/SUESSERMAN",
    Key_Planning_Questions_Completed__c: false,
    Brochure__c: "No",
    Attendee_Type_Code__c: "HCP",
    First_UNiD_case_brief__c: false,
    Rep_Engagement_Score__c: 0,
    Surgeon_type__c: "Orthopaedic",
    Surgeon_UNiD_Use_Percentage_25_50__c: false,
    Type__c: "Physician",
    CreatedDate: "2021-09-10T16:10:30.000+0000",
    LastName: "Devito",
    Manufacturing_At_Risk__c: false,
    UNiD_City__c: "Atlanta",
    Primary_Specialty__c: "Pediatric Orthopaedic Surgery",
    Scheduling_Acquisition_Score__c: 0,
    MailingStreet: "5445 Meridian Marks Rd Ne Suite 250",
    Case_Discovery_Contact_Primary__c: "a0P0R000003GWi4UAG",
    Formal_handoff_to_LAB__c: false,
    Scheduling_Visibility_All_Cases__c: false,
    Secondary_Email__c: "dpdevito21@gmail.com",
    Handles_Texts_for_UNiD_Contact__c: "0050R00000A28pYQAR",
    X3_Months__c: false,
    Identification_of_Staff_Uploader__c: false,
    Imaging_Access_Type_3rd_Party_Request__c: false,
    UNiD_Service_Pricing_Approved__c: false,
    Rep_Reliability_Not_Reliable__c: false,
    Spine_Account_RVP_Name__c: "OPEN Level 2 Manager",
    Planning_Cheat_Sheet_Complete__c: false,
    KOL_ID__c: "93874",
    Middle_name__c: "Peter",
    Phone: "55555555558",
    BAA_submitted__c: false,
    MailingPostalCode: "30342",
    Calibration_sphere_demo__c: false,
    First_UNiD_case_post_op_email_sent__c: false,
    Imaging_Timing_2_3_Days__c: false,
    Surgeon_UNiD_Use_Percentage__c: "75-99%",
    Currency_Code__c: "USD",
    Capital_Account_District__c: "ATLANTA",
    Imaging_Timing_Same_Day__c: false,
    X1st_UNiD_Surgery__c: "2016-05-09",
    Do_Not_Email__c: false,
    X10_Cases_w_Post_Ops__c: false,
    Record_Type__c: 100,
    Spine_Account_District__c: "SM ATLANTA",
    Inactive__c: "N",
    UNiD_Zip_Code__c: "30342",
    Owner_SF_ID__c: "0050M00000DHOGbQAP",
    Capital_Account_Region__c: "SOUTHEAST",
    X6_Months__c: false,
    Depends_on_Hospital__c: "No",
    Hospital_SF_ID__c: "0010R00001FXcz2QAD",
    Fax: "(404) 256-7924",
    LastModifiedById: "0050R00000A28pYQAR",
    Contact_ID__c: "0030R00001KE7xKQAT",
    Name_X_Ray_Contact__c: "Cara (Meridian Mark)\nRobert manager not x-ray tech (Duluth)",
    HMS_PID__c: "PINU97DMA8",
    NPI__c: "1578542130",
  };

  const newValuesUnknown = {
    attributes: {
      url: "/services/data/v53.0/sobjects/Contact/0030R00001KE7xKQAT",
    },
    Assigned_Consultant__c: "0050R00000A28pYQAR",
    LastModifiedDate: "2022-01-27T13:07:33.000+0000",
    Provider_UNiD__c: "Any",
    Capital_Account_RDT__c: "501.201.103",
    Sunshine_Act_Notes__c: false,
    Imaging_Acquisition_Score__c: 0,
    HasOptedOutOfFax: false,
    Imaging_Access_Type_Direct_Access__c: false,
    UNiD_Phone_Number__c: "(678) 520-8831",
    Surgeon_Engagement_Score__c: 4,
    Scheduling_Access_Direct_Access__c: false,
    Rep_Reliability_Some_Instances__c: false,
    SST_Account_Region__c: "Southeast",
    UNiD_Provider__c: "Any",
    Approved_for_VCP__c: false,
    Short_Advanced_Analysis_Offered__c: false,
    Rep_UNiD_Engagement_Very_Engaged__c: false,
    Surgeon_Case_Load_1_1_99__c: false,
    Email_2_2__c: "dpdevito@childrensortho.com",
    Surgeon_Case_Load_4__c: false,
    UNiD_Street__c: "Scottish Rite Hospital\nAttn: Brian Howell\n1001 Johnson Ferry Road NE",
    Post_Op_Imaging_Same_As_Pre_Op__c: false,
    IsDeleted: false,
    Surgeon_Status__c: "Uncontacted",
    Imaging_Timing_Next_Day__c: false,
    MailingCity: "Atlanta",
    Rep_UNiD_Engagement_Moderately_Engaged__c: false,
    Siebel_Contact_Row_ID__c: "1-1CSTW3X",
    Scheduling_Access_Direct_Request__c: false,
    Rank__c: 259,
    Shipment_address_identified__c: false,
    Uploader_Capabilities_Confirmed__c: false,
    Full_Name__c: "Dennis Devito",
    Identification_of_Post_Op_Timepoints__c: false,
    Id: "0030R00001KE7xKQAT",
    Surgeon_UNiD_Use_Percentage_100__c: false,
    Status__c: "Active",
    First_UNiD_case_debrief_requested__c: false,
    UNiD_State__c: "GA",
    Radiology_contact_identified__c: false,
    DoNotCall: false,
    MailingCountry: "USA",
    Imaging_Timing_3_Days__c: false,
    Siebel_Contact_ID__c: "1008844759920003",
    Imaging_Timing_Immediate__c: false,
    Surgeon_UNiD_Use_Percentage_50_75__c: false,
    Salutation: "Dr",
    MailingState: "GA",
    Rep_UNiD_Engagement_Somewhat_Engaged__c: false,
    Deceased__c: false,
    UNiD_HUB_Demo__c: false,
    OwnerId: "0050M00000DHOGbQAP",
    VuMedi__c: false,
    Assigned_LAB_Engineer__c: "0050R00000A28pYQAR",
    DEA__c: "BD1721516",
    RecordTypeId: "012300000019PdaAAE",
    Staff_uploader_case_creation_demo__c: false,
    Identification_of_Calibration_Method_s__c: false,
    Workflow_Cheat_Sheet_Complete__c: false,
    Surgeon_UNiD_Use_Percentage_75_99__c: true,
    PDC_Account_Manager__c: "Jake Ghannam",
    Surgeon_UNiD_Use_Percentage_25__c: false,
    Physician_Primary_Type__c: 1,
    FirstName: "Dennis",
    Owner_Name__c: "Franco Despoux",
    Face_to_Face__c: "No",
    Other_HCP__c: false,
    Relationship_Status__c: "Develop Relations",
    SystemModstamp: "2022-01-27T13:07:33.000+0000",
    UNiD_Name__c: "Brian Howell",
    Imaging_Access_Type_Direct_Request__c: false,
    Specialty__c: "Pediatric Scoli Surgeon",
    Scheduling_Access_3rd_Party_Request__c: false,
    Handles_Calls_for_UNiD_Contact__c: "0050R00000A2UB1QAN",
    Rep_Reliability_All_Instances__c: false,
    LastActivityDate: "2022-01-27",
    X1_Year__c: false,
    Scheduling_Visibility_UNiD_Cases_Only__c: false,
    UNiD_Status__c: "Active User - Post-Onboarding",
    Surgeon_Case_Load_1__c: false,
    UNiD_Country__c: "USA",
    Assigned_Case_Manager__c: "0050R00000A28pYQAR",
    Demo_request_for_calibration_spheres__c: false,
    Account_Provisioning_and_Linking__c: false,
    Primary_Account_SST_additional__c: "Steven Schneider",
    Limited_Use_Mobile__c: false,
    Email: "email@example.com",
    AccountId: "0010R00001FXcz2QAD",
    Rep_UNiD_Engagement_Low_Engagement__c: false,
    External_ID__c: "ID-024226",
    Zip_Code_Area__c: "30",
    MobilePhone: "55555555559",
    HCPIDSpinal__c: "2950800333",
    UNiD_Email_Notification__c: "pbhowell1221@gmail.com; lmaher@medicrea.com",
    Offered_Onboarding_Case_Interview__c: false,
    UNiD_Rod_KOLs__c: false,
    CreatedById: "0050M00000DHOGbQAP",
    Scheduling_Access_Scheduled_Communicatio__c: false,
    Publication_link__c: "DevitoDP",
    Not_Interested__c: false,
    Rep_Reliability_Most_Instances__c: false,
    UNiD_Email__c: "pbhowell1221@gmail.com",
    Surgeon_Case_Load_2_3_99__c: false,
    IsEmailBounced: false,
    Pricing_Approved__c: false,
    Preferred_Name__c: "Dennis P Devito",
    Practice_Type__c: "Hospital-Employed",
    X10_Cases_Complete_with_Post_Ops__c: false,
    HasOptedOutOfEmail: false,
    Rep_Reliability_Few_Instances__c: false,
    PDC_Account_Regions__c: "Southeast",
    Territory_Spine_Account_Rep_Associated__c: "HWANG/THOMAS/STUBLER/SUESSERMAN",
    Key_Planning_Questions_Completed__c: false,
    Brochure__c: "No",
    Attendee_Type_Code__c: "HCP",
    First_UNiD_case_brief__c: false,
    Rep_Engagement_Score__c: 0,
    Surgeon_type__c: "Orthopaedic",
    Surgeon_UNiD_Use_Percentage_25_50__c: false,
    Type__c: "Physician",
    CreatedDate: "2021-09-10T16:10:30.000+0000",
    LastName: "Devito",
    Manufacturing_At_Risk__c: false,
    UNiD_City__c: "Atlanta",
    Primary_Specialty__c: "Pediatric Orthopaedic Surgery",
    Scheduling_Acquisition_Score__c: 0,
    MailingStreet: "5445 Meridian Marks Rd Ne Suite 250",
    Case_Discovery_Contact_Primary__c: "a0P0R000003GWi4UAG",
    Formal_handoff_to_LAB__c: false,
    Scheduling_Visibility_All_Cases__c: false,
    Secondary_Email__c: "dpdevito21@gmail.com",
    Handles_Texts_for_UNiD_Contact__c: "0050R00000A28pYQAR",
    X3_Months__c: false,
    Identification_of_Staff_Uploader__c: false,
    Imaging_Access_Type_3rd_Party_Request__c: false,
    UNiD_Service_Pricing_Approved__c: false,
    Rep_Reliability_Not_Reliable__c: false,
    Spine_Account_RVP_Name__c: "OPEN Level 2 Manager",
    Planning_Cheat_Sheet_Complete__c: false,
    KOL_ID__c: "93874",
    Middle_name__c: "Peter",
    Phone: "55555555558",
    BAA_submitted__c: false,
    MailingPostalCode: "30342",
    Calibration_sphere_demo__c: false,
    First_UNiD_case_post_op_email_sent__c: false,
    Imaging_Timing_2_3_Days__c: false,
    Surgeon_UNiD_Use_Percentage__c: "75-99%",
    Currency_Code__c: "USD",
    Capital_Account_District__c: "ATLANTA",
    Imaging_Timing_Same_Day__c: false,
    X1st_UNiD_Surgery__c: "2016-05-09",
    Do_Not_Email__c: false,
    X10_Cases_w_Post_Ops__c: false,
    Record_Type__c: 100,
    Spine_Account_District__c: "SM ATLANTA",
    Inactive__c: "N",
    UNiD_Zip_Code__c: "30342",
    Owner_SF_ID__c: "0050M00000DHOGbQAP",
    Capital_Account_Region__c: "SOUTHEAST",
    X6_Months__c: false,
    Depends_on_Hospital__c: "No",
    Hospital_SF_ID__c: "0010R00001FXcz2QAD",
    Fax: "(404) 256-7924",
    LastModifiedById: "0050R00000A28pYQAR",
    Contact_ID__c: "0030R00001KE7xKQAT",
    Name_X_Ray_Contact__c: "Cara (Meridian Mark)\nRobert manager not x-ray tech (Duluth)",
    HMS_PID__c: "PINU97DMA8",
    NPI__c: "1578542130",
  };

  const pertinentNewValues = {
    userSfId: "0030R00001KE7xKQAT",
    firstName: "Dennis",
    lastName: "Devito",
    fullName: "Dennis Devito",
    phone: "55555555558",
    mobilePhone: "55555555559",
    email: "email@example.com",
    assignedConsultantId: "0050R00000A28pYQAR",
    unidPhoneNumber: "6785208831",
    assignedLabEngineerId: "0050R00000A28pYQAR",
    handlesCallsForUnidContactId: "0050R00000A2UB1QAN",
    assignedCaseManagerId: "0050R00000A28pYQAR",
    handlesTextsForUnidContactId: "0050R00000A28pYQAR",
  };

  const oldValues = {
    attributes: {
      type: RECORD_TYPE.CONTACT,
      url: "/services/data/v53.0/sobjects/Contact/0030R00001KE7xKQAT",
    },
    Assigned_Consultant__c: "0050R00000A28pYQAR",
    LastModifiedDate: "2022-01-25T14:52:49.000+0000",
    Provider_UNiD__c: "Any",
    Capital_Account_RDT__c: "501.201.103",
    Sunshine_Act_Notes__c: false,
    Imaging_Acquisition_Score__c: 0,
    HasOptedOutOfFax: false,
    Imaging_Access_Type_Direct_Access__c: false,
    UNiD_Phone_Number__c: "(678) 520-8831",
    Surgeon_Engagement_Score__c: 4,
    Scheduling_Access_Direct_Access__c: false,
    Rep_Reliability_Some_Instances__c: false,
    SST_Account_Region__c: "Southeast",
    UNiD_Provider__c: "Any",
    Approved_for_VCP__c: false,
    Short_Advanced_Analysis_Offered__c: false,
    Rep_UNiD_Engagement_Very_Engaged__c: false,
    Surgeon_Case_Load_1_1_99__c: false,
    Email_2_2__c: "dpdevito@childrensortho.com",
    Surgeon_Case_Load_4__c: false,
    UNiD_Street__c: "Scottish Rite Hospital\nAttn: Brian Howell\n1001 Johnson Ferry Road NE",
    Post_Op_Imaging_Same_As_Pre_Op__c: false,
    IsDeleted: false,
    Surgeon_Status__c: "Uncontacted",
    Imaging_Timing_Next_Day__c: false,
    MailingCity: "Atlanta",
    Rep_UNiD_Engagement_Moderately_Engaged__c: false,
    Siebel_Contact_Row_ID__c: "1-1CSTW3X",
    Scheduling_Access_Direct_Request__c: false,
    Rank__c: 259,
    Shipment_address_identified__c: false,
    Uploader_Capabilities_Confirmed__c: false,
    Full_Name__c: "Dennis Devito",
    Identification_of_Post_Op_Timepoints__c: false,
    Id: "0030R00001KE7xKQAT",
    Surgeon_UNiD_Use_Percentage_100__c: false,
    Status__c: "Active",
    First_UNiD_case_debrief_requested__c: false,
    UNiD_State__c: "GA",
    Radiology_contact_identified__c: false,
    DoNotCall: false,
    MailingCountry: "USA",
    Imaging_Timing_3_Days__c: false,
    Siebel_Contact_ID__c: "1008844759920003",
    Imaging_Timing_Immediate__c: false,
    Surgeon_UNiD_Use_Percentage_50_75__c: false,
    Salutation: "Dr",
    MailingState: "GA",
    Rep_UNiD_Engagement_Somewhat_Engaged__c: false,
    Deceased__c: false,
    UNiD_HUB_Demo__c: false,
    OwnerId: "0050M00000DHOGbQAP",
    VuMedi__c: false,
    Assigned_LAB_Engineer__c: "0050R00000A28pYQAR",
    DEA__c: "BD1721516",
    RecordTypeId: "012300000019PdaAAE",
    Staff_uploader_case_creation_demo__c: false,
    Identification_of_Calibration_Method_s__c: false,
    Workflow_Cheat_Sheet_Complete__c: false,
    Surgeon_UNiD_Use_Percentage_75_99__c: true,
    PDC_Account_Manager__c: "Jake Ghannam",
    Surgeon_UNiD_Use_Percentage_25__c: false,
    Physician_Primary_Type__c: 1,
    FirstName: "Dennis",
    Owner_Name__c: "Franco Despoux",
    Face_to_Face__c: "No",
    Other_HCP__c: false,
    Relationship_Status__c: "Develop Relations",
    SystemModstamp: "2022-01-27T00:12:27.000+0000",
    UNiD_Name__c: "Brian Howell",
    Imaging_Access_Type_Direct_Request__c: false,
    Specialty__c: "Pediatric Scoli Surgeon",
    Scheduling_Access_3rd_Party_Request__c: false,
    Handles_Calls_for_UNiD_Contact__c: "0050R00000A2UB1QAN",
    Rep_Reliability_All_Instances__c: false,
    LastActivityDate: "2022-01-27",
    X1_Year__c: false,
    Scheduling_Visibility_UNiD_Cases_Only__c: false,
    UNiD_Status__c: "Active User - Post-Onboarding",
    Surgeon_Case_Load_1__c: false,
    UNiD_Country__c: "USA",
    Assigned_Case_Manager__c: "0050R00000A28pYQAR",
    Demo_request_for_calibration_spheres__c: false,
    Account_Provisioning_and_Linking__c: false,
    Primary_Account_SST_additional__c: "Steven Schneider",
    Limited_Use_Mobile__c: false,
    Email: "email@example.com",
    AccountId: "0010R00001FXcz2QAD",
    Rep_UNiD_Engagement_Low_Engagement__c: false,
    External_ID__c: "ID-024226",
    Zip_Code_Area__c: "30",
    MobilePhone: "55555555555",
    HCPIDSpinal__c: "2950800333",
    UNiD_Email_Notification__c: "pbhowell1221@gmail.com; lmaher@medicrea.com",
    Offered_Onboarding_Case_Interview__c: false,
    UNiD_Rod_KOLs__c: false,
    CreatedById: "0050M00000DHOGbQAP",
    Scheduling_Access_Scheduled_Communicatio__c: false,
    Publication_link__c: "DevitoDP",
    Not_Interested__c: false,
    Rep_Reliability_Most_Instances__c: false,
    UNiD_Email__c: "pbhowell1221@gmail.com",
    Surgeon_Case_Load_2_3_99__c: false,
    IsEmailBounced: false,
    Pricing_Approved__c: false,
    Preferred_Name__c: "Dennis P Devito",
    Practice_Type__c: "Hospital-Employed",
    X10_Cases_Complete_with_Post_Ops__c: false,
    HasOptedOutOfEmail: false,
    Rep_Reliability_Few_Instances__c: false,
    PDC_Account_Regions__c: "Southeast",
    Territory_Spine_Account_Rep_Associated__c: "HWANG/THOMAS/STUBLER/SUESSERMAN",
    Key_Planning_Questions_Completed__c: false,
    Brochure__c: "No",
    Attendee_Type_Code__c: "HCP",
    First_UNiD_case_brief__c: false,
    Rep_Engagement_Score__c: 0,
    Surgeon_type__c: "Orthopaedic",
    Surgeon_UNiD_Use_Percentage_25_50__c: false,
    Type__c: "Physician",
    CreatedDate: "2021-09-10T16:10:30.000+0000",
    LastName: "Devito",
    Manufacturing_At_Risk__c: false,
    UNiD_City__c: "Atlanta",
    Primary_Specialty__c: "Pediatric Orthopaedic Surgery",
    Scheduling_Acquisition_Score__c: 0,
    MailingStreet: "5445 Meridian Marks Rd Ne Suite 250",
    Case_Discovery_Contact_Primary__c: "a0P0R000003GWi4UAG",
    Formal_handoff_to_LAB__c: false,
    Scheduling_Visibility_All_Cases__c: false,
    Secondary_Email__c: "dpdevito21@gmail.com",
    Handles_Texts_for_UNiD_Contact__c: "0050R00000A28pYQAR",
    X3_Months__c: false,
    Identification_of_Staff_Uploader__c: false,
    Imaging_Access_Type_3rd_Party_Request__c: false,
    UNiD_Service_Pricing_Approved__c: false,
    Rep_Reliability_Not_Reliable__c: false,
    Spine_Account_RVP_Name__c: "OPEN Level 2 Manager",
    Planning_Cheat_Sheet_Complete__c: false,
    KOL_ID__c: "93874",
    Middle_name__c: "Peter",
    Phone: "55555555556",
    BAA_submitted__c: false,
    MailingPostalCode: "30342",
    Calibration_sphere_demo__c: false,
    First_UNiD_case_post_op_email_sent__c: false,
    Imaging_Timing_2_3_Days__c: false,
    Surgeon_UNiD_Use_Percentage__c: "75-99%",
    Currency_Code__c: "USD",
    Capital_Account_District__c: "ATLANTA",
    Imaging_Timing_Same_Day__c: false,
    X1st_UNiD_Surgery__c: "2016-05-09",
    Do_Not_Email__c: false,
    X10_Cases_w_Post_Ops__c: false,
    Record_Type__c: 100,
    Spine_Account_District__c: "SM ATLANTA",
    Inactive__c: "N",
    UNiD_Zip_Code__c: "30342",
    Owner_SF_ID__c: "0050M00000DHOGbQAP",
    Capital_Account_Region__c: "SOUTHEAST",
    X6_Months__c: false,
    Depends_on_Hospital__c: "No",
    Hospital_SF_ID__c: "0010R00001FXcz2QAD",
    Fax: "(404) 256-7924",
    LastModifiedById: "0050R00000A28pYQAR",
    Contact_ID__c: "0030R00001KE7xKQAT",
    Name_X_Ray_Contact__c: "Cara (Meridian Mark)\nRobert manager not x-ray tech (Duluth)",
    HMS_PID__c: "PINU97DMA8",
    NPI__c: "1578542130",
  };

  const pertinentOldValues = {
    userSfId: "0030R00001KE7xKQAT",
    firstName: "Dennis",
    lastName: "Devito",
    fullName: "Dennis Devito",
    phone: "55555555556",
    mobilePhone: "55555555555",
    email: "email@example.com",
    assignedConsultantId: "0050R00000A28pYQAR",
    unidPhoneNumber: "6785208831",
    assignedLabEngineerId: "0050R00000A28pYQAR",
    handlesCallsForUnidContactId: "0050R00000A2UB1QAN",
    assignedCaseManagerId: "0050R00000A28pYQAR",
    handlesTextsForUnidContactId: "0050R00000A28pYQAR",
  };

  const changedValuesSalesforceName: string[] = ["Phone", "MobilePhone"];
  const changedValuesContactUpdatedRecordName: string[] = ["phone", "mobilePhone"];
  const changedValuesAllSalesforceName: string[] = [
    "Id",
    "FirstName",
    "LastName",
    "Full_Name__c",
    "Phone",
    "MobilePhone",
    "Email",
    "Assigned_Consultant__c",
    "UNiD_Phone_Number__c",
    "Assigned_LAB_Engineer__c",
    "Handles_Calls_for_UNiD_Contact__c",
    "Assigned_Case_Manager__c",
    "Handles_Texts_for_UNiD_Contact__c",
  ];
  const changedValuesAllContactUpdatedRecordName: string[] = [
    "userSfId",
    "firstName",
    "lastName",
    "fullName",
    "phone",
    "mobilePhone",
    "email",
    "assignedConsultantId",
    "unidPhoneNumber",
    "assignedLabEngineerId",
    "handlesCallsForUnidContactId",
    "assignedCaseManagerId",
    "handlesTextsForUnidContactId",
  ];

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());

  describe("Test 'sfdc-webhooks.getPertinentContactValues'", () => {
    let pertinentValues: ContactUpdatedRecord;
    it("should remove all the fields that we are not interested in", async () => {
      pertinentValues = service.getPertinentContactValues(newValues);
      expect(pertinentValues).toStrictEqual(pertinentNewValues);
    });
  });

  describe("Test 'sfdc-webhooks.getChangedFields' with all fields", () => {
    let changedFields: string[];
    it("should rename all the fields based on our map", async () => {
      changedFields = service.getChangedFields(RECORD_TYPE.CONTACT, changedValuesAllSalesforceName);
      expect(changedFields).toStrictEqual(changedValuesAllContactUpdatedRecordName);
    });
  });

  describe("Test 'sfdc-webhooks.getChangedFields' with a subset of fields", () => {
    let changedFields: string[];
    it("should rename some of the fields based on our map", async () => {
      changedFields = service.getChangedFields(RECORD_TYPE.CONTACT, changedValuesSalesforceName);
      expect(changedFields).toStrictEqual(changedValuesContactUpdatedRecordName);
    });
  });

  describe("Test 'sfdc-webhooks.processWebhook' which is end to end test", () => {
    const emitSpy = jest.spyOn(broker, "emit");

    const dataIn = { new: [newValues], old: [oldValues], changed: changedValuesSalesforceName };
    let expectedPayload: UpdatedRecordPayload = {
      type: RECORD_TYPE.CONTACT,
      new: pertinentNewValues,
      old: pertinentOldValues,
      changed: changedValuesContactUpdatedRecordName,
    };
    let actualPayload: UpdatedRecordPayload;
    it("should translate a Salesforce payload to a pubsub payload", async () => {
      actualPayload = service.processWebhook(dataIn);
      expect(actualPayload).toStrictEqual(expectedPayload);
      expect(emitSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Test 'sfdc-webhooks.processWebhook' which is end to end test", () => {
    let emptyNew: any[] = [];
    const dataIn = { new: emptyNew, old: [oldValues], changed: changedValuesSalesforceName };
    let actualPayload: UpdatedRecordPayload;
    it("should return null since no new data is passed in", async () => {
      actualPayload = service.processWebhook(dataIn);
      expect(actualPayload).toBe(null);
    });
  });

  describe("Test 'sfdc-webhooks.processWebhook' which is end to end test", () => {
    const dataIn = {
      new: [newValuesUnknown],
      old: [oldValues],
      changed: changedValuesSalesforceName,
    };
    let actualPayload: UpdatedRecordPayload;
    it("should return null since the new data is passed in does not have a record type", async () => {
      actualPayload = service.processWebhook(dataIn);
      expect(actualPayload).toBe(null);
    });
  });

  describe("Test 'sfdc-webhooks.getUpdatedRecordType' with a valid type", () => {
    let actualType: string;
    it("should return 'User' since the new data has that type", async () => {
      actualType = service.getUpdatedRecordType(newValues);
      expect(actualType).toBe(RECORD_TYPE.CONTACT);
    });
  });

  describe("Test 'sfdc-webhooks.getUpdatedRecordType' with a valid type", () => {
    let actualType: string;
    it("should return 'Unknown' since the new data has no type", async () => {
      actualType = service.getUpdatedRecordType(newValuesUnknown);
      expect(actualType).toBe(RECORD_TYPE.UNKNOWN);
    });
  });
});

describe("Test 'sfdc-webhooks service' for User records ", () => {
  const broker = new ServiceBroker({ logger: false });
  const service = broker.createService(ServiceSchema);

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());

  describe("Test 'sfdc-webhooks.getNormalizedPhoneNumber' ", () => {
    const numbersToNormalized: string[] = ["(919)790-0903", "+19197900903", "9197900903"];
    let normalizedPhoned: string = "";

    it("should format the phone numbers to remove all non-numeric characters", async () => {
      for (let i = 0; i < numbersToNormalized.length; i++) {
        normalizedPhoned = service.getNormalizedPhoneNumber(numbersToNormalized[i]);
        expect(normalizedPhoned).toEqual("9197900903");
      }
    });
  });
});
