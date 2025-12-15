export enum HttpStatusCode {
    OK = 200,
    CREATED = 201,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    UNPROCESSABLE_ENTITY = 422,
    INTERNAL_SERVER_ERROR = 500
  }
  
export enum ApplicationStatusCode {
    APPLICATIONS_RETRIEVED = HttpStatusCode.OK,
    APPLICATION_RETRIEVED = HttpStatusCode.OK,
    APPLICATION_STATUS_UPDATED = HttpStatusCode.OK,
    APPLICATION_NOTE_ADDED = HttpStatusCode.CREATED
  }
  
export enum ValidationStatusCode {
    VALIDATION_ERROR = HttpStatusCode.BAD_REQUEST,
    MISSING_REQUIRED_FIELDS = HttpStatusCode.BAD_REQUEST,
    INVALID_UUID_FORMAT = HttpStatusCode.UNPROCESSABLE_ENTITY
  }