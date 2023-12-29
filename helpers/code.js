"use strict";

const HttpStatus = {
    SUCCESS_CODE: 200,
    INTERNAL_SERVER_ERROR: 500,
    BAD_REQUEST_STATUS_CODE: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
};

const ErrorCode = {
    UNAUTHORIZED: 401,
    INTERNAL_SERVER_ERROR: 500,
    REQUIRED_CODE: 2001,
    INVALID_CODE: 2002,
    EXIST_CODE: 2003,
    NO_RECORD_FOUND_CODE: 2004,
    BAD_REQUEST_STATUS_CODE: 2005,
}

module.exports = { 
    HttpStatus : HttpStatus, 
    ErrorCode : ErrorCode
 }