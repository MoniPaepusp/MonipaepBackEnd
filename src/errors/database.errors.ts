import { HttpError, HttpCode, HttpErrorArgs, IExternalServiceError } from "../common/app.errors";

abstract class DatabaseError extends HttpError {
  constructor(args: HttpErrorArgs) {
    super({
      ...args,
      apiContext: `UNKNOWN_ERROR-${args.apiContext}`,
    });
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InfraestructureError extends DatabaseError {
  constructor(externalServiceError?: IExternalServiceError, message?: string) {
    super({
      apiContext: "INFRAESTRUCTURE_ERROR",
      httpCode: HttpCode.INTERNAL_SERVER_ERROR,
      message: message ?? "O banco de dados foi mal formado ou não existe.",
      externalServiceError,
    });
  }
}

export class ConnectionError extends DatabaseError {
    constructor(externalServiceError?: IExternalServiceError, message?: string) {
      super({
        apiContext: "CONNECTION_ERROR",
        httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        message: message ?? "No momento não é possível estabelecer uma conexão com o banco de dados.",
        externalServiceError,
      });
    }
  }
  