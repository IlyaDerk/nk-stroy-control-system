function getDemoSeed_() {
  var foremen = [
    ['1', 'Остапенко Денис Витальевич', CONFIG.STATUS.ACTIVE],
    ['2', 'Васина Кристина Евгеньевна', CONFIG.STATUS.ACTIVE]
  ];
  var objects = [
    ['1', '0992 — Мнёвники 13', 'Москва, ул. Мнёвники, д. 13', '0992', '1', foremen[0][1], CONFIG.STATUS.OBJECT_ACTIVE],
    ['2', '1674 — ЖК Сердце Столицы', 'Москва, Шелепихинская наб., д. 34', '1674', '1', foremen[0][1], CONFIG.STATUS.OBJECT_ACTIVE],
    ['3', '1111 — Проспект Маршала Жукова 12', 'Москва, проспект Маршала Жукова, д. 12', '1111', '2', foremen[1][1], CONFIG.STATUS.OBJECT_ACTIVE],
    ['4', '2222 — Москва-Сити', 'Москва, Пресненская наб., д. 8', '2222', '2', foremen[1][1], CONFIG.STATUS.OBJECT_ACTIVE]
  ];
  var fileTypes = [
    ['FILE-001', 'Запуск объекта', 'Видеоотчёт о запуске объекта', 'Видео', 1, CONFIG.STATUS.POSITION_ACTIVE],
    ['FILE-002', 'Запуск объекта', 'Подписанный документ о запуске объекта', 'Документ', 2, CONFIG.STATUS.POSITION_ACTIVE],
    ['FILE-003', 'Завершение объекта', 'Акт приёмки объекта', 'Документ', 3, CONFIG.STATUS.POSITION_ACTIVE],
    ['FILE-004', 'Завершение объекта', 'Фотоотчёт завершённого объекта', 'Фото', 4, CONFIG.STATUS.POSITION_ACTIVE],
    ['FILE-005', 'Завершение объекта', 'Видеоотзыв клиента', 'Видео', 5, CONFIG.STATUS.POSITION_ACTIVE]
  ];
  var statuses = {
    '1': [0, 1, 0, 0, 0], '2': [1, 1, 1, 0, 0],
    '3': [1, 0, 0, 0, 0], '4': [1, 1, 1, 1, 0]
  };
  var requirements = [];
  objects.forEach(function (object) {
    fileTypes.forEach(function (type, index) {
      requirements.push([
        'OBJ-' + object[0] + '-' + type[0], object[0], object[1], type[0], type[1], type[2], type[3],
        object[4], object[5], statuses[object[0]][index] ? CONFIG.STATUS.PROVIDED : CONFIG.STATUS.MISSING,
        '', '', '', ''
      ]);
    });
  });
  return { FOREMEN: foremen, OBJECTS: objects, FILE_TYPES: fileTypes, REQUIREMENTS: requirements };
}

function setupDemoProject() {
  return publicCall_(function () {
    var ids = getConfiguredIds_();
    if (ids.spreadsheetId || ids.rootFolderId) {
      throw new Error('Настройка уже выполнена: Script Properties содержат ID. Чтобы избежать дубликатов, используйте существующие ресурсы или предварительно удалите обе настройки вручную.');
    }
    var spreadsheet = SpreadsheetApp.create(CONFIG.PROJECT_NAME);
    spreadsheet.setSpreadsheetTimeZone(CONFIG.TIMEZONE);
    var defaultSheet = spreadsheet.getSheets()[0];
    defaultSheet.setName(CONFIG.SHEETS.FOREMEN);
    [CONFIG.SHEETS.OBJECTS, CONFIG.SHEETS.FILE_TYPES, CONFIG.SHEETS.REQUIREMENTS].forEach(function (name) {
      spreadsheet.insertSheet(name);
    });
    writeDemoSheets_(spreadsheet);
    var rootFolder = DriveApp.createFolder(CONFIG.PROJECT_NAME);
    PropertiesService.getScriptProperties().setProperties({
      SPREADSHEET_ID: spreadsheet.getId(), ROOT_FOLDER_ID: rootFolder.getId()
    }, false);
    return {
      message: 'Демонстрационный проект успешно настроен.',
      spreadsheetUrl: spreadsheet.getUrl(),
      folderUrl: rootFolder.getUrl()
    };
  });
}

function resetDemoData() {
  return publicCall_(function () {
    var spreadsheet = getSpreadsheet_();
    var root = getRootFolder_();
    var folders = root.getFolders();
    while (folders.hasNext()) folders.next().setTrashed(true);
    writeDemoSheets_(spreadsheet);
    return { message: 'Тестовые строки и статусы восстановлены, созданные приложением папки перемещены в корзину.' };
  });
}

function writeDemoSheets_(spreadsheet) {
  var seed = getDemoSeed_();
  var definitions = [
    ['FOREMEN', CONFIG.SHEETS.FOREMEN, CONFIG.HEADERS.FOREMEN],
    ['OBJECTS', CONFIG.SHEETS.OBJECTS, CONFIG.HEADERS.OBJECTS],
    ['FILE_TYPES', CONFIG.SHEETS.FILE_TYPES, CONFIG.HEADERS.FILE_TYPES],
    ['REQUIREMENTS', CONFIG.SHEETS.REQUIREMENTS, CONFIG.HEADERS.REQUIREMENTS]
  ];
  definitions.forEach(function (definition) {
    var sheet = spreadsheet.getSheetByName(definition[1]);
    if (!sheet) sheet = spreadsheet.insertSheet(definition[1]);
    sheet.clear();
    sheet.getRange(1, 1).setValue(CONFIG.PROJECT_NAME).setFontWeight('bold');
    sheet.getRange(CONFIG.HEADER_ROW, 1, 1, definition[2].length).setValues([definition[2]]).setFontWeight('bold').setBackground('#dbeafe');
    var rows = seed[definition[0]];
    if (rows.length) sheet.getRange(CONFIG.HEADER_ROW + 1, 1, rows.length, definition[2].length).setValues(rows);
    sheet.setFrozenRows(CONFIG.HEADER_ROW);
    sheet.autoResizeColumns(1, definition[2].length);
  });
}
