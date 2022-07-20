import { Errors } from "moleculer";
export class CreateInboundConfError extends Errors.MoleculerError {
  public constructor(msg: string, data: any) {
    super(
      msg || "could not create inbound conference",
      500,
      "CALL_COULD_NOT_BE_COMPLETED",
      data
    );
  }
}
