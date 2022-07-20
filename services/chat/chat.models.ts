export interface ConversationAttr {
  isOutboundInit?: boolean;
  subject?: string;
  primaryUsers?: PrimaryUserConversationAttr[];
  openContacts?: any[];
  contactPersons?: ContactPersonsConversationAttr[];
}

export interface SimpleForwardedUser {
  isLab: boolean;
  fedId: string;
  name: string;
  participantSid?: string;
}

export interface PrimaryUserConversationAttr {
  isLab: boolean;
  name: string;
  fedId: string;
  sfId: string;
  type: string;
  twilioNumber: string;
  forwardedUser?: SimpleForwardedUser;
  participantSid?: string;
}

export interface ContactPersonsConversationAttr {
  sfId: string;
  customerType: ParticipantType;
  name: string;
  primaryPhone: string;
  assignedLabEngineer?: any;
  assignedHandlesUnidTexts?: any;
}

export interface ParticipantAttr {
  isInternal: boolean;
  sfId: string;
  type: ParticipantType;
  name: string;
  primaryPhone: string;
  fedId?: string;
  twilioNumber?: string;
  assignedLabEngineer?: any;
  assignedHandlesUnidTexts?: any;
}

export interface MessageAttr {
  caseId?: string;
}

export enum ParticipantType {
  Surgeon = "Surgeon",
  Unknown = "Unknown",
  Unid = "Unid Contact",
  Engineer = "Engineer",
  CaseManager = "Case Manager",
  Manager = "Manager",
  Consultant = "Consultant",
  SrEngineer = "Senior Engineer", // todo - see if this is valid
}

export interface TwilioMessageStatus {
  type: string;
  SmsSid: string;
  SmsStatus: string;
  MessageStatus: string;
  To: string;
  MessagingServiceSid: string;
  MessageSid: string;
  AccountSid: string;
  From: string;
  ApiVersion: string;
}

export interface TwilioInboundMessage {
  type: string;
  ToCountry: string;
  ToState: string;
  SmsMessageSid: string;
  NumMedia: string;
  ToCity: string;
  FromZip: string;
  SmsSid: string;
  FromState: string;
  SmsStatus: string;
  FromCity: string;
  Body: string;
  FromCountry: string;
  To: string;
  MessagingServiceSid: string;
  ToZip: string;
  NumSegments: string;
  MessageSid: string;
  AccountSid: string;
  From: string;
  ApiVersion: string;
}

export interface ConversationParticipant {
  name: string;
  twilioNumber: string | number | any;
  fedId: string;
  type: string;
  participantRecord: any;
}

export interface ConversationAttributes {
  name?: string;
  phone?: string;
  fedId?: string;
  contactSfId?: string;
  contactPerson?: any;
  subject: string;
  userInfo: { userName: string; userFedId: string };
  assignedLabEngineer?: any;
  assignedCaseManager?: any;
  assignedHandlesUnidCalls?: any;
  assignedHandlesUnidTexts?: any;
  conversationParticipants: {
    name: string;
    phone: string;
    fedId: string;
    sfId?: string;
  }[];
  outboundInitiated: boolean;
}

export interface PostOnConversationAdd {
  AccountSid: string;
  Attributes: string;
  ChatServiceSid: string;
  ConversationSid: string;
  DateCreated: string;
  EventType: string;
  "MessagingBinding.Address"?: string;
  "MessagingBinding.AuthorAddress"?: string;
  "MessagingBinding.ProxyAddress"?: string;
  MessagingServiceSid: string;
  RetryCount: string;
  Source: "SMS" | "API";
  State: string;
}

export interface OnConversationAdd {
  AccountSid: string;
  Attributes: string;
  ChatServiceSid: string;
  DateCreated: string;
  EventType: string;
  MessagingServiceSid: string;
  MessageBody: string;
  RetryCount: string;
  Source: "SMS";
  State: string;
}

export interface OnConversationAddSMS extends OnConversationAdd {
  "MessagingBinding.Address": string;
  "MessagingBinding.ProxyAddress"?: string;
}

export interface OnConversationAddGroupSMS extends OnConversationAdd {
  "MessagingBinding.Address": string[];
  "MessagingBinding.AuthorAddress": string;
}

export interface ParticipantAttributes {
  name: string;
  phone: string;
  mobilePhone: string;
  fedId?: string;
  sfId: string;
  customerType?: string;
}

export interface InboundInitialMessage {
  contactPerson: InboundInitialMessageContact;
  friendlyName: string;
  initialMessage: string;
  subject: string;
  userFedId: string;
  userName: string;
}

export interface InboundInitialMessageContact {
  attributes: any;
  Id: string;
  Name: string;
  Phone?: string;
  MobilePhone: string;
  Email: string;
  AltEmail: string;
  Location: string;
}

export interface OutboundSMS {
  participants: string[];
  subject: string;
  senderTwilioNumber: string;
}

export interface PostOnMessageAdded {
  AccountSid: string;
  Attributes: string;
  Author: string;
  Body: string;
  Media?: string;
  ClientIdentity?: string;
  ConversationSid: string;
  DateCreated: string;
  EventType: string;
  Index: string;
  MessageSid: string;
  ParticipantSid: string;
  RetryCount: string;
  Source: "SMS" | "API" | "SDK";
}

export interface OnMessageAddedMedia {
  Sid: string;
  Filename: string;
  ContentType: string;
  Size: number;
}
