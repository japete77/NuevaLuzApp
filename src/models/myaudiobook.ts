import { AudioBookDetailResult } from './audiobookdetailresult';

export class MyAudioBook {
    book: AudioBookDetailResult;
    path: string;
    tmpFolder: string;
    filename: string;
    progress: number;
    statusDescription: string;
    errorCode: number;
    statusKey: string;
}
