inTargetWord = "";
//translation becomes the image name so for now I needed a default
// value for testing
inTranslation = "EXTENDSION_DEFAULT";
inDefTargetLang = "";
inSentence = "";
imageRequired = true;
inUrl = ""
wordList = []
wordIndexes = []
currWordIndex = 0
workingTabs = []
tabIndex  = 0
manuallySetDictForm = false;
const IMAGE_MODES = {
  UseTranslation: 0, UseTargetWord: 1, UseDictForm: 2
}
imagePrefs = [IMAGE_MODES.UseTranslation, IMAGE_MODES.UseDictForm]

async function getSelectedTabs() {
    return browser.tabs.query({
      highlighted: true,
      currentWindow: true,
    });
  }
  
  function tabsToText(tabs, options) {
    function setMissingOptionsToDefault(options) {
      const defaultOptions = {
        includeTitle: true,
        titleUrlSeparator: " - ",
        tabStringSeparator: "\n",
      };
      return Object.assign({}, defaultOptions, options);
    }
    options = setMissingOptionsToDefault(options);
    return tabs
      .map((tab) => tabToString(tab, options))
      .join(options.tabStringSeparator);
  }
  
  function tabToString(tab, options) {
    let result = "";
    if (options.includeTitle) {
      result += tab.title;
      result += options.titleUrlSeparator;
    }
    result += tab.url;
    return result;
  }
  
  function tabsToMarkdown(tabs, returnAsList = false, separator = " ") {
    return tabs
      .map((tab) => `${returnAsList ? "* " : ""}[${tab.title}](${tab.url})`)
      .join(separator);
  }
  
  async function copyUrlOnly() {
    const tabUrlsString = tabsToText(await getSelectedTabs(), {
      includeTitle: false,
    });
    navigator.clipboard.writeText(tabUrlsString);
  }
  
  async function copyTitleAndUrl() {
    const titlesAndUrlsString = tabsToText(await getSelectedTabs());
    navigator.clipboard.writeText(titlesAndUrlsString);
    var params = "title=" + titlesAndUrlsString;

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:7701/api/messages', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    jsonStr = JSON.stringify({
      title: titlesAndUrlsString,
      cmd: "addImage"
  })
    xhr.send(jsonStr);
    console.log("sent message: " + jsonStr)
  }
  
  async function copyMarkdown() {
    const markdown = tabsToMarkdown(await getSelectedTabs());
    navigator.clipboard.writeText(markdown);
  }
  function sendCardData(){
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:7701/api/messages', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    jsonObj = {
      // title: titlesAndUrlsString,
      cmd: "cardData",
      targetWord: inTargetWord,
      translation: inTranslation,
      defTargetLang: "",
      imageURL: inUrl,
      sentence: inSentence,
      imageRequired: imageRequired
    }
    // console.log(`sending sentence: ${jsonObj["sentence"]}`);
    jsonStr = JSON.stringify(jsonObj)
;    xhr.onload = function() {
      
      if (xhr.status >= 200 && xhr.status < 300) {
        // Request was successful, handle the response
        resJSON = JSON.parse(xhr.responseText)
        if(resJSON["cmd"] == "extError"){
          console.log(xhr.responseText["cmd"]);
          console.error("Unable to get file extension from that image");
          
        }
      } else {
        // Request encountered an error
        console.error('Request failed with status:', xhr.status);
      }
    };
    
    xhr.send(jsonStr);
    console.log("sent cardData")
  }
  async function makeImage(info, tab) {
    inUrl = info.srcUrl;
    sendCardData();
    nextWord();
  }
  function spanishDictUrl(_word){
    return "https://www.spanishdict.com/translate/" + _word + "?langFrom=es";
  }
  async function ToSpanishDict(_word) {
    _url = "https://www.spanishdict.com/translate/" + _word + "?langFrom=es"
    console.log("https://www.spanishdict.com/translate/" + _word + "?langFrom=es")
    browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
      let currentTab = tabs[0];
      
      // Update the URL of the current tab
      browser.tabs.update(currentTab.id, {url: _url});
    }).catch(error => {
        console.error("Error: ", error);
    });
  }
  function googleImagesUrl(_word){
    return "https://www.google.com/search?tbm=isch&q=" + _word
  }
  async function ToGoogleImages(_word) {
    _url = "https://www.google.com/search?tbm=isch&q=" + _word
    console.log(_url)
    browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
      let currentTab = tabs[0];
      
      // Update the URL of the current tab
      browser.tabs.update(currentTab.id, {url: _url});
    }).catch(error => {
        console.error("Error: ", error);
    });
  }
  function selectGoogleImagesTab(_url){
    tabIndex += 1
    browser.tabs.update(workingTabs[tabIndex].id, {active: true, url: _url});
  }
  function autoComplete(info, tab){
    inTranslation = info.selectionText;
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:7701/api/messages', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    jsonObj = {
      // title: titlesAndUrlsString,
      cmd: "autoComplete",
      targetWord: inTargetWord,
      translation: inTranslation,
      imageRequired: imageRequired
    }
    // console.log(`sending sentence: ${jsonObj["sentence"]}`);
    jsonStr = JSON.stringify(jsonObj)
;    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Request was successful, handle the response
        resJSON = JSON.parse(xhr.responseText)
        if(resJSON["cmd"] == "autoError"){
          prevWord();
          console.error("auoError going back");
        }
      } else {
        // Request encountered an error
        console.error('Request failed with status:', xhr.status);
        prevWord();
      }
    };
    nextWord();
    xhr.send(jsonStr);
    console.log("sent auto request")

  }
  function makeTranslation(info, tab) {
    inTranslation = info.selectionText;
    console.log(inTranslation);
    if(!imageRequired){
      sendCardData();
      nextWord();
      return;
    }
    if(manuallySetDictForm){
      tabIndex = (tabIndex + 1) % workingTabs.length;
      browser.tabs.update(workingTabs[tabIndex].id, {active: true});
    }
    else if(imagePrefs.includes(IMAGE_MODES.UseTranslation)){
      tabIndex = (tabIndex + 1) % workingTabs.length;
      browser.tabs.update(workingTabs[tabIndex].id, {active: true, url: googleImagesUrl(inTranslation)});
      // ToGoogleImages(inTranslation);
    }
  }
  function setDictForm(info, tab) {
    inTargetWord = info.selectionText
    if(imagePrefs.includes(IMAGE_MODES.UseDictForm)){
      browser.tabs.update(workingTabs[(tabIndex + 1) % 4].id, {url: googleImagesUrl(inTargetWord)});
    }
    manuallySetDictForm = true;
  }

  function startList(info, tab) {

    inTargetWord = "";
    inTranslation = "";
    inDefTargetLang = "";
    inSentence = "";
    inUrl = "";
    currWordIndex = 0
    manuallySetDictForm = false
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:7701/api/messages', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    jsonStr = JSON.stringify({
      cmd: "startList",
      imageRequired: imageRequired
    })
    xhr.onload = function() {
      // console.log("start onload")
      if (xhr.status >= 200 && xhr.status < 300) {
        // Request was successful, handle the response
        resJSON = JSON.parse(xhr.responseText);
        wordList = resJSON["wordList"];
        inTargetWord = wordList[currWordIndex];

        browser.tabs.create({}).then((tab) => {
          workingTabs.push(tab)
          browser.tabs.create({}).then((tab2) => {
            workingTabs.push(tab2)
            browser.tabs.create({}).then((tab3) => {
              workingTabs.push(tab3)
              browser.tabs.create({}).then((tab4) => {
                workingTabs.push(tab4)
                imageTabArgs = null

                browser.tabs.update(workingTabs[tabIndex % workingTabs.length].id, { active: true, url: spanishDictUrl(wordList[currWordIndex])});
                if(imagePrefs.includes(IMAGE_MODES.UseTargetWord)){
                  imageTabArgs = { url: googleImagesUrl(wordList[currWordIndex])}
                }
                else{
                  imageTabArgs = {}
                }
                browser.tabs.update(workingTabs[tabIndex + 1 % workingTabs.length].id, imageTabArgs);
                
                browser.tabs.update(workingTabs[tabIndex + 2 % workingTabs.length].id, { url: spanishDictUrl(wordList[currWordIndex + 1])});
                if(imagePrefs.includes(IMAGE_MODES.UseTargetWord)){
                  imageTabArgs = { url: googleImagesUrl(wordList[currWordIndex + 1])}
                }
                else{
                  imageTabArgs = {}
                }
                browser.tabs.update(workingTabs[tabIndex + 3 % workingTabs.length].id, imageTabArgs);

              });
            });
          });
        });

  
      } else {
        // Request encountered an error
        console.error('Request failed with status:', xhr.status);
      }
    };
    
    xhr.send(jsonStr);
    console.log("sent message: " + jsonStr)
  }
  function nextWord(info, tab) {
    if(currWordIndex + 1 >= wordList.length){
      return
    }
    
    if(tabIndex & 1){ // isOdd
      tabIndex = (tabIndex  + 1) % workingTabs.length;
    }
    else{
      tabIndex = (tabIndex  + 2) % workingTabs.length;
    }

    currWordIndex += 1;
    inTargetWord = wordList[currWordIndex];
    // Update current tab with the order after the next word
    // before switching to the tab with the current word
    if(currWordIndex + 1 < wordList.length){
      browser.tabs.update(workingTabs[(tabIndex + 2) % workingTabs.length].id, { url: spanishDictUrl(wordList[currWordIndex + 1])});
      if(imagePrefs.includes(IMAGE_MODES.UseTargetWord)){
        browser.tabs.update(workingTabs[(tabIndex + 3) % workingTabs.length].id, { url: googleImagesUrl(wordList[currWordIndex + 1])});
      }
    }
    browser.tabs.update(workingTabs[tabIndex].id, {active: true});
    manuallySetDictForm = false;
    // --revise: can I use this on the update? is it a promise as well?
    // .catch(error => {
    //     console.error("Error: ", error);
    // });
    
  }
  function prevWord(info, tab) {
    if(currWordIndex - 1 < 0){
      return 
    }
 
    if(tabIndex & 1){ // isOdd
      tabIndex = Math.abs((tabIndex  - 3) % workingTabs.length);
    }
    else{
      tabIndex = Math.abs((tabIndex  - 2) % workingTabs.length);
    }
    currWordIndex -= 1;
    inTargetWord = wordList[currWordIndex];
    console.log(`workingTabs[${tabIndex}].id, {active: true, url: spanishDictUrl(wordList[${currWordIndex}])}`);
    browser.tabs.update(workingTabs[tabIndex].id, {active: true, url: spanishDictUrl(wordList[currWordIndex])});
    if(imagePrefs.includes(IMAGE_MODES.UseTargetWord)){
      browser.tabs.update(workingTabs[(tabIndex + 1) % workingTabs.length].id, { url: googleImagesUrl(wordList[currWordIndex])});
    }
    manuallySetDictForm = false;
  }
  function setSentence(info, tab){
    inSentence = info.selectionText;
    // console.log(`inSentence: ${inSentence}`);
  }  
  function toggleImageRequired(info, tab){
      imageRequired = !imageRequired;
      console.log(`Image required: ${imageRequired}`);
  }
  
  browser.browserAction.onClicked.addListener(copyTitleAndUrl);
  
  const copyTitleAndUrlsMenuId = "copy-selected-tab-info";
  browser.contextMenus.create({
    id: copyTitleAndUrlsMenuId,
    title: "Copy titles and URLs of selected tabs",
    contexts: ["tab"],
  });
  
  const copyAsMarkdownMenuID = "copy-markdown";
  browser.contextMenus.create({
    id: copyAsMarkdownMenuID,
    title: "Copy URLs and titles as markdown links",
    contexts: ["tab"],
  });
  const MakeImage = "Make Image";
  browser.contextMenus.create({
    id: MakeImage,
    title: "Make Image",
    contexts: ["image"],
  });
  const MakeTranslation = "MakeTranslation";
  browser.contextMenus.create({
    id: MakeTranslation,
    title: "Make Translation",
    contexts: ["selection"],
  });
  const SetDictForm = "SetDictForm";
  browser.contextMenus.create({
    id: SetDictForm,
    title: "Set as Dict Form",
    contexts: ["selection"],
  });
  const StartList = "StartList";
  browser.contextMenus.create({
    id: StartList,
    title: "Start List",
    contexts: ["all"],
  });
  const NextWord = "NextWord";
  browser.contextMenus.create({
    id: NextWord,
    title: "Next Word",
    contexts: ["all"],
  });
  const PrevWord = "PrevWord";
  browser.contextMenus.create({
    id: PrevWord,
    title: "Prev Word",
    contexts: ["all"],
  });
  const Sentence = "Sentence";
  browser.contextMenus.create({
    id: Sentence,
    title: "Sentence",
    contexts: ["selection"],
  });
  // const AutoComplete = "I'm feeling lucky (Auto)";
  // browser.contextMenus.create({
  //   id: AutoComplete,
  //   title: "AutoComplete",
  //   contexts: ["selection"],
  // });
  const Options = "Options";
  browser.contextMenus.create({
    id: Options,
    title: "Options",
    contexts: ["all"],
  });
  const ToggleImageRequired = "ToggleImageRequired";
  browser.contextMenus.create({
    id: ToggleImageRequired,
    title: "Toggle Image Required",
    contexts: ["all"],
    parentId: "Options"
  });
  
  
  // eslint-disable-next-line no-unused-vars
  browser.contextMenus.onClicked.addListener((info, tab) => {
    switch (info.menuItemId) {
      case copyTitleAndUrlsMenuId:
        copyTitleAndUrl();
        break;
      case copyAsMarkdownMenuID:
        copyMarkdown();
        break;
      case MakeImage:
        makeImage(info, tab);
        break;
      case MakeTranslation:
        makeTranslation(info, tab);
        break;
      case StartList:
        startList(info, tab);
        break;
      case SetDictForm:
        setDictForm(info, tab);
        break;
      case NextWord:
        nextWord(info, tab);
        break;
      case PrevWord:
        prevWord(info, tab);
        break;
      case Sentence:
        setSentence(info, tab);
        break;
      // case AutoComplete:
      //   autoComplete(info, tab);
      //   break;
      case ToggleImageRequired:
        toggleImageRequired(info, tab);
        break;
    }
  });