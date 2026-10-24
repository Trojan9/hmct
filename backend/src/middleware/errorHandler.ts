import { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError, FieldError } from '../errors/AppError';

export interface ErrorResponseBody {
  error: {
    status: number;
    code: string;
    message: string;
    details?: FieldError[];
  };
}

const body = (
  status: number,
  code: string,
  message: string,
  details?: FieldError[],
): ErrorResponseBody => ({ error: { status, code, message, ...(details && { details }) } });

/** Errors raised by express.json() carry an HTTP status and a type. */
const isBodyParserError = (error: unknown): error is { status: number; type: string } =>
  typeof error === 'object' &&
  error !== null &&
  'type' in error &&
  'status' in error &&
  typeof (error as { status: unknown }).status === 'number';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json(body(404, 'ROUTE_NOT_FOUND', `Cannot ${req.method} ${req.path}`));
};

/**
 * Turns every error into the same JSON shape. Known errors keep their status
 * and message; anything unexpected is logged and reported as a generic 500 so
 * internal details never reach the client.
 */
export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof AppError) {
    res
      .status(error.statusCode)
      .json(body(error.statusCode, error.code, error.message, error.details));
    return;
  }

  if (isBodyParserError(error)) {
    if (error.type === 'entity.parse.failed') {
      res.status(400).json(body(400, 'INVALID_JSON', 'The request body is not valid JSON'));
      return;
    }
    if (error.type === 'entity.too.large') {
      res.status(413).json(body(413, 'PAYLOAD_TOO_LARGE', 'The request body is too large'));
      return;
    }
  }

  req.log?.error({ err: error }, 'Unhandled error');
  res.status(500).json(body(500, 'INTERNAL_ERROR', 'Something went wrong. Try again later.'));
};
