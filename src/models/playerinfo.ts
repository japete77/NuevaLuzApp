import { SeekInfo } from './seekinfo';
import { Bookmark } from './bookmark';
import { Media } from '@ionic-native/media/ngx';

// Player info object
export class PlayerInfo {
    media : Media; 
    status : number;
    position : SeekInfo;    
    bookmarks : Array<Bookmark>;
}