export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let status = res.statusCode === 200 ? 500 : res.statusCode;

  if (err.name === 'CastError') {
    status = 400;
    err.message = 'Invalid ID format';
  }
  if (err.code === 11000) {
    status = 409;
    err.message = 'Duplicate value: this record already exists';
  }
  if (err.name === 'ValidationError') {
    status = 400;
    const messages = Object.values(err.errors).map((val) => val.message);
    err.message = `Validation Error: ${messages.join(', ')}`;
  }

  res.status(status).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
