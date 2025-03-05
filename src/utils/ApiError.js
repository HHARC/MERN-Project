class ApiError extends Error {
    constructor(
        statuscode,
        message="Something Went Wrong",
        errors=[],
        statck=""
    ){
        super(message);
        this.statusCode = statuscode;
        this.errors = errors;
        this.data=null;
        this.message=message
        this.success=false;

        if(stack){
            this.stack=stack;

        }else{
            Error.captureStackTrace(this, this.constructor);
        }
        

    }
}

export {ApiError}