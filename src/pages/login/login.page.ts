import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';

import { SessionProvider } from 'src/providers/session/session';
import { SessionInfo } from 'src/models/sessioninfo';

@Component({
    selector: 'page-login',
    templateUrl: 'login.page.html',
})
export class LoginPage {

    username;
    password;
    verifying = false;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private session: SessionProvider,
        private alert: AlertController) {

        const sessionInfo = this.session.getSessionInfo();

        if (sessionInfo.username && sessionInfo.password) {
            this.username = sessionInfo.username;
            this.password = sessionInfo.password;
            this.login();
        }
    }

    public async login(): Promise<void> {

        // check username is a number
        const userInt = Number(this.username);
        if (isNaN(userInt)) {
            const alert = await this.alert.create({
                header: 'Aviso',
                subHeader: 'Nombre de usuario o contraseña incorrectos.',
                buttons: ['OK']
            });
            await alert.present();
            return;
        }

        this.verifying = true;

        // try to login
        const result: SessionInfo = await this.session.login(userInt, this.password);

        this.verifying = false;

        // check we have a valid session token
        if (result.session !== '') {
            // redirect to audiolibrary...
            this.router.navigateByUrl(
                '/audiolibrary',
                { replaceUrl: true }
            );
        }
    }
}
