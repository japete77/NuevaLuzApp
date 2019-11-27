import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'page-home',
  templateUrl: 'home.page.html'
})
export class HomePage {

  constructor(private router: Router) {
  }

  async gotoAudioLibrary() {
    this.router.navigateByUrl(`audiolibrary`);
  }

  gotoAudioBooks() {
    // this.navCtrl.push(AudioBooksPage);
  }

  gotoNotifications() {
  }

  gotoConfiguration() {
    // this.navCtrl.push(ConfigurationPage);
  }
}
