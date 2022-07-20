import { Context, Errors } from "moleculer";
import { ParticipantType } from "../chat.models";
import {
  CustomerRecord,
  CustomerRecordEntry,
  UserRecord,
  UserRecordEntry,
} from "../../models/QuerySchemas";
import getActiveTwilioNumbers from "../../utils/getActiveTwilioNumbers";
import standardNumber from "../../utils/standardNumber";

export default async function generateAddressMapping(
  ctx: Context<any, any>,
  addresses: string[]
): Promise<AddressMap> {
  const { TWILIO_LAB_TEAM_NUMBER } = process.env;
  let includesLabNumber = false;
  let addressMinusLab;
  let directUsersMap: AddressMap = {};
  let labUsersMap: AddressMap = {};
  const unknownContactsMap: AddressMap = {};
  // Check for and filter out the lab number now for later use
  if (addresses.includes(TWILIO_LAB_TEAM_NUMBER)) {
    includesLabNumber = true;
    addressMinusLab = addresses.filter(
      (n: string) => n !== TWILIO_LAB_TEAM_NUMBER
    );
  }
  const [addressesMinusLabAndDirects, directUserAddresses]: [
    string[],
    string[]
  ] = await getAndFilterTwilioDirectNumbers(ctx, addressMinusLab || addresses);


  if (directUserAddresses.length) {
    directUsersMap = await getDirectTwilioUsers(ctx, directUserAddresses);
  }

  const [remainingAddresses, externalContactsMap]: [string[], AddressMap] =
    await getAndFilterCustomerNumbers(ctx, addressesMinusLabAndDirects);
  let selectedPlanningUnitId;
  if (Object.keys(externalContactsMap).length) {
    selectedPlanningUnitId = findPrioritizedPlanningUnitId(externalContactsMap);
  }
  if (includesLabNumber && selectedPlanningUnitId) {
    labUsersMap = await getLabUsers(ctx, selectedPlanningUnitId);
  } else if (includesLabNumber) {
    labUsersMap = await getRandomLabUserForUnknown(ctx);
  }

  if (remainingAddresses.length) {
    // Handle for unknowns
    remainingAddresses.forEach((unknownNumber: string) => {
      unknownContactsMap[unknownNumber] = {
        type: ParticipantType.Unknown,
        name: "",
        contactPhone: unknownNumber,
      } as AddressMapping;
    });
  }

  return {
    ...labUsersMap,
    ...directUsersMap,
    ...externalContactsMap,
    ...unknownContactsMap,
    internal: [...Object.keys(labUsersMap), ...Object.keys(directUsersMap)],
    external: [
      ...Object.keys(externalContactsMap),
      ...Object.keys(unknownContactsMap),
    ],
  };
}

async function getRandomLabUserForUnknown(
  ctx: Context<any, any>
): Promise<AddressMap> {
  let randomUser;
  const caseManagers: UserRecord = await ctx.broker.call(
    "v1.sfdc-query.retrieveUsers",
    {
      userType: ParticipantType.CaseManager,
    }
  );
  if (caseManagers.records.length !== 0) {
    randomUser =
      caseManagers.records[
      Math.floor(Math.random() * caseManagers.records.length)
      ];
    ctx.service.logger.debug(
      "Random Case-Manager selected:" + JSON.stringify(randomUser)
    );
  } else {
    try {
      const engineers: UserRecord = await ctx.broker.call(
        "v1.sfdc-query.retrieveUsers",
        {
          userType: ParticipantType.Engineer,
        }
      );
      if (engineers.records.length !== 0) {
        randomUser =
          engineers.records[
          Math.floor(Math.random() * engineers.records.length)
          ];
        ctx.service.logger.debug(
          "Random Engineer selected:" + JSON.stringify(randomUser)
        );
      } else {
        throw new Errors.MoleculerServerError(
          `no user could be found to connect with unknown contact. This should never happen`,
          500
        );
      }
    } catch (error) {
      throw new Errors.MoleculerServerError(
        `error occurred finding participant for unknown convo: ${error.message}`,
        500
      );
    }
  }
  return {
    [process.env.TWILIO_LAB_TEAM_NUMBER]: [
      {
        type: randomUser.User_Role__c as ParticipantType,
        name: randomUser.Name,
        contactPhone: randomUser.MobilePhone || randomUser.Phone,
        fedId: randomUser.FederationIdentifier,
        sfId: randomUser.Id,
        record: randomUser,
        twilioNumber: randomUser.Twilio_Number__c,
      } as AddressMapping,
    ],
  };
}

function findPrioritizedPlanningUnitId(
  externalContactsMap: AddressMap
): string {
  let puId;
  for (const c of Object.values(externalContactsMap)) {
    const curr: AddressMapping = c as AddressMapping;
    // prioritize planning unit for surgeons, fall back to unid if no surgeons
    if (curr.type === ParticipantType.Surgeon) {
      puId = curr.record?.Planning_Unit_Organization__r?.Id;
      break;
    }
    if (curr.type === ParticipantType.Unid) {
      puId = curr.rootSurgeon.Planning_Unit_Organization__r?.Id;
    }
  }
  return puId;
}

async function getAndFilterCustomerNumbers(
  ctx: Context<any, any>,
  numbersIn: string[]
): Promise<[string[], AddressMap]> {
  const externalContactsMap: AddressMap = {};
  let filteredNumbers = [...numbersIn];
  for (const num of numbersIn) {
    const record: CustomerRecord = await ctx.broker.call(
      "v1.sfdc-query.retrieveCustomers",
      { phoneNumber: num }
    );
    if (record.totalSize) {
      if (record.type === ParticipantType.Surgeon) {
        externalContactsMap[num] = {
          type: record.type as ParticipantType,
          name: record.records[0].Name,
          contactPhone: num,
          sfId: record.records[0].Id,
          record: record.records[0],
          assignedLabEngineer: record.records[0].Assigned_LAB_Engineer__r,
          assignedHandlesUnidTexts:
            record.records[0].Handles_Texts_for_UNiD_Contact__r,
        } as AddressMapping;
        filteredNumbers = filteredNumbers.filter((n: string) => n !== num);
      }
      if (record.type === ParticipantType.Unid) {
        const unid = locateUnidContactRecord(record.records[0]);
        externalContactsMap[num] = {
          type: record.type as ParticipantType,
          rootSurgeon: record.records[0],
          name: unid.Name,
          contactPhone: num,
          sfId: unid.Id,
          record: unid,
          assignedLabEngineer: record.records[0].Assigned_LAB_Engineer__r,
          assignedHandlesUnidTexts:
            record.records[0].Handles_Texts_for_UNiD_Contact__r,
        } as AddressMapping;
        filteredNumbers = filteredNumbers.filter((n: string) => n !== num);
      }
    }
  }

  return [filteredNumbers, externalContactsMap];
}

function locateUnidContactRecord(cusRec: CustomerRecordEntry): any {
  let actual;
  for (const prop in cusRec) {
    if (cusRec[prop]?.attributes?.type === "UNiD_Contacts__c") {
      actual = { ...cusRec[prop] };
      break;
    }
  }
  return actual;
}

async function getLabUsers(
  ctx: Context<any, any>,
  planningUnitId: string
): Promise<AddressMap> {
  const labMembers: any[] = await ctx.service.broker.call(
    "v1.sfdc-query.retrievePlanningUnitUsers",
    { PUOId: planningUnitId }
  );
  const labMemberMappings: AddressMapping[] = [];
  labMembers.forEach((record: any) => {
    labMemberMappings.push({
      type: record.Role__c as ParticipantType,
      name: record.User__r.Name,
      contactPhone: record.User__r.MobilePhone || record.User__r.Phone,
      fedId: record.User__r.FederationIdentifier,
      sfId: record.User__r.Id,
      record: record.User__r,
      twilioNumber: record.User__r.Twilio_Number__c
        ? standardNumber(record.User__r.Twilio_Number__c)
        : process.env.TWILIO_LAB_TEAM_NUMBER,
    });
  });
  return {
    [standardNumber(process.env.TWILIO_LAB_TEAM_NUMBER)]: [...labMemberMappings],
  };
}

async function getDirectTwilioUsers(
  ctx: Context<any, any>,
  twilioNumbers: string[]
): Promise<AddressMap> {
  const queryResp: { searchRecords: any[] } = await ctx.service.broker.call(
    "v1.sfdc-query.retrieveUsersByTwilioNumber",
    { phoneNumbers: twilioNumbers }
  );
  if (!queryResp.searchRecords.length) {
    return {} as AddressMap;
  }
  const directUsersAddressMap: AddressMap = {};
  queryResp.searchRecords.forEach((record: UserRecordEntry) => {
    directUsersAddressMap[standardNumber(record.Twilio_Number__c)] = {
      type: record.User_Role__c as ParticipantType,
      name: record.Name,
      contactPhone: record.MobilePhone || record.Phone,
      fedId: record.FederationIdentifier,
      sfId: record.Id,
      twilioNumber: standardNumber(record.Twilio_Number__c),
      forwardingUser: record.Forwarding_User__c,
      record,
    };
  });
  return directUsersAddressMap;
}

async function getAndFilterTwilioDirectNumbers(
  ctx: Context<any, any>,
  numbersIn: string[]
): Promise<[string[], string[]]> {
  const copy = [...numbersIn];
  const twilioNumbers: string[] = await getActiveTwilioNumbers(ctx);
  const directUserNumbers: string[] = copy.filter((num: string) =>
    twilioNumbers.includes(standardNumber(num))
  );
  const filteredSet: string[] = copy.filter(
    (n: string) => !directUserNumbers.includes(n)
  );
  return [filteredSet, directUserNumbers];
}

export interface AddressMap {
  [key: string]: AddressMapping | AddressMapping[] | string[];
}

export interface AddressMapping {
  type: ParticipantType;
  rootSurgeon?: any;
  name: string;
  contactPhone: string;
  twilioNumber?: string;
  fedId?: string;
  sfId?: string;
  record?: any;
  assignedLabEngineer?: any;
  assignedHandlesUnidTexts?: any;
  forwardingUser?: any;
}
