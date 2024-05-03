
// Pull in libraries

// Express web framework (use it for REST API)
const express = require('express');

// Work with the filesystem
const fs = require("fs");

// CORS - Cross-Origin Resource Sharing (CORS)
const cors = require('cors')
const Path = require('path')
const Axios = require('axios')
// Declare App
const app = express();

app.use(express.json());

const messages = [];
const SUPPORTED_EXTS = ["jpeg", "jpg", "png", "webp", "gif", "tiff", "tif", "svg"]
// const SUPPORTED_EXTS = [] // for testing

imageRequired = true;

wordImageExt = "";
/** 
 * Remove non-unicode letters and all whitespace that isn't " "(space)
**/
function removeSpecialChars(str) {
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
    if(message.hasOwnProperty("imageRequired")){
        if(imageRequired != message.imageRequired){
            imageRequired = message.imageRequired;
            console.log(`Image required: ${imageRequired}`);
        }
    }
    // console.log(JSON.stringify(message))
    if(message.cmd == "startList")
    {
        
        pos = 0;
        console.log("starting list, 1st word: " + wordList[pos]);
        res.send({nextWord: wordList[pos]});
    }
    else if (message.cmd == "cardData")
    {
        messages.push(message);
        // console.log(JSON.stringify(message));
        if(message["translation"] != ""){
            // console.log(message["sentence"]);
            const cleanedMessage = 
            {
                cmd: message["cmd"],
                translation: removeSpecialChars(message["translation"]),
                targetWord: removeSpecialChars(message["targetWord"]),
                defTargetLang: removeSpecialChars(message["defTargetLang"]),
                sentence: message["sentence"], // Not clean, I should make a regex like I did before or this
                imageURL: message["imageURL"]
            } 
    
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
    else if (message.cmd === "skipWord")
    {
        pos = pos + 1;
        console.log("Skipping, Next word is: " + wordList[pos])
        res.send({cmd: "nextWord", nextWord: wordList[pos]});
    }
    else if (message.cmd === "GoBack")
    {
        pos = pos - 1;
        if(pos < 0){
            pos = 0;
        }
        console.log("Going back to: " + wordList[pos])
        res.send({cmd: "nextWord", nextWord: wordList[pos]});
    }
    
});
function OutPutLog(_json, _imageName, _imageRequired = true)
{
    if (!fs.existsSync("OutputLog.csv")) {
        fs.writeFileSync("OutputLog.csv", '');
    }
    _imageTag = ''
    if(_imageRequired){
        _imageTag = `<img src='${_imageName}'/>`            
    }
    // else{
    //     console.log("OutPutlLog skipping image tag")
    // }
    //     //spanish, picture, english, audio, ranking, sentence
    fs.appendFileSync('OutputLog.csv', `${_json["targetWord"]},${_imageTag},${_json["translation"]},,,${_json["sentence"]}\n`); // Needs html stuff on name
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