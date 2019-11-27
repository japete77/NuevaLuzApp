import { Component } from '@angular/core';
import { AudioBooksProvider } from 'src/providers/audiobooks/audiobooks';
import { Title } from 'src/models/title';
import { Router, ActivatedRoute } from '@angular/router';
import { TitleResult } from 'src/models/titleresult';

@Component({
  selector: 'page-titlebyauthor',
  templateUrl: 'titlesbyauthor.html',
})
export class TitlesByAuthorPage {

  authorid: number;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private audiobooks: AudioBooksProvider
  ) {
    this.hasMore = false;
    this.authorid = Number(this.activatedRoute.snapshot.params.id);
    this.loadMore();
  }

  titles: Array<Title> = [];
  hasMore: boolean;
  loading = false;

  private pageSize = 25;
  private index = 0;
  private filterText = '';

  loadMore() {
    this.audiobooks.GetBooksByAuthor(this.authorid, this.index, this.pageSize)
    .then((value: TitleResult) => {
        this.index += this.pageSize;
        this.hasMore = (this.index < value.Total);

        value.Titles.forEach(element => {
        this.titles.push(element);
        });
    });
  }

  // filter(event: any) {

  //   this.filterText = event.target.value;

  //   this.loading = true;
  //   this.index = 0;
  //   this.titles = [];

  //   if (this.filterText !== undefined && this.filterText !== '')
  //   {

  //     this.audiobooks.SearchBooksByTitle(event.target.value, this.index, this.pageSize)
  //     .subscribe(value => {

  //       this.index += this.pageSize;
  //       this.hasMore = (this.index < value.SearchTitlesResult.Total);

  //       value.SearchTitlesResult.Titles.forEach(element => {
  //         this.titles.push(element);
  //       });

  //       this.loading = false;
  //     });

  //   } else {

  //     this.audiobooks.GetBooksByTitle(this.index, this.pageSize)
  //     .subscribe(value => {

  //       this.index += this.pageSize;
  //       this.hasMore = (this.index < value.GetTitlesResult.Total);

  //       value.GetTitlesResult.Titles.forEach(element => {
  //         this.titles.push(element);
  //       });

  //       this.loading = false;
  //     });

  //   }
  // }

  gotoDetails(id: string) {
    this.router.navigateByUrl(`bookdetails/${id}`);
  }

}
