// Third-party
import { Errors, Service, ServiceBroker } from "moleculer";

// First-party
import axios from "axios";
import { SFDCAuthService } from "../../mixins/sfdc-auth.mixin";
import twilioClientService from "../../mixins/twilio-client.service";
import { PUB_SUB_VOICE, SURGEON, UNID_CONTACT } from "../voice/voice.constants";
import { PUB_SUB_CHAT } from "../chat/chat.constants";
import OrchestratorCloudEvent from "../models/OrchestratorCloudEvent";
import { PUB_SUB_VOICEMAIL } from "../constants/voicemail.constants";
import { VoicemailTaskRecord } from "../models/VoicemailSchemas";
import { ParticipantType } from "../chat/chat.models";
import { VOICEMAIL_ACTIVITY_CREATED } from "../constants/sfdc-tasks.constants";

/**
 * Handlers
 */
import createChatTaskHandler from "./createChatTask.handler";
import emitNotificationHandler from "./emitNotification.handler";


const MEDICREA_TASK_ERROR: string = "medicrea.task.error";
const enum TASK_TYPE {
  VOICE = "voice",
  VOICEMAIL = "voicemail",
  VOICEMAIL_STARTED = "voicemailStarted",
}

export default class SFDCTasksService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker);
    this.parseServiceSchema({
      name: "sfdc-tasks",
      version: "v1",
      mixins: [SFDCAuthService, twilioClientService],
      actions: {
        /**
         * Create Salesforce Task for Surgeon (WhoId) and Unid Contact (WhatId)
         */
        createChatTask: createChatTaskHandler,

        createVoiceTask: {
          async handler(ctx): Promise<any> {
            const conn = await this.getClient();
            const {
              Direction: callDirection,
              CallStatus: callStatus,
              CustomerType: customerType,
              CustomerPhoneNumber: customerNumber,
              ClientName: customerName,
              ClientSfId: customerId,
              UserPhoneNumber: internalUserNumber,
              UserName: internalUserName,
              UserFedId: userFedId,
              UserSfId: userSfId,
            } = ctx.params.data;

            if (
              customerType === "Surgeon" ||
              customerType === "Unid Contact" ||
              customerType === "Unknown"
            ) {
              let res;
              const subjectText = this.generateSubjectText(
                false,
                callDirection,
                internalUserName,
                TASK_TYPE.VOICE,
                customerName.replaceAll("_", " "),
                ctx.params.data?.RelatedSurgeonSfId
              );
              const descriptionText = this.generateVoiceDescriptionText(
                false,
                callDirection,
                customerName,
                customerNumber,
                internalUserName,
                internalUserNumber
              );
              const taskPayload = this.generateTaskPayload(
                customerId,
                subjectText,
                descriptionText,
                customerType.toLowerCase() === "unknown" ? customerNumber : "",
                customerType,
                userSfId,
                ctx.params.data?.RelatedSurgeonSfId
              );

              try {
                res = await conn.sobject("Task").create(taskPayload);
              } catch (e) {
                this.logger.error("Cannot create task: " + e.message);
                this.processError(e, callStatus);
                throw new Error(e.message);
              }
              return res;
            }
          },
        },

        createVoiceErrorTask: {
          async handler(ctx): Promise<any> {
            const conn = await this.getClient();
            const {
              Direction: callDirection,
              CallStatus: callStatus,
              CustomerType: customerType,
              CustomerPhoneNumber: customerNumber,
              ClientName: customerName,
              ClientSfId: customerId,
              UserPhoneNumber: internalUserNumber,
              UserName: internalUserName,
              UserFedId: userFedId,
              UserSfId: userSfId,
            } = ctx.params.data;

            let res;
            const subjectText = this.generateSubjectText(
              true,
              callDirection,
              internalUserName,
              TASK_TYPE.VOICE,
              customerName.replaceAll("_", " "),
              ctx.params.data?.RelatedSurgeonSfId
            );
            const descriptionText = this.generateVoiceDescriptionText(
              true,
              callDirection,
              customerName,
              customerNumber,
              internalUserName,
              internalUserNumber
            );

            const taskPayload = this.generateTaskPayload(
              customerId,
              subjectText,
              descriptionText,
              customerType.toLowerCase() === "unknown" ? customerNumber : "",
              customerType,
              userSfId,
              ctx.params.data?.RelatedSurgeonSfId
            );

            try {
              res = await conn.sobject("Task").create(taskPayload);
            } catch (e) {
              this.logger.error("Cannot create task: " + e.message);
              this.processError(e, callStatus);
              throw new Error(e.message);
            }
            return res;
          },
        },
        createVoicemailErrorTask: {
          async handler(ctx: any): Promise<any> {
            const conn = await this.getClient();
            const {
              CustomerName,
              CustomerSfId,
              CustomerType,
              UserName,
              UserSfId,
              Direction,
              TranscriptionText,
              RecordingSid,
              RecordingUrl,
              RelatedSurgeonSfId,
            } = ctx.params.data as VoicemailTaskRecord;
            const customerType = CustomerType.replaceAll("_", " ");
            if (
              customerType === ParticipantType.Surgeon ||
              customerType === ParticipantType.Unid ||
              customerType === ParticipantType.Unknown
            ) {
              let res;
              const subjectText = this.generateSubjectText(
                true,
                Direction,
                UserName.replaceAll("_", " "),
                TASK_TYPE.VOICEMAIL,
                CustomerName.replaceAll("_", " "),
                RelatedSurgeonSfId
              );
              const descriptionText =
                this.generateVoicemailDescriptionText(TranscriptionText);

              const taskPayload = this.generateTaskPayload(
                CustomerSfId,
                subjectText,
                descriptionText,
                "", // CustomerPhoneNumber, uneeded for VM
                customerType,
                UserSfId,
                RelatedSurgeonSfId
              );

              try {
                res = await conn.sobject("Task").create(taskPayload);

                if (res.success) {
                  this.createVoicemailAttachment(
                    RecordingUrl,
                    res.id,
                    RecordingSid,
                    UserSfId,
                    descriptionText
                  );

                  const notification: any = {
                    recipientIds: [UserSfId],
                    title: this.generateVoicemailNotificationSubjectText(
                      CustomerName.replaceAll("_", " ")
                    ),
                    body: descriptionText,
                    targetId: res.id,
                  };
                  const notificationEvent = new OrchestratorCloudEvent({
                    type: `${VOICEMAIL_ACTIVITY_CREATED}.${this.version}`,
                    data: notification,
                  });
                  this.broker.emit(
                    VOICEMAIL_ACTIVITY_CREATED,
                    notificationEvent
                  );
                }
              } catch (e) {
                this.logger.error("Cannot create voicemail task: " + e.message);
                this.processError(e, PUB_SUB_VOICEMAIL.COMPLETED);
              }
              return res;
            }
          },
        },
        createVoicemailStarted: {
          async handler(ctx: any): Promise<any> {
            const conn = await this.getClient();
            const {
              CallDirection: callDirection,
              CallStatus: callStatus,
              CustomerType,
              UserName,
              UserSfId,
              Direction,
              CustomerName,
              RelatedSurgeonSfId,
              customerNumber,
              customerName,
              CustomerId: customerId,
              internalUserNumber,
              internalUserName,
              UserFedId: userFedId,
              UserSfId: userSfId,
            } = ctx.params.data;

            const customerType = CustomerType.replaceAll("_", " ");
            let res;
            const subjectText = this.generateSubjectText(
              false,
              Direction,
              UserName != null ? UserName.replaceAll("_", " ") : "",
              TASK_TYPE.VOICEMAIL_STARTED,
              CustomerName != null ? CustomerName.replaceAll("_", " ") : "",
              RelatedSurgeonSfId
            );
            const descriptionText = "Voicemail conversation started...";
            console.log(customerId);
            const taskPayload = this.generateTaskPayload(
              customerId,
              subjectText,
              descriptionText,
              "", // CustomerPhoneNumber, uneeded for VM
              customerType,
              UserSfId,
              RelatedSurgeonSfId
            );
            try {
              res = await conn.sobject("Task").create(taskPayload);
            } catch (e) {
              this.logger.error("Cannot create voicemail task: " + e.message);
              this.processError(e, PUB_SUB_VOICEMAIL.COMPLETED);
            }
            return res;
          },
        },
        createVoicemailTask: {
          async handler(ctx: any): Promise<any> {
            const conn = await this.getClient();
            const {
              CustomerName,
              CustomerSfId,
              CustomerType,
              UserName,
              UserSfId,
              Direction,
              TranscriptionText,
              RecordingSid,
              RecordingUrl,
              RelatedSurgeonSfId,
            } = ctx.params.data as VoicemailTaskRecord;
            const customerType = CustomerType.replaceAll("_", " ");
            if (
              customerType === ParticipantType.Surgeon ||
              customerType === ParticipantType.Unid ||
              customerType === ParticipantType.Unknown
            ) {
              let res;
              const subjectText = this.generateSubjectText(
                false,
                Direction,
                UserName.replaceAll("_", " "),
                TASK_TYPE.VOICEMAIL,
                CustomerName.replaceAll("_", " "),
                RelatedSurgeonSfId
              );
              const descriptionText =
                this.generateVoicemailDescriptionText(TranscriptionText);

              const taskPayload = this.generateTaskPayload(
                CustomerSfId,
                subjectText,
                descriptionText,
                "", // CustomerPhoneNumber, uneeded for VM
                customerType,
                UserSfId,
                RelatedSurgeonSfId
              );

              try {
                res = await conn.sobject("Task").create(taskPayload);

                if (res.success) {
                  this.createVoicemailAttachment(
                    RecordingUrl,
                    res.id,
                    RecordingSid,
                    UserSfId,
                    descriptionText
                  );

                  const notification: any = {
                    recipientIds: [UserSfId],
                    title: this.generateVoicemailNotificationSubjectText(
                      CustomerName.replaceAll("_", " ")
                    ),
                    body: descriptionText,
                    targetId: res.id,
                  };
                  const notificationEvent = new OrchestratorCloudEvent({
                    type: `${VOICEMAIL_ACTIVITY_CREATED}.${this.version}`,
                    data: notification,
                  });
                  this.broker.emit(
                    VOICEMAIL_ACTIVITY_CREATED,
                    notificationEvent
                  );
                }
              } catch (e) {
                this.logger.error("Cannot create voicemail task: " + e.message);
                this.processError(e, PUB_SUB_VOICEMAIL.COMPLETED);
              }
              return res;
            }
          },
        },
        retrieveTaskSubjects: {
          async handler(ctx): Promise<any> {
            try {
              const conn = await this.getClient();
              const response = await conn.sobject("Task").describe();
              return response.fields
                .filter((o: any) => o.name === "Subject")[0]
                .picklistValues.map((s: any) => s.value);
            } catch (error) {
              throw new Error(error);
            }
          },
        },
      },
      events: {
        async [PUB_SUB_CHAT.DELIVERED](message: OrchestratorCloudEvent) {
          this.logger.trace("delivered chat event obtained");

          try {
            const newSFTask = await this.broker.call(
              "v1.sfdc-tasks.createChatTask",
              message
            );

            if (!newSFTask.success)
              throw new Errors.MoleculerError("could not create task");

            this.emitNotification(newSFTask, message);
          } catch (e) {
            this.logger.error(e);
            this.processError(e, PUB_SUB_CHAT.MMS_DELIVERED);
          }
        },
        async[PUB_SUB_VOICE.VOICE_COMPLETED](message: unknown) {
          this.logger.trace("voice completed");
          try {
            await this.broker.call("v1.sfdc-tasks.createVoiceTask", message);
          } catch (e) {
            this.logger.error(e);
            this.processError(e, PUB_SUB_VOICE.VOICE_COMPLETED);
          }
        },
        async[PUB_SUB_VOICE.VOICE_ERROR](message: unknown) {
          this.logger.trace("voice call failed to connect");
          try {
            await this.broker.call("v1.sfdc-tasks.createVoiceErrorTask", message);
          } catch (e) {
            this.logger.error(e);
            this.processError(e, PUB_SUB_VOICE.VOICE_ERROR);
          }
        },
        async[PUB_SUB_VOICEMAIL.COMPLETED](message: OrchestratorCloudEvent) {
          this.logger.trace("voicemail completed");
          try {
            await this.broker.call(
              "v1.sfdc-tasks.createVoicemailTask",
              message
            );
          } catch (e) {
            this.logger.error(e);
            this.processError(e, PUB_SUB_VOICEMAIL.COMPLETED);
          }
        },
        async[PUB_SUB_VOICEMAIL.FAILED](message: OrchestratorCloudEvent) {
          this.logger.trace("voicemail failed to complete");
          try {
            await this.broker.call(
              "v1.sfdc-tasks.createVoicemailErrorTask",
              message
            );
          } catch (e) {
            this.logger.error(e);
            this.processError(e, PUB_SUB_VOICEMAIL.FAILED);
          }
        },
        async[PUB_SUB_VOICEMAIL.STARTED](message: OrchestratorCloudEvent) {
          this.logger.trace("voicemail failed to complete");
          try {
            await this.broker.call(
              "v1.sfdc-tasks.createVoicemailStarted",
              message
            );
          } catch (e) {
            this.logger.error(e);
            this.processError(e, PUB_SUB_VOICEMAIL.STARTED);
          }
        },
      },
      methods: {
        /**
         * Notify users in Salesforce of Task creation
         */
        emitNotification: emitNotificationHandler,

        processError(error: unknown, eventType: string) {
          this.broker.emit(MEDICREA_TASK_ERROR, {
            type: `${eventType}.${this.version}`,
            data: {
              error,
            },
          });
        },
        generateSubjectText(
          isError: boolean,
          callDirection: string,
          internalUser: string,
          subjectType: TASK_TYPE,
          customerName?: string,
          relatedSurgeonSfId?: string,
        ) {
          const taskDateTime = new Date();
          const taskDateText = taskDateTime.toLocaleDateString("en-US", {
            timeZone: "America/New_York",
          });
          const taskTimeText = taskDateTime.toLocaleTimeString("en-US", {
            timeZone: "America/New_York",
          });
          let subject;
          let message = `An ${callDirection} call took place between`;
          if (isError) {
            message = `Missed ${callDirection} call between`;
          }
          if (subjectType === TASK_TYPE.VOICE) {
            subject = (relatedSurgeonSfId !== 'undefined')
              ? `${message} ${customerName} and ${internalUser} on ${taskDateText} at ${taskTimeText}.`
              : `${message} ${internalUser} on ${taskDateText} at ${taskTimeText}.`;
          } else if (subjectType === TASK_TYPE.VOICEMAIL_STARTED) {
            subject = `A voicemail was initiated between ${internalUser} and ${customerName} on ${taskDateText} at ${taskTimeText}.`;
          } else {
            subject = (relatedSurgeonSfId !== 'undefined')
              ? `A voicemail was left for ${internalUser} by ${customerName} on ${taskDateText} at ${taskTimeText}.`
              : `A voicemail was left for ${internalUser} on ${taskDateText} at ${taskTimeText}.`;
          }

          return subject;
        },
        generateVoicemailNotificationSubjectText(customerName: string) {
          return `${customerName} left you a voicemail.`;
        },
        generateVoiceDescriptionText(
          isError: boolean,
          callDirection: string,
          customerName: string,
          customerNumber: string,
          internalUserName: string,
          internalUserNumber: string
        ) {

          let message = `An ${callDirection} call took place between`;
          if (isError) {
            message = `Missed ${callDirection} call between`;
          }

          return `${message} ${customerName} (${customerNumber}) and ${internalUserName} (${internalUserNumber}).`;
        },
        generateVoicemailDescriptionText(transcriptionText: string) {
          const maxLength = 254;
          let voicemailDescription =
            transcriptionText != null
              ? transcriptionText
              : "No transcript available";

          if (voicemailDescription.length > 254) {
            voicemailDescription =
              voicemailDescription.substring(0, maxLength - 3) + "...";
          }
          return voicemailDescription;
        },
        generateTaskPayload(
          customerId: string,
          subjectText: string,
          descriptionText: string,
          phoneNumber: string,
          customerType: string,
          userSfId: string,
          relatedSurgeonSfId?: string
        ) {
          const payload = {} as any;

          payload.Type = "Call";
          payload.Subject = subjectText;
          payload.Activity_Detail__c = descriptionText;
          payload.Activity_Phone__c = phoneNumber;
          payload.Status = "Completed";
          payload.ActivityDate = new Date();
          payload.TaskSubtype = "Call";
          payload.OwnerId = userSfId;

          // customerType will be mutually exclusive
          // else customerType === UNKNOWN
          if (customerType === SURGEON) {
            payload.WhoId = customerId;
          }

          if (customerType === UNID_CONTACT) {
            payload.WhatId = customerId;
            if (relatedSurgeonSfId) {
              payload.WhoId = relatedSurgeonSfId;
            }
          }
          return payload;
        },
        async deleteVoicemailFileFromTwilio(recordingSid) {
          try {
            await this.schema.getClient().recordings(recordingSid).remove();
          } catch (e) {
            this.logger.error("ERROR: cannot create task " + e.message);
            this.processError(e, PUB_SUB_VOICEMAIL.COMPLETED);
          }
        },
        async getVoicemailFileFromTwilio(mediaUrl: string): Promise<Buffer> {
          try {
            const responseAxios = await axios.get(mediaUrl, {
              headers: {
                Authorization: this.schema.getBasicAuthHeader(),
              },
              responseType: "arraybuffer",
            });
            return Buffer.from(responseAxios.data, "base64");
          } catch (error) {
            this.logger.error(error);
            return null;
          }
        },
        async createVoicemailAttachment(
          recordingUrl: string,
          parentId: string,
          mediaSid: string,
          userSfId: string,
          descriptionText: string
        ) {
          let res;
          const buffer: Buffer = await this.getVoicemailFileFromTwilio(
            recordingUrl
          );

          if (buffer !== null) {
            const conn = await this.getClient();
            const attachmentCreationObject = {
              Name: mediaSid + ".wav",
              ContentType: "audio/wav",
              Description: descriptionText,
              ParentId: parentId,
              Body: buffer.toString("base64"),
              OwnerId: userSfId,
              IsPrivate: false,
            };

            try {
              res = await conn
                .sobject("Attachment")
                .create(attachmentCreationObject);

              if (res.success) {
                this.deleteVoicemailFileFromTwilio(mediaSid);
              }
            } catch (e) {
              this.logger.error("ERROR: cannot create task " + e.message);
              this.processError(e, PUB_SUB_VOICEMAIL.COMPLETED);
            }
          }
          return res;
        },
      },
    });
  }
}
