// Third-party
import { Service, ServiceBroker } from "moleculer";

// First-party
import {
  VoicemailRecord,
  VoicemailTaskRecord,
} from "./models/VoicemailSchemas";
import OrchestratorCloudEvent from "./models/OrchestratorCloudEvent";
import { PUB_SUB_VOICEMAIL } from "./constants/voicemail.constants";

export default class VoicemailService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker);
    this.parseServiceSchema({
      name: "voicemail",
      version: "v1",
      actions: {
        completed: {
          rest: {
            path: "/completed",
            method: "POST",
            params: {} as VoicemailRecord,
          },
          async handler(ctx: any) {
            const voicemail = ctx.params as VoicemailRecord;
            this.processVoicemail(voicemail);
          },
        },
      },
      events: {},
      methods: {
        async broadcastPubSubMessage(payload, type) {
          this.logger.debug("broadcasting message: ", type);
          const cloudEvent = new OrchestratorCloudEvent({
            type: `${type}.${this.version}`,
            data: payload,
          });
          this.logger.debug("payload: ", cloudEvent);
          this.broker.emit(type, cloudEvent);
          return cloudEvent;
        },

        processVoicemail(payload: VoicemailRecord) {
          const taskRecord = {} as VoicemailTaskRecord;

          taskRecord.CustomerType = payload.CustomerType;
          taskRecord.CustomerPhoneNumber = payload.CustomerPhoneNumber;
          taskRecord.CustomerName = payload.CustomerName;
          taskRecord.CustomerSfId = payload.CustomerSfId;
          taskRecord.UserPhoneNumber = payload.UserPhoneNumber;
          taskRecord.UserName = payload.UserName;
          taskRecord.UserSfId = payload.UserSfId;
          taskRecord.Direction = payload.Direction;
          taskRecord.CallStatus = payload.CallStatus;
          taskRecord.TranscriptionSid = payload.TranscriptionSid;
          taskRecord.TranscriptionText = payload.TranscriptionText;
          taskRecord.TranscriptionStatus = payload.TranscriptionStatus;
          taskRecord.TranscriptionUrl = payload.TranscriptionUrl;
          taskRecord.RecordingSid = payload.RecordingSid;
          taskRecord.RecordingUrl = payload.RecordingUrl;
          taskRecord.CallSid = payload.CallSid;
          taskRecord.AccountSid = payload.AccountSid;
          taskRecord.UserFedId = payload.UserFedId;
          taskRecord.RelatedSurgeonSfId = payload.RelatedSurgeonSfId;

          this.broadcastPubSubMessage(taskRecord, PUB_SUB_VOICEMAIL.COMPLETED);
        },
      },
    });
  }
}
