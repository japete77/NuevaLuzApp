import { AudioBookDetailResult } from './audiobookdetailresult';

export class MyAudioBook {
    book: AudioBookDetailResult;
    path: string;
    filename: string;
    progress: number;
    statusDescription: string;
    errorCode: number;
    statusKey: string;
}
