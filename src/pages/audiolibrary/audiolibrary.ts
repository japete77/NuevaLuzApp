import { Component } from '@angular/core';
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
