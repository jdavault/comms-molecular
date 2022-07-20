export interface CustomerRecord {
  totalSize: number;
  records: CustomerRecordEntry[];
  type: string;
  done: boolean;
  relatedSurgeonSfId?: string;
}

export interface CustomerRecordEntry {
  [key: string]: any;
  Id: string;
  Name: string;
  Phone?: string;
  MobilePhone?: string;
  FederationIdentifier: string;
  Assigned_LAB_Engineer__c: string;
  Handles_Texts_for_UNiD_Contact__c: string;
  Forwarding_User__c?: string;
}

export interface UserRecord {
  totalSize: number;
  records: UserRecordEntry[];
  done: boolean;
}

export interface UserRecordEntry {
  attributes: any;
  Id: string;
  Name: string;
  Phone: string;
  MobilePhone?: string;
  FederationIdentifier?: string;
  Twilio_Number__c?: string;
  User_Role__c?: string;
  Forwarding_User__c?: string;
}

export interface LoggedInUser {
  sfId: string;
  name: string;
  username: string;
  phone: string;
  mobilePhone?: string;
  fedId?: string;
  assignedTwilioNumber?: string;
  role?: string;
  availStatus: string;
  isForwarded: boolean;
  forwardingUser: string;
}
