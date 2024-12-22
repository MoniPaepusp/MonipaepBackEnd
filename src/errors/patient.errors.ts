import { HttpError, HttpCode, HttpErrorArgs, IExternalServiceError } from "../common/app.errors";

abstract class PatientError extends HttpError {
  constructor(args: HttpErrorArgs) {
    super({
      ...args,
      apiContext: `PATIENTS_ERROR-${args.apiContext}`,
    });
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PatientAlreadyExistsError extends PatientError {
  constructor(externalServiceError?: IExternalServiceError, message?: string) {
    super({
      apiContext: "PATIENT_ALREADY_EXISTS",
      httpCode: HttpCode.BAD_REQUEST,
      message: message ?? "Este paciente já existe.",
      externalServiceError,
    });
  }
}
