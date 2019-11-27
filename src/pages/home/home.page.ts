import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'page-home',
  templateUrl: 'home.page.html'
})
export class HomePage {

  constructor(private router: Router, public platform: Platform) {
    platform.ready().then(result => {
      console.log(`Ready platform: ${result}`);
    });
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
