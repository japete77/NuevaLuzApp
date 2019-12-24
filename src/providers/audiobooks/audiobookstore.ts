import { Injectable } from '@angular/core';
import { AudioBooksProvider } from 'src/providers/audiobooks/audiobooks';
import { FileTransfer, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { File } from '@ionic-native/file/ngx';
import { MyAudioBook } from 'src/models/myaudiobook';
import { Subject } from 'rxjs';
import { Platform } from '@ionic/angular';
import { Zip } from '@ionic-native/zip/ngx';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';
import { AudioBookDetailResult } from 'src/models/audiobookdetailresult';
import { Storage } from '@ionic/storage';

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
    private processingDownload = false;
    private audioBooksKey = 'audiobooks';

    public audioBookEvent = this.audioBookSource;

    constructor(
        private audioBooksProvider: AudioBooksProvider,
        private transfer: FileTransfer,
        private file: File,
        private platform: Platform,
        private diagnostic: Diagnostic,
        private zip: Zip,
        private storage: Storage) {

            this.loadBooks().then(data => {
                if (data) {
                    this.audioBooks = JSON.parse(data);
                }
            });

            // TODO: Check SDCard location
            this.dataDir = this.file.externalDataDirectory;

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
        if (this.processingDownload) return;
        
        this.processingDownload = true;
        
        this.currentAudioBook = this.getNextDownloadItem();

        if (!this.currentAudioBook) { 
            this.processingDownload = false;
            return null; 
        }

        // get link
        const link = await this.audioBooksProvider.GetAudioBookLink(this.currentAudioBook.book.Id);

        // download file
        const zipFile = `${this.dataDir}/${this.currentAudioBook.book.Id}.zip`;
        await this.fileTransfer.download(
            link.AudioBookLink,
            zipFile
        );

        this.currentAudioBook.statusDescription = 'Descarga completada';
        this.currentAudioBook.statusKey = STATUS_DOWNLOADED;
        this.audioBookSource.next(this.currentAudioBook);
        await this.saveBooks();

        // unzip
        this.currentAudioBook.statusDescription = 'Iniciando preparación audilibro';
        this.currentAudioBook.statusKey = STATUS_INSTALLING;
        this.audioBookSource.next(this.currentAudioBook);
        await this.saveBooks();

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
        await this.file.removeFile(`${this.dataDir}`, `${this.currentAudioBook.book.Id}.zip`);

        // move dir to final location
        const entries = await this.file.listDir(`${this.dataDir}`, tmpFolder);
        if (entries[0].isDirectory) {
            await this.file.moveDir(`${this.dataDir}${tmpFolder}`, entries[0].name, `${this.dataDir}`, `${this.currentAudioBook.book.Id}`);
        }

        // remove tmp folder
        await this.file.removeDir(this.dataDir, tmpFolder);

        this.currentAudioBook.statusKey = STATUS_COMPLETED;
        this.currentAudioBook.statusDescription = `Completado`;
        this.audioBookSource.next(this.currentAudioBook);

        await this.saveBooks();

        // process next
        this.processingDownload = false;
        await this.processDownloadQueue();
    }

    async download(book: AudioBookDetailResult) {
        // add new element to the queue
        const newItem: MyAudioBook = {
            book: book,
            path: this.file.dataDirectory,
            filename: `${book.Id}.zip`,
            progress: 0,
            statusDescription: 'Pendiente de descarga',
            errorCode: 0,
            statusKey: STATUS_PENDING
        };

        this.audioBooks.push(newItem);

        await this.saveBooks();

        await this.processDownloadQueue();
    }

    async cancel(id: string) {        
        const index = this.audioBooks.findIndex(value => value.book.Id == id);
        if (index > -1) {
            this.audioBooks.splice(index, 1);
            await this.saveBooks();
        }

        if (this.currentAudioBook && 
            this.currentAudioBook.book.Id == id) {

            this.processingDownload = false;

            if (this.currentAudioBook.statusKey == STATUS_DOWNLOADING) {            
                await this.fileTransfer.abort();
            } 
        }

        await this.processDownloadQueue();
    }

    getMyAudioBooks(): Array<MyAudioBook> {
        return this.audioBooks;
    }

    getMyAudioBook(id: string) : MyAudioBook {
        return this.audioBooks.find(value => value.book.Id == id);        
    }

    private saveBooks() : Promise<any> {
        return this.storage.set(this.audioBooksKey, JSON.stringify(this.audioBooks));
    }

    private loadBooks() : Promise<any> {
        return  this.storage.get(this.audioBooksKey);
    }
}
