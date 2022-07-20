const DEFAULT_TOKEN_LENGTH = 60 * 60 * 24; // 24 hours 
export default {
  name: "voice-token",
  getVoiceToken(fedId: string): Promise<string> {
    const AccessToken = require("twilio").jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioApiKey = process.env.TWILIO_API_KEY_SID;
    const twilioApiSecret = process.env.TWILIO_API_SECRET;
    const outgoingApplicationSid = process.env.TWILIO_DESKTOP_APPLICATION_SID;
    const identity: string = fedId;
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid,
      incomingAllow: true,
    });

    const token = new AccessToken(
      twilioAccountSid,
      twilioApiKey,
      twilioApiSecret,
      { identity, ttl: DEFAULT_TOKEN_LENGTH }
    );
    token.addGrant(voiceGrant);

    return token.toJwt();
  },
};
