import {
  userObjectBoth,
  userObjectMobileOnly,
  userObjectPhoneOnly,
} from "../../fixtures/voice.fixtures";
import { findUserNumber } from "../../../../../services/voice/inbound/createUserCall.handler";

describe("test Create User Call handler", () => {
  describe("test get userNumber function", () => {
    it("should find right number for user", async () => {
      expect(findUserNumber(userObjectMobileOnly)).toBe("9193932323");
      expect(findUserNumber(userObjectPhoneOnly)).toBe("8384348484");
      expect(findUserNumber(userObjectBoth)).toBe("3439493434");
    });
  });
});
