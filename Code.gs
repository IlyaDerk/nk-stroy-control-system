function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle(CONFIG.PROJECT_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function success_(data) {
  return { ok: true, data: data || {} };
}

function failure_(error) {
  var message = error && error.message ? error.message : String(error || 'Неизвестная ошибка.');
  console.error(message, error && error.stack ? error.stack : '');
  return { ok: false, message: message };
}

function publicCall_(callback) {
  try {
    return success_(callback());
  } catch (error) {
    return failure_(error);
  }
}
