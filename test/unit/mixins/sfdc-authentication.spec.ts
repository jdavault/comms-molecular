// Third-party
import fs from "fs";
import * as jwt from "sf-jwt-token";
import { ServiceBroker } from "moleculer";

// First-party
import * as auth from "../../../mixins/sfdc-auth.mixin";

// Not a valid key
// TODO: update tests and other tests to utilize a mock for salesforce.key
const mockKey = `
-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAKBgQC2OjWIP2b8EWVJp8XOwluQbM3TPKcAtZWCzHaK9aPvpsPOFlqa
bhJ2B2R2LEs0kPAco1O8ZPYkagTJG9KYOJun1pBDyw7AA6LcTU91rapf4h4mrUQU
/5ycG2LSsshoZhnBQhtl27raTAdxuTFYEOb5IAAF9BOV1jeYTwfSRUb0WwIDAQAB
AoGACohax8FCZpdqz1MPL+A0AqkHTIpY7MWSGrlOsMF59EQjVSodmod6MbBDskDl
J+iouD8Ie/8p6vjlxeoBxiKffH71pYQOk9lizhhGF6zpBFxdhdmNLnLzrOquYmgp
vPDfm/ZqAhrmb9FjdvbhayB+/vtrR3+WUzpFQk3Drm1DdSECQQDoQuO9kdWASdpg
JWMssVoYyUL0Tez7wOBeMmVCi10/4+77uY0rB6Em6LSOxJAo+uQSKYca/forBt6X
RxcLxFivAkEAyNovAiC9pCXzZBiBIpTqY9TgAB+EMAxmsmxd24xx960/5B7FKk+P
HvN2c6hjNvwRGzOPr1SsqLl457yp3B6yFQJBAI4SHGyhAA/xHPsi4387HPl8YtA9
unBkktoLyZTi2q9yJYUlAw0HJbQ/M/MAmY33qfrSHCqOoLAhC5dNjPNNr1ECQEGN
5LXfFcZTlKLg1JUC4ZV/zzR7FNvR0Fr/v4p+xlu+MhI0cMmkeePyNoD9PpSdpL+q
DoV9L3VKQ8nu68mqQxkCQHrG1NzBpljCZKltBEHfjIySAfuqXbL8HZ9HQ1NpwUTY
EOC5eUwtgZucndLMwj4YbDn9DXNItgK7GGWCjqHnBgo=
-----END RSA PRIVATE KEY-----
`;

describe("Test 'sfdc-authentication' ", () => {
	let mockReadFileSyncSpy;
	beforeEach(() => {
		mockReadFileSyncSpy = jest
			.spyOn(fs, "readFileSync")
			.mockReturnValue(mockKey);
	});
	afterEach(() => {
		jest.clearAllMocks();
	});
	describe("Test 'getToken' ", () => {
		const testJWT = {
			access_token: "test",
			scope: "id full",
			instance_url: "https://eu6.salesforce.com",
			id: "https://login.salesforce.com/id/xxxxxxxxxxEAI/yyyyyyyyyy",
			token_type: "Bearer",
		};

		it("should return a valid token back", async () => {
			const broker = new ServiceBroker({ logger: false });
			jest.spyOn(jwt, "getToken").mockResolvedValue(testJWT);

			const test = await auth.jwtToken(broker);

			expect(test).toBe(testJWT);
		});
	});

	describe("Test 'getToken' error", () => {
		beforeEach(() => {
			jest.spyOn(jwt, "getToken").mockImplementation(() => {
				throw new Error();
			});
		});

		it("should catch the error and return", async () => {
			expect(async () => {
				await auth.SFDCAuthService.methods.getClient();
			}).rejects.toThrow();
		});
	});
});
