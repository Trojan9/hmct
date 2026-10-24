import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, TASK_STATUSES, type TaskInput } from '../api/tasks';
import { STATUS_DISPLAY } from '../tasks/status';
import {
  DESCRIPTION_MAX_LENGTH,
  FIELD_IDS,
  TITLE_MAX_LENGTH,
  type TaskFormErrors,
  type TaskFormField,
  type TaskFormValues,
  fromApiErrors,
  toTaskInput,
  validateTaskForm,
} from '../tasks/validation';
import { ErrorSummary, type ErrorSummaryItem } from './ErrorSummary';

const FIELD_ORDER: TaskFormField[] = ['title', 'description', 'status', 'dueDate', 'dueTime'];

const ErrorMessage = ({ id, message }: { id: string; message?: string }) =>
  message ? (
    <p id={id} className="govuk-error-message">
      <span className="govuk-visually-hidden">Error:</span> {message}
    </p>
  ) : null;

const describedBy = (...ids: (string | false | undefined)[]) =>
  ids.filter(Boolean).join(' ') || undefined;

interface TaskFormProps {
  initialValues: TaskFormValues;
  /** New tasks must be due in the future; edits may keep a past due date. */
  requireFutureDueDate: boolean;
  submitLabel: string;
  cancelHref: string;
  isSubmitting: boolean;
  onSubmit: (input: TaskInput) => Promise<unknown>;
  onErrorsChange: (hasErrors: boolean) => void;
}

/**
 * Create/edit task form built from GOV.UK Design System components. Validates
 * on submit (not as the user types), shows an error summary plus inline
 * errors, and maps API validation errors onto the same fields.
 * https://design-system.service.gov.uk/patterns/validation/
 */
export const TaskForm = ({
  initialValues,
  requireFutureDueDate,
  submitLabel,
  cancelHref,
  isSubmitting,
  onSubmit,
  onErrorsChange,
}: TaskFormProps) => {
  const [values, setValues] = useState<TaskFormValues>(initialValues);
  const [errors, setErrors] = useState<TaskFormErrors>({});
  const [formError, setFormError] = useState<string>();
  // Bumped on every submit so the error summary takes focus again each time.
  const [submitCount, setSubmitCount] = useState(0);

  const showErrors = (next: TaskFormErrors, general?: string) => {
    setErrors(next);
    setFormError(general);
    onErrorsChange(Object.keys(next).length > 0 || Boolean(general));
  };

  const set =
    (field: keyof TaskFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitCount((count) => count + 1);
    const validationErrors = validateTaskForm(values, { requireFutureDueDate });
    if (Object.keys(validationErrors).length > 0) {
      showErrors(validationErrors);
      return;
    }
    showErrors({});
    try {
      await onSubmit(toTaskInput(values));
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        const fieldErrors = fromApiErrors(error.details);
        const mapped = Object.keys(fieldErrors).length > 0;
        showErrors(fieldErrors, mapped ? undefined : error.message);
      } else {
        showErrors({}, 'Sorry, the task could not be saved. Try again later.');
      }
    }
  };

  const summary: ErrorSummaryItem[] = [
    ...(formError ? [{ text: formError }] : []),
    ...FIELD_ORDER.filter((field) => errors[field]).map((field) => ({
      text: errors[field]!,
      href: FIELD_IDS[field],
    })),
  ];

  const remaining = DESCRIPTION_MAX_LENGTH - values.description.length;

  return (
    <>
      <ErrorSummary key={submitCount} errors={summary} />

      <form onSubmit={handleSubmit} noValidate>
        <div className={`govuk-form-group${errors.title ? ' govuk-form-group--error' : ''}`}>
          <label className="govuk-label govuk-label--m" htmlFor="title">
            Title
          </label>
          <div id="title-hint" className="govuk-hint">
            For example, review hearing bundle for case 1742
          </div>
          <ErrorMessage id="title-error" message={errors.title} />
          <input
            className={`govuk-input${errors.title ? ' govuk-input--error' : ''}`}
            id="title"
            name="title"
            type="text"
            maxLength={TITLE_MAX_LENGTH + 50}
            value={values.title}
            onChange={set('title')}
            aria-describedby={describedBy('title-hint', errors.title && 'title-error')}
          />
        </div>

        <div
          className={`govuk-form-group govuk-character-count${errors.description ? ' govuk-form-group--error' : ''}`}
        >
          <label className="govuk-label govuk-label--m" htmlFor="description">
            Description (optional)
          </label>
          <div id="description-hint" className="govuk-hint">
            Add anything the person doing the task needs to know
          </div>
          <ErrorMessage id="description-error" message={errors.description} />
          <textarea
            className={`govuk-textarea${errors.description || remaining < 0 ? ' govuk-textarea--error' : ''}`}
            id="description"
            name="description"
            rows={5}
            value={values.description}
            onChange={set('description')}
            aria-describedby={describedBy(
              'description-hint',
              'description-info',
              errors.description && 'description-error',
            )}
          />
          <div
            id="description-info"
            className={`govuk-character-count__message ${remaining < 0 ? 'govuk-error-message' : 'govuk-hint'}`}
            aria-live="polite"
          >
            {remaining < 0
              ? `You have ${Math.abs(remaining).toLocaleString('en-GB')} ${Math.abs(remaining) === 1 ? 'character' : 'characters'} too many`
              : `You have ${remaining.toLocaleString('en-GB')} ${remaining === 1 ? 'character' : 'characters'} remaining`}
          </div>
        </div>

        <div className={`govuk-form-group${errors.status ? ' govuk-form-group--error' : ''}`}>
          <fieldset className="govuk-fieldset">
            <legend className="govuk-fieldset__legend govuk-fieldset__legend--m">Status</legend>
            <ErrorMessage id="status-error" message={errors.status} />
            <div className="govuk-radios govuk-radios--small" data-module="govuk-radios">
              {TASK_STATUSES.map((value, index) => {
                const id = index === 0 ? 'status' : `status-${value}`;
                return (
                  <div className="govuk-radios__item" key={value}>
                    <input
                      className="govuk-radios__input"
                      id={id}
                      name="status"
                      type="radio"
                      value={value}
                      checked={values.status === value}
                      onChange={() => setValues((current) => ({ ...current, status: value }))}
                    />
                    <label className="govuk-label govuk-radios__label" htmlFor={id}>
                      {STATUS_DISPLAY[value].label}
                    </label>
                  </div>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className={`govuk-form-group${errors.dueDate ? ' govuk-form-group--error' : ''}`}>
          <fieldset
            className="govuk-fieldset"
            role="group"
            aria-describedby={describedBy('due-date-hint', errors.dueDate && 'due-date-error')}
          >
            <legend className="govuk-fieldset__legend govuk-fieldset__legend--m">Due date</legend>
            <div id="due-date-hint" className="govuk-hint">
              {requireFutureDueDate && 'The task must be due in the future. '}
              For example, 27 3 {new Date().getFullYear() + 1}
            </div>
            <ErrorMessage id="due-date-error" message={errors.dueDate} />
            <div className="govuk-date-input" id="due-date">
              {(
                [
                  ['day', 'Day', 2],
                  ['month', 'Month', 2],
                  ['year', 'Year', 4],
                ] as const
              ).map(([part, label, width]) => (
                <div className="govuk-date-input__item" key={part}>
                  <div className="govuk-form-group">
                    <label
                      className="govuk-label govuk-date-input__label"
                      htmlFor={`due-date-${part}`}
                    >
                      {label}
                    </label>
                    <input
                      className={`govuk-input govuk-date-input__input govuk-input--width-${width}${errors.dueDate ? ' govuk-input--error' : ''}`}
                      id={`due-date-${part}`}
                      name={`due-date-${part}`}
                      type="text"
                      inputMode="numeric"
                      value={values[part]}
                      onChange={set(part)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
        </div>

        <div className={`govuk-form-group${errors.dueTime ? ' govuk-form-group--error' : ''}`}>
          <fieldset
            className="govuk-fieldset"
            role="group"
            aria-describedby={describedBy('due-time-hint', errors.dueTime && 'due-time-error')}
          >
            <legend className="govuk-fieldset__legend govuk-fieldset__legend--m">Due time</legend>
            <div id="due-time-hint" className="govuk-hint">
              Use the 24-hour clock, for example 14 30
            </div>
            <ErrorMessage id="due-time-error" message={errors.dueTime} />
            <div className="govuk-date-input" id="due-time">
              {(
                [
                  ['hour', 'Hour'],
                  ['minute', 'Minute'],
                ] as const
              ).map(([part, label]) => (
                <div className="govuk-date-input__item" key={part}>
                  <div className="govuk-form-group">
                    <label
                      className="govuk-label govuk-date-input__label"
                      htmlFor={`due-time-${part}`}
                    >
                      {label}
                    </label>
                    <input
                      className={`govuk-input govuk-date-input__input govuk-input--width-2${errors.dueTime ? ' govuk-input--error' : ''}`}
                      id={`due-time-${part}`}
                      name={`due-time-${part}`}
                      type="text"
                      inputMode="numeric"
                      value={values[part]}
                      onChange={set(part)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="govuk-button-group">
          <button type="submit" className="govuk-button" disabled={isSubmitting}>
            {submitLabel}
          </button>
          <Link className="govuk-link" to={cancelHref}>
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
};
