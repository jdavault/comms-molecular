import { Errors } from "moleculer";
export class DirectToVMError extends Errors.MoleculerError {
  public constructor(msg: string, data: any) {
    super(msg || "could not reach voicemail", 500, "VMAIL_UNREACHABLE", data);
  }
}
