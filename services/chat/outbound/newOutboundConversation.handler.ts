import { Context, Errors } from "moleculer";
import { Twilio } from "twilio";
import { ConversationInstance } from "twilio/lib/rest/conversations/v1/conversation";
import {
  ContactPersonsConversationAttr,
  ConversationAttr,
  OutboundSMS,
  ParticipantAttr,
  ParticipantType,
  PrimaryUserConversationAttr,
} from "../chat.models";
import { UserContext } from "../../../mixins/validate-sso";
import standardNumber from "../../utils/standardNumber";
import generateAddressMapping, {
  AddressMap,
  AddressMapping,
} from "../shared/generateAddressMapping";
import findExistingConversationsForParticipants from "../shared/findExistingConversationsForParticipants";
import cleanUpAbortedConversations from "../shared/cleanUpAbortedConversations";

async function handleNewOutboundConversation(
  ctx: Context<OutboundSMS, { meta: UserContext }>
) {
  ctx.service.logger.trace("handling new outbound conversation");
  const participants = ctx.params.participants;
  const senderTwilioNumber = ctx.params.senderTwilioNumber;
  const subject = ctx.params.subject;
  const twilio: Twilio = ctx.service.schema.getClient();

  console.log("1. participants: " + participants);
  console.log("2. senderTwilioNumber: " + senderTwilioNumber);
  console.log("3. subject: " + subject);

  validate(ctx);
  try {
    // Check for existing, if sid is found return it

    const standardizedParticipants: string[] = [
      ...participants.map((n: string) => standardNumber(n)),
      standardNumber(senderTwilioNumber),
    ];
    console.log("3.5 starting findExistingConversations...");
    const existingConversationSid =
      await findExistingConversationsForParticipants(
        twilio,
        standardizedParticipants
      );
    console.log("3.9 existingConversationSid: " + existingConversationSid);
    if (existingConversationSid) {
      console.log("4. ExistingConversationSid: " + existingConversationSid);
      // If we find an existing sid, return to the front end
      if (subject) {
        const existingConvo = await twilio.conversations.conversations(existingConversationSid).fetch();
        const existingAttr = { ...JSON.parse(existingConvo.attributes) };
        existingAttr.subject = subject;

        console.log("5. existingConvo: " + existingConvo);
        console.log("6. existingAttr: " + existingAttr);

        await twilio.conversations
          .conversations(existingConversationSid)
          .update({ attributes: JSON.stringify(existingAttr) });
      }
      return existingConversationSid;
    }
    const addressMap: AddressMap = await generateAddressMapping(
      ctx,
      standardizedParticipants
    );
    if (ctx.params.participants.length > 1) {
      console.log("7. ctx.params.participants.length >1");
      return await handleGroup(ctx, twilio, addressMap, subject);
    } else {
      console.log("8. ctx.params.participants.length =< 1");
      return await handleSingle(ctx, twilio, addressMap, subject);
    }
  } catch (e) {
    console.error("8. ERROR(e):" + e);
    throw new Errors.MoleculerServerError(
      `an error occurred processing new inbound conversation: ${e.message}`,
      500
    );
  }
}

async function handleSingle(
  ctx: Context<any, any>,
  twilio: Twilio,
  addressMap: AddressMap,
  subject: string
) {
  let newConversation: ConversationInstance;
  try {
    const convoAttr: ConversationAttr = {
      isOutboundInit: true,
      subject,
      openContacts: [],
      contactPersons: [],
      primaryUsers: [],
    };
    let primarySurgeon: any;
    let primaryUnid: any;
    const internal = addressMap.internal as string[];
    const external = addressMap.external as string[];
    const internalNum: string = internal[0];
    const externalNum = external[0];
    const participant: AddressMapping = addressMap[
      externalNum
    ] as AddressMapping;

    newConversation = await twilio.conversations.conversations.create({
      friendlyName: "Outbound SMS",
    });
    const partiAttr: ParticipantAttr = {
      isInternal: false,
      sfId: participant.sfId,
      type: participant.type,
      name: participant.name,
      primaryPhone: participant.contactPhone,
      assignedLabEngineer: participant.assignedLabEngineer,
      assignedHandlesUnidTexts: participant.assignedHandlesUnidTexts,
    };
    const contactPersonAttr: ContactPersonsConversationAttr = {
      sfId: participant.sfId,
      customerType: participant.type,
      name: participant.name,
      primaryPhone: participant.contactPhone,
      assignedLabEngineer: participant.assignedLabEngineer,
      assignedHandlesUnidTexts: participant.assignedHandlesUnidTexts,
    };
    // If the external contact is a Surgeon or Unid, get the record for later use
    if (participant.type === ParticipantType.Surgeon) {
      primarySurgeon = participant.record;
    }
    if (participant.type === ParticipantType.Unid) {
      primaryUnid = participant.rootSurgeon;
    }
    convoAttr.contactPersons.push(contactPersonAttr);
    await createExternalConversationParticipant(
      twilio,
      newConversation.sid,
      participant.contactPhone,
      partiAttr
    );
    if (internalNum === process.env.TWILIO_LAB_TEAM_NUMBER) {
      const labMembers: AddressMapping[] = addressMap[
        internalNum
      ] as AddressMapping[];
      for (const lm of labMembers) {
        const lmPartiAttr: ParticipantAttr = {
          isInternal: true,
          sfId: lm.sfId,
          type: lm.type,
          name: lm.name,
          primaryPhone: lm.contactPhone,
          fedId: lm.fedId,
        };
        await createInternalConversationParticipant(
          twilio,
          newConversation.sid,
          lmPartiAttr,
          lm.twilioNumber,
          lm.fedId
        );
        if (
          (primarySurgeon &&
            primarySurgeon.Assigned_LAB_Engineer__r &&
            lm.sfId === primarySurgeon.Assigned_LAB_Engineer__r.Id) ||
          (primaryUnid &&
            primaryUnid.Handles_Texts_for_UNiD_Contact__r &&
            lm.sfId === primaryUnid.Handles_Texts_for_UNiD_Contact__r.Id)
        ) {
          const primaryUserConvoAttr: PrimaryUserConversationAttr = {
            isLab: true,
            name: lm.name,
            fedId: lm.fedId,
            sfId: lm.sfId,
            type: lm.type,
            twilioNumber: lm.twilioNumber,
            forwardedUser: null, // todo
          };
          convoAttr.primaryUsers.push(primaryUserConvoAttr);
        }
      }
    } else {
      const intPart = addressMap[internalNum] as AddressMapping;
      const intPartiAttr: ParticipantAttr = {
        isInternal: true,
        sfId: intPart.sfId,
        type: intPart.type,
        name: intPart.name,
        primaryPhone: intPart.contactPhone,
        fedId: intPart.fedId,
      };
      await createInternalConversationParticipant(
        twilio,
        newConversation.sid,
        intPartiAttr,
        intPart.twilioNumber,
        intPart.fedId
      );

      const primaryUserConvoAttr: PrimaryUserConversationAttr = {
        isLab: intPart.type === ParticipantType.CaseManager, // Case Manager is part of lab
        name: intPart.name,
        fedId: intPart.fedId,
        sfId: intPart.sfId,
        type: intPart.type,
        twilioNumber: intPart.twilioNumber,
        forwardedUser: null, // todo
      };
      convoAttr.primaryUsers.push(primaryUserConvoAttr);
    }
    // update the conversation attribut
    const result = await updateConversation(
      ctx,
      twilio,
      newConversation.sid,
      convoAttr
    );
    return newConversation.sid;
  } catch (e) {
    if (newConversation?.sid) {
      ctx.service.logger.trace(
        `an error occurred while creating new outbound conversation: ${e.message}`
      );
      await cleanUpAbortedConversations(ctx, newConversation.sid);
    }
    throw e;
  }
}

async function handleGroup(
  ctx: Context<any, any>,
  twilio: Twilio,
  addressMap: AddressMap,
  subject: string
) {
  let newConversation: ConversationInstance;
  try {
    const convoAttr: ConversationAttr = {
      isOutboundInit: true,
      subject,
      openContacts: [],
      contactPersons: [],
      primaryUsers: [],
    };

    let primarySurgeon: any;
    let primaryUnid: any;
    newConversation = await twilio.conversations.conversations.create({
      friendlyName: "Outbound Group SMS",
    });
    const external = addressMap.external as string[];
    for (const externalNum of external) {
      const participant: AddressMapping = addressMap[
        externalNum
      ] as AddressMapping;
      const partiAttr: ParticipantAttr = {
        isInternal: false,
        sfId: participant.sfId,
        type: participant.type,
        name: participant.name,
        primaryPhone: participant.contactPhone,
        assignedLabEngineer: participant.assignedLabEngineer,
        assignedHandlesUnidTexts: participant.assignedHandlesUnidTexts,
      };
      const contactPersonAttr: ContactPersonsConversationAttr = {
        sfId: participant.sfId,
        customerType: participant.type,
        name: participant.name,
        primaryPhone: participant.contactPhone,
        assignedLabEngineer: participant.assignedLabEngineer,
        assignedHandlesUnidTexts: participant.assignedHandlesUnidTexts,
      };
      // If the external is a Surgeon or Unid, get the record for later use
      if (participant.type === ParticipantType.Surgeon) {
        primarySurgeon = participant.record;
      }
      if (participant.type === ParticipantType.Unid) {
        primaryUnid = participant.rootSurgeon;
      }
      await createExternalConversationParticipant(
        twilio,
        newConversation.sid,
        participant.contactPhone,
        partiAttr
      );
      convoAttr.contactPersons.push(contactPersonAttr);
    }
    // Next we add the identified internal users
    const internal = addressMap.internal as string[];
    for (const internalNum of internal) {
      if (internalNum === process.env.TWILIO_LAB_TEAM_NUMBER) {
        const labMembers: AddressMapping[] = addressMap[
          internalNum
        ] as AddressMapping[];
        for (const lm of labMembers) {
          const lmPartiAttr: ParticipantAttr = {
            isInternal: true,
            sfId: lm.sfId,
            type: lm.type,
            name: lm.name,
            primaryPhone: lm.contactPhone,
            fedId: lm.fedId,
          };
          await createInternalConversationParticipant(
            twilio,
            newConversation.sid,
            lmPartiAttr,
            lm.twilioNumber,
            lm.fedId
          );
          if (
            (primarySurgeon &&
              primarySurgeon.Assigned_LAB_Engineer__r &&
              lm.sfId === primarySurgeon.Assigned_LAB_Engineer__r.Id) ||
            (primaryUnid &&
              primaryUnid.Handles_Texts_for_UNiD_Contact__r &&
              lm.sfId === primaryUnid.Handles_Texts_for_UNiD_Contact__r.Id)
          ) {
            const primaryUserConvoAttr: PrimaryUserConversationAttr = {
              isLab: true,
              name: lm.name,
              fedId: lm.fedId,
              sfId: lm.sfId,
              type: lm.type,
              twilioNumber: lm.twilioNumber,
              forwardedUser: null, // todo
            };
            convoAttr.primaryUsers.push(primaryUserConvoAttr);
          }
        }
      } else {
        const intPart = addressMap[internalNum] as AddressMapping;
        const intPartiAttr: ParticipantAttr = {
          isInternal: true,
          sfId: intPart.sfId,
          type: intPart.type,
          name: intPart.name,
          primaryPhone: intPart.contactPhone,
          fedId: intPart.fedId,
        };
        await createInternalConversationParticipant(
          twilio,
          newConversation.sid,
          intPartiAttr,
          intPart.twilioNumber,
          intPart.fedId
        );

        const primaryUserConvoAttr: PrimaryUserConversationAttr = {
          isLab: intPart.type === ParticipantType.CaseManager, // Case Manager is part of lab
          name: intPart.name,
          fedId: intPart.fedId,
          sfId: intPart.sfId,
          type: intPart.type,
          twilioNumber: intPart.twilioNumber,
          forwardedUser: null, // todo
        };
        convoAttr.primaryUsers.push(primaryUserConvoAttr);
      }
    }
    // update the conversation attribut
    const result = await updateConversation(
      ctx,
      twilio,
      newConversation.sid,
      convoAttr
    );
    return newConversation.sid;
  } catch (e) {
    if (newConversation?.sid) {
      ctx.service.logger.trace(
        `an error occurred while creating new outbound conversation: ${e.message}`
      );
      await cleanUpAbortedConversations(ctx, newConversation.sid);
    }
    throw e;
  }
}

async function createExternalConversationParticipant(
  client: Twilio,
  convoSid: string,
  addressFrom: string,
  partiAttr: any
) {
  await client.conversations.conversations(convoSid).participants.create({
    attributes: JSON.stringify(partiAttr),
    messagingBinding: {
      address: `+1${addressFrom}`,
    },
    xTwilioWebhookEnabled: "true",
  });
}

async function createInternalConversationParticipant(
  client: Twilio,
  convoSid: string,
  partiAttr: any,
  twilioNumber: string,
  identity: string
) {
  await client.conversations.conversations(convoSid).participants.create({
    attributes: JSON.stringify(partiAttr),
    identity,
    messagingBinding: {
      projectedAddress: `+1${twilioNumber}`,
    },
    xTwilioWebhookEnabled: "true",
  });
}

async function updateConversation(
  ctx: Context,
  client: Twilio,
  convoSid: string,
  convoAttr: any
) {
  const result = await client.conversations.conversations(convoSid).update({
    attributes: JSON.stringify(convoAttr),
    friendlyName: `Outbound ${convoAttr.contactPersons.length > 1 ? "Group SMS" : "SMS"
      }`,
  });
  ctx.service.logger.trace(result);
}

function validate(ctx: Context<OutboundSMS>): void {
  if (!process.env.TWILIO_LAB_TEAM_NUMBER) {
    throw new Error("missing required environment var TWILIO_LAB_TEAM_NUMBER");
  }
}

export default handleNewOutboundConversation;