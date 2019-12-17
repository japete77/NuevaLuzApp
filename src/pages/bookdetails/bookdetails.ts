import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AudioBooksProvider } from 'src/providers/audiobooks/audiobooks';
import { AudioBookDetailResult } from 'src/models/audiobookdetailresult';
import { AudioBookStore } from 'src/providers/audiobooks/audiobookstore';
import { MyAudioBook } from 'src/models/myaudiobook';
import { ChangeDetectorRef } from '@angular/core'
import { STATUS_INSTALLING } from 'src/globals';

@Component({
  selector: 'page-bookdetails',
  templateUrl: 'bookdetails.html',
})
export class BookDetailsPage implements OnInit {

    detail: AudioBookDetailResult;

    loading = true;
    downloading = false;
    installing = false;
    downloadStatus = "";

    constructor(private router: Router,
                private activatedRoute: ActivatedRoute,
                private audioBooksProvider: AudioBooksProvider,
                private audioBookStore: AudioBookStore,
                private changeRef: ChangeDetectorRef
                ) {

  }

  ngOnInit(): void {
    this.loading = true;

    this.audioBooksProvider.GetBookDetail(this.activatedRoute.snapshot.params.id)
      .then((result: AudioBookDetailResult) => {
          this.detail = result;
          this.loading = false;
      }
    );

    this.audioBookStore.audioBookEvent.subscribe((audioBook: MyAudioBook) => {
      this.downloadStatus = audioBook.statusDescription;
      this.installing = audioBook.statusKey == STATUS_INSTALLING;
      this.changeRef.detectChanges();
    });
  }

  async download() {
    try {
      this.downloading = true;
      this.downloadStatus = "Iniciando descarga";
      await this.audioBookStore.download(this.detail.Id, this.detail.Title);
    } catch (error) {
      this.downloadStatus = error;
    } finally {
      this.downloading = false;  
      this.installing = false;
    }
  }

  async cancel() {
    await this.audioBookStore.cancel();
    this.downloading = false;
    this.installing = false;
  }
}
