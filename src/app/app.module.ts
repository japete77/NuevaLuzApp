import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy, Routes, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { IonicStorageModule } from '@ionic/storage';
import { Zip } from '@ionic-native/zip/ngx';
import { Diagnostic } from '@ionic-native/diagnostic/ngx';
import { Media } from '@ionic-native/media/ngx';
import { File } from '@ionic-native/file/ngx';
import { FileTransfer } from '@ionic-native/file-transfer/ngx';

import { AppComponent } from './app.component';
import { LoginPage } from 'src/pages/login/login.page';
import { HomePage } from 'src/pages/home/home.page';
import { AudioLibraryPage } from 'src/pages/audiolibrary/audiolibrary';
import { ByTitlePage } from 'src/pages/bytitle/bytitle';
import { PlayPage} from 'src/pages/play/play.page';
import { SessionProvider } from 'src/providers/session/session';
import { AudioBooksProvider } from 'src/providers/audiobooks/audiobooks';
import { SecureAccess } from 'src/shared/secure.access';
import { BookDetailsPage } from 'src/pages/bookdetails/bookdetails';
import { ByAuthorPage } from 'src/pages/byauthor/byauthor';
import { TitlesByAuthorPage } from 'src/pages/titlesbyauthor/titlesbyauthor';
import { AudioBookStore } from 'src/providers/audiobooks/audiobookstore';
import { MyAudioBooksPage } from 'src/pages/myaudiobooks/myaudiobooks';
import { DaisyPlayer } from 'src/providers/daisy/daisyplayer';
import { DaisyBook } from 'src/providers/daisy/daisybook';
import { LevelsPage } from 'src/pages/levels/levels.page';
import { InfoPage } from 'src/pages/info/info.page';
import { IndexPage } from 'src/pages/index/index.page';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', component: LoginPage },
  { path: 'home', component: HomePage },
  { path: 'myaudiobooks' , component: MyAudioBooksPage },
  { path: 'audiolibrary' , canActivate: [SecureAccess], component: AudioLibraryPage },
  { path: 'bytitle' , canActivate: [SecureAccess], component: ByTitlePage },
  { path: 'byauthor' , canActivate: [SecureAccess], component: ByAuthorPage },
  { path: 'titlesbyauthor/:id' , canActivate: [SecureAccess], component: TitlesByAuthorPage },
  { path: 'bookdetails/:id', canActivate: [SecureAccess], component: BookDetailsPage },
  { path: 'play/:id', canActivate: [SecureAccess], component: PlayPage },
  { path: 'levels', canActivate: [SecureAccess], component: LevelsPage },
  { path: 'info/:id', canActivate: [SecureAccess], component: InfoPage },
  { path: 'index', canActivate: [SecureAccess], component: IndexPage },
];

@NgModule({
  declarations: [
    AppComponent,
    LoginPage,
    HomePage,
    AudioLibraryPage,
    ByTitlePage,
    BookDetailsPage,
    ByAuthorPage,
    TitlesByAuthorPage,
    PlayPage,
    MyAudioBooksPage,
    LevelsPage,
    InfoPage,
    IndexPage,
  ],
  entryComponents: [
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BrowserModule,
    IonicModule.forRoot(),
    RouterModule.forRoot(routes),
    IonicStorageModule.forRoot(),
  ],
  exports:  [RouterModule ],
  providers: [
    StatusBar,
    SplashScreen,
    SessionProvider,
    File,
    FileTransfer,
    AudioBooksProvider,
    AudioBookStore,
    Zip,
    SecureAccess,
    Diagnostic,
    Media,
    DaisyPlayer,
    DaisyBook,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
