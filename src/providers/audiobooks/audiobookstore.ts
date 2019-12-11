import { Injectable } from '@angular/core';
import { AudioBooksProvider } from 'src/providers/audiobooks/audiobooks';
import { AudioBook } from 'src/models/audiobook';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { File } from '@ionic-native/file/ngx';
import { MyAudioBook } from 'src/models/myaudiobook';
import { Subject } from 'rxjs';
import { Platform } from '@ionic/angular';
import { Zip } from '@ionic-native/zip/ngx';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';

export const STATUS_PENDING = 'pending';
export const STATUS_DOWNLOADING = 'downloading';
export const STATUS_DOWNLOADED = 'downloaded';
export const STATUS_INSTALLING = 'installing';
export const STATUS_CANCELLED = 'cancelled';
export const STATUS_ERROR = 'error';
export const STATUS_COMPLETED = 'completed';

@Injectable()
export class AudioBookStore {

    private audioBooks: Array<MyAudioBook> = [];
    private audioBookSource = new Subject<MyAudioBook>();
    private fileTransfer: FileTransferObject;
    private currentAudioBook: MyAudioBook;
    private dataDir: string;

    public audioBookEvent = this.audioBookSource.asObservable();

    constructor(
        private audioBooksProvider: AudioBooksProvider,
        private transfer: FileTransfer,
        private file: File,
        private platform: Platform,
        private diagnostic: Diagnostic,
        private zip: Zip) {

            this.platform.ready().then(() => {

                // check storage location
                this.diagnostic.getExternalSdCardDetails().then(result => {
                    const sdData = result.filter(item => item.canWrite);
                    if (sdData && sdData.length > 0) {
                        this.dataDir = sdData[0].path;
                    } else if (this.file.externalDataDirectory) {
                        this.dataDir = this.file.externalDataDirectory;
                    } else {
                        this.dataDir = this.file.dataDirectory;
                    }
                });

                // setup file transfer
                this.fileTransfer = this.transfer.create();
                this.fileTransfer.onProgress(
                    (event: ProgressEvent) => {
                        if (this.currentAudioBook != null) {
                            const progress = Math.floor((event.loaded / event.total) * 100);
                            if (progress !== this.currentAudioBook.progress) {
                                this.currentAudioBook.progress = progress;
                                this.currentAudioBook.statusKey = STATUS_DOWNLOADING;
                                this.currentAudioBook.statusDescription = `${this.currentAudioBook.progress}% descargado...`;
                                this.audioBookSource.next(this.currentAudioBook);
                            }
                        }
                    }
                );
             });
    }

    private getNextDownloadItem(): MyAudioBook {
        if (this.audioBooks.length > 0) {
            for (const value of this.audioBooks) {
                if (value.statusKey === STATUS_PENDING) {
                    return value;
                }
            }
        }
        return null;
    }

    async processDownloadQueue(): Promise<void> {
        this.currentAudioBook = this.getNextDownloadItem();

        if (!this.currentAudioBook) { return null; }

        // get link
        const link = await this.audioBooksProvider.GetAudioBookLink(this.currentAudioBook.id);

        // download file
        const zipFile = `${this.dataDir}/${this.currentAudioBook.id}.zip`;
        await this.fileTransfer.download(
            link.AudioBookLink,
            zipFile
        );

        this.currentAudioBook.statusDescription = 'Descarga completada';
        this.currentAudioBook.statusKey = STATUS_DOWNLOADED;
        this.audioBookSource.next(this.currentAudioBook);

        // unzip
        this.currentAudioBook.statusDescription = 'Iniciando preparación audilibro';
        this.currentAudioBook.statusKey = STATUS_INSTALLING;
        this.audioBookSource.next(this.currentAudioBook);

        const d = new Date();
        const  tmpFolder = d.getTime().toString();

        await this.zip.unzip(zipFile, this.dataDir + '/' + tmpFolder,
            (event: ProgressEvent) => {
                if (this.currentAudioBook != null) {
                    const progress = Math.floor((event.loaded / event.total) * 100);
                    if (progress !== this.currentAudioBook.progress) {
                        this.currentAudioBook.progress = progress;
                        this.currentAudioBook.statusKey = STATUS_INSTALLING;
                        this.currentAudioBook.statusDescription = `Instalando: ${this.currentAudioBook.progress}% completado...`;
                        this.audioBookSource.next(this.currentAudioBook);
                    }
                }
            }
        );

        // clean up .zip file
        await this.file.removeFile(`file://${this.dataDir}`, this.currentAudioBook.filename);

        // move dir to final location
        const entries = await this.file.listDir(`file://${this.dataDir}`, tmpFolder);

        this.currentAudioBook.statusKey = STATUS_COMPLETED;
        this.currentAudioBook.statusDescription = `Completado`;
        this.audioBookSource.next(this.currentAudioBook);

        // process next
        await this.processDownloadQueue();
    }

    async download(id: string, title: string) {
        // add new element to the queue
        const newItem: MyAudioBook = {
            id,
            title,
            path: this.file.dataDirectory,
            filename: `${id}.zip`,
            progress: 0,
            statusDescription: 'Pendiente de descarga',
            errorCode: 0,
            statusKey: STATUS_PENDING
        };

        this.audioBooks.push(newItem);

        await this.processDownloadQueue();
    }

    getMyAudioBooks(): Array<MyAudioBook> {
        return this.audioBooks;
    }
}
