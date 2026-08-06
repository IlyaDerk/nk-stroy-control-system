function getSpreadsheet_() {
  var id = getConfiguredIds_().spreadsheetId;
  if (!id) throw new Error('Проект не настроен. Запустите setupDemoProject().');
  return SpreadsheetApp.openById(id);
}

function getTable_(sheetKey) {
  var name = CONFIG.SHEETS[sheetKey];
  var headers = CONFIG.HEADERS[sheetKey];
  var sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('Не найден лист «' + name + '».');
  var actual = sheet.getRange(CONFIG.HEADER_ROW, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getDisplayValues()[0];
  var map = {};
  actual.forEach(function (header, index) { if (header) map[String(header).trim()] = index; });
  headers.forEach(function (header) {
    if (map[header] === undefined) throw new Error('На листе «' + name + '» не найден столбец «' + header + '».');
  });
  var count = Math.max(0, sheet.getLastRow() - CONFIG.HEADER_ROW);
  var values = count ? sheet.getRange(CONFIG.HEADER_ROW + 1, 1, count, actual.length).getValues() : [];
  return { sheet: sheet, headers: map, values: values, firstDataRow: CONFIG.HEADER_ROW + 1 };
}

function value_(table, row, header) { return row[table.headers[header]]; }
function sameId_(left, right) { return String(left) === String(right); }

function findUnique_(table, header, id, label) {
  var matches = [];
  table.values.forEach(function (row, index) {
    if (sameId_(value_(table, row, header), id)) matches.push({ row: row, rowNumber: table.firstDataRow + index });
  });
  if (!matches.length) throw new Error(label + ' не найден.');
  if (matches.length > 1) throw new Error(label + ' должен иметь уникальный ID.');
  return matches[0];
}

function validateForeman_(foremanId) {
  var table = getTable_('FOREMEN');
  var found = findUnique_(table, 'ID прораба', foremanId, 'Прораб');
  if (value_(table, found.row, 'Статус') !== CONFIG.STATUS.ACTIVE) throw new Error('Выбранный прораб не является действующим.');
  return { id: String(value_(table, found.row, 'ID прораба')), name: String(value_(table, found.row, 'ФИО прораба')) };
}

function validateObject_(objectId, foremanId) {
  var table = getTable_('OBJECTS');
  var found = findUnique_(table, 'ID объекта', objectId, 'Объект');
  if (!sameId_(value_(table, found.row, 'ID ответственного прораба'), foremanId)) throw new Error('Объект не закреплён за выбранным прорабом.');
  if (value_(table, found.row, 'Статус объекта') !== CONFIG.STATUS.OBJECT_ACTIVE) throw new Error('Выбранный объект не является действующим.');
  return {
    id: String(value_(table, found.row, 'ID объекта')), name: String(value_(table, found.row, 'Название')),
    address: String(value_(table, found.row, 'Адрес')), status: String(value_(table, found.row, 'Статус объекта'))
  };
}

function getForemen() {
  return publicCall_(function () {
    var table = getTable_('FOREMEN');
    return table.values.filter(function (row) { return value_(table, row, 'Статус') === CONFIG.STATUS.ACTIVE; }).map(function (row) {
      return { id: String(value_(table, row, 'ID прораба')), name: String(value_(table, row, 'ФИО прораба')) };
    });
  });
}

function getObjectsByForeman(foremanId) {
  return publicCall_(function () {
    validateForeman_(foremanId);
    var table = getTable_('OBJECTS');
    return table.values.filter(function (row) {
      return sameId_(value_(table, row, 'ID ответственного прораба'), foremanId) && value_(table, row, 'Статус объекта') === CONFIG.STATUS.OBJECT_ACTIVE;
    }).map(function (row) {
      return { id: String(value_(table, row, 'ID объекта')), name: String(value_(table, row, 'Название')), address: String(value_(table, row, 'Адрес')), status: String(value_(table, row, 'Статус объекта')) };
    });
  });
}

function getRequirementsByObject(objectId, foremanId) {
  return getObjectState(objectId, foremanId);
}

function getObjectState(objectId, foremanId) {
  return publicCall_(function () {
    var foreman = validateForeman_(foremanId);
    var object = validateObject_(objectId, foremanId);
    var table = getTable_('REQUIREMENTS');
    var rows = table.values.filter(function (row) {
      return sameId_(value_(table, row, 'ID объекта'), objectId) && sameId_(value_(table, row, 'ID ответственного прораба'), foremanId);
    }).map(function (row) {
      return { id: String(value_(table, row, 'ID обязательного файла')), stage: String(value_(table, row, 'Этап работ')), name: String(value_(table, row, 'Наименование обязательного файла')), category: String(value_(table, row, 'Категория файла')), status: String(value_(table, row, 'Статус')), typeId: String(value_(table, row, 'ID типа файла')) };
    });
    return {
      foreman: foreman,
      object: object,
      requirements: rows,
      maxFileSizeMb: CONFIG.MAX_FILE_SIZE_MB,
      maxRequirementTotalSizeMb: CONFIG.MAX_REQUIREMENT_TOTAL_SIZE_MB
    };
  });
}

function getRemainingRequirementCount(objectId, foremanId) {
  return publicCall_(function () {
    validateForeman_(foremanId); validateObject_(objectId, foremanId);
    var table = getTable_('REQUIREMENTS');
    return { count: table.values.filter(function (row) { return sameId_(value_(table, row, 'ID объекта'), objectId) && sameId_(value_(table, row, 'ID ответственного прораба'), foremanId) && value_(table, row, 'Статус') === CONFIG.STATUS.MISSING; }).length };
  });
}
