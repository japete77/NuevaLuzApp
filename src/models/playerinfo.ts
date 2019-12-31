import { SeekInfo } from './seekinfo';
import { Bookmark } from './bookmark';
import { MediaObject } from '@ionic-native/media/ngx';

// Player info object
export class PlayerInfo {
    media : MediaObject; 
    status : number;
    position : SeekInfo;    
    bookmarks : Array<Bookmark>;
}