import { Injectable } from '@angular/core';

import { Media } from '@ionic-native/media/ngx';
import { timer, Subscription, Subject } from 'rxjs';
import { File } from '@ionic-native/file/ngx';
import { MusicControls } from '@ionic-native/music-controls/ngx';

import { PlayerInfo } from 'src/models/playerinfo';
import { DaisyBook, NAV_LEVEL_1 } from './daisybook';
import { AudioBookStore } from '../audiobooks/audiobookstore';
import { SeekInfo } from 'src/models/seekinfo';
import { Bookmark } from 'src/models/bookmark';

const STATUS_FILENAME = "status.json"
const BOOKMARKS_FILENAME = "bookmarks.json"

export var FORWARD = 1;
export var BACKWARD = -1;

@Injectable()
export class DaisyPlayer {

    mediaTimer: Subscription;
    playerStatus: Subscription;
    playerInfo: PlayerInfo;
    book: DaisyBook;
    playTimeout: any;
    wasPlaying: boolean;

    public playerEvent = new Subject<PlayerInfo>();

    constructor(
        private media: Media,
        private file: File,
        private audioBooksStore: AudioBookStore,
        private musicControls: MusicControls
    ) {
        this.setPlayerEvents(true);
    }

    private setPlayerEvents(enable: boolean) {
        if (enable) {
            // Timer to generate player events
            this.mediaTimer = timer(0, 500).subscribe(val => {

                if (this.playerInfo && this.playerInfo.media) {

                    this.playerInfo.media.getCurrentPosition()
                        .then((position: number) => {

                            if (position > -1) {
                                this.playerInfo.position.currentTC = position;
                                this.playerInfo.position.absoluteTC = this.seconds2TC(this.playerInfo.position.currentSOM + this.playerInfo.position.currentTC);
                            }

                            if (this.playerInfo.position.currentIndex >= 0 &&
                                this.playerInfo.position.currentIndex < this.book.sequence.length) {
                                    if (this.book.sequence[this.playerInfo.position.currentIndex].tcout < position) {
                                        this.playerInfo.position.currentIndex++;
                                        this.playerInfo.position.currentTitle = this.book.sequence[this.playerInfo.position.currentIndex].title;
                                    }        
                                }

                            this.playerEvent.next(this.playerInfo);
                            this.musicControls.updateIsPlaying(this.playerInfo.status == this.media.MEDIA_RUNNING);
                        });
                }
            });

        } else {

            this.mediaTimer.unsubscribe();

        }
    }

    private async loadNextFile(): Promise<boolean> {

        let currentSeq = this.book.sequence[this.playerInfo.position.currentIndex];
        let newFile, newIndex;
        for (let i = this.playerInfo.position.currentIndex; i < this.book.sequence.length; i++) {
            if (this.book.sequence[i].filename != currentSeq.filename) {
                newFile = this.book.sequence[i].filename;
                newIndex = i;
                break;
            }
        }

        this.release();

        if (newFile) {
            this.playerInfo.position.currentIndex = newIndex;
            this.playerInfo.position.currentSOM = this.book.sequence[newIndex].som;
            this.playerInfo.position.currentTC = 0;
            this.playerInfo.position.absoluteTC = this.seconds2TC(this.playerInfo.position.currentSOM + this.playerInfo.position.currentTC);
            this.playerInfo.position.currentTitle = this.book.sequence[newIndex].title;
            let filetoplay = `${this.audioBooksStore.getDataDir()}${this.book.id}/${newFile}`;
            console.log(`Loading file ${filetoplay}`);
            this.createMediaPlayer(filetoplay);
            await this.saveStatus(this.playerInfo);
            return true;
        } else {
            return false;
        }
    }

    createMediaPlayer(file: string) {
        this.playerInfo.media = this.media.create(file);
        if (this.playerStatus) this.playerStatus.unsubscribe();
        this.playerStatus = this.playerInfo.media.onStatusUpdate.subscribe(async (status) => {
            let currentPosition = await this.playerInfo.media.getCurrentPosition();
            this.playerInfo.status = status;
            
            console.log(`Status: ${status}, Duration: ${this.playerInfo.media.getDuration()}, Current: ${currentPosition}`)
            
            if (status == this.media.MEDIA_STOPPED && currentPosition < 0) {
                console.log('Stopped detected!');
                // Stopped due to audio file reached the end... so play the next one
                let hasNext = await this.loadNextFile();
                if (hasNext) {
                    this.play(this.playerInfo.position);
                } else {
                    this.playerInfo.position.currentIndex = 0;
                    this.playerInfo.position.currentTC = 0;
                    this.playerInfo.position.currentSOM = this.book.sequence[this.playerInfo.position.currentIndex].som;
                    this.playerInfo.position.absoluteTC = this.seconds2TC(this.playerInfo.position.currentSOM + this.playerInfo.position.currentTC);
                    this.playerInfo.position.currentTitle = this.book.sequence[this.playerInfo.position.currentIndex].title;
                    await this.saveStatus(this.playerInfo);    
                    this.stop();
                }
            }
        });
    }

    createPlayerControls() {
        this.musicControls.destroy();
        this.musicControls.create({
            track: this.book.title,         // optional, default : ''
            artist: this.book.creator,     // optional, default : ''
            // cover: 'albums/absolution.jpg', // optional, default : nothing
            // cover can be a local path (use fullpath 'file:///storage/emulated/...', or only 'my_image.jpg' if my_image.jpg is in the www folder of your app)
            //           or a remote url ('http://...', 'https://...', 'ftp://...')
            isPlaying: this.playerInfo.status == this.media.MEDIA_RUNNING,                 // optional, default : true
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

        this.musicControls.subscribe().subscribe(async (action) => {

            console.log(action);

            const message = JSON.parse(action).message;
            switch (message) {
                case 'music-controls-next':
                    await this.move(FORWARD);
                    break;
                case 'music-controls-previous':
                    await this.move(BACKWARD);
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
                    if (this.playerInfo.status == this.media.MEDIA_RUNNING) {
                        this.pause();
                    } else {
                        this.playFromCurrentPos();
                    }
                    break;
                case 'music-controls-skip-forward':
                    await this.move(FORWARD);
                    break;
                case 'music-controls-skip-backward':
                    await this.move(BACKWARD);
                    break;

                default:
                    break;
            }
        });

        this.musicControls.listen(); // activates the observable above

        this.musicControls.updateIsPlaying(this.playerInfo.status == this.media.MEDIA_RUNNING);
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
        await this.loadBookmarks();
        this.createMediaPlayer(`${this.audioBooksStore.getDataDir()}${this.book.id}/${this.book.sequence[this.playerInfo.position.currentIndex].filename}`);
        this.createPlayerControls();
        this.play(this.playerInfo.position);
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
            this.musicControls.updateIsPlaying(this.playerInfo.status == this.media.MEDIA_RUNNING);
        }
    }

    play(position: SeekInfo) {
        if (this.playerInfo && this.playerInfo.media) {
            this.playerInfo.media.play();
            this.playerInfo.media.seekTo(position.currentTC * 1000);
            this.playerInfo.status = this.media.MEDIA_RUNNING;
            this.musicControls.updateIsPlaying(this.playerInfo.status == this.media.MEDIA_RUNNING);
        }
    }

    stop() {
        if (this.playerInfo && this.playerInfo.media) {
            this.playerInfo.media.stop();
            this.playerInfo.status = this.media.MEDIA_STOPPED;
            this.musicControls.updateIsPlaying(this.playerInfo.status == this.media.MEDIA_RUNNING);
        }
    }

    pause() {
        if (this.playerInfo && this.playerInfo.media) {
            this.playerInfo.media.pause();
            this.playerInfo.status = this.media.MEDIA_PAUSED;
            this.musicControls.updateIsPlaying(this.playerInfo.status == this.media.MEDIA_RUNNING);
        }
    }

    release() {
        if (this.playerInfo && this.playerInfo.media) {
            this.playerInfo.media.release();
            this.playerInfo.status = this.media.MEDIA_NONE;
            this.musicControls.updateIsPlaying(this.playerInfo.status == this.media.MEDIA_RUNNING);
        }
    }

    async move(updown: number) {

        clearTimeout(this.playTimeout);

        this.wasPlaying = this.wasPlaying || (this.playerInfo.status === this.media.MEDIA_RUNNING);
        
        this.pause();

        // Calculate current position in sequence
        let index = this.playerInfo.position.currentIndex;
        let currentPos = await this.playerInfo.media.getCurrentPosition();
        if (currentPos > 0) {
            while (index >= 0 &&
                index < this.book.sequence.length - 1 &&
                !(currentPos >= this.book.sequence[index].tcin &&
                    currentPos <= this.book.sequence[index].tcout)) {
                index++;
            }
        }

        let filename = this.book.sequence[index].filename;

        do {
            index += updown;
        } while (index > 0 && index < this.book.sequence.length && this.book.sequence[index].level > this.playerInfo.position.navigationLevel);

        // adjust bounds
        if (index < 0) {
            index = 0;
        }
        else if (index > this.book.sequence.length - 1) {
            index = this.book.sequence.length - 1;
        } else {
            this.playerInfo.position.currentIndex = index;
            this.playerInfo.position.currentSOM = this.book.sequence[index].som;
            this.playerInfo.position.currentTC = this.book.sequence[index].tcin;
            this.playerInfo.position.absoluteTC = this.seconds2TC(this.playerInfo.position.currentSOM + this.playerInfo.position.currentTC);
            this.playerInfo.position.currentTitle = this.book.sequence[index].title;
        }

        if (this.book.sequence[index].filename !== filename) {
            this.release();
            this.createMediaPlayer(`${this.audioBooksStore.getDataDir()}${this.book.id}/${this.book.sequence[index].filename}`);
        }

        await this.saveStatus(this.playerInfo);

        this.musicControls.updateIsPlaying(this.playerInfo.status == this.media.MEDIA_RUNNING);
        this.musicControls.updateIsPlaying(this.playerInfo.status == this.media.MEDIA_RUNNING);

        if (this.playerInfo.position.currentTC > 0) {
            this.playerInfo.media.seekTo(this.playerInfo.position.currentTC * 1000);
        }

        // resume play after 1 sec
        this.playTimeout = setTimeout(() => {
            if (this.wasPlaying) {
                this.playerInfo.media.play();
                this.wasPlaying = false;
            }

        }, 1000);
    }

    seek(bookmark: Bookmark) {

        var isPlaying: boolean = (this.playerInfo.status === this.media.MEDIA_RUNNING);

        this.playerInfo.media.pause();

        // If filename is not currently laoded, load the right one
        if (this.book.sequence[bookmark.index].filename != this.book.sequence[this.playerInfo.position.currentIndex].filename) {
            this.release();
            this.createMediaPlayer(`${this.audioBooksStore.getDataDir()}${this.book.id}/${this.book.sequence[bookmark.index].filename}`);
        }

        // update status
        this.playerInfo.position.absoluteTC = bookmark.absoluteTC;
        this.playerInfo.position.currentIndex = bookmark.index;
        this.playerInfo.position.currentSOM = bookmark.som;
        this.playerInfo.position.currentTC = bookmark.tc;
        this.playerInfo.position.currentTitle = this.book.sequence[bookmark.index].title;

        // Seek to the position in the player
        this.playerInfo.media.seekTo(bookmark.tc * 1000);

        // pause if it was not playing
        if (isPlaying) {
            this.playerInfo.media.play();
        }

        this.musicControls.updateIsPlaying(this.playerInfo.status == this.media.MEDIA_RUNNING);
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

    setRate(rate: number) {
        this.playerInfo.media.setRate(rate);
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