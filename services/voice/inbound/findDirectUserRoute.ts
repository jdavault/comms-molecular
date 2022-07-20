import { CustomerRecordEntry } from "../../models/QuerySchemas";
import {
  SURGEON,
  UNID_CONTACT,
  UNID_CONTACT_SOBJECT,
  UNKNOWN,
} from "../voice.constants";
import { RouteUser, RoutingInformation } from "../voice.models";
import checkUserAvailability from "./checkUserAvailability";
import { INVALID_CUSTOMER_TYPE } from "./error.constants";
import getForwardedUser from "./getForwardedUser";

async function findDirectUserRoute(
  record: CustomerRecordEntry,
  type: string,
  user: RouteUser,
  relatedSurgeonSfId?: string,
): Promise<RoutingInformation> {
  let directRoutingInformation: RoutingInformation;

  if (type === SURGEON) {
    directRoutingInformation = {
      Id: record.Id,
      Name: record.Name,
      Type: type,
      Record: record,
      User: user,
    };
  } else if (type === UNID_CONTACT) {
    for (const property in record) {
      if (
        record[property] &&
        record[property].attributes &&
        record[property].attributes.type === UNID_CONTACT_SOBJECT
      ) {
        directRoutingInformation = {
          Id: record[property].Id,
          Name: record[property].Name,
          Type: type,
          Record: record,
          User: user,
          RelatedSurgeonSfId: (relatedSurgeonSfId) ? relatedSurgeonSfId : null,
        };
      }
    }
  } else if (type === UNKNOWN) {
    directRoutingInformation = {
      Id: "",
      Name: "Unknown",
      Type: type,
      Record: record,
      User: user,
    };
  } else {
    throw Error(INVALID_CUSTOMER_TYPE);
  }

  const userAvailability = await checkUserAvailability.call(
    this,
    directRoutingInformation.User.Id
  );

  directRoutingInformation.User.AvailabilityStatus =
    userAvailability.AvailabilityStatus;

  if (
    userAvailability.AvailabilityStatus === "Out of Office" &&
    userAvailability.ForwardingUser !== ""
  ) {
    const forwardedToUser = await getForwardedUser.call(
      this,
      userAvailability.ForwardingUser
    );

    directRoutingInformation.User = {
      Id: userAvailability.ForwardingUser,
      Name: forwardedToUser.Name,
      Phone: forwardedToUser.Phone,
      MobilePhone: forwardedToUser.MobilePhone,
      AvailabilityStatus: forwardedToUser.AvailabilityStatus,
      FederationIdentifier: forwardedToUser.FederationIdentifier,
      ForwardedBy: user,
    };
  }
  return directRoutingInformation;
}

export default findDirectUserRoute;
