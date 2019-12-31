import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DaisyBook } from 'src/providers/daisy/daisybook';
import { ActivatedRoute } from '@angular/router';
import { AudioBookStore } from 'src/providers/audiobooks/audiobookstore';
import { File } from '@ionic-native/file/ngx';
import { DaisyPlayer } from 'src/providers/daisy/daisyplayer';
import { Subscription } from 'rxjs';
import { PlayerInfo } from 'src/models/playerinfo';
import { MyAudioBook } from 'src/models/myaudiobook';
import { LoadingController } from '@ionic/angular';

@Component({
    selector: 'play-page',
    templateUrl: 'play.page.html',
})
export class PlayPage implements OnInit, OnDestroy {

    id: string;
    daisyBook: DaisyBook;
    abook: MyAudioBook;
    bookFolder: string;
    playerSubscription: Subscription;
    currentStatus: PlayerInfo;
    loading = true;
    showPlay = false;

    constructor(
        private activatedRoute: ActivatedRoute,
        private audioBookStore: AudioBookStore,
        private file: File,
        private player: DaisyPlayer,
        private loadingCtrl: LoadingController
        ) {
    }

    async ngOnInit(): Promise<void> {

        this.id = this.activatedRoute.snapshot.params.id;

        this.abook = this.audioBookStore.getMyAudioBook(this.id);

        const currentPlayingBook = this.player.getCurrentBook();

        if (!currentPlayingBook || currentPlayingBook.id != this.id) {

            if (currentPlayingBook) this.player.stop();
            
            this.loading = true;

            const loadingDialog = await this.loadingCtrl.create({
                message: 'Cargando audiolibro ...'
            });
    
            await loadingDialog.present();
            
            this.bookFolder = `${this.abook.path}/${this.id}/`;
    
            const result = await this.file.readAsBinaryString(this.bookFolder, "ncc.html");
            this.daisyBook = new DaisyBook();
            this.daisyBook.id = this.id;
            this.daisyBook.parseDaisyBook(result);
    
            // Read all smil files...
            for (let i = 0; i < this.daisyBook.body.length; i++) {
                const smilData = await this.file.readAsBinaryString(this.bookFolder, this.daisyBook.body[i].filename); 
                this.daisyBook.parseSmils(
                    smilData, 
                    this.daisyBook.body[i].id, 
                    this.daisyBook.body[i].title, 
                    this.daisyBook.body[i].level
                );
            }
    
            await this.player.loadBook(this.daisyBook);
        
            // Close loading dialog
            await loadingDialog.dismiss();
        } else {
            this.daisyBook = this.player.getCurrentBook();
        }

        this.loading = false;

        this.playerSubscription = this.player.playerEvent.subscribe((info : PlayerInfo) => {
            this.currentStatus = info;
        });                       
    }

    ngOnDestroy(): void {
        if (this.playerSubscription) {
            this.playerSubscription.unsubscribe();
        }
    }

    async next() {
        await this.player.next();
    }

    async prev() {
        await this.player.prev();
    }

    play() {
        if (this.showPlay) {
            this.player.playFromCurrentPos();
        } else {
            this.player.pause();
        }
        this.showPlay = !this.showPlay;
    }

    getLevel() {
        return "Nivel 1";
    }
}
