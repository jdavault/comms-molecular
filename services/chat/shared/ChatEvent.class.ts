import {
  OnConversationAddGroupSMS,
  OnConversationAddSMS,
} from "../chat.models";

export default class ChatEvent {
  public static isInbound(object: unknown): object is OnConversationAddSMS {
    if (Object.prototype.hasOwnProperty.call(object, "Source")) {
      const casted = object as OnConversationAddSMS;
      return (casted.Source === "SMS");
    }
    return false;
  }

  public static isInboundGroup(object: unknown): object is OnConversationAddGroupSMS {
    return Object.prototype.hasOwnProperty.call(object, "MessagingBinding.AuthorAddress");
  }
}
