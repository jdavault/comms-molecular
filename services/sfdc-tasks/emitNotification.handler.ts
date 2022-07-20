import OrchestratorCloudEvent from "../models/OrchestratorCloudEvent";
import { MEDICREA_TASK_CREATED } from "../constants/sfdc-tasks.constants";

import {
  ContactPersonsConversationAttr,
  ConversationAttr,
  OnMessageAddedMedia,
  ParticipantAttr,
  PrimaryUserConversationAttr,
} from "../chat/chat.models";
import { SFTask } from "./sfdc-tasks.models";

/**
 * Notify users in Salesforce of Task creation
 */
function emitNotification(sfTask: SFTask, message: OrchestratorCloudEvent) {
  if (!message.data) { return; }

  const data = message.data as {
    From: ParticipantAttr;
    Body: string;
    contactPerson: ContactPersonsConversationAttr;
    subject: string;
    media: OnMessageAddedMedia[];
    attributes: ConversationAttr;
  };

  const assignedLabEngineer = data.contactPerson.assignedLabEngineer;
  const primaryUsers = data.attributes.primaryUsers;
  const contactPersons = data.attributes.contactPersons;

  if (
    assignedLabEngineer &&
    shouldBeNotified(assignedLabEngineer, primaryUsers, contactPersons)
  ) {
    // Builds a notification that looks like this:
    // Message body preview .... (bold)
    // To: XXXX From: XXXX
    const from = data.From;
    let recipients = from.isInternal ? contactPersons : primaryUsers;

    const to = (recipients as any[])
      .map(
        (
          user: PrimaryUserConversationAttr | ContactPersonsConversationAttr
        ) => {
          return user.name;
        }
      )
      .join(", ");

    const MAX_LENGTH = 140;

    const truncate = (input: string, maxLength = MAX_LENGTH) => {
      return input && input.length >= maxLength
        ? `${input.substring(0, maxLength)}...`
        : input;
    };

    const notification: any = {
      recipientIds: [assignedLabEngineer.Id],
      title: data.media ? "Media Attachment" : truncate(data.Body),
      body: `To: ${to} From: ${from.name}`,
      targetId: sfTask.id,
    };

    const notificationEvent = new OrchestratorCloudEvent({
      type: `${this.version}.${MEDICREA_TASK_CREATED}`,
      data: notification,
    });

    this.broker.emit(MEDICREA_TASK_CREATED, notificationEvent);
  }
}

// if lab engineer is not involved in 1-1 convo they should get notification
// unless the conversation is with a UNiD contact
function shouldBeNotified(
  assignedLabEngineer: any,
  primaryUsers: any,
  contactPersons: any
) {
  if (
    isADirectMessageWithASurgeon(contactPersons) &&
    !inConversation(assignedLabEngineer, primaryUsers)
  ) {
    return true;
  }
  return false;
}

function isADirectMessageWithASurgeon(contactPersons: any) {
  if (contactPersons.length !== 1) return false;
  if (contactPersons[0].customerType === "Surgeon") return true;
  return false;
}

function inConversation(user: any, primaryUsers: any) {
  for (const u of primaryUsers) {
    if (u.fedId === user.FederationIdentifier) {
      return true;
    }
  }
  return false;
}

export default emitNotification;
