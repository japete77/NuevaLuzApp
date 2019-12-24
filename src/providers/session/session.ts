import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { LoadingController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import * as globalVars from '../../globals';
import { SessionInfo } from '../../models/sessioninfo';
import { http, IHttpResponse } from 'src/shared/http';
import { LoginResult } from 'src/models/loginresult';

@Injectable()
export class SessionProvider {

  private initialized: boolean;
  private sessionInfo: SessionInfo;
  private sesionKey = 'session_info';

  constructor(private loadingCtrl: LoadingController,
              private alert: AlertController,
              private storage: Storage) {

    this.initialized = false;

    this.sessionInfo = {
      currentBook: null,
      password: null,
      playDir: null,
      session: null,
      username: null,
      workingDir: null
    };

    this.initialize().then(result => {
      this.initialized = result;
    });
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public async initialize(): Promise<boolean> {
    const session = await this.loadSession();
    if (session) {
      this.sessionInfo = session;
      return true;
    } else {
      return false;
    }
  }

  public getSessionInfo(): SessionInfo {
    return this.sessionInfo;
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
      await this.saveSession(this.sessionInfo);
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

  private async loadSession(): Promise<SessionInfo> {
    return await this.storage.get(this.sesionKey);
  }

  public async saveSession(session: SessionInfo): Promise<any> {
    await this.storage.set(this.sesionKey, session);
    this.sessionInfo = session;
  }

  public async clearSessionInfo(): Promise<any> {
    this.sessionInfo = null;
    await this.storage.remove(this.sesionKey);
  }
}


