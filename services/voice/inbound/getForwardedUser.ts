async function getForwardedUser(userId: string) {
  const forwardedUserDetails = {
    AvailabilityStatus: "Available",
    Name: "",
    Phone: "",
    MobilePhone: "",
    FederationIdentifier: "",
  };

  try {
    const userDetails = await this.broker.call(
      "v1.sfdc-query.retrieveUserById",
      {
        id: userId,
      }
    );

    if (userDetails.totalSize === 1) {
      forwardedUserDetails.AvailabilityStatus = userDetails.records[0]
        .Availability_Status__c
        ? userDetails.records[0].Availability_Status__c
        : "Available";
      forwardedUserDetails.Name = userDetails.records[0].Name;
      forwardedUserDetails.Phone = userDetails.records[0].Phone;
      forwardedUserDetails.MobilePhone = userDetails.records[0].MobilePhone;
      forwardedUserDetails.FederationIdentifier =
        userDetails.records[0].FederationIdentifier;
    }
  } catch (error) {
    this.logger.warn("Could not get forwarded to user.");
  }

  return forwardedUserDetails;
}

export default getForwardedUser;
