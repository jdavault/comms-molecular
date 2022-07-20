// / Third-party
import { Context, Errors, Service, ServiceBroker } from "moleculer";
import { v4 as uuidv4 } from "uuid";

// First-party
import twilio from "twilio";
import AuthenticateTwilio from "../../mixins/authenticate-twilio";
import twilioClientService from "../../mixins/twilio-client.service";
import OrchestratorCloudEvent from "../models/OrchestratorCloudEvent";
import {
  PUB_SUB_VOICE,
  CALL_DIRECTION,
  INBOUND_CALL_WAIT_URL,
  USER_LABEL,
  INBOUND_CALL_WAIT_MESSAGE,
  METHOD_TYPES,
  STATUS_CALLBACK_EVENT_TYPES,
} from "./voice.constants";
import {
  InboundConferenceStatusEvent,
  OutboundConferenceStatusEvent,
  OutboundCallEvent,
} from "./voice.models";
import inboundHandler from "./inbound/inbound.handler";
import amdStatusHandler from "./callbacks/amdStatus.handler";
import sfStatusHandler from "./callbacks/sfStatus.handler";
import generateOutboundStatusCallbackURL from "./callbacks/generateOutboundStatusCallback";
import handleCallTransfer from "./transfer/callTransfer.handler";

const baseURL = process.env.APP_URL;
const VoiceResponse = twilio.twiml.VoiceResponse;
export default class VoiceService extends Service {
  public constructor(public broker: ServiceBroker) {
    super(broker);
    this.parseServiceSchema({
      name: "voice",
      version: "v1",
      mixins: [AuthenticateTwilio, twilioClientService],
      actions: {
        inboundCall: {
          rest: {
            path: "/inbound",
            method: "POST",
            params: {
              From: "string",
              To: "string",
              CallSid: "string",
              Direction: "string",
              CallType: "string|optional",
            },
          },
          async handler(ctx: any) {
            this.actions.startInboundConference(ctx.params);
            return this.callWait(ctx);
          },
        },

        startInboundConference: inboundHandler,

        startOutboundConference: {
          rest: {
            path: "/outbound",
            method: "GET",
            params: {
              customerPhoneNumber: { type: "number", min: 10 },
              userNumber: { type: "number", min: 10 },
              userSfId: "string",
              userName: "string",
              clientSfId: "string",
              clientName: "string",
              customerType: "string",
            },
          },
          async handler(ctx) {
            const params = ctx.params as OutboundCallEvent;
            const customer = await this.broker.call("v1.sfdc-query.retrieveCustomers", { phoneNumber: params.CustomerPhoneNumber });
            return this.addAgentToOutboundConference({
              ctx,
              agentLabel: `user:${params.UserName}:${params.UserFedId}`,
            },
              customer?.relatedSurgeonSfId
            );
          },
        },

        /*
         * Conference Callbacks are a primary means for call orchestration.
         * Most calls will be managed purely by Conference callback events once all participants make it in the conference.
         * Other callbacks like '/amd/status' are used to manage pre-conferenced calls for things like voicemail handling.
         */
        inboundConferenceCallback: {
          rest: "/inbound/conference/status",
          async handler(ctx) {
            const params = ctx.params as InboundConferenceStatusEvent;
            switch (params.StatusCallbackEvent) {
              case "conference-end": {
                const voiceTask = {
                  Direction: CALL_DIRECTION.INBOUND,
                  CallStatus: params.StatusCallbackEvent,
                  CustomerType: params.CustomerType.replaceAll("_", " "),
                  CustomerPhoneNumber: params.CustomerPhoneNumber,
                  ClientName: params.ClientName.replaceAll("_", " "),
                  ClientSfId: params.ClientSfId,
                  UserFedId: params.UserFedId,
                  UserPhoneNumber: params.UserPhoneNumber,
                  UserName: params.UserName.replaceAll("_", " "),
                  UserSfId: params.UserSfId,
                  PrimaryContactFedId: params.PrimaryContactFedId,
                  RelatedSurgeonSfId: params.RelatedSurgeonSfId,
                };

                this.broadcastPubSubMessage(
                  voiceTask,
                  PUB_SUB_VOICE.VOICE_COMPLETED
                );
                break;
              }
              case "participant-join": {
                if (
                  params.ParticipantLabel &&
                  params.ParticipantLabel.includes(USER_LABEL)
                ) {
                  await this.schema
                    .getClient()
                    .calls(params.ClientCallSid)
                    .update({
                      twiml: (function ({ label, name }) {
                        ctx.meta.$responseType = "text/xml";
                        const response = new VoiceResponse();
                        const dial = response.dial();
                        dial.conference(
                          {
                            participantLabel: label,
                            endConferenceOnExit: true,
                          },
                          name
                        );
                        return response.toString();
                      })({
                        label: `client:${params.ClientName}:${params.CustomerType}:${params.ClientSfId}`,
                        name: params.FriendlyName,
                      }),
                    });
                }
                break;
              }
              case "participant-leave": {
                this.logger.trace("Participant Leave: ");
                this.logger.debug(ctx.params);
                // Additional code in here for future stories
                break;
              }
              default:
                this.logger.warn(
                  `Untracked Conference Status Event: ${params.StatusCallbackEvent} for conference ${params.ConferenceSid}`
                );
            }
          },
        },

        /*
         * Conference Callbacks are a primary means for call orchestration.
         * Most calls will be managed purely by Conference callback events once all participants make it in the conference.
         * Other callbacks like '/amd/status' are used to manage pre-conferenced calls for things like voicemail handling.
         */
        outboundConferenceCallback: {
          rest: "/outbound/conference/status",
          async handler(ctx) {
            const params = ctx.params as OutboundConferenceStatusEvent;
            switch (params.StatusCallbackEvent) {
              case "conference-end": {
                const voiceTask = {
                  Direction: CALL_DIRECTION.OUTBOUND,
                  CallStatus: params.StatusCallbackEvent,
                  CustomerType: params.CustomerType.replaceAll("_", " "),
                  CustomerPhoneNumber: params.CustomerPhoneNumber,
                  To: params.CustomerPhoneNumber,
                  ClientName: params.ClientName.replaceAll("_", " "),
                  ClientSfId: params.ClientSfId,
                  UserPhoneNumber: params.UserPhoneNumber,
                  UserName: params.UserName.replaceAll("_", " "),
                  UserSfId: params.UserSfId,
                  UserFedId: params.UserFedId,
                  RelatedSurgeonSfId: params?.RelatedSurgeonSfId,
                };

                this.broadcastPubSubMessage(
                  voiceTask,
                  PUB_SUB_VOICE.VOICE_COMPLETED
                );
                break;
              }
              case "participant-join": {
                if (params.ParticipantLabel.includes(USER_LABEL)) {
                  await this.schema
                    .getClient()
                    .conferences(params.ConferenceSid)
                    .participants.create({
                      from: params.AliasPhoneNumber,
                      to: params.CustomerPhoneNumber,
                      label: `client:${params.ClientName}:${params.CustomerType}:${params.ClientSfId}`,
                      conferenceStatusCallback: `\
${baseURL}/v1/voice/outbound/conference/status\
?CustomerPhoneNumber=${params.CustomerPhoneNumber}\
&AliasPhoneNumber=${params.AliasPhoneNumber}\
&UserSfId=${params.UserSfId}\
&UserName=${params.UserName}\
&ClientSfId=${params.ClientSfId}\
&ClientName=${params.ClientName}\
&CustomerType=${params.CustomerType}\
&UserPhoneNumber=${params.UserPhoneNumber}\
&RelatedSurgeonSfId=${params?.RelatedSurgeonSfId}`,
                      conferenceStatusCallbackMethod: "POST",
                      conferenceStatusCallbackEvent: ["join", "leave", "end"],
                      endConferenceOnExit: true,
                    });
                }
                break;
              }
              case "participant-leave": {
                this.logger.trace("Participant Leave: ");
                // Additional code in here for future stories possibly
                break;
              }
              default:
                this.logger.warn(
                  `Untracked Conference Status Event: ${params.StatusCallbackEvent} for conference ${params.ConferenceSid}`
                );
            }
          },
        },

        /*
         * Handles Automatic Machine detection status updates.
         * This is core to voicemail detection and post detection call orchestration.
         * Handles both inbound and outbound calls.
         */
        amdStatus: {
          rest: "/amd/status",
          handler: amdStatusHandler,
        },

        statusCallback: {
          rest: "/sf/status",
          handler: sfStatusHandler,
        },

        endCall: {
          rest: "/conference/endCall",
          async handler(ctx) {
            ctx.meta.$responseType = "text/xml";
            const twiml = new VoiceResponse();
            twiml.hangup();
            return twiml.toString();
          },
        },

        transferCall: {
          rest: {
            path: "/conference/transfer",
            method: "POST",
            params: {
              twilioNumber: "string",
              transfereeSfId: "string",
            },
          },
          handler: handleCallTransfer,
        },

        inititateOutboundCall: {
          rest: {
            path: "/outbound/initiateCall",
            method: "POST",
            params: {
              userNumber: "string",
              userSfId: "string",
              userFedId: "string",
              userName: "string",
              clientSfId: "string",
              clientName: "string",
              customerType: "string",
              customerPhoneNumber: "string",
              aliasNumber: "string",
            },
          },
          async handler(ctx) {
            const params = ctx.params as OutboundCallEvent;
            this.logger.debug(
              `Creating outbound call from ${params.UserName} to ${params.ClientName}`
            );

            const customer = await this.broker.call("v1.sfdc-query.retrieveCustomers", { phoneNumber: params.CustomerPhoneNumber });
            const conferenceName = uuidv4().replaceAll("-", "");
            const result = await this.schema
              .getClient()
              .conferences(conferenceName)
              .participants.create({
                from: params.AliasNumber,
                to: params.UserNumber,
                label: `user:${params.UserName}:${params.UserFedId}`,
                conferenceStatusCallback:
                  generateOutboundStatusCallbackURL.call(this, params, customer?.relatedSurgeonSfId),
                conferenceStatusCallbackEvent: [
                  STATUS_CALLBACK_EVENT_TYPES.JOIN,
                  STATUS_CALLBACK_EVENT_TYPES.LEAVE,
                  STATUS_CALLBACK_EVENT_TYPES.END,
                ],
                conferenceStatusCallbackMethod: METHOD_TYPES.GET,
                endConferenceOnExit: true,
                startConferenceOnEnter: true,
              });
            this.logger.trace("Outbound call handling completed");
            this.logger.debug(result);
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
        callWait(ctx) {
          ctx.meta.$responseType = "text/xml";
          const response = new VoiceResponse();
          response.say({ voice: "Polly.Salli" }, INBOUND_CALL_WAIT_MESSAGE);
          response.play({ loop: 1 }, INBOUND_CALL_WAIT_URL);
          response.say(
            { voice: "Polly.Salli" },
            "We were unable to connect you to your expected contact. Please try again later."
          );
          this.logger.debug("Inbound caller being put on call wait...");
          this.logger.debug(response.toString());
          return response.toString();
        },
        addAgentToOutboundConference({ ctx, agentLabel }, relatedSurgeonSfId?: string) {
          ctx.meta.$responseType = "text/xml";
          const twiml = new VoiceResponse();
          const dial = twiml.dial();
          const callbackUri = generateOutboundStatusCallbackURL.call(
            this,
            ctx.params,
            relatedSurgeonSfId
          );
          dial.conference(
            {
              endConferenceOnExit: true,
              participantLabel: `${agentLabel}`,
              statusCallback: encodeURI(callbackUri),
              statusCallbackMethod: "GET",
              statusCallbackEvent: ["join", "leave", "end"],
            },
            agentLabel
          );

          return twiml.toString();
        },
      },
    });
  }
}
