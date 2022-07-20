import { Errors } from "moleculer";
import PhoneNumber from "awesome-phonenumber";
import { Twilio } from "twilio";
import { ParticipantConversationInstance } from "twilio/lib/rest/conversations/v1/participantConversation";
import getActiveTwilioNumbers from "../../utils/getActiveTwilioNumbers";
import standardNumber from "../../utils/standardNumber";
import {
  ContactPersonsConversationAttr,
  ConversationAttr,
  PrimaryUserConversationAttr,
} from "../chat.models";

const equal = function (arr1: string[], arr2: string[]) {
  // Check if the arrays are the same length
  if (arr1.length !== arr2.length) {
    return false;
  }

  // Check if all items exist and are in the same order
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }

  // Otherwise, return true
  return true;
};

export default async function findExistingConversationsForParticipants(
  twilio: Twilio,
  smsParticipants: string[]
): Promise<string> {
  try {
    const mydt = new Date();
    console.log("3.6 in findExistingConverstions..." + mydt.getTime());
    let conversationSid;
    const test = new Array<string>();
    const labNumber = process.env.TWILIO_LAB_TEAM_NUMBER;

    console.log("3.6.1 Looping participants" + mydt.getTime());
    for (const a of smsParticipants) {
      const sNum = standardNumber(a);
      // We check for duplicate numbers from some participants as twilio may have created some
      // as part of creating a 'gateway' for group conversations per docs:
      // https://www.twilio.com/docs/conversations/group-texting
      if (!test.includes(sNum)) {
        test.push(sNum);
      }
    }
    console.log("3.6.2 Sorting list" + mydt.getTime());
    test.sort();
    // pass the first one in to get all related participants
    console.log("3.6.3 Phone Nunbers" + mydt.getTime());
    const e164Address = new PhoneNumber(smsParticipants[0], "US").getNumber(
      "e164"
    );
    console.log("3.6.3.1  e164Address: " + e164Address);
    console.log("3.6.4 Conversation instance " + mydt.getTime());
    const existingConversations: ParticipantConversationInstance[] =
      await getParticipantConversations(twilio, e164Address);
    console.log("3.6.5 Looping Conversations" + mydt.getTime());
    for (const c of existingConversations) {
      const attributes: ConversationAttr = JSON.parse(c.conversationAttributes);
      const smsAddressInExistingConversation = new Array<string>();
      let labIncluded = false;
      // We check for duplicate numbers from some participants as twilio may have created some
      // as part of creating a 'gateway' for group conversations per docs:
      // https://www.twilio.com/docs/conversations/group-texting
      if (attributes.contactPersons) {
        attributes.contactPersons.forEach(
          (contact: ContactPersonsConversationAttr) => {
            const num = contact.primaryPhone;
            if (!smsAddressInExistingConversation.includes(num)) {
              smsAddressInExistingConversation.push(num);
            }
          }
        );
      }
      if (attributes.primaryUsers) {
        attributes.primaryUsers.forEach((user: PrimaryUserConversationAttr) => {
          if (!labIncluded && user.twilioNumber === labNumber) {
            labIncluded = true;
            const num = user.twilioNumber;
            if (!smsAddressInExistingConversation.includes(num)) {
              smsAddressInExistingConversation.push(num);
            }
          } else {
            const num = user.twilioNumber;
            if (!smsAddressInExistingConversation.includes(num)) {
              smsAddressInExistingConversation.push(num);
            }
          }
        });
      }
      smsAddressInExistingConversation.sort();
      const existing = smsAddressInExistingConversation;
      if (equal(test, existing)) {
        conversationSid = c.conversationSid;
        break;
      }
    }
    console.log("3.6.6 End Conversations " + mydt.getTime());
    return conversationSid;
  } catch (e) {
    console.error("8.1 ERROR(e):" + e);
    throw new Errors.MoleculerServerError(
      `an error occurred processing new inbound conversation: ${e.message}`,
      500
    );
  }

}

async function getParticipantConversations(
  client: Twilio,
  address: string
): Promise<ParticipantConversationInstance[]> {
  try {
    return await client.conversations.participantConversations.list({
      address,
      limit: 20,
    });
  } catch (error) {
    console.log("3.6.4.1 Caught Error: " + error);
    this.logger.error(error);
    throw new Error(error);
  }
}