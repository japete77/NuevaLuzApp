import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, AlertController } from '@ionic/angular';
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { File } from '@ionic-native/file/ngx';

import { SessionProvider } from 'src/providers/session/session';
import { SessionInfo } from 'src/models/sessioninfo';
import { Router, ActivatedRoute } from '@angular/router';
import { AudioBooksProvider } from 'src/providers/audiobooks/audiobooks';
import { AudioBookDetailResult } from 'src/models/audiobookdetailresult';

@Component({
  selector: 'page-bookdetails',
  templateUrl: 'bookdetails.html',
})
export class BookDetailsPage {

    detail: AudioBookDetailResult;

    loading = true;

    constructor(private router: Router,
                private activatedRoute: ActivatedRoute,
                private audioBooksProvider: AudioBooksProvider,
                private transfer: FileTransfer,
                private file: File) {

      this.loading = true;

      audioBooksProvider.GetBookDetail(this.activatedRoute.snapshot.params.id)
        .then((result: AudioBookDetailResult) => {
            this.detail = result;
            this.loading = false;
        }
      );
  }

  async download() {
    await this.file.writeFile(this.file.dataDirectory, 'test.txt', 'hola');
  }
}
