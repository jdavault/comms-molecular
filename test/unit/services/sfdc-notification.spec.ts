"use strict";

import ServiceSchema from "../../../services/sfdc-notification.service";
import {
	NOTIFICATION_SENT,
	NOTIFICATION_ERROR,
} from "../../../services/sfdc-notification.service";

import { ServiceBroker, Context } from "moleculer";

const testNotification = {
  recipientIds: ["0050R00000XXXXXXXX"],
  title: "Custom Notification",
  body: "This is a custom notification.",
  targetId: "0170R00009XXXXXXXX",
};

const testResSuccess = [
	{
		actionName: "customNotificationAction",
		isSuccess: true,
		outputValues: {
			SuccessMessage:
				"Your custom notification is processed successfully.",
		},
	},
];

const testResFail = [
	{
		actionName: "customNotificationAction",
		errors: [
			{
				statusCode: "INVALID_ARGUMENT_TYPE",
				message: "Invalid parameter value for: targetId",
			},
		],
		isSuccess: false,
	},
];

describe("Test 'sfdc-notification service' ", () => {
	const broker = new ServiceBroker({ logger: false });
	const service = broker.createService(ServiceSchema);

	beforeAll(() => broker.start());
	afterAll(() => broker.stop());

	describe("Test 'sfdc-notification.sendNotification' ", () => {
		afterEach(() => {
			jest.clearAllMocks();
		});

		it("should emit a sfdc-notification.sent event when successful", async () => {
			jest.spyOn(Context.prototype, "emit");

			const mockClient = jest.fn(() => {
				return {
					request: jest.fn((body, callback) => {
						callback(null, testResSuccess);
						return testResSuccess;
					}),
				};
			});

			service.getClient = mockClient;

			const res = await broker.call(
				"v1.sfdc-notification.sendNotification",
				testNotification
			);

			expect(res).toBe(testResSuccess);
			expect(mockClient.mock.calls.length).toBe(1);
			expect(Context.prototype.emit).toBeCalledTimes(1);
			expect(Context.prototype.emit).toHaveBeenCalledWith(
				NOTIFICATION_SENT,
				testResSuccess
			);
		});

		it("should emit a sfdc-notification.error event on failure", async () => {
			jest.spyOn(Context.prototype, "emit");

			const mockClient = jest.fn(() => {
				return {
					request: jest.fn((body, callback) => {
						callback(testResFail, null);
						return testResFail;
					}),
				};
			});

			service.getClient = mockClient;

			await expect(
				broker.call(
					"v1.sfdc-notification.sendNotification",
					testNotification
				)
			).rejects.toThrow(NOTIFICATION_ERROR);
			
			expect(mockClient.mock.calls.length).toBe(1);
			expect(Context.prototype.emit).toBeCalledTimes(1);
			expect(Context.prototype.emit).toHaveBeenCalledWith(
				NOTIFICATION_ERROR,
				testResFail
			);
		});
	});
});
