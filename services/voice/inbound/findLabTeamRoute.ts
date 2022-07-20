import PhoneNumber from "awesome-phonenumber";
import { CustomerRecordEntry } from "../../models/QuerySchemas";
import {
  SURGEON,
  UNID_CONTACT,
  UNID_CONTACT_SOBJECT,
} from "../voice.constants";
import { RouteUser, RoutingInformation } from "../voice.models";
import checkUserAvailability from "./checkUserAvailability";
import { INVALID_CUSTOMER_TYPE } from "./error.constants";
import getForwardedUser from "./getForwardedUser";

async function findLabTeamRoute(record: CustomerRecordEntry, type: string, relatedSurgeonSfId?: string) {
  if (type === SURGEON) {
    return await findSurgeonLabTeamRoute.call(this, record, type);
  } else if (type === UNID_CONTACT) {
    return await findUnidContactLabTeamRoute.call(this, record, type, relatedSurgeonSfId);
  } else {
    throw Error(INVALID_CUSTOMER_TYPE);
  }
}

function getCleanPhoneNumber(phone?: string): string {
  return phone ? PhoneNumber(phone, "US").getNumber("significant") : "";
}

async function findSurgeonLabTeamRoute(
  record: CustomerRecordEntry,
  type: string
) {
  if (!record.Assigned_LAB_Engineer__r) {
    throw Error("No Assigned Lab Engineer");
  }

  const userAvailability = await checkUserAvailability.call(
    this,
    record.Assigned_LAB_Engineer__r.Id
  );

  let userId = record.Assigned_LAB_Engineer__r.Id;
  let userName = record.Assigned_LAB_Engineer__r.Name;
  let phone = record.Assigned_LAB_Engineer__r.Phone;
  let mobile = record.Assigned_LAB_Engineer__r.MobilePhone;
  let userFedId = record.Assigned_LAB_Engineer__r.FederationIdentifier;
  let userAvailabilityStatus = userAvailability.AvailabilityStatus;

  let isForwarding = false;
  let forwardedByUser: RouteUser;
  if (
    userAvailability.AvailabilityStatus === "Out of Office" &&
    userAvailability.ForwardingUser !== ""
  ) {
    isForwarding = true;
    const forwardedToUser = await getForwardedUser.call(
      this,
      userAvailability.ForwardingUser
    );

    forwardedByUser = {
      Id: userId,
      Name: userName,
      Phone: getCleanPhoneNumber(phone),
      MobilePhone: getCleanPhoneNumber(mobile),
      FederationIdentifier: userFedId,
      AvailabilityStatus: userAvailabilityStatus,
    };

    userId = userAvailability.ForwardingUser;
    userName = forwardedToUser.Name;
    phone = forwardedToUser.Phone;
    mobile = forwardedToUser.MobilePhone;
    userFedId = forwardedToUser.FederationIdentifier;
    userAvailabilityStatus = forwardedToUser.AvailabilityStatus;
  }

  const routeDetail: RoutingInformation = {
    Id: record.Id,
    Name: record.Name,
    Type: type,
    Record: record,
    User: {
      Id: userId,
      Name: userName,
      Phone: getCleanPhoneNumber(phone),
      MobilePhone: getCleanPhoneNumber(mobile),
      FederationIdentifier: userFedId,
      AvailabilityStatus: userAvailabilityStatus,
    },
  };

  if (isForwarding) {
    routeDetail.User.ForwardedBy = forwardedByUser;
  }

  return routeDetail;
}

async function findUnidContactLabTeamRoute(
  record: CustomerRecordEntry,
  type: string,
  relatedSurgeonSfId?: string
) {
  for (const property in record) {
    if (
      record[property] &&
      record[property].attributes &&
      record[property].attributes.type === UNID_CONTACT_SOBJECT
    ) {
      let userId = record.Handles_Calls_for_UNiD_Contact__r.Id;
      let userName = record.Handles_Calls_for_UNiD_Contact__r.Name;
      let phone = record.Handles_Calls_for_UNiD_Contact__r.Phone;
      let mobile = record.Handles_Calls_for_UNiD_Contact__r.MobilePhone;
      let userFedId =
        record.Handles_Calls_for_UNiD_Contact__r.FederationIdentifier;
      const userAvailability = await checkUserAvailability.call(this, userId);
      let userAvailabilityStatus = userAvailability.AvailabilityStatus;

      let isForwarding = false;
      let forwardedByUser: RouteUser;
      if (
        userAvailability.AvailabilityStatus === "Out of Office" &&
        userAvailability.ForwardingUser !== ""
      ) {
        isForwarding = true;
        const forwardedToUser = await getForwardedUser.call(
          this,
          userAvailability.ForwardingUser
        );

        forwardedByUser = {
          Id: userId,
          Name: userName,
          Phone: getCleanPhoneNumber(phone),
          MobilePhone: getCleanPhoneNumber(mobile),
          FederationIdentifier: userFedId,
          AvailabilityStatus: userAvailabilityStatus,
        };

        userId = userAvailability.ForwardingUser;
        userName = forwardedToUser.Name;
        phone = forwardedToUser.Phone;
        mobile = forwardedToUser.MobilePhone;
        userFedId = forwardedToUser.FederationIdentifier;
        userAvailabilityStatus = forwardedToUser.AvailabilityStatus;
      }

      const routeDetail: RoutingInformation = {
        Id: record[property].Id,
        Name: record[property].Name,
        Type: type,
        Record: record,
        RelatedSurgeonSfId: relatedSurgeonSfId,
        User: {
          Id: userId,
          Name: userName,
          Phone: getCleanPhoneNumber(phone),
          MobilePhone: getCleanPhoneNumber(mobile),
          FederationIdentifier: userFedId,
          AvailabilityStatus: userAvailabilityStatus,
        },
      };

      if (isForwarding) {
        routeDetail.User.ForwardedBy = forwardedByUser;
      }

      return routeDetail;
    }
  }
}

export default findLabTeamRoute;
