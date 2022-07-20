import { ParticipantType } from "../chat/chat.models";
import { CustomerRecordEntry } from "../models/QuerySchemas";

export interface VoiceCallStatusEvent {
  AccountSid: string;
  ApiVersion: string;
  CallSid: string;
  CallStatus: string;
  Called: string;
  CalledCountry: string;
  CalledCity: string;
  CalledState: string;
  CalledZip: string;
  Caller: string;
  CallerCity: string;
  CallerCountry: string;
  CallerState: string;
  Direction: string;
  FromCity: string;
  From: string;
  FromState: string;
  To: string;
  FromZip: string;
  FromCountry: string;
  CallerZip: string;
  ToCity: string;
  ToCountry: string;
  ToZip: string;
  ToState: string;
}

export interface ConferenceCallStatusEvent {
  Coaching: string;
  FriendlyName: string;
  ParticipantLabel: string;
  EndConferenceOnExit: string;
  StatusCallbackEvent: string;
  Timestamp: string;
  StartConferenceOnEnter: string;
  AccountSid: string;
  SequenceNumber: string;
  ConferenceSid: string;
  CallSid: string;
  Hold: string;
  Muted: string;
  CallSidEndingConference: string;
  ReasonConferenceEnded: string;
  ParticipantLabelEndingConference: string;
  Reason: string;
  UserSfId: string;
  UserFedId: string;
  UserName: string;
  ClientSfId: string;
  ClientName: string;
  CustomerPhoneNumber: string;
  AliasPhoneNumber: string;
  UserPhoneNumber: string;
}

export interface InboundCallEvent extends VoiceCallStatusEvent {
  StirPassportToken: string;
  StirVerstat: string;
  CallType?: string;
}

export interface OutboundConferenceStatusEvent
  extends ConferenceCallStatusEvent {
  StirPassportToken: string;
  StirVerstat: string;
  CustomerType: "Surgeon" | "Unid Contact" | "Unknown";
  RelatedSurgeonSfId?: string;
}

export interface InboundConferenceStatusEvent
  extends ConferenceCallStatusEvent {
  StirPassportToken: string;
  StirVerstat: string;
  CustomerType: "Surgeon" | "Unid Contact" | "Unknown";
  ClientCallSid: string;
  PrimaryContactFedId: string;
  RelatedSurgeonSfId?: string;
}

export interface AmdStatusCallbackEvent {
  MachineDetectionDuration: string;
  CallSid: string;
  AnsweredBy: string;
  AccountSid: string;
  Direction: string;
}

export interface InboundAmdStatusCallbackEvent extends AmdStatusCallbackEvent {
  ClientCallSid: string;
  UserSfId: string;
  UserFedId: string;
  CustomerType: "Surgeon" | "Unid Contact" | "Unknown" | ParticipantType;
  ClientSfId: string;
  CustomerPhoneNumber: string;
  ClientName: string;
  UserPhoneNumber: string;
  UserName: string;
  AliasNumber: string;
  PrimaryContactFedId?: string;
  RelatedSurgeonSfId?: string;
  ForwardingUserName?: string;
  TransferrerUserName?: string;
}

export interface OutboundCallEvent extends VoiceCallStatusEvent {
  StirPassportToken: string;
  StirVerstat: string;
  UserSfId: string;
  UserFedId: string;
  UserNumber: string;
  UserName: string;
  ClientSfId: string;
  ClientName: string;
  CustomerPhoneNumber: string;
  CustomerType: string;
  AliasNumber: string;
}

export interface StatusCallbackEvent extends VoiceCallStatusEvent {
  CallbackSource: string;
  Timestamp: string;
  SequenceNumber: string;
  StirStatus: string;
  ClientCallSid: string;
  UserFedId: string;
  CustomerType: "Surgeon" | "Unid Contact" | "Unknown";
  ClientSfId: string;
  CustomerPhoneNumber: string;
  ClientName: string;
  UserPhoneNumber: string;
  UserName: string;
  AliasPhoneNumber: string;
  MobilePhoneNumber: string;
}

export interface RoutingInformation {
  Id: string;
  Name: string;
  Type: string;
  Record: CustomerRecordEntry;
  User: RouteUser;
  RelatedSurgeonSfId?: string;
}

export interface RouteUser {
  Id: string;
  Name: string;
  Phone: string;
  MobilePhone: string;
  FederationIdentifier: string;
  AvailabilityStatus?: string;
  ForwardedBy?: RouteUser;
  TransferredBy?: string;
}
