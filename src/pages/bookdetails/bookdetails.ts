import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AudioBooksProvider } from 'src/providers/audiobooks/audiobooks';
import { AudioBookDetailResult } from 'src/models/audiobookdetailresult';
import { AudioBookStore, STATUS_COMPLETED } from 'src/providers/audiobooks/audiobookstore';
import { MyAudioBook } from 'src/models/myaudiobook';
import { ChangeDetectorRef } from '@angular/core'
import { STATUS_INSTALLING, STATUS_DOWNLOADING, STATUS_PENDING } from 'src/globals';
import { Subscription } from 'rxjs';

@Component({
  selector: 'page-bookdetails',
  templateUrl: 'bookdetails.html',
})
export class BookDetailsPage implements OnInit, OnDestroy {

    detail: AudioBookDetailResult;

    id: string;
    loading = true;
    downloading = false;
    installing = false;
    pending = false;
    downloadStatus = "";

    subscription: Subscription;

    constructor(private router: Router,
                private activatedRoute: ActivatedRoute,
                private audioBooksProvider: AudioBooksProvider,
                private audioBookStore: AudioBookStore,
                private changeRef: ChangeDetectorRef
                ) {

  }

  ngOnInit(): void {
    this.loading = true;

    this.id = this.activatedRoute.snapshot.params.id;

    console.log(`OnInit ${this.id}`);
    
    this.audioBooksProvider.GetBookDetail(this.id)
      .then((result: AudioBookDetailResult) => {
          this.detail = result;
          this.loading = false;
      }
    );

    const myAudioBook = this.audioBookStore.getMyAudioBook(this.id);
    if (myAudioBook) {
      this.pending = myAudioBook.statusKey == STATUS_PENDING;
      this.downloadStatus = "Pendiente de descarga";
      console.log("OnInit: Pendiente descarga");
    }

    this.subscription = this.audioBookStore.audioBookEvent.subscribe((audioBook: MyAudioBook) => {
      if (this.id == audioBook.id) {                
        this.downloadStatus = audioBook.statusDescription;
        this.pending = false;
        
        if (audioBook.statusKey == STATUS_COMPLETED) {
          this.pending = this.downloading = this.installing = false;
        } else {
          this.downloading = audioBook.statusKey == STATUS_DOWNLOADING;
          this.installing = audioBook.statusKey == STATUS_INSTALLING;  
        }

        this.changeRef.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    console.log(`OnDestroy ${this.id}`);
    this.subscription.unsubscribe();
  }

  async download() {
    try {
      this.pending = true;
      this.downloadStatus = "Pendiente de descarga";
      this.changeRef.detectChanges();
      await this.audioBookStore.download(this.detail.Id, this.detail.Title);
    } catch (error) {
      this.downloadStatus = error;
    }
  }

  async cancel() {
    await this.audioBookStore.cancel(this.id);
    this.downloading = false;
    this.installing = false;
    this.pending = false;
    this.changeRef.detectChanges();
  }
}
