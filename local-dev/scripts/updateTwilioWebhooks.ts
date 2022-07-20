

import twilio from "twilio";
import TwilioClient from "twilio/lib/rest/Twilio";
import { config } from "dotenv-flow";
import { IncomingPhoneNumberInstance } from "twilio/lib/rest/api/v2010/account/incomingPhoneNumber";

config();

(async () => {
  try {
    console.log("Updating Twilio webhook resources...\n");
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, APP_URL, TWILIO_CONVERSATIONS_SERVICE_SID, TWILIO_DESKTOP_APPLICATION_SID } = process.env;
    const client: TwilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    await updatePhoneWebhooks(client, APP_URL);
    await updateConversationsWebhooks(client, APP_URL, TWILIO_CONVERSATIONS_SERVICE_SID);
    await updateTWIMLAppWebhooks(client, APP_URL, TWILIO_DESKTOP_APPLICATION_SID);

    console.log("\nTwilio Webhooks updated");
  } catch (e) {
    console.error(e);
  }
})();

async function updatePhoneWebhooks(client: TwilioClient, baseUrl: string) {
  const numbers: Record<string, Record<string, string>> = {};
  (await client.incomingPhoneNumbers.list({ limit: 20 }))
    .forEach(async (pn: IncomingPhoneNumberInstance) => {
      const newVoiceUrl = baseUrl + pn.voiceUrl.split("/api")[1];
      console.log(`Updating phone number ${pn.sid}\nNew URL: ${newVoiceUrl}\nOld URL: ${pn.voiceUrl}\n`);
      await client.incomingPhoneNumbers(pn.sid).update({ voiceUrl: newVoiceUrl });
    });
  console.log("Phone number inbound voice urls updated\n");
}

async function updateConversationsWebhooks(client: TwilioClient, baseUrl: string, convoSid: string) {
  const filters = [
    "onConversationAdded",
    "onMessageAdded",
  ];
  const convoConfig = await client.conversations.configuration.webhooks(convoSid).fetch();
  const currPostConvoUrl = convoConfig.postWebhookUrl;
  const newPostUrl = baseUrl + currPostConvoUrl.split("/api")[1];
  console.log(`Updating Conversations postConversation webhook:\nNew URL: ${newPostUrl}\nOld URL: ${currPostConvoUrl}`);
  console.log(`Applying the following webhook filters: ${filters}`);
  await client.conversations.configuration.webhooks(convoSid)
    .update({ postWebhookUrl: newPostUrl, filters });
  console.log("Conversations webhooks updated\n");
}

async function updateTWIMLAppWebhooks(client: TwilioClient, baseUrl: string, appSid: string) {
  const currAppUrl = (await client.applications(appSid).fetch()).voiceUrl;
  const newUrl = baseUrl + currAppUrl.split("/api")[1];
  console.log(`Updating TWIML Application webhook:\nNew URL: ${newUrl}\nOld URL: ${currAppUrl}`);
  await client.applications(appSid).update({ voiceUrl: newUrl });
  console.log("TWIML Application webhooks updated\n");
}