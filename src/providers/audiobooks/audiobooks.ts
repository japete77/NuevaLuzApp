import { Injectable } from '@angular/core';
import { LoadingController, AlertController } from '@ionic/angular';

import * as globalVars from '../../globals';
import { SessionProvider } from '../session/session';
import { http, IHttpResponse } from 'src/shared/http';
import { TitleResult } from 'src/models/titleresult';
import { AudioBookDetailResult } from 'src/models/audiobookdetailresult';
import { AuthorsResult } from 'src/models/authorsresult';
import { Router } from '@angular/router';
import { AudioBookLinkResult } from 'src/models/audiobooklinkresult';

@Injectable()
export class AudioBooksProvider {

    constructor(private session: SessionProvider,
        private loadingCtrl: LoadingController,
        private alert: AlertController,
        private router: Router) {
    }

    public async GetBooksByTitle(index: number, count: number): Promise<TitleResult> {
        return await this.Get<TitleResult>('gettitles', '', index, count, '');
    }

    public GetBooksByAuthor(author: number, index: number, count: number): Promise<TitleResult> {
        return this.GetTitlesByAuthor(author, index, count);
    }

    public async SearchBooksByTitle(text: string, index: number, count: number): Promise<TitleResult> {
        return await this.Get<TitleResult>('searchtitles', text, index, count, '');
    }

    public async GetAuthors(index: number, count: number): Promise<AuthorsResult> {
        return await this.Get<AuthorsResult>('getauthors', '', index, count, '');
    }

    public async SearchAuthors(text: string, index: number, count: number): Promise<AuthorsResult> {
        return await this.Get<AuthorsResult>('searchauthors', text, index, count, '');
    }

    public async GetAuthorsIndexes(): Promise<string[]> {
        return await this.Get<string[]>('GetAuthorsIndexes', '', 0, 0, '');
    }

    public async GetAuthorsFiltered(index: number, count: number, filter: string): Promise<AuthorsResult> {
        return await this.Get<AuthorsResult>('GetAuthorsFiltered', '', index, count, filter);
    }

    public async GetTitlesIndexes(): Promise<string[]> {
        return await this.Get<string[]>('GetTitlesIndexes', '', 0, 0, '');
    }

    public async GetTitlesFiltered(index: number, count: number, filter: string): Promise<TitleResult> {
        return await this.Get<TitleResult>('GetTitlesFiltered', '', index, count, filter);
    }

    public async GetAudioBookLink(id: string): Promise<AudioBookLinkResult> {
        await this.session.initialize();

        const queryUrl = globalVars.baseUrl + 'getaudiobooklink?session=' + this.session.getSession() + '&id=' + id;

        return await this.GetByQuery<AudioBookLinkResult>(queryUrl);
    }

    public async GetBookDetail(id: string): Promise<AudioBookDetailResult> {

        await this.session.initialize();

        const queryUrl = globalVars.baseUrl + 'getaudiobookdetail?session=' + this.session.getSession() + '&id=' + id;

        return this.GetByQuery<AudioBookDetailResult>(queryUrl);
    }

    private async GetTitlesByAuthor(id: number, index: number, count: number): Promise<TitleResult> {

        await this.session.initialize();

        const queryUrl = globalVars.baseUrl + 'gettitlesbyauthor?session=' +
            this.session.getSession() + '&id=' + id + '&index=' + index +
            '&count=' + count;

        return await this.GetByQuery<TitleResult>(queryUrl);
    }

    private async Get<T>(method: string, text: string, index: number, count: number, filter: string): Promise<T> {

        await this.session.initialize();

        let queryUrl = globalVars.baseUrl + method + '?session=' + this.session.getSession() + '&index=' + index + '&count=' + count;

        if (text !== '') {
            queryUrl += '&text=' + text;
        }
        if (filter !== '') {
            queryUrl += '&filter=' + filter;
        }

        return await this.GetByQuery<T>(queryUrl);
    }

    private async GetByQuery<T>(query: string): Promise<T> {

        const loading = await this.loadingCtrl.create({
            message: 'Cargando'
        });

        await loading.present();

        try {
            const response: IHttpResponse<T> = await http<T>(
                new Request(`${query}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                }));

            await loading.dismiss();

            if (!response.ok) {
                const alert = await this.alert.create({
                    header: 'Aviso',
                    subHeader: 'Error recuperando información del servicio de audio libros.',
                    buttons: ['OK']
                });
                await alert.present();
            }
            return response.parsedBody;
        } catch (error) {
            await loading.dismiss();

            this.router.navigateByUrl(
                this.router.createUrlTree(
                    ['/login'], {
                    queryParams: {
                        redirectUrl: this.router.url
                    }
                }
                )
            );
        }
    }
}

