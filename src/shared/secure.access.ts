import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { SessionProvider } from '../providers/session/session';

export class SecureAccess implements CanActivate {

  constructor(private sessionProvider: SessionProvider, private router: Router) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

    // tslint:disable-next-line:no-string-literal
    const redirectUrl = route['_routerState']['url'];

    this.sessionProvider.initialize()
    .then(result => {
      if (!this.sessionProvider.isAuthenticated()) {
        this.router.navigateByUrl(
          this.router.createUrlTree(
            ['/login'], {
              queryParams: {
                redirectUrl
              }
            }
          ),
          { replaceUrl: true }
        );
      }
    });

    return true;
  }
}
