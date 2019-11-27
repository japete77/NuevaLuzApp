// Global variables
export let baseUrl = 'https://jvrr26o3jl.execute-api.eu-west-1.amazonaws.com/production/';
export let workingDir = '';
export let playDir = '';
export let appleDevice;

export let internalStorage = null;
export let externalStorage = null;
export let externalStorage2 = null;

export let extStorageBase = [ 'file:///Removable/', 'file:///mnt/sdcard/',
'file:///mnt/', 'file:///mnt/', 'file:///mnt/sdcard/',
'file:///mnt/', 'file:///mnt/', 'file:///mnt/sdcard/',
'file:///storage/', 'file:///mnt/' ];

export let extStorageDirs = [ 'MicroSD', 'ext_sd',
'external', 'sdcard2', '_ExternalSD',
'sdcard-ext', 'external1', 'external_sd',
'extSdCard', 'extSdCard' ];

export let storageTypes = [ 'Interno', 'Externo 1', 'Externo 2' ];

export let abooksSatusFilename = 'status.json';

export let LOGIN_OK = 0;
export let LOGIN_FAILED = 1;
export let SERVICE_UNAVAILABLE = 2;
export let HTTP_NOT_FOUND = 404;
export let HTTP_NOT_ALLOWED = 405;

export let STATUS_PENDING = 'pending';
export let STATUS_DOWNLOADING = 'downloading';
export let STATUS_DOWNLOADED = 'downloaded';
export let STATUS_INSTALLING = 'installing';
export let STATUS_CANCELLED = 'cancelled';
export let STATUS_ERROR = 'error';
export let STATUS_COMPLETED = 'completed';
