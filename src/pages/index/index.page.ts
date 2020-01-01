import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { DaisyPlayer } from 'src/providers/daisy/daisyplayer';
import { DaisyBook } from 'src/providers/daisy/daisybook';
import { Bookmark } from 'src/models/bookmark';
import { ThrowStmt } from '@angular/compiler';
import { SmilInfo } from 'src/models/smilinfo';

@Component({
  selector: 'index',
  templateUrl: 'index.page.html'
})
export class IndexPage {

    book: DaisyBook;
    items: SmilInfo[];

    constructor(
        private location: Location,
        private player: DaisyPlayer,
    ) {
        this.book = this.player.getCurrentBook();
        const currentLevel = this.player.getPlayerInfo().position.navigationLevel;
        this.items = this.book.body.filter(f => f.level <= currentLevel);
    }

    seek(index: number) {
        // seek to selected index
        var res : Bookmark = null;
        for (var i=0; i<this.book.sequence.length; i++) {
            if (this.book.sequence[i].id===this.items[index].id) {
                res = {
                    id: 0,
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
