import { AudioBook } from './audiobook';

export class SessionInfo {
    username: number;
    password: string;
    session: string;
    currentBook: AudioBook;
    workingDir: string;
    playDir: string;
}
