import { Context } from "moleculer";
import axios from "axios";

import {
  // ContactPersonsConversationAttr,
  // ConversationAttr,
  // ParticipantAttr,
  ParticipantType,
  // PostOnConversationAdd,
  // PrimaryUserConversationAttr,
  // PostOnMessageAdded,
  OnMessageAddedMedia,
} from "../chat/chat.models";
import { PUB_SUB_CHAT } from "../chat/chat.constants";

import OrchestratorCloudEvent from "../models/OrchestratorCloudEvent";
import { SFTask } from "./sfdc-tasks.models";

async function createChatTask(ctx: Context<any, any>): Promise<SFTask> {
  const conn = await this.getClient();
  const params = ctx.params.data;
  const texter = params.From;
  const body = params.Body;
  const customerNumber = params.From.type === "Unknown" ? params.From.primaryPhone : "";
  const caseId = params.CaseId;
  const contactPerson = params.contactPerson;
  const subject = params.subject;
  const media = params.media;

  const newTask = {
    Type: "Text",
    Subject: subject,
    Case_ID__c: caseId,
    Activity_Detail__c:
      media && media.length > 0
        ? `${texter?.name || "Unknown"}: Media Attachment`
        : `${texter?.name || "Unknown"}: ${body}`,
    Activity_Phone__c: customerNumber,
    Status: "Completed",
    ActivityDate: new Date(),
  } as SFTask;

  if (texter?.isInternal) {
    newTask.OwnerId = texter.sfId;
  }

  // Tasks created without a WhoId or a WhatId will appear as Open Tasks in SFDC
  if (contactPerson.customerType !== ParticipantType.Unknown) {
    if (contactPerson.customerType === ParticipantType.Surgeon) {
      newTask.WhoId = contactPerson.sfId;
    } else {
      newTask.WhatId = contactPerson.sfId;
    }
  }

  let sfTask: SFTask;

  try {
    sfTask = await conn.sobject("Task").create(newTask);
    this.logger.trace(sfTask);

    if (media) {
      // UI currently supports sending one at a time, but Twilio presents an array
      // create mediaTaskAttachment for each in array
      media.forEach(async (item: OnMessageAddedMedia) => {
        await createMMSTaskAttachment(ctx, sfTask.id, item, newTask.OwnerId);
      });
    }
  } catch (e) {
    ctx.service.logger.error("Cannot create task: " + e.message);
    ctx.service.processError(e, PUB_SUB_CHAT.DELIVERED);
    throw new Error(e.message);
  }

  return sfTask;
}

async function createMMSTaskAttachment(
  ctx: Context<any, any>,
  parentId: string,
  media: OnMessageAddedMedia,
  taskOwnerId: string
): Promise<any> {
  const conn = await ctx.service.getClient();
  const buffer: Buffer = await getMediaByURL(ctx, media);

  const ext = media.ContentType.substring(media.ContentType.indexOf("/") + 1);

  const attachmentCreationObject = {
    Name: `${media.Sid}.${ext}`,
    ContentType: media.ContentType, // "image/jpeg",
    Description: media.Filename,
    ParentId: parentId, // sfId of new task
    Body: buffer.toString("base64"),
    OwnerId: taskOwnerId, // must match OwnerId of new task
  };
  let res;
  try {
    res = await conn.sobject("Attachment").create(attachmentCreationObject);
  } catch (e) {
    ctx.service.logger.error("ERROR: cannot create task " + e.message);
    ctx.service.processError(e, PUB_SUB_CHAT.DELIVERED);
    throw new Error(e.message);
  }

  return res;
}

async function getMediaByURL(
  ctx: Context<any, any>,
  item: OnMessageAddedMedia
): Promise<Buffer> {
  return getMediaImageBuffer(ctx, await getMediaURL(ctx, item));
}

async function getMediaURL(
  ctx: Context<any, any>,
  media: OnMessageAddedMedia
): Promise<string> {
  try {
    const conversationSid = process.env.TWILIO_CONVERSATIONS_SERVICE_SID;
    const url =
      "https://mcs.us1.twilio.com/v1/Services/" +
      conversationSid +
      "/Media/" +
      media.Sid;

    const resp = await axios.get(url, {
      headers: {
        Authorization: ctx.service.schema.getBasicAuthHeader(),
      },
    });
    return resp.data.links.content_direct_temporary;
  } catch (error) {
    ctx.service.logger.error(error);
    throw new Error(error);
  }
}

async function getMediaImageBuffer(
  ctx: Context<any, any>,
  mediaUrl: string
): Promise<Buffer> {
  try {
    const responseAxios = await axios.get(mediaUrl, {
      responseType: "arraybuffer",
    });
    return Buffer.from(responseAxios.data, "base64");
  } catch (error) {
    ctx.service.logger.error(error);
    throw new Error(error);
  }
}

export default createChatTask;
