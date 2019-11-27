import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { SessionProvider } from '../providers/session/session';

export class SecureAccess implements CanActivate {

  constructor(private sessionProvider: SessionProvider, private router: Router) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

    // tslint:disable-next-line:no-string-literal
    const redirectUrl = route['_routerState']['url'];

    if (this.sessionProvider.isAuthenticated()) {
      return true;
    }

    this.router.navigateByUrl(
      this.router.createUrlTree(
        ['/login'], {
          queryParams: {
            redirectUrl
          }
        }
      )
    );

    return false;
  }
  // public authenticated = true;
  // public username;
  // public password;

  // constructor(public navCtrl: NavController,
  //             public session: SessionProvider,
  //             public loadingCtrl: LoadingController) {

  //   this.loadingCtrl.create({
  //       message: 'Verificando credenciales...'
  //   }).then(loading => {
  //       loading.present().then(res => { });

  //       this.session.isReady()
  //       .then(responseIsReady => {
  //         // check if session is available
  //         this.authenticated = session.isAuthenticated();
  //         if (this.authenticated) {
  //           // check if sessions is valid (not expired)
  //           this.session.isSessionValid()
  //           .then(responseIsSessionValid  => {
  //             if (responseIsSessionValid !== globalVars.LOGIN_OK) {
  //               // session not valid, must re-login
  //               this.authenticated = false;
  //               loading.dismiss().then(res => { });
  //             } else {
  //               loading.dismiss().then(res => { });
  //             }
  //           });
  //         } else {
  //           loading.dismiss();
  //         }
  //       });
  //   });
  // }
}
