import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { SessionProvider } from '../providers/session/session';
import { Injectable } from '@angular/core';

@Injectable()
export class SecureAccess implements CanActivate {

    constructor(private sessionProvider: SessionProvider, private router: Router) {
    }

    canActivate(route: ActivatedRouteSnapshot) {

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
