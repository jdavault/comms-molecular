import PhoneNumber from "awesome-phonenumber";

export default function standardNumber(number: string): string {
  return PhoneNumber(number, "US").getNumber("significant");
}
