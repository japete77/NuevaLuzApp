import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DaisyPlayer } from 'src/providers/daisy/daisyplayer';
import { DaisyBook } from 'src/providers/daisy/daisybook';
import { BoundElementProperty } from '@angular/compiler';
import { AlertController, LoadingController } from '@ionic/angular';
import { AudioBookStore } from 'src/providers/audiobooks/audiobookstore';

@Component({
    selector: 'info',
    templateUrl: 'info.page.html'
})
export class InfoPage implements OnInit {

    book: DaisyBook;
    id: string;

    constructor(
        private router: Router,
        private player: DaisyPlayer,
        private audiobookStore: AudioBookStore,
        private alertController: AlertController,
        private activatedRoute: ActivatedRoute,
        private loadingCtrl: LoadingController
    ) {
    }

    ngOnInit(): void {
        this.book = this.player.getCurrentBook()
        this.id = this.activatedRoute.snapshot.params.id;
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
                        this.player.stop();

                        const loadingDialog = await this.loadingCtrl.create({
                            message: 'Eliminando audiolibro ...'
                        });

                        await loadingDialog.present();

                        await this.audiobookStore.delete(this.id);

                        await loadingDialog.dismiss();

                        this.router.navigateByUrl(`/home`);
                    }
                }
            ]
        });

        await confirm.present();
    }
}
