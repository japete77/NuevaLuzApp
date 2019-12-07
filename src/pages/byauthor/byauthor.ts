import { Component } from '@angular/core';
import { AudioBooksProvider } from 'src/providers/audiobooks/audiobooks';
import { Router } from '@angular/router';
import { AuthorsResult } from 'src/models/authorsresult';
import { Author } from 'src/models/authors';
import { SessionProvider } from 'src/providers/session/session';

@Component({
  selector: 'page-byauthor',
  templateUrl: 'byauthor.html',
})
export class ByAuthorPage {

  constructor(
    private router: Router,
    private audiobooks: AudioBooksProvider) {
    this.hasMore = false;
    this.loadMore();
  }

  authors: Array<Author> = [];
  hasMore: boolean;
  loading = false;

  private pageSize = 25;
  private index = 0;
  private filterText = '';

  loadMore() {

    this.loading = true;

    if (this.filterText !== '') {
      this.audiobooks.SearchAuthors(this.filterText, this.index, this.pageSize)
        .then((value: AuthorsResult) => {
          this.index += this.pageSize;
          this.hasMore = (this.index < value.Total);

          value.Authors.forEach(element => {
            this.authors.push(element);
          });

          this.loading = false;
        });
    } else {

      this.audiobooks.GetAuthors(this.index, this.pageSize)
        .then((value: AuthorsResult) => {
          this.index += this.pageSize;
          this.hasMore = (this.index < value.Total);

          value.Authors.forEach(element => {
            this.authors.push(element);
          });

          this.loading = false;

        });
    }
  }

  filter(event: any) {

    this.filterText = event.target.value;

    this.loading = true;
    this.index = 0;
    this.authors = [];

    if (this.filterText !== undefined && this.filterText !== '') {

      this.audiobooks.SearchAuthors(event.target.value, this.index, this.pageSize)
      .then((value: AuthorsResult) => {

        this.index += this.pageSize;
        this.hasMore = (this.index < value.Total);

        value.Authors.forEach(element => {
          this.authors.push(element);
        });

        this.loading = false;
      });

    } else {

      this.audiobooks.GetAuthors(this.index, this.pageSize)
      .then((value: AuthorsResult) => {

        this.index += this.pageSize;
        this.hasMore = (this.index < value.Total);

        value.Authors.forEach(element => {
          this.authors.push(element);
        });

        this.loading = false;
      });

    }
  }

  gotoTitlesByAuthor(id: string) {
    this.router.navigateByUrl(`titlesbyauthor/${id}`);
  }

}
