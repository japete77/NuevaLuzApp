import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, AlertController } from '@ionic/angular';

import { SessionProvider } from 'src/providers/session/session';
import { SessionInfo } from 'src/models/sessioninfo';
import { Router } from '@angular/router';

@Component({
  selector: 'page-audiolibrary',
  templateUrl: 'audiolibrary.html',
})
export class AudioLibraryPage {

  constructor(private router: Router) {
  }

  public gotoByTitleIndex() {
    this.router.navigateByUrl(`bytitle`);
  }

  public gotoByAuthorIndex() {
    this.router.navigateByUrl(`byauthor`);
  }
}
