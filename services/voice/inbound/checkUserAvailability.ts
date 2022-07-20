async function checkUserAvailability(userId: string) {
  const userAvailabilityResults = {
    AvailabilityStatus: "Available",
    ForwardingUser: "",
  };

  try {
    const userAvailability = await this.broker.call(
      "v1.sfdc-query.retrieveUserAvailabilityDetails",
      {
        id: userId,
      }
    );

    if (userAvailability.totalSize === 1) {
      userAvailabilityResults.AvailabilityStatus = userAvailability.records[0]
        .Availability_Status__c
        ? userAvailability.records[0].Availability_Status__c
        : "Available";
      userAvailabilityResults.ForwardingUser = userAvailability.records[0]
        .Forwarding_User__c
        ? userAvailability.records[0].Forwarding_User__c
        : "";
    }
  } catch (error) {
    this.logger.warn(
      "Availability data was not defined.  Assuming user is available."
    );
  }

  return userAvailabilityResults;
}

export default checkUserAvailability;
