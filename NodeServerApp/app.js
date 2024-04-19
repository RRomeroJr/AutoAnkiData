
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

// wordList = ["fuerza", "pantalla", "miel", "nieve"]
wordList = fs.readFileSync(Path.resolve(__dirname, 'words.txt'), 'utf8')
// console.log(wordList)
wordList = wordList.split("\n");
for(let i = 0; i < wordList.length; i++){
    wordList[i] = wordList[i].replace("\r|","")
}
// console.log(wordList)
pos = 0

app.use(cors())
//Request Handler
app.post('/api/messages', (req, res) => {
    const message = {
        cmd: req.body.cmd,
        targetWord: req.body.targetWord,
        translation: req.body.translation,
        defTargetLang: req.body.defTargetLang,
        imageURL: req.body.imageURL
    };
    // console.log(JSON.stringify(message))
    if(message.cmd == "startList")
    {
        pos = 0
        console.log("starting list, 1st word: " + wordList[pos])
        res.send({nextWord: wordList[pos]});
    }
    else if (message.cmd == "cardData")
    {
        messages.push(message);
        // console.log(JSON.stringify(message));
        if(message["translation"] != ""){
            _ext = "";
            try{
                _ext = extensionFromURL(message["imageURL"]);
            }
            catch{
                console.log(`${wordList[pos]} ERROR: couldn't get image extension from URL`);
                res.send({cmd: "extError"});
                return;
            }
            try{ //extension from url could fail
                _imageName = `${message["translation"]}.${_ext}`
                OutPutLog(message, _imageName);
                downloadImage(message["imageURL"], _imageName);
            }
            catch(e)
            {
                console.log(`${wordList[pos]} skipped. Something went wrong`)
                console.error(e)
            }
        }
        else
        {
            console.log(`No translation for ${wordList[pos]} skipping`)
        }
        pos = pos + 1;
        console.log("Next word in list: " + wordList[pos])
        res.send({cmd: "nextWord", nextWord: wordList[pos]});
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
function OutPutLog(_json, _imageName)
{
    if (!fs.existsSync("OutputLog.txt")) {
        fs.writeFileSync("OutputLog.txt", '');
    }
    _imageTag = `<img src='${_imageName}'/>`
    fs.appendFileSync('OutputLog.csv', `${_json["targetWord"]},${_json["translation"]},${_json["defTargetLang"]},${_imageTag}\n`); // Needs html stuff on name
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
    const SUPPORTED_EXTS = ["jpeg", "jpg", "png", "webp", "gif", "tiff", "tif", "svg"]
    for(ext of SUPPORTED_EXTS){
        if(result === ext){
            return result
        }
    }
    console.log(result);
    if (!fs.existsSync("ErrorLog.txt")) {
        fs.writeFileSync("ErrorLog.txt", '');
    }
    fs.appendFileSync('ErrorLog.txt', `Extension type error: ${_url}\n`);
    throw new Error("Extension type error");
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
    extension = extensionFromURL(_url)
    const path = Path.resolve(__dirname, 'images', imageName)
    // const path = `C:\\AutoAnkiTestOut\\${imageName}`
    const writer = fs.createWriteStream(path)
    
    const response = await Axios({
        url,
        method: 'GET',
        responseType: 'stream',
        headers: {
            'content-type': ''
        }
    })
    console.log(response.headers)
    console.log(response)
    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
    })
}


//PORT ENVIRONMENT VARIABLE
// const port = process.env.PORT || 7701; // Kept this line bc the process.env.PORT was interesting that you can do that
const port = 7701;
app.listen(port, () => console.log(`Listening on port ${port}..`));