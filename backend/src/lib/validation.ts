import { z } from 'zod';
import { FieldError, ValidationError } from '../errors/AppError';

export const toFieldErrors = (error: z.ZodError): FieldError[] =>
  error.issues.map((issue) => ({
    field: issue.path.length > 0 ? issue.path.join('.') : 'body',
    message: issue.message,
  }));

/**
 * Parses untrusted input against a schema, throwing a ValidationError
 * (rendered as a 400 by the error handler) when it does not match.
 */
export const parseOrThrow = <S extends z.ZodTypeAny>(schema: S, input: unknown): z.output<S> => {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(toFieldErrors(result.error));
  }
  return result.data as z.output<S>;
};
