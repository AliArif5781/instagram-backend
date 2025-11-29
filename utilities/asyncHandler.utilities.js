export const asyncHandler = (func) => (req, res, next) => {
  Promise.resolve(func(req, res, next)).catch((err) => next(err));
};

/*
Creates a higher-order function that takes another function (func)

Returns a new function that handles req, res, next parameters

Promise.resolve(func(req, res, next)) - Executes the original function

.catch((err) => next(err)) - Catches any errors and passes them to Express error handler
 */
