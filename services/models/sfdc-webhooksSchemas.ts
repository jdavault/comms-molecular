export interface UserUpdatedRecord {
  userFedId: string;
  userSfId: string;
  firstName: string;
  lastName: string;
  phone: string;
  mobilePhone: string;
  assignedTwilioNumber: string;
  email: string;
  userRole: string;
  availabilityStatus: string;
  isForwarded: boolean;
  forwardingUser: string;
}

export interface ContactUpdatedRecord {
  userSfId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  mobilePhone: string;
  email: string;
  assignedConsultantId: string;
  unidPhoneNumber: string;
  assignedLabEngineerId: string;
  handlesCallsForUnidContactId: string;
  assignedCaseManagerId: string;
  handlesTextsForUnidContactId: string;
}

export interface UpdatedRecordPayload {
  type: string;
  new: UserUpdatedRecord | ContactUpdatedRecord;
  old: UserUpdatedRecord | ContactUpdatedRecord;
  changed: string[];
}
