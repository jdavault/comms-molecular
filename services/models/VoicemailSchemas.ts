export interface VoicemailRecord {
  TranscriptionSid: string;
  TranscriptionText: string;
  TranscriptionStatus: string;
  TranscriptionUrl: string;
  RecordingSid: string;
  RecordingUrl: string;
  CallSid: string;
  AccountSid: string;
  From: string;
  To: string;
  CallStatus: string;
  ApiVersion: string;
  Direction: string;
  ForwardedFrom: string;
  TranscriptionType: string;
  Called: string;
  url: string;
  Caller: string;
  CustomerType: string;
  CustomerPhoneNumber: string;
  CustomerName: string;
  CustomerSfId: string;
  UserPhoneNumber: string;
  UserName: string;
  UserSfId: string;
  UserFedId: string;
  RelatedSurgeonSfId?: string;
}

export interface VoicemailTaskRecord {
  CustomerType: string;
  CustomerPhoneNumber: string;
  CustomerName: string;
  CustomerSfId: string;
  UserPhoneNumber: string;
  UserName: string;
  UserSfId: string;
  UserFedId: string;
  Direction: string;
  CallStatus: string;
  TranscriptionSid: string;
  TranscriptionText: string;
  TranscriptionStatus: string;
  TranscriptionUrl: string;
  RecordingSid: string;
  RecordingUrl: string;
  CallSid: string;
  AccountSid: string;
  RelatedSurgeonSfId?: string;
}
