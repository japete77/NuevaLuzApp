import { AudioBooksProvider } from 'src/providers/audiobooks/audiobooks';

export class MyAudioBook {
    id: string;
    title: string;
    path: string;
    filename: string;
    progress: number;
    statusDescription: string;
    errorCode: number;
    statusKey: string;
}
