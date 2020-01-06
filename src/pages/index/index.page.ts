import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { DaisyPlayer } from 'src/providers/daisy/daisyplayer';
import { DaisyBook } from 'src/providers/daisy/daisybook';
import { Bookmark } from 'src/models/bookmark';
import { ThrowStmt } from '@angular/compiler';
import { SmilInfo } from 'src/models/smilinfo';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'index',
  templateUrl: 'index.page.html'
})
export class IndexPage implements OnInit {

    book: DaisyBook;
    items: SmilInfo[];
    loading: boolean;

    constructor(
        private location: Location,
        private player: DaisyPlayer,
        private loadingCtrl: LoadingController
    ) {
    }

    async ngOnInit(): Promise<void> {

        this.loading = true;

        const loadingDialog = await this.loadingCtrl.create({
            message: 'Cargando'
        });

        await loadingDialog.present();

        this.book = this.player.getCurrentBook();
        const currentLevel = this.player.getPlayerInfo().position.navigationLevel;
        this.items = this.book.body.filter(f => f.level <= currentLevel);

        await loadingDialog.dismiss();

        this.loading = false;
    }

    seek(index: number) {
        // seek to selected index
        var res : Bookmark = null;
        for (var i = 0; i < this.book.sequence.length; i++) {
            if (this.book.sequence[i].id === this.items[index].id) {
                res = {
                    id: Number(this.book.sequence[i].id),
                    index: i,
                    title: this.book.sequence[i].title,
                    tc: this.book.sequence[i].tcin,
                    som: this.book.sequence[i].som,
                    absoluteTC: this.player.seconds2TC(this.book.sequence[i].tcin + this.book.sequence[i].som)
                };
                break;
            }
        }

        this.player.seek(res);
        this.player.playFromCurrentPos();
        this.location.back();
    }  
}
