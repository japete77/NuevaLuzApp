import { OnInit, OnDestroy, Component } from '@angular/core';
import { MyAudioBook } from 'src/models/myaudiobook';
import { AudioBookStore } from 'src/providers/audiobooks/audiobookstore';
import { STATUS_COMPLETED } from 'src/globals';

@Component({
    selector: 'audiobooks',
    templateUrl: 'myaudiobooks.html',
})
export class MyAudioBooksPage implements OnInit, OnDestroy {
    
    books: MyAudioBook[] = [];

    constructor(private audioBooksStore: AudioBookStore) {
    }

    ngOnInit(): void {
        // Show only audiobooks ready order by title
        this.books = this.audioBooksStore.getMyAudioBooks()
            .filter(f => f.statusKey == STATUS_COMPLETED)
            .sort((a, b) => {
                if (a.book.Title < b.book.Title) return -1;
                else if (a.book.Title > b.book.Title) return 1;
                else return 0;
            });
    }    
    
    ngOnDestroy(): void {
    }
}