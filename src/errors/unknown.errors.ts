import { HttpError, HttpCode, HttpErrorArgs, IExternalServiceError } from "../common/app.errors";

abstract class UnknownError extends HttpError {
  constructor(args: HttpErrorArgs) {
    super({
      ...args,
      apiContext: `UNKNOWN_ERROR-${args.apiContext}`,
    });
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class GeneralInternalError extends UnknownError {
  constructor(externalServiceError?: IExternalServiceError, message?: string) {
    super({
      apiContext: "GENERAL_INTERNAL_ERROR",
      httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      message: message ?? "Um erro interno desconhecido ocorreu durante esta operação.",
      externalServiceError,
    });
  }
}
