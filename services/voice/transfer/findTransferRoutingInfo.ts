import { Context, Errors } from "moleculer";
import { ParticipantType } from "../../chat/chat.models";
import { CustomerRecord } from "../../models/QuerySchemas";
import getForwardedUser from "../inbound/getForwardedUser";
import { UNID_CONTACT_SOBJECT, UNKNOWN } from "../voice.constants";
import { RouteUser, RoutingInformation } from "../voice.models";

export interface TransferRoutingInformation extends RoutingInformation {
  TwilioNumber?: string;
}

export default async function findTransferRoutingInfo(
  transfereeSfId: string,
  customerPhone: string
): Promise<TransferRoutingInformation> {
  let user: RouteUser;

  const transfereeUser: any = await this.broker.call(
    "v1.sfdc-users.getUserBySfId",
    { sfId: transfereeSfId }
  );

  if (transfereeUser.records.length === 0) {
    throw new Errors.MoleculerClientError(
      `user with Id ${transfereeSfId} could not be found in Salesforce`,
      404
    );
  }
  const userRec = transfereeUser.records[0];
  const client: CustomerRecord = await this.broker.call(
    "v1.sfdc-query.retrieveCustomers",
    { phoneNumber: customerPhone }
  );

  if (
    userRec.Availability_Status__c === "Out of Office" &&
    userRec.Forwarding_User__c !== ""
  ) {
    const forwardedToUser = await getForwardedUser.call(
      this,
      transfereeUser.Forwarding_User__c
    );
    user = {
      Id: transfereeUser.Forwarding_User__c,
      Name: forwardedToUser.Name,
      Phone: forwardedToUser.Phone,
      MobilePhone: forwardedToUser.MobilePhone,
      AvailabilityStatus: forwardedToUser.AvailabilityStatus,
      FederationIdentifier: forwardedToUser.FederationIdentifier,
      ForwardedBy: userRec,
    };
  } else {
    user = {
      Id: userRec.Id,
      Name: userRec.Name,
      Phone: userRec.Phone,
      MobilePhone: userRec.MobilePhone,
      FederationIdentifier: userRec.FederationIdentifier,
      AvailabilityStatus: userRec.Availability_Status__c,
    };
  }

  let routeInfo: TransferRoutingInformation;
  if (client.type === ParticipantType.Unknown) {
    routeInfo = {
      Id: UNKNOWN,
      Name: UNKNOWN,
      Record: null,
      Type: UNKNOWN,
      User: user,
    };
  } else if (client.type === ParticipantType.Unid) {
    const clientRec = client.records[0];
    for (const property in clientRec) {
      if (
        clientRec[property] &&
        clientRec[property].attributes &&
        clientRec[property].attributes.type === UNID_CONTACT_SOBJECT
      ) {
        routeInfo = {
          Id: clientRec[property].Id,
          Name: clientRec[property].Name,
          Type: client.type,
          Record: clientRec,
          User: user,
        };
        break;
      }
    }
  } else {
    routeInfo = {
      Id: client.records[0].Id,
      Name: client.records[0].Name,
      Type: client.type,
      Record: client.records[0],
      User: user,
    };
  }
  if (client?.relatedSurgeonSfId) {
    routeInfo.RelatedSurgeonSfId = client.relatedSurgeonSfId;
  }
  return routeInfo;
}
