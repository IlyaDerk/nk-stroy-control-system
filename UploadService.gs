function uploadRequirementFiles(payload) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    return success_(uploadRequirementFilesLocked_(payload));
  } catch (error) {
    return failure_(error);
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function uploadRequirementFilesLocked_(payload) {
  if (!payload || !payload.foremanId || !payload.objectId || !payload.requirementId) throw new Error('Переданы неполные данные загрузки.');
  if (!Array.isArray(payload.files) || !payload.files.length) throw new Error('Не выбраны файлы для обязательной позиции.');
  var foreman = validateForeman_(payload.foremanId);
  var object = validateObject_(payload.objectId, payload.foremanId);
  var table = getTable_('REQUIREMENTS');
  var found = findUnique_(table, 'ID обязательного файла', payload.requirementId, 'Обязательная позиция');
  var row = found.row;
  if (!sameId_(value_(table, row, 'ID объекта'), object.id)) throw new Error('Обязательная позиция не относится к выбранному объекту.');
  if (!sameId_(value_(table, row, 'ID ответственного прораба'), foreman.id)) throw new Error('Обязательная позиция не относится к выбранному прорабу.');
  if (value_(table, row, 'Статус') !== CONFIG.STATUS.MISSING) throw new Error('Эта обязательная позиция уже предоставлена.');
  var requirement = { id: String(value_(table, row, 'ID обязательного файла')), stage: String(value_(table, row, 'Этап работ')), name: String(value_(table, row, 'Наименование обязательного файла')) };
  var decoded = payload.files.map(validateAndDecodeFile_);
  var totalSize = decoded.reduce(function (sum, file) { return sum + file.bytes.length; }, 0);
  if (totalSize > CONFIG.MAX_REQUIREMENT_TOTAL_SIZE_BYTES) {
    throw new Error('Общий размер файлов позиции превышает допустимые ' + CONFIG.MAX_REQUIREMENT_TOTAL_SIZE_MB + ' МБ.');
  }
  var folder = getRequirementFolder_(object, requirement);
  var created = [];
  try {
    decoded.forEach(function (file) {
      created.push(folder.createFile(Utilities.newBlob(file.bytes, file.mimeType, file.name)));
    });
  } catch (error) {
    trashFiles_(created);
    throw new Error('Не удалось сохранить все файлы позиции. Созданные в этой попытке файлы удалены. ' + error.message);
  }
  var timestamp = new Date();
  var updates = { 'Статус': CONFIG.STATUS.PROVIDED, 'Дата предоставления': timestamp, 'Кто загрузил': foreman.name, 'Ссылка на материалы': folder.getUrl(), 'Дата обновления': timestamp };
  var updatedRow = row.slice();
  Object.keys(updates).forEach(function (header) { updatedRow[table.headers[header]] = updates[header]; });
  try {
    table.sheet.getRange(found.rowNumber, 1, 1, updatedRow.length).setValues([updatedRow]);
    SpreadsheetApp.flush();
  } catch (error) {
    trashFiles_(created);
    throw new Error('Не удалось обновить строку в Google Sheets. Созданные в этой попытке файлы удалены. ' + error.message);
  }
  return { requirementId: requirement.id, requirementName: requirement.name, uploadedFileCount: created.length, folderUrl: folder.getUrl() };
}

function trashFiles_(files) {
  files.forEach(function (file) { try { file.setTrashed(true); } catch (ignored) {} });
}

function validateAndDecodeFile_(file) {
  if (!file || !file.name || typeof file.base64 !== 'string') throw new Error('Файл передан в неверном формате.');
  var content = file.base64.replace(/^data:[^;]+;base64,/, '');
  var bytes;
  try { bytes = Utilities.base64Decode(content); } catch (error) { throw new Error('Не удалось декодировать файл «' + file.name + '».'); }
  if (bytes.length > CONFIG.MAX_FILE_SIZE_BYTES) throw new Error('Файл «' + file.name + '» превышает допустимый размер ' + CONFIG.MAX_FILE_SIZE_MB + ' МБ.');
  return { name: String(file.name).substring(0, 240), mimeType: file.mimeType || 'application/octet-stream', bytes: bytes };
}
