export enum HttpCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/*
  ApiContenxt: In which context the error occurred, DISEASE_ERROR, PATIENT_ERROR, USM_ERROR, 
  HttpCode: The returned HTTP code
  MESSAGE: The error message
  ExternalServiceError: If an external service was used during the request and it was the
  guilty for the error, it will send the error object returned

*/

export interface HttpErrorArgs {
  apiContext: string;
  httpCode: HttpCode;
  message: string;
  externalServiceError?: IExternalServiceError
}

export interface IExternalServiceError {
  externalService: string;
  externalHttpCode: HttpCode;
  externalErrorMessage: string;
};

export class HttpError extends Error {
  public readonly httpCode: HttpCode;
  public readonly apiContext: string;
  public readonly message: string;
  public readonly externalServiceError?: IExternalServiceError

  constructor(args: HttpErrorArgs) {
    super(args.message);

    Object.setPrototypeOf(this, new.target.prototype);

    this.httpCode = args.httpCode;
    this.apiContext = args.apiContext;
    this.message = args.message;
    this.externalServiceError = args.externalServiceError;

    Error.captureStackTrace(this);
  }
}
