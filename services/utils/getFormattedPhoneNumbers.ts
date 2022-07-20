import PhoneNumber from "awesome-phonenumber";

export interface FormattedPhoneNumbers {
  national: string;
  international: string;
  condensedNational: string;
}

export default function getFormattedPhoneNumbers(phoneNumber: PhoneNumber): FormattedPhoneNumbers {
  const nationalNumber = phoneNumber.getNumber("national");
  const international = phoneNumber
    .getNumber("international")
    .replace("+1 ", "");
  const condensedNational = international.replace(/-/g, "");
  return {
    national: nationalNumber,
    international,
    condensedNational,
  };
}
