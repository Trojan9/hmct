// Lets GOV.UK Frontend styles know JavaScript is available. Kept as a file so
// the Content Security Policy does not need to allow inline scripts.
document.body.className +=
  ' js-enabled' + ('noModule' in HTMLScriptElement.prototype ? ' govuk-frontend-supported' : '');
