import { Context, Errors } from "moleculer";

export default async function cleanUpAbortedConversations(
  ctx: Context<any, any>,
  conversationSid: string
): Promise<string> {
  ctx.service.logger.debug("deleting aborted conversation from twilio...");
  try {
    return await ctx.service.schema.getClient()
      .conversations
      .conversations(conversationSid)
      .remove(conversationSid);
  } catch (error) {
    throw new Errors.MoleculerServerError(
      `failed to cleanup conversation records: ${error.message}`,
      500
    );
  }
}
