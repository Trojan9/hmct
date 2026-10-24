import { AppError, NotFoundError, ValidationError } from '../../src/errors/AppError';

describe('AppError subclasses', () => {
  it('NotFoundError is a 404 with a default message', () => {
    const error = new NotFoundError();
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({
      name: 'NotFoundError',
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Resource not found',
    });
  });

  it('ValidationError is a 400 that carries field details', () => {
    const error = new ValidationError([{ field: 'title', message: 'Enter a title' }]);
    expect(error).toMatchObject({
      name: 'ValidationError',
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'The request contains invalid data',
      details: [{ field: 'title', message: 'Enter a title' }],
    });
  });
});
