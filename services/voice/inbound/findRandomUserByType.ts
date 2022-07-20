import { UserRecord, UserRecordEntry } from "../../models/QuerySchemas";

async function findRandomUserByType(
  userType: string
): Promise<UserRecordEntry> {
  this.logger.info(`Getting random ${userType} for caller`);
  const users = (await this.broker.call("v1.sfdc-query.retrieveUsers", {
    userType,
  })) as UserRecord;

  if (users.records.length === 0) {
    this.logger.info(`No ${userType} found`);
    throw Error(`No ${userType} found`);
  }

  return users.records[Math.floor(Math.random() * users.records.length)];
}

export default findRandomUserByType;
