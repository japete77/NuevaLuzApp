import { SmilInfo } from 'src/models/smilinfo';
import { Sequence } from 'src/models/sequence';
import { Injectable } from '@angular/core';

export var NAV_LEVEL_1 : number = 1;
export var NAV_LEVEL_2 : number = 2;
export var NAV_LEVEL_3 : number = 3;
export var NAV_LEVEL_4 : number = 4;
export var NAV_LEVEL_5 : number = 5;
export var NAV_LEVEL_6 : number = 6;
export var NAV_LEVEL_PHRASE : number = 7;
export var NAV_LEVEL_PAGE : number = 8;

@Injectable()
export class DaisyBook {
    
    // Metadata info
    id : string;
    creator : string;
    date : string;
    format : string;
    identifier : string;
    publisher : string;
    subject : string;
    source : string;
    title : string;
    charset : string;
    generator : string;
    narrator : string;
    producer : string;
    totalTime : string;
    
    maxLevels : number = 0;
    hasPages : boolean = false;
            
    // body smil info
    body : Array<SmilInfo>;
    
    // audio navigation helper
    sequence : Array<Sequence>;
    
    constructor() {
        this.body = new Array<SmilInfo>();
        this.sequence = new Array<Sequence>();
    }
    
    public parseDaisyBook(content : string) {
                        
        var xmlParser = new DOMParser();
        var doc = xmlParser.parseFromString(content, "text/xml");
        
        // Read header metadata
        var meta = doc.getElementsByTagName("meta");
        for (var i=0; i<meta.length; i++) {
            if (meta.item(i).attributes.getNamedItem("name")) {
                if (meta.item(i).attributes.getNamedItem("name").value==="dc:creator")
                    this.creator = meta.item(i).attributes.getNamedItem("content").value;
                else if (meta.item(i).attributes.getNamedItem("name").value==="dc:date")
                    this.date = meta.item(i).attributes.getNamedItem("content").value;
                else if (meta.item(i).attributes.getNamedItem("name").value==="dc:format")
                    this.format = meta.item(i).attributes.getNamedItem("content").value;
                else if (meta.item(i).attributes.getNamedItem("name").value==="dc:identifier")
                    this.identifier = meta.item(i).attributes.getNamedItem("content").value;
                else if (meta.item(i).attributes.getNamedItem("name").value==="dc:publisher")
                    this.publisher = meta.item(i).attributes.getNamedItem("content").value;
                else if (meta.item(i).attributes.getNamedItem("name").value==="dc:subject")
                    this.subject = meta.item(i).attributes.getNamedItem("content").value;
                else if (meta.item(i).attributes.getNamedItem("name").value==="dc:source")
                    this.source = meta.item(i).attributes.getNamedItem("content").value;
                else if (meta.item(i).attributes.getNamedItem("name").value==="dc:title")
                    this.title = meta.item(i).attributes.getNamedItem("content").value;
                else if (meta.item(i).attributes.getNamedItem("name").value==="ncc:charset")
                    this.charset = meta.item(i).attributes.getNamedItem("content").value;
                else if (meta.item(i).attributes.getNamedItem("name").value==="ncc:generator")
                    this.generator = meta.item(i).attributes.getNamedItem("content").value;
                else if (meta.item(i).attributes.getNamedItem("name").value==="ncc:narrator")
                    this.narrator = meta.item(i).attributes.getNamedItem("content").value;
                else if (meta.item(i).attributes.getNamedItem("name").value==="ncc:producer")
                    this.producer = meta.item(i).attributes.getNamedItem("content").value;
                else if (meta.item(i).attributes.getNamedItem("name").value==="ncc:totalTime")
                    this.totalTime = meta.item(i).attributes.getNamedItem("content").value;                            
            } 
        }
        
        // Read body
        var tmpSmil : SmilInfo;
        
        var bodyElements = doc.getElementsByTagName("body").item(0).children;
        for (var i=0; i<bodyElements.length; i++) {
            var href : string[] = bodyElements.item(i).getElementsByTagName("a").item(0).attributes.getNamedItem("href").value.split("#");
            var level : number;
            switch (bodyElements.item(i).tagName) {
                case "h1":
                    level = NAV_LEVEL_1;
                    break;
                case "h2":
                    level = NAV_LEVEL_2;
                    break;
                case "h3":
                    level = NAV_LEVEL_3;
                    break;
                case "h4":
                    level = NAV_LEVEL_4;
                    break;
                case "h5":
                    level = NAV_LEVEL_5;
                    break;
                case "h6":
                    level = NAV_LEVEL_6;
                    break;
                case "span":
                    level = NAV_LEVEL_PAGE;
                    this.hasPages = true;
                    break;
                case "div":
                    level = NAV_LEVEL_PAGE;
                    this.hasPages = true;
                    break;
            }
            
            if (level<=NAV_LEVEL_6 && this.maxLevels<level) {
                this.maxLevels = level;
            }
            
            this.body.push({
                id : href[1],
                title : bodyElements.item(i).getElementsByTagName("a").item(0).innerText,
                filename : href[0],
                level : level
            });
        }       
    }
    
    // Read smil file....
    parseSmils(content : string, id : string, title : string, level : number) {        
        var xmlParser = new DOMParser();
        var doc = xmlParser.parseFromString(content, "text/xml");
        
        // Read SOM
        var som : number = this.tc2secs(doc.querySelector('meta[name="ncc:totalElapsedTime"]').attributes.getNamedItem("content").value);
        
        // Read audio sequences
        var query = doc.querySelector('text[id="' + id + '"]');            
        var audioElements = query.parentElement.querySelectorAll("audio");
        for (var i=0; i<audioElements.length; i++) {
            var tcin : number = this.ntp2number(audioElements.item(i).attributes.getNamedItem("clip-begin").value);
            var tcout : number = this.ntp2number(audioElements.item(i).attributes.getNamedItem("clip-end").value);
            this.sequence.push({
                 id : id,
                 filename : audioElements.item(i).attributes.getNamedItem("src").value,
                 title : title,
                 level : i===0?level:NAV_LEVEL_PHRASE,
                 som : som,
                 tcin : tcin,
                 tcout : tcout
            });
        }
    }
    
    private ntp2number(value : string) : number {
        value = value.replace("npt=", "");
        value = value.replace("s", "");
        return parseFloat(value);
    }
    
    private tc2secs(value : string) : number {
        var parts : string[] = value.split(":");
        return parseFloat(parts[0])*3600 + 
                parseFloat(parts[1])*60 + 
                parseFloat(parts[2]);
    }
}