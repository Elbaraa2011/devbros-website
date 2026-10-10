const STATUS_BY_CODE = {
  VALIDATION_ERROR: 400,
  RATE_LIMITED: 429
};

export class ErrorHandler {
  middleware() {
    return (err, req, res, next) => { // eslint-disable-line no-unused-vars
      const status = err.status ?? STATUS_BY_CODE[err.code] ?? 500;
      const message =
        err.expose && err.message
          ? err.message
          : 'Something went wrong on our end. Please try again, or email devbros40@gmail.com.';

      console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${err.code ?? 'SERVER_ERROR'}: ${err.message}`);

      if (!res.headersSent) {
        res.status(status).json({
          ok: false,
          error: {
            code: err.code ?? 'SERVER_ERROR',
            message
          }
        });
      }
    };
  }
}

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
    this.expose = true;
  }
}
