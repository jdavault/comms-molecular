/* eslint-disable @typescript-eslint/quotes */
export enum PUB_SUB_VOICE {
  VOICE_TEST = "medicrea.voice.test",
  VOICE_COMPLETED = "medicrea.voice.completed",
  VOICE_QUEUED = "medicrea.voice.queued",
  VOICE_INITIATED = "medicrea.voice.initiated",
  VOICE_RINGING = "medicrea.voice.ringing",
  VOICE_IN_PROGRESS = "medicrea.voice.in-progress",
  VOICE_ERROR = "medicrea.voice.error",
  START_INBOUND_CONFERENCE = "medicrea.voice.start-inbound-conference",
}

export enum VOICE_PROGRESS_EVENTS {
  COMPLETED = "completed",
  INITIATED = "initiated",
  RINGING = "ringing",
  ANSWERED = "answered",
  FAILED = "failed",
}


export enum VOICE_STATUS {
  COMPLETED = "completed",
  QUEUED = "queued",
  INITIATED = "initiated",
  RINGING = "ringing",
  IN_PROGRESS = "in-progress",
  CANCELED = "canceled",
  BUSY = "busy",
  NO_ANSWER = "no-answer",
  FAILED = "failed",
}

export enum METHOD_TYPES {
  GET = "GET",
  POST = "POST",
}

export enum STATUS_CALLBACK_EVENT_TYPES {
  JOIN = "join",
  LEAVE = "leave",
  END = "end",
}

export enum CALL_DIRECTION {
  INBOUND = "inbound",
  OUTBOUND = "outbound",
}

export enum CALL_TYPE {
  CASE_MANAGER_SEARCH_TYPE = "case manager",
  LAB_TEAM_SEARCH_TYPE = "lab-team",
}

export const INBOUND_CALL_WAIT_MESSAGE = `\
<speak>\
  Thank you for calling Medtronic.\
  <break time=".5s" />\
  Please wait while we connect your call.\
  <break time=".5s" />\
  Thank you.\
</speak>
`;

export const INBOUND_CALL_WAIT_URL =
  "https://magenta-lion-4358.twil.io/assets/medtronic-hold-music.wav";

export const INBOUND_VOICEMAIL_MESSAGE = `\
<speak>\
  The Medtronic representative is not available is not available to take your call right now.\
  Please leave a message after the beep.\
</speak>`;

export const INBOUND_VOICEMAIL_MESSAGE_LAB = `\
<speak>\
  Your UNiD lab member is currently unavailable. We apologize for the inconvenience and will get back to you as soon as possible. \
  Please leave a message at the beep, or alternatively send a text message for any urgent needs.\
</speak>`;

export const INBOUND_VOICEMAIL_MESSAGE_CONSULTANT = `\
<speak>\
  Your UNiD Consultant is currently unavailable. We apologize for the inconvenience and will get back to you as soon as possible. \
  Please leave a message at the beep, or alternatively send a text message for any urgent needs.\
</speak>`;

export const VMAIL_UNREACHABLE_MESSAGE =
  "Sorry, we could not reach the voice mailbox for the caller. Please call again later.";

export const CALL_COULD_NOT_BE_COMPLETED_MESSAGE =
  "Sorry, something went wrong and the call could not be completed. Please call again later.";

export const SURGEON = "Surgeon";
export const UNID_CONTACT = "Unid Contact";
export const UNKNOWN = "Unknown";
export const CASE_MANAGER = "Case Manager";
export const ENGINEER = "Engineer";
export const ASSIGNED_ENGINEER = "Assigned_LAB_Engineer__r";
export const ASSIGNED_USER = "Handles_Calls_for_UNiD_Contact__r";
export const USER_LABEL = "user";
export const CLIENT = "client";
export const HUMAN = "human";
export const UNID_CONTACT_SOBJECT = "UNiD_Contacts__c";
// export const ANSWERED = "answered";
// export const INITIATED = "initiated";
// export const RINGING = "ringing";
// export const COMPLETED = "completed";

// Machine detection can only be done from a Twilio call resource
// We return Twiml on the agent call to wait for an agent response
// And allow Machine Detection to proceed, each w is 0.5 seconds long
// eslint-disable-next-line @typescript-eslint/quotes
export const MACHINE_DETECTION_TWIML = `<Response>\
<Play digits="wwwwwwwwwwwwwwwwwwwwwwwwwww\
wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww\
wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww0"/>\
</Response>`;
