import { Component, OnInit } from '@angular/core';
import { AudioBooksProvider } from 'src/providers/audiobooks/audiobooks';
import { Title } from 'src/models/title';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'page-titlebyauthor',
    templateUrl: 'titlesbyauthor.html',
})
export class TitlesByAuthorPage implements OnInit {

    authorid: number;
    titles: Array<Title> = [];
    hasMore: boolean;
    loading = false;

    private pageSize = 25;
    private index = 0;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private audiobooks: AudioBooksProvider
    ) {
    }

    async ngOnInit() {
        this.hasMore = false;
        this.authorid = Number(this.activatedRoute.snapshot.params.id);
        await this.loadMore();
    }

    async loadMore() {
        let value = await this.audiobooks.GetBooksByAuthor(this.authorid, this.index, this.pageSize);
        this.index += this.pageSize;
        this.hasMore = (this.index < value.Total);

        value.Titles.forEach(element => {
            this.titles.push(element);
        });
    }

    gotoDetails(id: string) {
        this.router.navigateByUrl(`bookdetails/${id}`);
    }

}
