
// Pull in libraries

// Express web framework (use it for REST API)
const express = require('express');

// Work with the filesystem
const fs = require("fs");

// CORS - Cross-Origin Resource Sharing (CORS)
const cors = require('cors');
const Path = require('path');
const Axios = require('axios');
const AAD_Scrape = require('./AAD_Scrape.js');

// Declare App
const app = express();

app.use(express.json());

const messages = [];
const SUPPORTED_EXTS = ["jpeg", "jpg", "png", "webp", "gif", "tiff", "tif", "svg"];
// const SUPPORTED_EXTS = [] // for testing

imageRequired = true;
additionalImagesNames = []
wordImageExt = "";
/** 
 * Remove non-unicode letters and all whitespace that isn't " "(space)
**/
function removeSpecialChars(str) {
  if(str === null || str === undefined){
      return "";
  }
  const regex = new RegExp('[^\\p{L} ]', 'gu');
  return str.replace(regex, "");
}
if (!fs.existsSync("words.txt")) {
    fs.writeFileSync("words.txt", '');
}

let imageSavePath = ""

wordList = fs.readFileSync(Path.resolve(__dirname, 'words.txt'), 'utf8')

wordList = wordList.split("\n");
for(let i = 0; i < wordList.length; i++){
    wordList[i] = removeSpecialChars(wordList[i]);
}
processSettings();

pos = 0

app.use(cors())
//Request Handler
app.post('/api/messages', (req, res) => {
    const message = {
        cmd: req.body.cmd,
        targetWord: req.body.targetWord,
        translation: req.body.translation,
        defTargetLang: req.body.defTargetLang,
        imageURL: req.body.imageURL,
        sentence: req.body.sentence,
        imageRequired: req.body.imageRequired
    };
    // console.log(message.translation)
    let cleanedMessage = cleanMessage(message);

    messages.push(message);
    if(cleanedMessage.hasOwnProperty("imageRequired")){
        if(imageRequired != cleanedMessage.imageRequired){
            imageRequired = cleanedMessage.imageRequired;
            console.log(`Image required: ${imageRequired}`);
        }
    }
    // console.log(JSON.stringify(cleanedMessage))
    if(cleanedMessage.cmd == "startList")
    {
        
        pos = 0;
        console.log("starting list, 1st word: " + wordList[pos]);
        res.send({wordList: wordList});
    }
    else if (cleanedMessage.cmd == "cardData")
    {
        // console.log(JSON.stringify(cleanedMessage));
        if(cleanedMessage["translation"] != ""){
    
            if(imageRequired){
                downloadImage(cleanedMessage["imageURL"], cleanedMessage["translation"])
                .then(downloadRes => {
                    OutPutLog(cleanedMessage, cleanedMessage["translation"] + "." + wordImageExt);
                    pos = pos + 1;
                    console.log("Next word in list: " + wordList[pos])
                    res.send({cmd: "nextWord", nextWord: wordList[pos]});
                    wordImageExt = "";
                })
                .catch(error => {
                    console.error(error);
                    console.log(`${wordList[pos]}: couldn't download that image or input is bad`);
                })
            }else{ //no image required
                pos = pos + 1;
                console.log("Next word in list: " + wordList[pos])
                res.send({cmd: "nextWord", nextWord: wordList[pos]});
                OutPutLog(cleanedMessage, undefined, _imageRequired = false);
            }

        }
        else
        {
            console.log(`No translation for ${wordList[pos]}`)
        }
        
    }
    else if (cleanedMessage.cmd === "addImage")
    {
        console.log("addImage");
        // console.log(cleanedMessage["translation"]);
        aImageName = '';
        aImageName = `${cleanedMessage["translation"].join("_")}${additionalImagesNames.length + 1}`;
        downloadImage(cleanedMessage["imageURL"], aImageName)
        .then(downloadRes => {
            additionalImagesNames.push(aImageName + "." + wordImageExt)
            console.log(`${additionalImagesNames.length}: ${additionalImagesNames}`)
            wordImageExt = "";
        })
        .catch(error => {
            console.error(error);
            console.log(`${wordList[pos]}: couldn't download additional image or input is bad`);
        })
    }
    // else if (cleanedMessage.cmd === "autoComplete")
    // {
    //     autoComplete(cleanedMessage)
    //     .catch(error => {
    //         console.error(error)
    //         console.log("error caught continuing. Sending Go Back")
    //         res.send({cmd: "autoError"});
    //     })
    // }
    
    
});
function cleanMessage(_msg){
    // console.log(_msg);
    newMsg = {
        cmd: _msg["cmd"],
        sentence: _msg["sentence"], // Not clean, I should make a regex like I did before or this
        imageURL: _msg["imageURL"],
        imageRequired: _msg["imageRequired"]
    }
    if(_msg.translation != null){
        _res = [];
        for(ele of _msg.translation){
            // console.log(ele);
            _res.push(removeSpecialChars(ele));
        }
        newMsg.translation = _res;
        console.log(`new ${newMsg.translation} old ${_msg.translation}`)
    }
    if(_msg["targetWord"] != null){
        newMsg.targetWord = removeSpecialChars(_msg["targetWord"]);
    }
    if(_msg["defTargetLang"] != null){
        newMsg.defTargetLang = removeSpecialChars(_msg["defTargetLang"]);
    }
    // console.log(newMsg);
    return newMsg;
}
function spanishDictUrl(_word){
    return "https://www.spanishdict.com/translate/" + _word + "?langFrom=es";
}
function googleImagesUrl(_word){
    return "https://www.google.com/search?tbm=isch&q=" + _word
}
// async function autoComplete(_msg){
//     fakeMessage = 
//     {
//         targetWord: _msg.targetWord,
//         translation: _msg.translation,
//         defTargetLang: "",
//         imageURL: await AAD_Scrape.scrapeGIFirst(googleImagesUrl(_msg.translation)),
//         sentence: "",
//         imageRequired: true
//     }
//     downloadImage(fakeMessage["imageURL"], fakeMessage["translation"])
//         .then(downloadRes => {
//             OutPutLog(fakeMessage, fakeMessage["translation"] + "." + wordImageExt);
//             wordImageExt = "";
//         })
// }
function OutPutLog(_json, _imageName, _imageRequired = true)
{
    if (!fs.existsSync("OutputLog.csv")) {
        fs.writeFileSync("OutputLog.csv", '');
    }
    _imageField = ''
    if(_imageRequired){
        for(img of additionalImagesNames){
            _imageField += `<img src='${img}'/>`;       
        }
        _imageField += `<img src='${_imageName}'/>`;       
    }
    _enlgishField = _json["translation"].join("_");

    fs.appendFileSync('OutputLog.csv', `${_json["targetWord"]},${_imageField},${_enlgishField},,,${_json["sentence"]}\n`); // Needs html stuff on name
}

function extensionFromURL(_url) {
    result = ""
    if (_url.startsWith("https:")) {
        // console.log("normal url detected")
        result = extFromURLNormal(_url);
    } else if (_url.startsWith("data:image/")) {
        // console.log("Data URL detected")
        result = extFromDataURL(_url);
    } else {
        if (!fs.existsSync("ErrorLog.txt")) {
            fs.writeFileSync("ErrorLog.txt", '');
        }
        fs.appendFileSync('ErrorLog.txt', `Unknown URL type: ${_url}\n`);
        throw new Error("Unknown url type");
    }
    
    // gaurd clause
    
    for(ext of SUPPORTED_EXTS){
        if(result === ext){
            return result
        }
    }
    if (!fs.existsSync("ErrorLog.txt")) {
        fs.writeFileSync("ErrorLog.txt", '');
    }
    fs.appendFileSync('ErrorLog.txt', `Extension type error: ${_url}\n`);
    throw new Error("extensionFromURL, Unsupported or Unknown: " + result);
}
function extFromURLNormal(_iURL){
    return _iURL.split('.').pop().toLowerCase();
}
function extFromDataURL(_dURL){
    const start = _dURL.indexOf('/') + 1;
    const end = _dURL.indexOf(';');
    return _dURL.substring(start, end);
}
async function downloadImage(_url, imageName) {
    const url = _url
    
    try{
        const axiosRes = await Axios({
            url,
            method: 'GET',
            responseType: 'stream'
        }).then(response => {
            extension = "";
            try
            {
                extension = extensionFromURL(_url);
            }
            catch
            {
                // console.log("Number of headers: ", Object.keys(response.headers).length);
                const contentType = response.headers['content-type'];
                // console.log(response)
                extension = contentType.split('/')[1]; // Extracting the file extension from the content type
                supported = false;
                for(ext of SUPPORTED_EXTS){
                    if(extension === ext){
                        supported = true;
                    }
                }

                // throw new Error("Catch this error please! ");

                if(!supported){
                    return Promise.reject(new Error("Unsupported extension: " + extension));
                }
                else{
                    console.log("Found extension in headers: " + extension);
                }
            }

            // const filePath = Path.resolve(__dirname, 'images', `${imageName}.${extension}`);

            //band-aid solution. I needed to get the extension down here somehow
            // So I used a global variable
            wordImageExt = extension; 

            //Will fail if directory doesn't exist
            // const filePath = `C:\\AutoAnkiTestOut\\${imageName}.${extension}`

            const writer = fs.createWriteStream(`${imageSavePath}\\${imageName}.${extension}`)
        
            response.data.pipe(writer);
            return new Promise((resolve, reject) => {
                writer.on('finish', resolve)
                writer.on('error', reject)
            })
            // writer.on('finish', () => {
            //   console.log('Image downloaded successfully.');
            // });
        
            // writer.on('error', (err) => {
            //   console.error('Error downloading image:', err);
            // });
        }).catch(error => {
            console.log("HANDLED ERROR: " + error);
            // return Promise.reject(error);
            throw error;
        });
    }
    catch(e)
    {
        throw e;
        // return Promise.reject(e);
    }   
}

function processSettings(){
    var contents = fs.readFileSync("settings.json");
    var jsonContent = JSON.parse(contents);
    if(jsonContent["imageSavePath"] === ""){
        jsonContent["imageSavePath"] = Path.resolve(__dirname, 'images');
        contents = JSON.stringify(jsonContent);
        fs.writeFileSync("settings.json", JSON.stringify(jsonContent, null, 4));
    }

    imageSavePath = jsonContent["imageSavePath"];

}


//PORT ENVIRONMENT VARIABLE
// const port = process.env.PORT || 7701; // Kept this line bc the process.env.PORT was interesting that you can do that
const port = 7701;
app.listen(port, () => console.log(`Listening on port ${port}..`));