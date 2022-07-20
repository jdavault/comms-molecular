"use strict";

import UserService from "../../../services/sfdc-users.service";
import { ServiceBroker } from "moleculer";

describe("Test 'sfdc-users' service", () => {
  const broker = new ServiceBroker({ logger: false });
  const userService = broker.createService(UserService);

  let mockClient: any;

  beforeAll(() => broker.start());
  afterAll(() => broker.stop());

  describe("Test 'sfdc-users.updateUserStatus' ", () => {
    beforeEach(() => {
      mockClient = jest.fn(() => {
        return {
          sobject: () => {
            return {
              update: jest.fn().mockImplementation(() => {}),
            };
          },
        };
      });
      userService.getClient = mockClient;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    const statusUpdateToAvailableEvent = {
      id: "ae42791b-bbff-4b5e-ae12-068c53c344c9",
      status: "DynamicAvailability",
    };
    const statusUpdateToAvailableResponse = (id: string, status: string) => {
      return { msg: `Status for id: ${id} updated to : ${status}` };
    };

    it("Testing Update of user status to 'Available'", async () => {
      statusUpdateToAvailableEvent.status = "Available";
      const res = await broker.call(
        "v1.sfdc-users.updateUserStatus",
        statusUpdateToAvailableEvent
      );
      expect(res).toStrictEqual(
        statusUpdateToAvailableResponse(
          statusUpdateToAvailableEvent.id,
          statusUpdateToAvailableEvent.status
        )
      );
    });

    it("Testing Update of user status to 'Offline'", async () => {
      statusUpdateToAvailableEvent.status = "Offline";
      const res = await broker.call(
        "v1.sfdc-users.updateUserStatus",
        statusUpdateToAvailableEvent
      );
      expect(res).toStrictEqual(
        statusUpdateToAvailableResponse(
          statusUpdateToAvailableEvent.id,
          statusUpdateToAvailableEvent.status
        )
      );
    });

    it("Testing Update of user status to 'Out of Office'", async () => {
      statusUpdateToAvailableEvent.status = "Out of Office";
      const res = await broker.call(
        "v1.sfdc-users.updateUserStatus",
        statusUpdateToAvailableEvent
      );
      expect(res).toStrictEqual(
        statusUpdateToAvailableResponse(
          statusUpdateToAvailableEvent.id,
          statusUpdateToAvailableEvent.status
        )
      );
    });
  });

  describe("'sfdc-users.getUser'", () => {
    const userRecord = {
      Id: "Id_mock",
      FederationIdentifier: "FederationIdentifier_mock",
      Username: "Username_mock",
      User_Role__c: "User_Role__c_mock",
      Name: "Name_mock",
      Twillio__c: "Twillio__c_mock",
      Availability_Status__c: "Availability_Status__c_mock",
    };

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("Testing a getUser request", async () => {
      mockClient = jest.fn(() => {
        return {
          query: jest.fn().mockReturnValueOnce(Promise.resolve(userRecord)),
        };
      });

      userService.getClient = mockClient;

      const res = await broker.call("v1.sfdc-users.getUser", {
        fedId: "a060R00000BEaR9QAL",
      });

      expect(res).toBe(userRecord);
    });
  });
});
