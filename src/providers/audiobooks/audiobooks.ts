import { Injectable } from '@angular/core';
import { LoadingController, AlertController } from '@ionic/angular';

import * as globalVars from '../../globals';
import { SessionProvider } from '../session/session';
import { GetTitlesResponse } from '../../models/gettitlesresponse';
import { GetAuthorsResponse } from '../../models/getauthorsresponse';
import { SearchTitlesResponse } from '../../models/searchtitlesresponse';
import { SearchAuthorsResponse } from '../../models/searchauthorsresponse';
import { GetAudioBookDetailResponse } from '../../models/getaudiobookdetailresponse';
import { GetAuthorsIndexesResponse } from '../../models/getauthorsindexesresponse';
import { GetTitlesIndexesResponse } from '../../models/gettitlesindexesresponse';
import { GetAuthorsFilteredResponse } from '../../models/getauthorsfilteredresponse';
import { GetTitlesFilteredResponse } from '../../models/gettitlesfilteredresponse';
import { GetTitlesByAuthorResponse } from '../../models/gettitlesbyauthorresponse';
import { http, IHttpResponse } from 'src/shared/http';
import { TitleResult } from 'src/models/titleresult';
import { AudioBookDetailResult } from 'src/models/audiobookdetailresult';
import { AuthorsResult } from 'src/models/authorsresult';

@Injectable()
export class AudioBooksProvider {

  constructor(private session: SessionProvider,
              private loadingCtrl: LoadingController,
              private alert: AlertController) {
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

  public async GetAuthorsIndexes(): Promise<GetAuthorsIndexesResponse> {
    return await this.Get<GetAuthorsIndexesResponse>('GetAuthorsIndexes', '', 0, 0, '');
  }

  public async etAuthorsFiltered(index: number, count: number, filter: string): Promise<GetAuthorsFilteredResponse> {
    return await this.Get<GetAuthorsFilteredResponse>('GetAuthorsFiltered', '', index, count, filter);
  }

  public async GetTitlesIndexes(): Promise<GetTitlesIndexesResponse> {
    return await this.Get<GetTitlesIndexesResponse>('GetTitlesIndexes', '', 0, 0, '');
  }

  public async GetTitlesFiltered(index: number, count: number, filter: string): Promise<GetTitlesFilteredResponse> {
    return await this.Get<GetTitlesFilteredResponse>('GetTitlesFiltered', '', index, count, filter);
  }

  public async GetBookDetail(id: string): Promise<AudioBookDetailResult> {
    const queryUrl = globalVars.baseUrl + 'getaudiobookdetail?session=' + this.session.getSession() + '&id=' + id;

    return this.GetByQuery<AudioBookDetailResult>(queryUrl);
  }

  private async GetTitlesByAuthor(id: number, index: number, count: number): Promise<TitleResult> {
    const queryUrl = globalVars.baseUrl + 'gettitlesbyauthor?session=' +
      this.session.getSession() + '&id=' + id + '&index=' + index +
      '&count=' + count;

    return await this.GetByQuery<TitleResult>(queryUrl);
  }

  private async Get<T>(method: string, text: string, index: number, count: number, filter: string): Promise<T> {
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
        message: 'Cargando...'
      });

    await loading.present();

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
  }
}

