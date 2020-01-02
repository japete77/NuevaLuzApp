import { Component, OnInit } from '@angular/core';
import { DaisyPlayer } from 'src/providers/daisy/daisyplayer';
import { Bookmark } from 'src/models/bookmark';
import { Location } from '@angular/common';

@Component({
    selector: 'bookmarks',
    templateUrl: 'bookmarks.page.html',
})
export class BookmarksPage implements OnInit {

    bookmarks: Bookmark[];
    selectedIndex = -1;

    constructor(
        private player: DaisyPlayer,
        private location: Location
    ) {
    }

    ngOnInit(): void {
        this.bookmarks = this.player.getPlayerInfo().bookmarks;
    }

    async deleteBookmark(index: number) {
        this.bookmarks.splice(index, 1);
        await this.player.saveBooksmarks(this.bookmarks);
    }

    seekTo(index : number) {
        this.player.seek(this.bookmarks[index]);
        this.location.back();
    }
}
