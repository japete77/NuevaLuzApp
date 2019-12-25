import { Component, OnInit } from '@angular/core';
import { DaisyBook } from 'src/providers/daisy/daisybook';
import { ActivatedRoute } from '@angular/router';
import { AudioBookStore } from 'src/providers/audiobooks/audiobookstore';
import { File } from '@ionic-native/file/ngx';

@Component({
    selector: 'play-page',
    templateUrl: 'play.page.html',
})
export class PlayPage implements OnInit {
    daisyBook: DaisyBook;
    id: string;
    bookFolder: string;
    loading = false;

    constructor(
        private activatedRoute: ActivatedRoute,
        private audioBookStore: AudioBookStore,
        private file: File
        ) {
    }

    ngOnInit(): void {
        this.loading = true;

        this.id = this.activatedRoute.snapshot.params.id;
        const abook = this.audioBookStore.getMyAudioBook(this.id);
        this.bookFolder = `${abook.path}/${this.id}/`;

        this.file.readAsBinaryString(this.bookFolder, "ncc.html").then(result => {
            this.daisyBook = new DaisyBook();
            this.daisyBook.parseDaisyBook(result);

            // Read all smil files...
            var promises : Array<Promise<string>> = new Array<Promise<string>>();
            this.daisyBook.body.forEach(s => {
                promises.push(this.file.readAsBinaryString(this.bookFolder, s.filename)); 
            });
            
            Promise.all(promises)
                .then((result : string[]) => {
                    for (var i=0; i<result.length; i++) {
                        this.daisyBook.parseSmils(
                            result[i], 
                            this.daisyBook.body[i].id, 
                            this.daisyBook.body[i].title, 
                            this.daisyBook.body[i].level
                        );     
                    }

                    // Initialize player
                    this.loading = false;
                });
        });
    }
}
