import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AudioBooksProvider } from 'src/providers/audiobooks/audiobooks';
import { AudioBookDetailResult } from 'src/models/audiobookdetailresult';
import { AudioBookStore, STATUS_COMPLETED } from 'src/providers/audiobooks/audiobookstore';
import { MyAudioBook } from 'src/models/myaudiobook';
import { ChangeDetectorRef } from '@angular/core'
import { STATUS_INSTALLING, STATUS_DOWNLOADING, STATUS_PENDING, STATUS_ERROR } from 'src/globals';
import { Subscription } from 'rxjs';
import { AlertController, LoadingController } from '@ionic/angular';

@Component({
    selector: 'page-bookdetails',
    templateUrl: 'bookdetails.html',
})
export class BookDetailsPage implements OnInit, OnDestroy {

    detail: AudioBookDetailResult;

    id: string;
    loading = true;
    downloading = false;
    installing = false;
    pending = false;
    available = false;
    error = false;
    downloadStatus = "";

    subscription: Subscription;

    constructor(private router: Router,
        private activatedRoute: ActivatedRoute,
        private audioBooksProvider: AudioBooksProvider,
        private audioBookStore: AudioBookStore,
        private changeRef: ChangeDetectorRef,
        private alertController: AlertController,
        private loadingCtrl: LoadingController,
    ) {
    }

    async ngOnInit(): Promise<void> {
        this.loading = true;
        this.changeRef.detectChanges();

        this.id = this.activatedRoute.snapshot.params.id;

        let myAudioBook = this.audioBookStore.getMyAudioBook(this.id);

        if (myAudioBook) {
            this.detail = myAudioBook.book;
            this.pending = myAudioBook.statusKey == STATUS_PENDING;
            this.downloading = myAudioBook.statusKey == STATUS_DOWNLOADING;
            this.installing = myAudioBook.statusKey == STATUS_INSTALLING;
            this.available = myAudioBook.statusKey == STATUS_COMPLETED;
            this.error = myAudioBook.statusKey == STATUS_ERROR;

            if (this.pending) {
                this.downloadStatus = "Pendiente de descarga";
            }

            this.loading = false;

        } else {
            let result = await this.audioBooksProvider.GetBookDetail(this.id);
            this.detail = result;
            this.loading = false;
        }

        this.subscription = this.audioBookStore.audioBookEvent.subscribe((audioBook: MyAudioBook) => {
            if (this.id == audioBook.book.Id) {
                this.downloadStatus = audioBook.statusDescription;
                this.pending = false;

                if (audioBook.statusKey == STATUS_COMPLETED) {
                    this.pending = this.downloading = this.installing = false;
                    this.available = true;
                } else {
                    this.downloading = audioBook.statusKey == STATUS_DOWNLOADING;
                    this.installing = audioBook.statusKey == STATUS_INSTALLING;
                }

                this.changeRef.detectChanges();
            }
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    async download() {
        try {
            this.pending = true;
            this.downloadStatus = "Pendiente de descarga";
            this.changeRef.detectChanges();
            await this.audioBookStore.download(this.detail);
        } catch (error) {
            this.downloadStatus = error;
        }
    }

    async cancel() {
        await this.audioBookStore.cancel(this.id);
        this.downloading = false;
        this.installing = false;
        this.pending = false;
        this.changeRef.detectChanges();
    }

    async play() {
        this.router.navigateByUrl(`play/${this.id}`);
    }

    async delete() {
        const confirm = await this.alertController.create({
            header: 'Confirmar',
            message: 'Esto eliminará el audio libro y todos los marcadores creados ¿Está seguro?',
            buttons: [
                {
                    text: 'No',
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: () => {
                    }
                }, {
                    text: 'Si',
                    handler: async () => {
                        const loadingDialog = await this.loadingCtrl.create({
                            message: 'Eliminando audiolibro'
                        });

                        await loadingDialog.present();

                        await this.audioBookStore.delete(this.id);

                        await loadingDialog.dismiss();

                        this.available = false;
                    }
                }
            ]
        });

        await confirm.present();
    }
}
