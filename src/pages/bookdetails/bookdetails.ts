import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavController, NavParams, LoadingController, AlertController } from '@ionic/angular';

import { SessionProvider } from 'src/providers/session/session';
import { SessionInfo } from 'src/models/sessioninfo';
import { Router, ActivatedRoute } from '@angular/router';
import { AudioBooksProvider } from 'src/providers/audiobooks/audiobooks';
import { AudioBookDetailResult } from 'src/models/audiobookdetailresult';
import { AudioBookStore } from 'src/providers/audiobooks/audiobookstore';
import { MyAudioBook } from 'src/models/myaudiobook';

@Component({
  selector: 'page-bookdetails',
  templateUrl: 'bookdetails.html',
})
export class BookDetailsPage implements OnInit, OnDestroy {

    detail: AudioBookDetailResult;

    loading = true;

    constructor(private router: Router,
                private activatedRoute: ActivatedRoute,
                private audioBooksProvider: AudioBooksProvider,
                private audioBookStore: AudioBookStore
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

    this.audioBookStore.audioBookEvent.subscribe(this.onDownloadProgress);
  }

  ngOnDestroy(): void {
  }

  onDownloadProgress(audioBook: MyAudioBook) {
    console.log(audioBook.statusDescription);
  }

  download() {
    this.audioBookStore.download(this.detail.Id, this.detail.Title);
  }
}
