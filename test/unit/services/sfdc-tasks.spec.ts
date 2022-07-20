"use strict";

import TasksService from "../../../services/sfdc-tasks/sfdc-tasks.service";
import {
  PUB_SUB_VOICE,
  VOICE_STATUS,
  CALL_DIRECTION,
  SURGEON,
  UNKNOWN,
} from "../../../services/voice/voice.constants";

import { QueryResult } from "jsforce";
import { ServiceBroker } from "moleculer";
import { CustomerRecord } from "../../../services/models/QuerySchemas";

describe("Test 'sfdc-tasks service' ", () => {
  const broker = new ServiceBroker({ logger: false });
  const realBroker = broker.call.bind(broker);

  let mockClient: any;

  const testChatEvent = {
    id: "ae42791b-bbff-4b5e-ae12-068c53c344c9",
    time: "2021-10-04T17:12:18.963Z",
    type: "medicrea.chat.inbound.v1",
    source: "urn:com:medicrea:via:orchestrator",
    specversion: "1.0.1",
    datacontenttype: "application/json",
    data: {
      ToCountry: "US",
      ToState: "IA",
      SmsMessageSid: "SMe7d817e20a1d294ba7e21bdf2e87441b",
      NumMedia: "0",
      ToCity: "MUSCATINE",
      FromZip: "78232",
      SmsSid: "SMe7d817e20a1d294ba7e21bdf2e87441b",
      FromState: "TX",
      SmsStatus: "received",
      FromCity: "SAN ANTONIO",
      Body: "Blah",
      FromCountry: "US",
      To: "+15636075966",
      MessagingServiceSid: "MG344318249d1144b4dbad9effa4904abe",
      ToZip: "52761",
      NumSegments: "1",
      MessageSid: "SMe7d817e20a1d294ba7e21bdf2e87441b",
      AccountSid: "AC11947859c8448f9015066e4d6d9858bf",
      From: "+12102867939",
      ApiVersion: "2010-04-01",
      type: "lab-team",
      CaseId: "8675309",
      subject: "Test chat task",
      contactPerson: { customerType: "Surgeon", sfId: "0050R00000A28pYQAR" },
    },
  };

  const testVoiceInboundEvent = {
    id: "ae42791b-bbff-4b5e-ae12-068c53c344c9",
    time: "2021-10-04T17:12:18.963Z",
    type: "medicrea.voice.inbound.v1",
    source: "urn:com:medicrea:via:orchestrator",
    specversion: "1.0.1",
    datacontenttype: "application/json",
    data: {
      AccountSid: "AC12345678",
      ApiVersion: "2010.04.01",
      CallSid: "CA12345678",
      CallStatus: "completed",
      CustomerType: "Surgeon",
      Direction: "inbound",
      CustomerPhoneNumber: "9293233333",
      ClientName: "Dr. Dennis Devito",
      ClientSfId: "0030R00001KE7xKQAT",
      UserPhoneNumber: "9191231234",
      UserName: "John Snow",
      UserFedId: "0050R00000A28pYQAR",
    },
  };

  const testVoiceOutboundEvent = {
    id: "ae42791b-bbff-4b5e-ae12-068c53c344c9",
    time: "2021-10-04T17:12:18.963Z",
    type: "medicrea.voice.outbound.v1",
    source: "urn:com:medicrea:via:orchestrator",
    specversion: "1.0.1",
    datacontenttype: "application/json",
    data: {
      AccountSid: "AC12345678",
      ApiVersion: "2010.04.01",
      CallSid: "CA12345678",
      CallStatus: "completed",
      CustomerType: "Surgeon",
      Direction: "outbound",
      CustomerPhoneNumber: "9293233333",
      ClientName: "Dr. Dennis Devito",
      ClientSfdId: "0030R00001KE7xKQAT",
      UserPhoneNumber: "9191231234",
      UserName: "John Snow",
      UserFedId: "0050R00000A28pYQAR",
    },
  };

  const testRes = {
    id: "test",
    success: true,
    errors: [],
  } as unknown;

  const taskService = broker.createService(TasksService);

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());

  describe("Test 'sfdc-tasks.createChatTask' ", () => {
    const record: CustomerRecord = {
      totalSize: 1,
      done: true,
      type: SURGEON,
      records: [
        {
          attributes: [Object],
          Id: "0030R00001KE7vsQAD",
          Name: "Adam Shimer",
          Phone: "4342435432",
          FederationIdentifier: "shimera34",
          Assigned_LAB_Engineer__c: "0030R00001KE7vsQAD",
          Handles_Texts_for_UNiD_Contact__c: "0030R00001KE7vsQAD",
        },
      ],
    };
    describe("Test 'sfdc-tasks.createChatTask' ", () => {
      const record: QueryResult<any> = {
        totalSize: 1,
        done: true,
        records: [
          {
            attributes: [Object],
            Id: "0030R00001KE7vsQAD",
            Name: "Adam Shimer",
            Phone: "4342435432",
          },
        ],
      };

      afterEach(() => {
        jest.clearAllMocks();
      });

      it("should create a task", async () => {
        mockClient = jest.fn(() => {
          return {
            sobject: () => {
              return {
                create: jest.fn().mockImplementation(() => {
                  return testRes;
                }),
              };
            },
          };
        });

        taskService.getClient = mockClient;

        const res = await broker.call(
          "v1.sfdc-tasks.createChatTask",
          testChatEvent
        );

        expect(res).toBe(testRes);
      });
    });

    describe("Test Inbound 'sfdc-tasks.createVoiceTask' ", () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it("should create a task", async () => {
        mockClient = jest.fn(() => {
          return {
            sobject: () => {
              return {
                create: jest.fn().mockImplementation(() => {
                  return testRes;
                }),
              };
            },
          };
        });

        taskService.getClient = mockClient;

        const res = await broker.call(
          "v1.sfdc-tasks.createVoiceTask",
          testVoiceInboundEvent
        );

        expect(res).toBe(testRes);
      });
    });

    describe("Test Outbound 'sfdc-tasks.createVoiceTask' ", () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it("should create a task", async () => {
        mockClient = jest.fn(() => {
          return {
            sobject: () => {
              return {
                create: jest.fn().mockImplementation(() => {
                  return testRes;
                }),
              };
            },
          };
        });

        taskService.getClient = mockClient;

        const res = await broker.call(
          "v1.sfdc-tasks.createVoiceTask",
          testVoiceOutboundEvent
        );
        expect(res).toBe(testRes);
      });
    });

    describe("Test " + PUB_SUB_VOICE.VOICE_COMPLETED + "events", () => {
      const broker = new ServiceBroker({ logger: false });
      const service = broker.createService(TasksService);
      let voiceMessage = {
        id: "dfa7cc70-4826-413c-b753-a73505e9abe0",
        time: "2021-10-29T12:50:31.802Z",
        type: "medicrea.voice.ringing.v1",
        source: "urn:com:medicrea:via:orchestrator",
        specversion: "1.0.1",
        datacontenttype: "application/json",
        data: {
          AccountSid: "AC9d82026049189f22ff76fd93f65ef71d",
          ApiVersion: "2010-04-01",
          CallSid: "CAf9063586ec58494e81dc60cbffd8c27b",
          CallStatus: VOICE_STATUS.COMPLETED,
          Called: "8005551234",
          CalledCountry: "US",
          CalledCity: "RICHMOND",
          CalledState: "VA",
          CalledZip: "23221",
          Caller: "8005554321",
          CallerCity: "RALEIGH",
          CallerCountry: "US",
          CallerState: "NC",
          Direction: CALL_DIRECTION.INBOUND,
          FromCity: "RALEIGH",
          From: "9196106961",
          FromState: "NC",
          To: "8005551234",
          FromZip: "52761",
          FromCountry: "US",
          StirPassportToken:
            "eyJhbGciOiJFUzI1NiIsInBwdCI6InNoYWtlbiIsInR5cCI6InBhc3Nwb3J0IiwieDV1IjoiaHR0cHM6Ly9zdGkudmVyaXpvbi5jb20vdnp3Y2VydC92enNoYWtlbi0wMi0yMDI0LmNydCJ9.eyJhdHRlc3QiOiJBIiwiZGVzdCI6eyJ0biI6WyIxODcyNDAxNjM0MSJdfSwiaWF0IjoxNjM1NTExODE5LCJvcmlnIjp7InRuIjoiMTkxOTQxMzIwNTUifSwib3JpZ2lkIjoiRkZGRkZGRkYtRkZGRi1GRkZGLUZGRkYtMDEwMTAwMDAwMDAwIn0.0h7CrkXTSVkwVaPXt3jjLmR33_EfAY61G4eLUIeLmaV0XXBZ09Huim6_wYTx-23sO110SAXZ1rMrDPkZ3by6Nw",
          StirVerstat: "TN-Validation-Passed-A",
          CallerZip: "52761",
          ToCity: "RICHMOND",
          ToCountry: "US",
          ToZip: "23221",
          ToState: "VA",
          CustomerType: "Surgeon",
          CustomerPhoneNumber: "9003233333",
          ClientName: "Dr. Dennis",
          ClientSfId: "0030R00001KE7xKQAT",
          UserPhoneNumber: "9191231234",
          UserName: "John Snow",
        },
        meta: {},
        requestID: "dc50830d-7e70-465c-9e11-9cfe8ca4a0e4",
        cachedResult: false,
      };

      beforeAll(() => broker.start());
      afterAll(() => broker.stop());
      afterEach(() => {
        jest.clearAllMocks();
      });

      it("should call the inbound action succesfully", async () => {
        const callSpy = jest.spyOn(broker, "call");
        await service.emitLocalEventHandler(
          PUB_SUB_VOICE.VOICE_COMPLETED,
          voiceMessage
        );
        expect(callSpy).toHaveBeenCalledTimes(1);
      });

      it("should call the outbound action succesfully", async () => {
        const callSpy = jest.spyOn(broker, "call");

        voiceMessage.data.Direction = CALL_DIRECTION.OUTBOUND;
        voiceMessage.data.To = "9003233333";
        voiceMessage.data.From = "8005551234";

        await service.emitLocalEventHandler(
          PUB_SUB_VOICE.VOICE_COMPLETED,
          voiceMessage
        );
        expect(callSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe("Test generating payload for surgeon", () => {
      const id = "0030R00001KE7xNQAT";
      const payload = taskService.generateTaskPayload(
        id,
        "Test Subject",
        "Test Description",
        "Surgeon",
        "0050R00000A28pYQAR"
      );
      expect(payload.WhoId).toEqual(id);
    });

    describe("Test generating payload for Unid Contact", () => {
      const id = "a0P0R000003GumFUAS";
      const payload = taskService.generateTaskPayload(
        id,
        "Test Subject",
        "Test Description",
        "Unid_Contact",
        "0050R00000A28pYQAR"
      );
      expect(payload.WhatId).toEqual(id);
    });
  });
});
