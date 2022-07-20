import {
  InboundAmdStatusCallbackEvent,
  StatusCallbackEvent,
} from "../../../../services/voice/voice.models";
import { CustomerRecord } from "../../../../services/models/QuerySchemas";
import {
  CALL_DIRECTION,
  HUMAN,
} from "../../../../services/voice/voice.constants";

export const validSurgeonRecord: any = {
  totalSize: 1,
  done: true,
  type: "Surgeon",
  records: [
    {
      attributes: {
        type: "Contact",
        url: "/services/data/v42.0/sobjects/Contact/0030R00001KE7z8QAD",
      },
      Id: "0030R00001KE7z8QAD",
      Name: "Alec Stall",
      Phone: "9845648971",
      MobilePhone: "(443) 327-8364",
      FederationIdentifier: "stalla97",
      Assigned_LAB_Engineer__r: {
        attributes: {
          type: "User",
          url: "/services/data/v42.0/sobjects/User/0050R000009GL9ZQAW",
        },
        Id: "0050R000009GL9ZQAW",
        Name: "Luke Zbinden",
        Phone: "8041234567",
        MobilePhone: "8045673297",
        FederationIdentifier: "zbindenl3",
      },
      Handles_Calls_for_UNiD_Contact__r: {
        attributes: {
          type: "User",
          url: "/services/data/v42.0/sobjects/User/0050M00000DHOGbQAP",
        },
        Id: "0050M00000DHOGbQAP",
        Name: "Franco Despoux",
        Phone: "8047654321",
        MobilePhone: "8046736295",
        FederationIdentifier: "despouxf46",
      },
      Planning_Unit_Organization__r: {
        attributes: {
          type: "Planning_Unit_Organization__c",
          url: "/services/data/v42.0/sobjects/Planning_Unit_Organization__c/a060R00000BEaR4QAL",
        },
        Id: "a060R00000BEaR4QAL",
      },
      Approval_Reminder_Contact__r: null,
      Case_Discovery_Contact_Primary__r: {
        attributes: {
          type: "UNiD_Contacts__c",
          url: "/services/data/v42.0/sobjects/UNiD_Contacts__c/a0P0R000003GWkZUAW",
        },
        Id: "a0P0R000003GWkZUAW",
        Name: "Bailey Imbo",
        Phone_Number__c: "8048407345",
      },
      Case_Discovery_Contact_Secondary__r: {
        attributes: {
          type: "UNiD_Contacts__c",
          url: "/services/data/v42.0/sobjects/UNiD_Contacts__c/a0P0R000003GWlpUAG",
        },
        Id: "a0P0R000003GWlpUAG",
        Name: "Aaron Mensah",
        Phone_Number__c: "9191234567",
      },
      Case_Discovery_Contact_Tertiary__r: null,
      Imaging_Contact_Primary__r: null,
      Imaging_Contact_Secondary__r: null,
      Imaging_Contact_Tertiary__r: null,
      Sales_Rep_Primary__r: null,
      Sales_Rep_Secondary__r: null,
    },
  ],
};

export const noCustomerUserRecord: CustomerRecord = {
  totalSize: 0,
  done: true,
  records: [] as any[],
  type: "Unknown",
};

export const validCaseManagerUserRecord: any = {
  totalSize: 3,
  done: true,
  records: [
    {
      attributes: {
        type: "User",
        url: "/services/data/v42.0/sobjects/User/0050R0000093qANQAY",
      },
      Id: "0050R0000093qANQAY",
      Name: "Annie Mickelson",
      Phone: "9841234567",
      MobilePhone: "8045632897",
      FederationIdentifier: "mickelsona12",
    },
    {
      attributes: {
        type: "User",
        url: "/services/data/v42.0/sobjects/User/0050R000009GL9XQAW",
      },
      Id: "0050R000009GL9XQAW",
      Name: "Marcus Lorenzana",
      Phone: "9841234567",
      MobilePhone: "8045632897",
      FederationIdentifier: "lorenzanam23",
    },
    {
      attributes: {
        type: "User",
        url: "/services/data/v42.0/sobjects/User/0050R00000A2UAwQAN",
      },
      Id: "0050R00000A2UAwQAN",
      Name: "Daniel Dixon",
      Phone: "9841234567",
      MobilePhone: "8045632897",
      FederationIdentifier: "dixond45",
    },
  ] as any[],
};

export const userObjectMobileOnly: any = {
  attributes: {
    type: "User",
    url: "/services/data/v42.0/sobjects/User/test",
  },
  Id: "test",
  Name: "test testerson",
  Phone: null,
  MobilePhone: "19193932323",
};

export const userObjectPhoneOnly: any = {
  attributes: {
    type: "User",
    url: "/services/data/v42.0/sobjects/User/test",
  },
  Id: "test",
  Name: "test testerson",
  Phone: "18384348484",
  MobilePhone: "",
};

export const userObjectBoth: any = {
  attributes: {
    type: "User",
    url: "/services/data/v42.0/sobjects/User/test",
  },
  Id: "test",
  Name: "test testerson",
  Phone: "18384348484",
  MobilePhone: "13439493434",
};

export const unidContactRecord: any = {
  totalSize: 1,
  done: true,
  type: "Unid Contact",
  records: [
    {
      attributes: {
        type: "Contact",
        url: "/services/data/v42.0/sobjects/Contact/0030R00001KE7z8QAD",
      },
      Id: "0030R00001KE7z8QAD",
      Name: "Alec Stall",
      Phone: "9845648971",
      MobilePhone: "(443) 327-8364",
      FederationIdentifier: "stalla97",
      Assigned_LAB_Engineer__r: {
        attributes: {
          type: "User",
          url: "/services/data/v42.0/sobjects/User/0050R000009GL9ZQAW",
        },
        Id: "0050R000009GL9ZQAW",
        Name: "Luke Zbinden",
        Phone: "8041234567",
        MobilePhone: "8045673297",
        FederationIdentifier: "zbindenl3",
      },
      Handles_Calls_for_UNiD_Contact__r: {
        attributes: {
          type: "User",
          url: "/services/data/v42.0/sobjects/User/0050M00000DHOGbQAP",
        },
        Id: "0050M00000DHOGbQAP",
        Name: "Franco Despoux",
        Phone: "8047654321",
        MobilePhone: "8046736295",
        FederationIdentifier: "despouxf46",
      },
      Planning_Unit_Organization__r: {
        attributes: {
          type: "Planning_Unit_Organization__c",
          url: "/services/data/v42.0/sobjects/Planning_Unit_Organization__c/a060R00000BEaR4QAL",
        },
        Id: "a060R00000BEaR4QAL",
      },
      Approval_Reminder_Contact__r: null,
      Case_Discovery_Contact_Primary__r: {
        attributes: {
          type: "UNiD_Contacts__c",
          url: "/services/data/v42.0/sobjects/UNiD_Contacts__c/a0P0R000003GWkZUAW",
        },
        Id: "a0P0R000003GWkZUAW",
        Name: "Bailey Imbo",
        Phone_Number__c: "8048407345",
      },
      Case_Discovery_Contact_Secondary__r: {
        attributes: {
          type: "UNiD_Contacts__c",
          url: "/services/data/v42.0/sobjects/UNiD_Contacts__c/a0P0R000003GWlpUAG",
        },
        Id: "a0P0R000003GWlpUAG",
        Name: "Aaron Mensah",
        Phone_Number__c: "9191234567",
      },
      Case_Discovery_Contact_Tertiary__r: null,
      Imaging_Contact_Primary__r: null,
      Imaging_Contact_Secondary__r: null,
      Imaging_Contact_Tertiary__r: null,
      Sales_Rep_Primary__r: null,
      Sales_Rep_Secondary__r: null,
    },
  ],
};

export const amdEvent: InboundAmdStatusCallbackEvent = {
  MachineDetectionDuration: "1200",
  CallSid: "CAxxx",
  AnsweredBy: HUMAN,
  AccountSid: "ACxxx",
  Direction: CALL_DIRECTION.INBOUND,
  ClientCallSid: "CAxxxy",
  UserSfId: "fedid1",
  UserFedId: "userfedid",
  CustomerType: "Surgeon",
  PrimaryContactFedId: "testPrimaryID",
  ClientSfId: "fedid2",
  CustomerPhoneNumber: "5555551234",
  ClientName: "Lisa Surgeon",
  UserPhoneNumber: "5555554321",
  UserName: "Jana Medtronic",
  AliasNumber: "5555556789",
};

export const sfEvent: StatusCallbackEvent = {
  CallSid: "CAxxx",
  AccountSid: "ACxxx",
  Direction: CALL_DIRECTION.INBOUND,
  ClientCallSid: "CAxxxy",
  UserFedId: "userfedid",
  CustomerType: "Surgeon",
  CustomerPhoneNumber: "5555551234",
  ClientName: "Lisa Surgeon",
  UserPhoneNumber: "5555554321",
  UserName: "Jana Medtronic",
  ClientSfId: "testPrimaryID",
  AliasPhoneNumber: "5555556789",
  MobilePhoneNumber: "5555554321",
  CallbackSource: "",
  Timestamp: "",
  SequenceNumber: "",
  StirStatus: "",
  ApiVersion: "",
  CallStatus: "",
  Called: "",
  CalledCountry: "",
  CalledCity: "",
  CalledState: "",
  CalledZip: "",
  Caller: "",
  CallerCity: "",
  CallerCountry: "",
  CallerState: "",
  FromCity: "",
  From: "",
  FromState: "",
  To: "",
  FromZip: "",
  FromCountry: "",
  CallerZip: "",
  ToCity: "",
  ToCountry: "",
  ToZip: "",
  ToState: "",
};

export const userAvailabilityAvailable: any = {
  totalSize: 1,
  records: [
    {
      Availability_Status__c: "Available",
      Forwarding_User__c: "",
    },
  ],
};

export const userAvailabilityOutOfOffice: any = {
  totalSize: 1,
  records: [
    {
      Availability_Status__c: "Out of Office",
      Forwarding_User__c: "a0P0R000003GWlpUAG",
    },
  ],
};

export const userRecord: any = {
  totalSize: 1,
  records: [
    {
      AvailabilityStatus: "Available",
      Name: "John Snow",
      Phone: "9195551212",
      MobilePhone: "7035551212",
      FederationIdentifier: "snowj35",
    },
  ],
};
