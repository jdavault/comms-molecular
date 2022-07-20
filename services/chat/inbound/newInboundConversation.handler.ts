import { Context, Errors } from "moleculer";
import { Twilio } from "twilio";
import { ParticipantInstance } from "twilio/lib/rest/conversations/v1/conversation/participant";
import {
  ContactPersonsConversationAttr,
  ConversationAttr,
  ParticipantAttr,
  ParticipantType,
  PostOnConversationAdd,
  PrimaryUserConversationAttr,
} from "../chat.models";
import standardNumber from "../../utils/standardNumber";
import generateAddressMapping, {
  AddressMap,
  AddressMapping,
} from "../shared/generateAddressMapping";
import ChatEvent from "../shared/ChatEvent.class";

async function handleNewInboundConversation(
  ctx: Context<PostOnConversationAdd>
) {
  ctx.service.logger.debug("handling new inbound conversation");
  const twilio: Twilio = ctx.service.schema.getClient();
  validate(ctx);
  const existingConversationSid = ctx.params.ConversationSid;
  try {
    const addressMap: AddressMap = await getAddressMap(ctx);
    const existingParticipants = await getConvoParticipantsList(
      twilio,
      existingConversationSid
    );
    if (ChatEvent.isInboundGroup(ctx.params)) {
      await handleGroup(
        ctx,
        twilio,
        addressMap,
        existingConversationSid,
        existingParticipants
      );
    } else {
      await handleSingle(
        ctx,
        twilio,
        addressMap,
        existingConversationSid,
        existingParticipants
      );
    }
  } catch (e) {
    throw new Errors.MoleculerServerError(
      `an error occurred processing new inbound conversation: ${e.message}`,
      500
    );
  }
}

async function handleSingle(
  ctx: Context<PostOnConversationAdd>,
  twilio: Twilio,
  addressMap: AddressMap,
  existingConversationSid: string,
  existingParticipants: ParticipantInstance[]
) {
  const convoAttr: ConversationAttr = {
    isOutboundInit: false,
    subject: "Other",
    openContacts: [],
    contactPersons: [],
    primaryUsers: [],
  };
  let primarySurgeon: any;
  let primaryUnid: any;
  let openContact: any;
  let forwardingEngineer: any;

  const internalNum = standardNumber(
    ctx.params["MessagingBinding.ProxyAddress"]
  );
  const externalNum = standardNumber(ctx.params["MessagingBinding.Address"]);
  const participant: AddressMapping = addressMap[externalNum] as AddressMapping;
  const pSid = getExistingParticipantSid(
    ctx,
    existingParticipants,
    externalNum
  );
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
    if (primarySurgeon.Assigned_LAB_Engineer__r) {
      forwardingEngineer = primarySurgeon.Assigned_LAB_Engineer__r.Forwarding_User__r;
    }
  }
  if (participant.type === ParticipantType.Unid) {
    primaryUnid = participant.rootSurgeon;
    if (primaryUnid.Handles_Texts_for_UNiD_Contact__r) {
      forwardingEngineer = primaryUnid.Handles_Texts_for_UNiD_Contact__r.Forwarding_User__r;
    }
  }

  // If the external is a Surgeon or Unid, get the record for later use
  await updateConvoParticipant(
    twilio,
    existingConversationSid,
    pSid,
    partiAttr
  );
  convoAttr.contactPersons.push(contactPersonAttr);

  if (internalNum === process.env.TWILIO_LAB_TEAM_NUMBER) {
    const labMembers: AddressMapping[] = addressMap[internalNum] as AddressMapping[];
    // For inbound autocreate twilio will create participants for all addressed numbers in the group
    // In the case of the lab team number, we want to delete the autocreated participant so we can
    // recreate with all the lab members projected behind it.
    // If 1 to 1 message only the sms sender is added as a participant, so no need to delete
    // the created participant for the lab team
    for (const lm of labMembers) {
      const lmPartiAttr: ParticipantAttr = {
        isInternal: true,
        sfId: lm.sfId,
        type: lm.type,
        name: lm.name,
        primaryPhone: lm.contactPhone,
        fedId: lm.fedId,
        twilioNumber: lm.twilioNumber,
      };
      await createConversationParticipant(
        twilio,
        existingConversationSid,
        lmPartiAttr,
        lm.fedId
      );
      // If we identified a Surgeon or Unid, and one of the lab numbers is the lookup
      // add them to the convo attributes used to track primary contacts
      if (!primarySurgeon && !primaryUnid) {
        const openUserConvoAttr: PrimaryUserConversationAttr = {
          isLab: true,
          name: lm.name,
          fedId: lm.fedId,
          sfId: lm.sfId,
          type: lm.type,
          twilioNumber: lm.twilioNumber,
          forwardedUser: { isLab: true, fedId: forwardingEngineer?.FederationIdentifier, name: forwardingEngineer?.Name },
        };
        convoAttr.openContacts.push(openUserConvoAttr);
      } else if (
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
          forwardedUser: { isLab: true, fedId: forwardingEngineer?.FederationIdentifier, name: forwardingEngineer?.Name },
        };
        convoAttr.primaryUsers.push(primaryUserConvoAttr);
      }
    }
  } else {
    const intPart = addressMap[internalNum] as AddressMapping;
    // if this participant has forwardingUser, let's grab that user and add
    // them to the concersation and also see this participants forwarding user to this forwardedUser
    let forwardedParticipant: ParticipantAttr;
    let forwardedConsultant: PrimaryUserConversationAttr;
    if (intPart.forwardingUser) {
      const response: any = await ctx.service.broker.call(
        "v1.sfdc-users.getUserBySfId",
        { sfId: intPart.forwardingUser }
      );
      if (response) {
        const user = response.records[0];
        forwardedParticipant = {
          isInternal: true,
          fedId: user.FederationIdentifier,
          name: user.Name,
          sfId: user.Id,
          primaryPhone: user.MobilePhone ? user.MobilePhone : user.Phone,
          type: user.User_Role__c,
          twilioNumber: user.Twilio_Number__c,
        };
      }
      forwardedConsultant = {
        isLab: false, name: forwardedParticipant.name, fedId: forwardedParticipant.fedId,
        sfId: forwardedParticipant.sfId, type: forwardedParticipant.type, twilioNumber: forwardedParticipant.twilioNumber, forwardedUser: null,
      };

      await createConversationParticipant(
        twilio,
        existingConversationSid,
        forwardedParticipant,
        forwardedParticipant.fedId
      );
    }

    const intPartiAttr: ParticipantAttr = {
      isInternal: true,
      sfId: intPart.sfId,
      type: intPart.type,
      name: intPart.name,
      primaryPhone: intPart.contactPhone,
      twilioNumber: intPart.twilioNumber,
      fedId: intPart.fedId,
    };
    await createConversationParticipant(
      twilio,
      existingConversationSid,
      intPartiAttr,
      intPart.fedId
    );
    if (!primarySurgeon && !primaryUnid) {
      const openUserConvoAttr: PrimaryUserConversationAttr = {
        isLab: intPart.type === ParticipantType.CaseManager, // Case Manager is part of lab
        name: intPart.name,
        fedId: intPart.fedId,
        sfId: intPart.sfId,
        type: intPart.type,
        twilioNumber: intPart.twilioNumber,
        forwardedUser: forwardedConsultant,
      };
      convoAttr.openContacts.push(openUserConvoAttr);
    } else {
      const primaryUserConvoAttr: PrimaryUserConversationAttr = {
        isLab: intPart.type === ParticipantType.CaseManager, // Case Manager is part of lab
        name: intPart.name,
        fedId: intPart.fedId,
        sfId: intPart.sfId,
        type: intPart.type,
        twilioNumber: intPart.twilioNumber,
        forwardedUser: forwardedConsultant,
      };
      convoAttr.primaryUsers.push(primaryUserConvoAttr);
      if (forwardedConsultant) {
        convoAttr.primaryUsers.push(forwardedConsultant);
      }

    }
  }
  // update the conversation attribut
  await updateConversation(ctx, twilio, existingConversationSid, convoAttr);
}

async function handleGroup(
  ctx: Context<PostOnConversationAdd>,
  twilio: Twilio,
  addressMap: AddressMap,
  existingConversationSid: string,
  existingParticipants: ParticipantInstance[]
) {
  const convoAttr: ConversationAttr = {
    isOutboundInit: false,
    subject: "Other",
    openContacts: [],
    contactPersons: [],
    primaryUsers: [],
  };
  // As this is inbound, we want to loop through the identified exteral numbers and update
  // their participant attributes
  let primarySurgeon: any;
  let primaryUnid: any;
  const external = addressMap.external as string[];
  for (const externalNum of external) {
    const participant: AddressMapping = addressMap[
      externalNum
    ] as AddressMapping;
    const pSid = getExistingParticipantSid(
      ctx,
      existingParticipants,
      externalNum
    );
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
    await updateConvoParticipant(
      twilio,
      existingConversationSid,
      pSid,
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
      // For inbound autocreate twilio will create participants for all addressed numbers in the group
      // In the case of the lab team number, we want to delete the autocreated participant so we can
      // recreate with all the lab members projected behind it.
      // If 1 to 1 message only the sms sender is added as a participant, so no need to delete
      // the created participant for the lab team
      for (const lm of labMembers) {
        const partiAttr: ParticipantAttr = {
          isInternal: true,
          sfId: lm.sfId,
          type: lm.type,
          name: lm.name,
          primaryPhone: lm.contactPhone,
          twilioNumber: lm.twilioNumber,
          fedId: lm.fedId,
        };
        await createConversationParticipant(
          twilio,
          existingConversationSid,
          partiAttr,
          lm.fedId
        );
        // If we identified a Surgeon or Unid, and one of the lab numbers is the lookup
        // add them to the convo attributes used to track primary contacts
        if (!primarySurgeon && !primaryUnid) {
          const openUserConvoAttr: PrimaryUserConversationAttr = {
            isLab: true,
            name: lm.name,
            fedId: lm.fedId,
            sfId: lm.sfId,
            type: lm.type,
            twilioNumber: lm.twilioNumber,
            forwardedUser: null, // todo
          };
          convoAttr.openContacts.push(openUserConvoAttr);
        } else if (
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
      const pSid = getExistingParticipantSid(
        ctx,
        existingParticipants,
        internalNum
      );
      const intPart = addressMap[internalNum] as AddressMapping;
      const partiAttr: ParticipantAttr = {
        isInternal: true,
        sfId: intPart.sfId,
        type: intPart.type,
        name: intPart.name,
        primaryPhone: intPart.contactPhone,
        fedId: intPart.fedId,
        twilioNumber: intPart.twilioNumber,
      };
      await updateConvoParticipant(
        twilio,
        existingConversationSid,
        pSid,
        partiAttr,
        intPart.fedId
      );
      if (!primarySurgeon && !primaryUnid) {
        const openUserConvoAttr: PrimaryUserConversationAttr = {
          isLab: intPart.type === ParticipantType.CaseManager, // Case Manager is part of lab
          name: intPart.name,
          fedId: intPart.fedId,
          sfId: intPart.sfId,
          type: intPart.type,
          twilioNumber: intPart.twilioNumber,
          forwardedUser: null, // todo
        };
        convoAttr.openContacts.push(openUserConvoAttr);
      } else {
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
    // update the conversation attribute
    await updateConversation(ctx, twilio, existingConversationSid, convoAttr);
  }
}

async function createConversationParticipant(
  client: Twilio,
  convoSid: string,
  partiAttr: any,
  identity: string
) {
  await client.conversations.conversations(convoSid).participants.create({
    attributes: JSON.stringify(partiAttr),
    identity,
    messagingBinding: {
      projectedAddress: `+1${partiAttr.twilioNumber}`,
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
    friendlyName: `Inbound ${ChatEvent.isInboundGroup(ctx.params) ? "Group SMS" : "SMS"
      }`,
  });
  ctx.service.logger.debug(result);
}

function getExistingParticipantSid(
  ctx: Context<PostOnConversationAdd, any>,
  participants: ParticipantInstance[],
  searchNumber: string
): string {
  return participants[
    participants.findIndex((ep: ParticipantInstance) => {
      let bindingAddress;
      if (ChatEvent.isInboundGroup(ctx.params)) {
        bindingAddress =
          ep.messagingBinding?.address != null
            ? standardNumber(ep.messagingBinding.address)
            : standardNumber(ep.messagingBinding.projected_address);
      } else {
        bindingAddress =
          ep.messagingBinding?.address != null
            ? standardNumber(ep.messagingBinding.address)
            : standardNumber(ep.messagingBinding.proxy_address);
      }

      return bindingAddress === searchNumber;
    })
  ].sid;
}

async function getConvoParticipantsList(
  client: Twilio,
  existingSid: string
): Promise<ParticipantInstance[]> {
  return client.conversations.conversations(existingSid).participants.list();
}

async function getAddressMap(
  ctx: Context<PostOnConversationAdd, any>
): Promise<AddressMap> {
  return ChatEvent.isInboundGroup(ctx.params)
    ? generateAddressMapping(ctx, [
      standardNumber(ctx.params["MessagingBinding.AuthorAddress"]),
      ...ctx.params["MessagingBinding.Address"]
        .split(",")
        .map((n: string) => standardNumber(n.trim())),
    ])
    : generateAddressMapping(ctx, [
      standardNumber(ctx.params["MessagingBinding.Address"]),
      standardNumber(ctx.params["MessagingBinding.ProxyAddress"]),
    ]);
}

function validate(ctx: Context<PostOnConversationAdd>): void {
  if (!process.env.TWILIO_LAB_TEAM_NUMBER) {
    throw new Error("missing required environment var TWILIO_LAB_TEAM_NUMBER");
  }
  if (!ctx.params["MessagingBinding.Address"]) {
    throw new Error(`\
missing 'MessagingBinding.Address' parameter.\
Was this handler called for an outbound initial conversation?`);
  }
}

async function updateConvoParticipant(
  client: Twilio,
  convoSid: string,
  partiSid: string,
  partiAttr: any,
  identity?: string
) {
  const updatePayload: any = {
    attributes: JSON.stringify(partiAttr),
  };
  if (identity) {
    updatePayload.identity = identity;
  }
  await client.conversations
    .conversations(convoSid)
    .participants(partiSid)
    .update(updatePayload);
}

export default handleNewInboundConversation;
