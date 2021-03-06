import { Component, ViewChildren, AfterViewInit, OnInit } from '@angular/core';
import { DaisyPlayer } from 'src/providers/daisy/daisyplayer';
import { IonRadioGroup } from '@ionic/angular';
import { Location } from '@angular/common';
import { NAV_LEVEL_PHRASE, NAV_LEVEL_PAGE } from 'src/providers/daisy/daisybook';

@Component({
    selector: 'levels',
    templateUrl: 'levels.page.html'
})
export class LevelsPage implements OnInit, AfterViewInit {

    @ViewChildren('radioGroup') radioGroup: IonRadioGroup;

    levels = [];

    constructor(private player: DaisyPlayer, private location: Location) {
    }

    ngOnInit(): void {
        const info = this.player.getPlayerInfo();

        const currentLevel = Number(info.position.navigationLevel);

        const pLevels = this.player.getLevels();
        pLevels.forEach((level, index) => {
            this.levels.push({
                id: index + 1,
                name: 'levels',
                value: index + 1,
                text: `Nivel ${index + 1}`,
                disabled: false,
                checked: currentLevel == (index + 1),
                color: 'primary'
            });
        });

        this.levels.push({
            id: NAV_LEVEL_PHRASE,
            name: 'levels',
            value: NAV_LEVEL_PHRASE,
            text: `Frases`,
            disabled: false,
            checked: currentLevel == NAV_LEVEL_PHRASE,
            color: 'primary'
        });

        if (this.player.getCurrentBook().hasPages) {
            this.levels.push({
                id: NAV_LEVEL_PAGE,
                name: 'levels',
                value: NAV_LEVEL_PAGE,
                text: `Páginas`,
                disabled: false,
                checked: currentLevel == NAV_LEVEL_PAGE,
                color: 'primary'
            });
        }
    }

    ngAfterViewInit(): void {
        if (this.radioGroup) {
            this.radioGroup.value = this.player.getPlayerInfo().position.navigationLevel;
        }
    }

    async levelSelect(event) {
        const info = this.player.getPlayerInfo();
        if (info && info.position) {
            info.position.navigationLevel = Number(event.detail.value);
        }
        await this.player.saveStatus(info);
        this.location.back();
    }
}