class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = ErrorHandler;

/*
Creates a custom error class that extends the built-in Error class

constructor(message, statusCode) - Takes error message and HTTP status code

super(message) - Calls parent Error class constructor

this.statusCode = statusCode - Adds statusCode property to the error

Error.captureStackTrace(...) - Creates a stack trace for debugging

Exports the class for use in other files
 */

/*
Without Error.captureStackTrace:-
If you didn’t use this line, the error report would include unnecessary technical details,
like where the ErrorHandler class itself is defined.
That’s not very helpful when you’re trying to debug.

With Error.captureStackTrace, you're saying:
"Skip all the setup details and just show me where the error actually happened in the code."
*/
