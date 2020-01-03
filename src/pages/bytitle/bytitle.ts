import { Component, OnInit } from '@angular/core';
import { AudioBooksProvider } from 'src/providers/audiobooks/audiobooks';
import { Title } from 'src/models/title';
import { Router } from '@angular/router';
import { TitleResult } from 'src/models/titleresult';
import { SessionProvider } from 'src/providers/session/session';

@Component({
    selector: 'page-bytitle',
    templateUrl: 'bytitle.html',
})
export class ByTitlePage implements OnInit {

    titles: Array<Title> = [];
    hasMore: boolean;
    loading = false;
    private pageSize = 25;
    private index = 0;
    private filterText = '';

    constructor(
        private router: Router,
        private audiobooks: AudioBooksProvider) {
    }

    async ngOnInit() {
        this.hasMore = false;
        await this.loadMore();
    }

    async loadMore() {
        this.loading = true;
        if (this.filterText !== '') {
            let value = await this.audiobooks.SearchBooksByTitle(this.filterText, this.index, this.pageSize);
            this.index += this.pageSize;
            this.hasMore = (this.index < value.Total);

            value.Titles.forEach(element => {
                this.titles.push(element);
            });
            this.loading = false;
        } else {
            let value = await this.audiobooks.GetBooksByTitle(this.index, this.pageSize);
            this.index += this.pageSize;
            this.hasMore = (this.index < value.Total);
            value.Titles.forEach(element => {
                this.titles.push(element);
            });
            this.loading = false;
        }
    }

    filter(event: any) {
        this.filterText = event.target.value;

        this.loading = true;
        this.index = 0;
        this.titles = [];

        if (this.filterText !== undefined && this.filterText !== '') {

            this.audiobooks.SearchBooksByTitle(event.target.value, this.index, this.pageSize)
                .then((value: TitleResult) => {

                    this.index += this.pageSize;
                    this.hasMore = (this.index < value.Total);

                    value.Titles.forEach(element => {
                        this.titles.push(element);
                    });

                    this.loading = false;
                });

        } else {

            this.audiobooks.GetBooksByTitle(this.index, this.pageSize)
                .then((value: TitleResult) => {

                    this.index += this.pageSize;
                    this.hasMore = (this.index < value.Total);

                    value.Titles.forEach(element => {
                        this.titles.push(element);
                    });

                    this.loading = false;
                });
        }
    }

    gotoDetails(id: string) {
        this.router.navigateByUrl(`bookdetails/${id}`);
    }

}
