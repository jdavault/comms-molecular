import { Context, Errors } from "moleculer";
import { ConversationInstance } from "twilio/lib/rest/conversations/v1/service/conversation";
import { ParticipantInstance } from "twilio/lib/rest/conversations/v1/service/conversation/participant";

import {
  ContactPersonsConversationAttr,
  ConversationAttr,
  ParticipantAttr,
  PostOnMessageAdded,
  OnMessageAddedMedia,
  PrimaryUserConversationAttr,
} from "../chat.models";
import { PUB_SUB_CHAT } from "../chat.constants";
import OrchestratorCloudEvent from "../../models/OrchestratorCloudEvent";

async function onMessageAdded(ctx: Context<PostOnMessageAdded>) {
  const params = ctx.params;
  const caseId =
    ctx.params.Attributes && JSON.parse(ctx.params.Attributes).caseId
      ? JSON.parse(ctx.params.Attributes).caseId.trim()
      : null;

  const conversationSid: string = params.ConversationSid;
  let conversation: ConversationInstance = await this.fetchConversationObject(
    conversationSid
  );
  let retries = 0;
  const MAX_RETRIES = 15;
  // Conversations don't support retries, but attributes should eventually update
  // most within 1 or 2 retries (4s)
  // https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides#connection-overrides
  while (conversation.attributes === "{}") {
    if (retries === MAX_RETRIES) {
      throw new Errors.MoleculerRetryableError(
        "max retries reached; conversation attributes not available"
      );
    }
    await new Promise((r: any) => setTimeout(r, 2000));
    try {
      conversation = await this.fetchConversationObject(conversationSid);
      retries++;
      this.logger.trace(`retry fetching Conversation: ${retries}`);
    } catch (error) {
      throw new Errors.MoleculerRetryableError(
        `error fetching conversation to get attributes: ${error.message}`
      );
    }
  }

  this.logger.trace("onMessageAdded hit with params:" + JSON.stringify(params));
  this.logger.trace(
    "onMessageAdded hit with ConversationInstance:" +
    JSON.stringify(conversation)
  );
  const attributes: ConversationAttr = JSON.parse(conversation.attributes);

  const foundUserInGroup = (fedId: string, group: PrimaryUserConversationAttr[]) => {
    const filtered = group.findIndex((primaryUser: any) => (
      primaryUser.fedId === fedId ||
      primaryUser.forwardedUser?.fedId === fedId
    ));
    return filtered >= 0;
  };


  const body: string = params.Body;

  const media: OnMessageAddedMedia[] = params.Media
    ? JSON.parse(params.Media)
    : null;

  const getAuthor = async (participantSid: string) => {
    const participantsList: ParticipantInstance[] = await conversation
      .participants()
      .list();
    return participantsList.filter((p: ParticipantInstance) => {
      return p.sid === participantSid;
    })[0];
  };

  const getRecipents = async (participantSid: string) => {
    const recipentsList: ParticipantInstance[] = await conversation
      .participants()
      .list();
    return recipentsList.filter((p: ParticipantInstance) => p.sid !== participantSid);
  };


  // there should be only one user in the list, find them
  const author = await getAuthor(params.ParticipantSid);
  const recipients = await getRecipents(params.ParticipantSid);

  const texter = JSON.parse(author.attributes) as ParticipantAttr;
  const textees: string[] = [];
  let temp;
  recipients.forEach((user: ParticipantInstance) => {
    if (user.identity !== null) {
      textees.push(user.identity);
      temp = JSON.parse(user.attributes) as ParticipantAttr;
    }
  });


  const contactPersons: ContactPersonsConversationAttr[] =
    attributes.contactPersons;

  try {
    await emitCreateTask(
      ctx,
      body,
      caseId,
      texter,
      contactPersons,
      attributes.subject,
      media,
      attributes
    );

    textees.forEach((fedId: string) => {
      const isPrimaryUser = foundUserInGroup(fedId, attributes.primaryUsers);
      const isOpenContact = attributes.openContacts && foundUserInGroup(fedId, attributes.openContacts);
      if (isPrimaryUser || isOpenContact) {
        const texterName = texter.name == null || texter.name === "" ? "Unknown" : texter.name;
        const notifyPayload = {
          primaryContactFedId: fedId,
          body: `There is a new message from ${texterName}`,
        };
        ctx.broker.call("v1.notify.sendNotification", notifyPayload);
      }
    });

  } catch (error) {
    this.logger.error(error);
    throw new Error(error);
  }
}

async function emitCreateTask(
  ctx: Context<PostOnMessageAdded>,
  body: string,
  caseId: string,
  texter: ParticipantAttr,
  contactPersons: ContactPersonsConversationAttr[],
  subject: string,
  media: OnMessageAddedMedia[],
  attributes: ConversationAttr
) {
  // A task will be created for each contact person
  contactPersons.forEach((customer: ContactPersonsConversationAttr) => {
    const cloudEvent = new OrchestratorCloudEvent({
      type: PUB_SUB_CHAT.DELIVERED,
      data: {
        From: texter,
        Body: body,
        CaseId: caseId,
        contactPerson: customer,
        subject,
        media,
        attributes,
      },
    });

    ctx.emit(PUB_SUB_CHAT.DELIVERED, cloudEvent);

  });
}

export default onMessageAdded;
