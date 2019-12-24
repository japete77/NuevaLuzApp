import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { AudioBookStore } from 'src/providers/audiobooks/audiobookstore';

@Component({
  selector: 'page-home',
  templateUrl: 'home.page.html'
})
export class HomePage {

  constructor(private router: Router, public platform: Platform, private store: AudioBookStore) {
  }

  async gotoAudioLibrary() {
    this.router.navigateByUrl(`audiolibrary`);
  }

  gotoAudioBooks() {
    // this.router.navigateByUrl(`audiobooks`);
  }

  gotoNotifications() {
    // this.router.navigateByUrl(`notifications`);
  }

  gotoConfiguration() {
    // this.router.navigateByUrl(`configuration`);
  }
}
