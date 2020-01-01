import { Component, OnInit, OnDestroy } from '@angular/core';
import { DaisyBook, NAV_LEVEL_PHRASE, NAV_LEVEL_BOOKMARK, NAV_LEVEL_PAGE, NAV_LEVEL_INTERVAL } from 'src/providers/daisy/daisybook';
import { ActivatedRoute, Router } from '@angular/router';
import { AudioBookStore } from 'src/providers/audiobooks/audiobookstore';
import { File } from '@ionic-native/file/ngx';
import { Media } from '@ionic-native/media/ngx';
import { Subscription } from 'rxjs';
import { PlayerInfo } from 'src/models/playerinfo';
import { MyAudioBook } from 'src/models/myaudiobook';
import { LoadingController } from '@ionic/angular';
import { DaisyPlayer } from 'src/providers/daisy/daisyplayer';

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
        private media: Media,
        private player: DaisyPlayer,
        private loadingCtrl: LoadingController,
        private router: Router
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
            var promises : Array<Promise<string>> = new Array<Promise<string>>();
            this.daisyBook.body.forEach(s => {
                promises.push(this.file.readAsBinaryString(this.bookFolder, s.filename)); 
            });            

            let smilData = await Promise.all(promises);

            for (var i = 0; i < smilData.length; i++) {
                this.daisyBook.parseSmils(
                    smilData[i], 
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
            this.player.playFromCurrentPos();
        }

        this.loading = false;

        this.playerSubscription = this.player.playerEvent.subscribe((info : PlayerInfo) => {
            this.currentStatus = info;
            this.showPlay = this.currentStatus.status != this.media.MEDIA_RUNNING;
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
        const info = this.player.getPlayerInfo();
        if (info && info.position && info.position.navigationLevel) {
            switch (info.position.navigationLevel) {
                case NAV_LEVEL_PHRASE:
                    return "Frase";
                case NAV_LEVEL_BOOKMARK:
                    return "Marcas";
                case NAV_LEVEL_PAGE:
                    return "Página";
                case NAV_LEVEL_INTERVAL:
                    return "Intervalo";
                default:
                    return `Nivel ${info.position.navigationLevel}`;
            }
        }
    }

    selectLevel() {
        this.router.navigateByUrl(`levels`);
    }

    showInfo() {
        this.router.navigateByUrl(`info/${this.id}`);
    }

    goToIndex() {
        this.router.navigateByUrl(`index`);
    }
}
