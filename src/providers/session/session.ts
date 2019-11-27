import { Injectable } from '@angular/core';
import { File } from '@ionic-native/file/ngx';
import { AlertController } from '@ionic/angular';
import { LoadingController } from '@ionic/angular';
import * as globalVars from '../../globals';
import { LoginResult } from '../../models/loginresponse';
import { SessionInfo } from '../../models/sessioninfo';
import { stringify, parse } from 'querystring';
import { GetTitlesResponse } from 'src/models/gettitlesresponse';
import { http, IHttpResponse } from 'src/shared/http';

@Injectable()
export class SessionProvider {

  private initialized: boolean;
  private sessionInfo: SessionInfo = new SessionInfo();
  private sessionStatusFilename = 'status.json';

  constructor(private file: File,
              private loadingCtrl: LoadingController,
              private alert: AlertController) {

    this.initialized = false;
  }

  public async isReady(): Promise<boolean> {
    if (this.initialized) {
      return true;
    } else {
      const session = await this.loadSession();
      if (session) {
        this.sessionInfo = session;
        this.initialized = true;
        return true;
      } else {
        return false;
      }
    }
  }

  async login(username: number, pass: string): Promise<SessionInfo> {

    this.sessionInfo.username = username;
    this.sessionInfo.password = pass;
    this.sessionInfo.session = '';

    const loading = await this.loadingCtrl.create({
        message: 'Verificando credenciales...'
    });

    await loading.present();

    let loginResponse: IHttpResponse<LoginResult>;

    try {
      loginResponse = await http<LoginResult>(
        new Request(`${globalVars.baseUrl}login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: username, password: pass })
        })
      );
    } catch (error) {
      loading.dismiss();
      this.alert.create({
        header: 'Aviso',
        subHeader: 'Biblioteca de audio libros fuera de servicio.',
        buttons: ['OK']
      }).then(alert => alert.present());
    }

    await loading.dismiss();

    if (loginResponse.ok && loginResponse.parsedBody.Success) {
      this.sessionInfo.session = loginResponse.parsedBody.Session;
    } else {
      const alert = await this.alert.create({
        header: 'Aviso',
        subHeader: 'Acceso denegado. El usuario o la contraseña son incorrectos.',
        buttons: ['OK']
      });
      await alert.present();
      return this.sessionInfo;
    }

    try {
      const resultSave = await this.saveSession();
    } catch {
      console.log('Error guardando la sesión de usuario.');
    }

    return this.sessionInfo;
  }

  public getSession(): string {
    return this.sessionInfo.session;
  }

  public isAuthenticated(): boolean {
    if (!this.sessionInfo ||
        !this.sessionInfo.session ||
        this.sessionInfo.session === '') {
          return false;
    } else {
      return true;
    }
  }

  public async isSessionValid(): Promise<number> {

    const requestOptions = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    };

    const getTitlesResponse: GetTitlesResponse = await (
        await fetch(`${globalVars.baseUrl}gettitles?session=${this.sessionInfo.session}&index=1&count=1`, requestOptions)
      )
      .json()
      .catch(error => {
        this.alert.create({
          header: 'Aviso',
          subHeader: 'Biblioteca de audio libros fuera de servicio.',
          buttons: ['OK']
        }).then(alert => alert.present());
      });

    return globalVars.LOGIN_OK;
    // if (getTitlesResponse.GetTitlesResult) {
    //   return globalVars.LOGIN_OK;
    // } else if (response.status === globalVars.HTTP_NOT_FOUND) {
    //     return globalVars.SERVICE_UNAVAILABLE;
    // } else if (response.status === globalVars.HTTP_NOT_ALLOWED) {
    //   // retry login just in case the session has expired
    //   const loginResponse = await this.login(this.sessionInfo.username, this.sessionInfo.password)
    //   if (loginResponse) {
    //     this.sessionInfo = loginResponse;
    //     return globalVars.LOGIN_OK;
    //   } else {
    //     return globalVars.LOGIN_FAILED;
    //   }
    // }
  }

  private async loadSession(): Promise<SessionInfo> {
    const data = await this.file.readAsBinaryString(this.file.dataDirectory, this.sessionStatusFilename);
    return data ? JSON.parse(data) : null;
  }

  public async saveSession(): Promise<boolean> {
    const checkFileResponse = await this.file.checkFile(this.file.dataDirectory, this.sessionStatusFilename);

    if (checkFileResponse) {
      await this.file.removeFile(this.file.dataDirectory, this.sessionStatusFilename);

      const writeFileResponse = await this.file.writeFile(
        this.file.dataDirectory,
        this.sessionStatusFilename,
        JSON.stringify(this.sessionInfo),
        {
          replace: true,
          append: false,
        }
      );

      if (writeFileResponse) {
        return true;
      }
    }
    return false;
  }

  public async clearSessionInfo(): Promise<boolean> {
    this.sessionInfo.username = null;
    this.sessionInfo.password = '';
    this.sessionInfo.session = '';
    return await this.saveSession();
  }
}


