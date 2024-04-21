inTargetWord = ""
//translation becomes the image name so for now I needed a default
// value for testing
inTranslation = "EXTENDSION_DEFAULT"
inDefTargetLang = ""
inSentence = ""

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
  // async function thisIsAnImage(info, tab) {
  //   // console.log("īmej issa! " + "Image URL: " +  info.srcUrl)
  //   var xhr = new XMLHttpRequest();
  //   xhr.open('POST', 'http://localhost:7701/api/messages', true);
  //   xhr.setRequestHeader('Content-Type', 'application/json');
  //   jsonStr = JSON.stringify({
  //     // title: titlesAndUrlsString,
  //     cmd: "cardData",
  //     translation: inTranslation,
  //     defTargetLang: "definición en la idioma objetiva",
  //     imageURL: info.srcUrl
  //   })
  //   xhr.onload = function() {
      
  //     if (xhr.status >= 200 && xhr.status < 300) {
  //       // Request was successful, handle the response
  //       console.log('Response from server:', xhr.responseText);
  //     } else {
  //       // Request encountered an error
  //       console.error('Request failed with status:', xhr.status);
  //     }
  //   };
    
  //   xhr.send(jsonStr);
  //   console.log("sent message: " + jsonStr)
  // }
  async function thisIsAnImage(info, tab) {
    // console.log("īmej issa! " + "Image URL: " +  info.srcUrl)
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:7701/api/messages', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    jsonObj = {
      // title: titlesAndUrlsString,
      cmd: "cardData",
      targetWord: inTargetWord,
      translation: inTranslation,
      defTargetLang: "",
      imageURL: info.srcUrl,
      sentence: inSentence
    }
    // console.log(`sending sentence: ${jsonObj["sentence"]}`);
    jsonStr = JSON.stringify(jsonObj)
;    xhr.onload = function() {
      
      if (xhr.status >= 200 && xhr.status < 300) {
        // Request was successful, handle the response
        resJSON = JSON.parse(xhr.responseText)
        if(resJSON["cmd"] == "nextWord"){
            inTargetWord = resJSON["nextWord"];
            inSentence = "";
            inDefTargetLang = "";
            console.log('Next to SpanishDict: ', inTargetWord);
            ToSpanishDict(inTargetWord)
        }else if(resJSON["cmd"] == "extError"){
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
  async function makeTranslation(info, tab) {
    inTranslation = info.selectionText;
    console.log(inTranslation);
    ToGoogleImages(inTranslation);
  }
  async function setDictForm(info, tab) {
    inTargetWord = info.selectionText
  }
  
  async function startList(info, tab) {
    inTargetWord = "";
    inTranslation = "";
    inDefTargetLang = "";
    inSentence = "";
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:7701/api/messages', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    jsonStr = JSON.stringify({
      cmd: "startList"
    })
    xhr.onload = function() {
      // console.log("start onload")
      if (xhr.status >= 200 && xhr.status < 300) {
        // Request was successful, handle the response
        resJSON = JSON.parse(xhr.responseText)
        inTargetWord = resJSON["nextWord"]
        console.log('To SpanishDict: ', inTargetWord);
        ToSpanishDict(inTargetWord)
      } else {
        // Request encountered an error
        console.error('Request failed with status:', xhr.status);
      }
    };
    
    xhr.send(jsonStr);
    console.log("sent message: " + jsonStr)
  }
  async function skipWord(info, tab) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:7701/api/messages', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    jsonStr = JSON.stringify({
      cmd: "skipWord"
    })
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Request was successful, handle the response
        resJSON = JSON.parse(xhr.responseText)
        inTargetWord = resJSON["nextWord"]
        console.log('To SpanishDict: ', inTargetWord);
        ToSpanishDict(inTargetWord)
      } else {
        // Request encountered an error
        console.error('Request failed with status:', xhr.status);
      }
    };
    
    xhr.send(jsonStr);
    console.log("sent message: " + jsonStr)
  }
  async function goBack(info, tab) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://localhost:7701/api/messages', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    jsonStr = JSON.stringify({
      cmd: "GoBack"
    })
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Request was successful, handle the response
        resJSON = JSON.parse(xhr.responseText)
        inTargetWord = resJSON["nextWord"]
        console.log('To SpanishDict: ', inTargetWord);
        ToSpanishDict(inTargetWord)
      } else {
        // Request encountered an error
        console.error('Request failed with status:', xhr.status);
      }
    };
    
    xhr.send(jsonStr);
    console.log("sent message: " + jsonStr)
  }
  function setSentence(info, tab){
    inSentence = info.selectionText;
    // console.log(`inSentence: ${inSentence}`);
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
  const ThisIsAnImage = "This is an image";
  browser.contextMenus.create({
    id: ThisIsAnImage,
    title: "This is an image",
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
  const SkipWord = "SkipWord";
  browser.contextMenus.create({
    id: SkipWord,
    title: "Skip Word",
    contexts: ["all"],
  });
  const GoBack = "GoBack";
  browser.contextMenus.create({
    id: GoBack,
    title: "Go Back",
    contexts: ["all"],
  });
  const Sentence = "Sentence";
  browser.contextMenus.create({
    id: Sentence,
    title: "Sentence",
    contexts: ["selection"],
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
      case ThisIsAnImage:
        thisIsAnImage(info, tab);
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
      case SkipWord:
        skipWord(info, tab);
        break;
      case GoBack:
        goBack(info, tab);
        break;
      case Sentence:
        setSentence(info, tab);
        break;
    }
  });