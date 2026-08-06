/** Централизованная конфигурация демонстрационного проекта. */
var CONFIG = Object.freeze({
  PROJECT_NAME: 'НК-строй — демо',
  TIMEZONE: 'Europe/Moscow',
  PROPERTY_KEYS: Object.freeze({
    SPREADSHEET_ID: 'SPREADSHEET_ID',
    ROOT_FOLDER_ID: 'ROOT_FOLDER_ID'
  }),
  MAX_FILE_SIZE_MB: 10,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  HEADER_ROW: 2,
  SHEETS: Object.freeze({
    FOREMEN: 'Справочник прорабов',
    OBJECTS: 'Объекты',
    FILE_TYPES: 'Справочник файлов',
    REQUIREMENTS: 'Файлы объектов'
  }),
  HEADERS: Object.freeze({
    FOREMEN: ['ID прораба', 'ФИО прораба', 'Статус'],
    OBJECTS: ['ID объекта', 'Название', 'Адрес', 'Номер договора', 'ID ответственного прораба', 'Ответственный прораб', 'Статус объекта'],
    FILE_TYPES: ['ID типа файла', 'Этап работ', 'Наименование обязательного файла', 'Категория файла', 'Порядок отображения', 'Статус позиции'],
    REQUIREMENTS: ['ID обязательного файла', 'ID объекта', 'Название объекта', 'ID типа файла', 'Этап работ', 'Наименование обязательного файла', 'Категория файла', 'ID ответственного прораба', 'Ответственный прораб', 'Статус', 'Дата предоставления', 'Кто загрузил', 'Ссылка на материалы', 'Дата обновления']
  }),
  STATUS: Object.freeze({
    ACTIVE: 'Действующий',
    OBJECT_ACTIVE: 'Действующий',
    POSITION_ACTIVE: 'Действующая',
    MISSING: 'Не предоставлено',
    PROVIDED: 'Предоставлено'
  }),
  STAGES: Object.freeze(['Запуск объекта', 'Завершение объекта'])
});

function getConfiguredIds_() {
  var properties = PropertiesService.getScriptProperties();
  return {
    spreadsheetId: properties.getProperty(CONFIG.PROPERTY_KEYS.SPREADSHEET_ID),
    rootFolderId: properties.getProperty(CONFIG.PROPERTY_KEYS.ROOT_FOLDER_ID)
  };
}
