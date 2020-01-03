import { Injectable } from '@angular/core';

import { Media } from '@ionic-native/media/ngx';
import { timer, Subscription, Subject } from 'rxjs';
import { File } from '@ionic-native/file/ngx';
import { MusicControls } from '@ionic-native/music-controls/ngx';

import { PlayerInfo } from 'src/models/playerinfo';
import { DaisyBook, NAV_LEVEL_PHRASE, NAV_LEVEL_PAGE, NAV_LEVEL_BOOKMARK, NAV_LEVEL_INTERVAL, NAV_LEVEL_1 } from './daisybook';
import { AudioBookStore } from '../audiobooks/audiobookstore';
import { SeekInfo } from 'src/models/seekinfo';
import { Bookmark } from 'src/models/bookmark';
import { Mutex } from 'async-mutex';

const STATUS_FILENAME = "status.json"
const BOOKMARKS_FILENAME = "bookmarks.json"

@Injectable()
export class DaisyPlayer {

    mediaTimer: Subscription;
    playerStatus: Subscription;
    playerInfo: PlayerInfo;
    isPlaying: boolean = false;
    book: DaisyBook;
    mutex: Mutex;

    public playerEvent = new Subject<PlayerInfo>();

    constructor(
        private media: Media,
        private file: File,
        private audioBooksStore: AudioBookStore,
        private musicControls: MusicControls
    ) {
        this.mutex = new Mutex();

        const sourceTimer = timer(0, 500);
        this.mediaTimer = sourceTimer.subscribe(val => {

            if (this.playerInfo && this.playerInfo.media) {

                this.playerInfo.media.getCurrentPosition()
                    .then((position: number) => {
                        if (position > -1) {
                            this.playerInfo.position.currentTC = position;
                            this.playerInfo.position.absoluteTC = this.seconds2TC(this.playerInfo.position.currentSOM + this.playerInfo.position.currentTC);
                        }

                        if (this.isPlaying && (this.playerInfo.position.currentTC < 0 ||
                            this.playerInfo.status === this.media.MEDIA_STOPPED)) {
                            this.loadNextFile(1);
                            this.playerInfo.status = this.media.MEDIA_RUNNING;
                            this.play(this.playerInfo.position);
                        }


                        if (this.book.sequence[this.playerInfo.position.currentIndex].tcout < position) {
                            this.playerInfo.position.currentIndex++;
                            this.playerInfo.position.currentTitle = this.book.sequence[this.playerInfo.position.currentIndex].title;
                        }

                        this.playerEvent.next(this.playerInfo);
                    });
            }
        });
    }

    private async loadNextFile(step: number) {
        if (this.book.sequence.length > this.playerInfo.position.currentIndex + step &&
            this.playerInfo.position.currentIndex + step >= 0) {
            this.release();
            this.playerInfo.position.currentIndex += step;
            this.playerInfo.position.currentSOM = this.book.sequence[this.playerInfo.position.currentIndex].som;
            this.playerInfo.position.currentTC = 0;
            this.playerInfo.position.absoluteTC = this.seconds2TC(this.playerInfo.position.currentSOM + this.playerInfo.position.currentTC);
            this.playerInfo.position.currentTitle = this.book.sequence[this.playerInfo.position.currentIndex].title;
            this.createMediaPlayer(this.audioBooksStore.getDataDir() + "/" + this.book.id + "/" + this.book.sequence[this.playerInfo.position.currentIndex].filename);
            await this.saveStatus(this.playerInfo);
        }
    }

    createMediaPlayer(file: string) {        
        this.playerInfo.media = this.media.create(file);
        if (this.playerStatus) this.playerStatus.unsubscribe();
        this.playerStatus = this.playerInfo.media.onStatusUpdate.subscribe(status => { this.playerInfo.status = status });
    }

    createPlayerControls() {
        this.musicControls.destroy();
        this.musicControls.create({
            track: this.book.title,         // optional, default : ''
            artist: this.book.creator,     // optional, default : ''
            // cover: 'albums/absolution.jpg', // optional, default : nothing
            // cover can be a local path (use fullpath 'file:///storage/emulated/...', or only 'my_image.jpg' if my_image.jpg is in the www folder of your app)
            //           or a remote url ('http://...', 'https://...', 'ftp://...')
            isPlaying: true,                         // optional, default : true
            dismissable: true,                         // optional, default : false

            // hide previous/next/close buttons:
            hasPrev: true,      // show previous button, optional, default: true
            hasNext: true,      // show next button, optional, default: true
            hasClose: true,     // show close button, optional, default: false

            // iOS only, optional
            // album: 'Absolution',     // optional, default: ''
            // duration: this.book.totalTime, // optional, default: 0
            // elapsed: 10, // optional, default: 0
            hasSkipForward: true,  // show skip forward button, optional, default: false
            hasSkipBackward: true, // show skip backward button, optional, default: false
            // skipForwardInterval: 15, // display number for skip forward, optional, default: 0
            // skipBackwardInterval: 15, // display number for skip backward, optional, default: 0
            hasScrubbing: false, // enable scrubbing from control center and lockscreen progress bar, optional

            // Android only, optional
            // text displayed in the status bar when the notification (and the ticker) are updated, optional
            ticker: this.book.title,
            // All icons default to their built-in android equivalents
            playIcon: 'media_play',
            pauseIcon: 'media_pause',
            prevIcon: 'media_prev',
            nextIcon: 'media_next',
            closeIcon: 'media_close',
            notificationIcon: 'notification'
        });

        this.musicControls.subscribe().subscribe(action => {

            console.log(action);

            const message = JSON.parse(action).message;
            switch (message) {
                case 'music-controls-next':
                    this.next();
                    break;
                case 'music-controls-previous':
                    this.prev();
                    break;
                case 'music-controls-pause':
                    this.pause();
                    break;
                case 'music-controls-play':
                    this.playFromCurrentPos();
                    break;
                case 'music-controls-destroy':
                    this.release();
                    break;

                // External controls (iOS only)
                case 'music-controls-toggle-play-pause':
                    if (this.isPlaying) {
                        this.pause();
                    } else {
                        this.playFromCurrentPos();
                    }                    
                    break;
                case 'music-controls-skip-forward':
                    this.next();
                    break;
                case 'music-controls-skip-backward':
                    this.prev();
                    break;

                default:
                    break;
            }
        });

        this.musicControls.listen(); // activates the observable above

        this.musicControls.updateIsPlaying(this.isPlaying);
    }

    async loadBook(book: DaisyBook) {

        // Save status of a previous book loaded
        if (this.playerInfo) {
            await this.saveStatus(this.playerInfo);
        }

        this.playerInfo = new PlayerInfo();
        this.playerInfo.position = new SeekInfo();
        this.playerInfo.position.currentIndex = 0;
        this.playerInfo.position.navigationLevel = NAV_LEVEL_1;
        this.playerInfo.status = this.media.MEDIA_STOPPED;

        this.release();

        this.book = book;

        await this.loadStatus();
        this.createMediaPlayer(this.audioBooksStore.getDataDir() + "/" + this.book.id + "/" + this.book.sequence[this.playerInfo.position.currentIndex].filename);
        this.createPlayerControls();
        this.play(this.playerInfo.position);
        await this.loadBookmarks();
    }

    getLevels(): Array<string> {
        var levels: Array<string> = new Array<string>();
        for (var i: number = 1; i <= this.book.maxLevels; i++) {
            levels.push("Nivel " + i);
        }
        return levels;
    }

    getCurrentBook(): DaisyBook {
        return this.book;
    }

    getPlayerInfo(): PlayerInfo {
        return this.playerInfo;
    }

    playFromCurrentPos() {
        if (this.playerInfo && this.playerInfo.media) {
            this.playerInfo.media.play();
            this.playerInfo.status = this.media.MEDIA_RUNNING;
            this.isPlaying = true;
            this.musicControls.updateIsPlaying(this.isPlaying);
        }
    }

    play(position: SeekInfo) {
        if (this.playerInfo && this.playerInfo.media) {
            this.playerInfo.media.play();
            this.playerInfo.media.seekTo(position.currentTC * 1000);
            this.playerInfo.status = this.media.MEDIA_RUNNING;
            this.isPlaying = true;
            this.musicControls.updateIsPlaying(this.isPlaying);
        }
    }

    stop() {
        if (this.playerInfo && this.playerInfo.media) {
            this.playerInfo.media.stop();
            this.playerInfo.status = this.media.MEDIA_STOPPED;
            this.isPlaying = false;
            this.musicControls.updateIsPlaying(this.isPlaying);
        }
    }

    pause() {
        if (this.playerInfo && this.playerInfo.media) {
            this.playerInfo.media.pause();
            this.playerInfo.status = this.media.MEDIA_PAUSED;
            this.isPlaying = false;
            this.musicControls.updateIsPlaying(this.isPlaying);
        }
    }

    release() {
        if (this.playerInfo && this.playerInfo.media) {
            this.playerInfo.media.release();
            this.playerInfo.status = this.media.MEDIA_NONE;
            this.isPlaying = false;
            this.musicControls.updateIsPlaying(this.isPlaying);
        }
    }

    async next() {

        this.mutex.acquire().then(async (release) => {

            try {
                this.isPlaying = false;
                this.musicControls.updateIsPlaying(this.isPlaying);

                var index: number = 0;

                if (this.playerInfo.position.navigationLevel <= NAV_LEVEL_PHRASE) {
                    index = this.playerInfo.position.currentIndex;

                    // protect bounds...
                    if (index >= 0 && this.book.sequence.length <= index) return;

                    var filename: string = this.book.sequence[index].filename;
                    var level: number = this.playerInfo.position.navigationLevel;

                    do {
                        index++;
                    } while (index < this.book.sequence.length && this.book.sequence[index].level > level);

                    // protect bounds...
                    if (index < 0) {
                        index = 0;
                        return;
                    }
                    if (index >= this.book.sequence.length) {
                        index = this.book.sequence.length - 1;
                        return;
                    }

                    this.playerInfo.position.currentIndex = index;
                    this.playerInfo.position.currentSOM = this.book.sequence[index].som;
                    this.playerInfo.position.currentTC = this.book.sequence[index].tcin;
                    this.playerInfo.position.absoluteTC = this.seconds2TC(this.playerInfo.position.currentSOM + this.playerInfo.position.currentTC);
                    this.playerInfo.position.currentTitle = this.book.sequence[index].title;
                }
                else if (this.playerInfo.position.navigationLevel === NAV_LEVEL_PAGE) {
                    index = this.playerInfo.position.currentIndex;

                    // protect bounds...
                    if (index >= 0 && this.book.sequence.length <= index) return;

                    var filename: string = this.book.sequence[index].filename;
                    var level: number = this.playerInfo.position.navigationLevel;

                    do {
                        index++;
                    } while (index < this.book.sequence.length && this.book.sequence[index].level != NAV_LEVEL_PAGE);

                    // protect bounds...
                    if (index < 0) {
                        index = this.playerInfo.position.currentIndex;
                        return;
                    }
                    if (index >= this.book.sequence.length) {
                        index = this.playerInfo.position.currentIndex;
                        return;
                    }

                    this.playerInfo.position.currentIndex = index;
                    this.playerInfo.position.currentSOM = this.book.sequence[index].som;
                    this.playerInfo.position.currentTC = this.book.sequence[index].tcin;
                    this.playerInfo.position.absoluteTC = this.seconds2TC(this.playerInfo.position.currentSOM + this.playerInfo.position.currentTC);
                    this.playerInfo.position.currentTitle = this.book.sequence[index].title;

                }
                else if (this.playerInfo.position.navigationLevel === NAV_LEVEL_BOOKMARK) {
                    if (this.playerInfo.bookmarks) {
                        var absoluteTC: number = this.playerInfo.position.currentSOM + this.playerInfo.position.currentTC;

                        var found: boolean = false;
                        var goBookmark: Bookmark = null;
                        this.playerInfo.bookmarks.forEach((bm: Bookmark, index: number, array: Bookmark[]) => {
                            if (!found && bm.som + bm.tc > absoluteTC) {
                                found = true;
                                goBookmark = bm;
                            }
                        });

                        if (goBookmark) {
                            this.seek(goBookmark);
                        }

                        return;
                    }
                }
                else if (this.playerInfo.position.navigationLevel === NAV_LEVEL_INTERVAL) {

                }

                var wasPlaying: boolean = (this.playerInfo.status === this.media.MEDIA_RUNNING);

                if (this.book.sequence[index].filename !== filename) {
                    await this.loadNextFile(0);
                }

                await this.saveStatus(this.playerInfo);

                if (wasPlaying) {
                    this.playerInfo.media.play();
                    this.isPlaying = true;
                }

                this.playerInfo.media.seekTo(this.playerInfo.position.currentTC * 1000);

                if (!wasPlaying) {
                    this.playerInfo.media.pause();
                    this.isPlaying = false;
                }

                this.musicControls.updateIsPlaying(this.isPlaying);

            } finally {
                release();
            }
        });
    }

    async prev() {

        this.mutex.acquire().then(async (release) => {
            try {
                this.isPlaying = false;
                this.musicControls.updateIsPlaying(this.isPlaying);

                var index: number = 0;

                if (this.playerInfo.position.navigationLevel <= NAV_LEVEL_PHRASE) {
                    index = this.playerInfo.position.currentIndex;

                    // protect bounds...
                    if (index >= 0 && this.book.sequence.length <= index) return;

                    var filename: string = this.book.sequence[index].filename;
                    var level: number = this.playerInfo.position.navigationLevel;

                    do {
                        index--;
                    } while (index > 0 && this.book.sequence[index].level > level);

                    // protect bounds...
                    if (index < 0) {
                        index = 0;
                    }
                    if (index >= this.book.sequence.length) {
                        index = this.playerInfo.position.currentIndex;
                        return;
                    }

                    this.playerInfo.position.currentIndex = index;
                    this.playerInfo.position.currentSOM = this.book.sequence[index].som;
                    this.playerInfo.position.currentTC = this.book.sequence[index].tcin;
                    this.playerInfo.position.absoluteTC = this.seconds2TC(this.playerInfo.position.currentSOM + this.playerInfo.position.currentTC);
                    this.playerInfo.position.currentTitle = this.book.sequence[index].title;
                }
                else if (this.playerInfo.position.navigationLevel <= NAV_LEVEL_PAGE) {
                    index = this.playerInfo.position.currentIndex;

                    // protect bounds...
                    if (index >= 0 && this.book.sequence.length <= index) return;

                    var filename: string = this.book.sequence[index].filename;
                    var level: number = this.playerInfo.position.navigationLevel;

                    do {
                        index--;
                    } while (index > 0 && this.book.sequence[index].level != NAV_LEVEL_PAGE);

                    // protect bounds...
                    if (index < 0) {
                        index = this.playerInfo.position.currentIndex;
                        return;
                    }
                    if (index >= this.book.sequence.length) {
                        index = this.book.sequence.length - 1;
                        return;
                    }

                    this.playerInfo.position.currentIndex = index;
                    this.playerInfo.position.currentSOM = this.book.sequence[index].som;
                    this.playerInfo.position.currentTC = this.book.sequence[index].tcin;
                    this.playerInfo.position.absoluteTC = this.seconds2TC(this.playerInfo.position.currentSOM + this.playerInfo.position.currentTC);
                    this.playerInfo.position.currentTitle = this.book.sequence[index].title;
                }
                else if (this.playerInfo.position.navigationLevel === NAV_LEVEL_BOOKMARK) {
                    if (this.playerInfo.bookmarks) {
                        var absoluteTC: number = this.playerInfo.position.currentSOM + this.playerInfo.position.currentTC;

                        var found: boolean = false;
                        var goBookmark: Bookmark = null;
                        for (var i = this.playerInfo.bookmarks.length - 1; i >= 0; i--) {
                            if (!found && this.playerInfo.bookmarks[i].som + this.playerInfo.bookmarks[i].tc < absoluteTC - 5) {
                                found = true;
                                goBookmark = this.playerInfo.bookmarks[i];
                            }
                        }

                        if (goBookmark) {
                            this.seek(goBookmark);
                        }

                        return;
                    }
                }
                else if (this.playerInfo.position.navigationLevel === NAV_LEVEL_INTERVAL) {

                }

                var wasPlaying: boolean = (this.playerInfo.status === this.media.MEDIA_RUNNING);

                if (this.book.sequence[this.playerInfo.position.currentIndex].filename !== filename || index == 0) {
                    await this.loadNextFile(0);
                }

                await this.saveStatus(this.playerInfo);

                if (wasPlaying) {
                    this.playerInfo.media.play();
                    this.isPlaying = true;
                }

                this.playerInfo.media.seekTo(this.playerInfo.position.currentTC * 1000);

                if (!wasPlaying) {
                    this.playerInfo.media.pause();
                    this.isPlaying = false;
                }

                this.musicControls.updateIsPlaying(this.isPlaying);

            } finally {
                release();
            }
        });
    }

    seek(bookmark: Bookmark) {

        this.isPlaying = false;
        this.musicControls.updateIsPlaying(this.isPlaying);

        var isPlaying: boolean = (this.playerInfo.status === this.media.MEDIA_RUNNING);

        // If filename is not currently laoded, load the right one
        if (this.book.sequence[bookmark.index].filename != this.book.sequence[this.playerInfo.position.currentIndex].filename) {
            this.release();
            this.createMediaPlayer(this.audioBooksStore.getDataDir() + "/" + this.book.id + "/" + this.book.sequence[bookmark.index].filename);
        }

        // update status
        this.playerInfo.position.absoluteTC = bookmark.absoluteTC;
        this.playerInfo.position.currentIndex = bookmark.index;
        this.playerInfo.position.currentSOM = bookmark.som;
        this.playerInfo.position.currentTC = bookmark.tc;
        this.playerInfo.position.currentTitle = this.book.sequence[bookmark.index].title;

        this.playerInfo.media.play();
        // Seek to the position in the player
        this.playerInfo.media.seekTo(bookmark.tc * 1000);
        // play if running
        if (!isPlaying) {
            this.playerInfo.media.pause();
        }

        this.musicControls.updateIsPlaying(this.isPlaying);
    }

    async loadBookmarks() {
        var bdir = this.audioBooksStore.getDataDir() + this.book.id + "/";
        try {
            const result = await this.file.checkFile(bdir, BOOKMARKS_FILENAME);
            if (result) {
                const bookmarksData = await this.file.readAsBinaryString(bdir, BOOKMARKS_FILENAME)
                this.playerInfo.bookmarks = JSON.parse(atob(bookmarksData));
            }
        } catch {
            console.log("Bookmarks not found!");
        }
    }

    async saveBooksmarks(bookmarks: Array<Bookmark>) {
        this.playerInfo.bookmarks = bookmarks;
        var bdir = this.audioBooksStore.getDataDir() + this.book.id + "/";
        await this.file.writeFile(bdir, BOOKMARKS_FILENAME, btoa(JSON.stringify(this.playerInfo.bookmarks)), { replace: true });
    }

    async loadStatus() {
        var bdir = this.audioBooksStore.getDataDir() + this.book.id + "/";

        try {
            await this.file.checkFile(bdir, STATUS_FILENAME);
            const statusData = await this.file.readAsBinaryString(bdir, STATUS_FILENAME);
            this.playerInfo.position = JSON.parse(atob(statusData));
        }
        catch {
            this.playerInfo.position = new SeekInfo();
            this.playerInfo.position.navigationLevel = NAV_LEVEL_1;
            this.playerInfo.position.currentIndex = 0;
            this.playerInfo.position.currentSOM = this.book.sequence[0].som;
            this.playerInfo.position.currentTC = this.book.sequence[0].som;
            this.playerInfo.position.currentTitle = this.book.sequence[0].title;
            this.playerInfo.position.absoluteTC = "0:00:00";
        }
    }

    async saveStatus(pinfo: PlayerInfo) {
        this.playerInfo = pinfo;
        var bdir = this.audioBooksStore.getDataDir() + this.book.id + "/";
        await this.file.writeFile(
            bdir,
            STATUS_FILENAME,
            btoa(JSON.stringify(this.playerInfo.position)),
            { replace: true }
        );
    }

    seconds2TC(seconds: number): string {
        if (seconds < 0) seconds = 0;

        return Math.floor(seconds / 3600).toString() + ":" +
            this.padleft(Math.floor((seconds / 60) % 60).toString(), 2, "0") + ":" +
            this.padleft(Math.floor(seconds % 60).toString(), 2, "0");
    }

    private padleft(str: string, count: number, char: string): string {
        var pad = "";
        for (var i = 0; i < count; i++) { pad += char; }
        return pad.substring(0, pad.length - str.length) + str
    }
}