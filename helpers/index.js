function sendResponse(res, status, code, message, payload) {
    console.log("res",res),
    console.log("status",status)
    console.log("code",code)
    console.log("message",message)
    console.log("payload",payload)
    return res.status(status).send(prepareResponse(code, message, payload));
};

function prepareResponse(status, message, data) {
    if (data != null || data != undefined) {
        return {
            responseCode: status,
            responseMessage: message,
            responseData: data,
        };
    }
    return {
        responseCode: status,
        responseMessage: message,
    };
};

module.exports = {sendResponse:sendResponse}