import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { SessionProvider } from 'src/providers/session/session';
import { File } from '@ionic-native/file/ngx';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private session: SessionProvider,
    private file: File
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then((platform) => {
      console.log(`The platform is ready: ${platform}`);
      if (this.platform.is('android')) {
        console.log('Is Android');
      }
      console.log(this.file);
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }
}
