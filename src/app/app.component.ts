import { Component, OnInit } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { BackgroundMode } from '@ionic-native/background-mode/ngx';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit {
    constructor(
        private platform: Platform,
        private background: BackgroundMode,
        private splashScreen: SplashScreen,
        private statusBar: StatusBar,
    ) {
    }

    async ngOnInit(): Promise<void> {
        let platform = await this.platform.ready();
        console.log(`The platform is ready: ${platform}`);

        if (this.platform.is('android')) {
            console.log('Device Android');
        } else if (this.platform.is('ios')) {
            console.log('Device iOS');

            // Only valid for iOS
            this.background.setDefaults({
                title: 'Audioteca Nueva Luz',
                ticker: 'Audioteca Nueva Luz',
                text: 'Audioteca Nueva Luz'
            });

            this.background.enable();
            console.log('Background mode enabled');
        }

        // this.background.setEnabled(true);
        // this.statusBar.styleDefault();
        // this.splashScreen.hide();    
    }
}
