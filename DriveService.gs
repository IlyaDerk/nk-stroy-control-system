function getRootFolder_() {
  var id = getConfiguredIds_().rootFolderId;
  if (!id) throw new Error('Корневая папка не настроена. Запустите setupDemoProject().');
  return DriveApp.getFolderById(id);
}

function safeFolderName_(name) {
  return String(name || '').replace(/[\\/:*?"<>|\[\]]/g, '-').replace(/\s+/g, ' ').trim().substring(0, 180) || 'Без названия';
}

function getOrCreateFolder_(parent, name) {
  var safeName = safeFolderName_(name);
  var folders = parent.getFoldersByName(safeName);
  return folders.hasNext() ? folders.next() : parent.createFolder(safeName);
}

function getRequirementFolder_(object, requirement) {
  var objectFolder = getOrCreateFolder_(getRootFolder_(), object.id + ' — ' + object.name);
  var stageFolder = getOrCreateFolder_(objectFolder, requirement.stage);
  return getOrCreateFolder_(stageFolder, requirement.id + ' — ' + requirement.name);
}
