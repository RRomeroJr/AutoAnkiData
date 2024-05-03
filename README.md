# AutoAnkiData
Automating part of my workflow for gathering information for Anki language flashcards 
| Requirements | 
| - |
| - Node.js <br> - Firefox    |

# Idea
When I make flashcards for new words/ phrases in a language. At least 80% of them follow the same process.
- Find a translation
  - Maybe an example sentence 
- Go to google images to find (an) image(s) to help convey the idea

I wanted to see if I could build a tool that would help make this process a little faster.

# Knowledge Learned or Reinforced
- Javascript, first time using it to build something
- Making XML post requests over local host
- Cursory understanding of Promises and how to use them
- Practice managing a small repo using git/ github

# Installation Instructions
- Install `Node.js` (LTS)
- Install `Firefox`
- clone this repo either with `git clone` or downloading the .zip file
- Navigate to where you have cloned this repo
-  run `set_up.bat`
   - Or, if you want to do it yourself
   - open the `NodeServerApp` folder
   - run `npm install`
# Usage
<b>Setting up the extension</b>:
- In the address bar type `about:debugging`
- On the left, click `This Firefox`
- Under `Temporary Extensions` click `Load Temporary Add-on`
- Go to where you cloned the repository
- Open `AutoAnkiExt`  and select `manifest.json`

<b>Setting up the Node app</b>:
- Browse to where you have cloned the repo and open NodeServerApp
- Make sure there is a file in this directory called "words.txt"
- Add any words you want to search for in that file
  - Only 1 word or phrase per line
- (Opt.) in `settings.json` add the path where you want to download images
  - Making this Anki's `collections.media` folder will allow you simply import the csv instead of having to paste the images there manually
  - Default location will be `NodeServerApp/images`
- Open a terminal in this directory. (if on windows, you can type cmd in the address bar)
- run `node app.js`

**Gathering Data**
- If both are set up open firefox and right click to open the context menu
- There should sub-menu there call AutoAnkData
  - options here are contextual and will change depending on what you have selected/ clicked
- click `start list` to begin
- When you find a translation for a word you like select it
- Navigate to the `Make Translation` option
  - This will save your selection then take you to google images
  - (Opt.) select a sentence you like and select `Sentence`
- Right click an image you like and select `Make Image`
  - This will automatically move you on to the next word
- Repeat until done
  - When you are done close the terminal or press `ctrl + c` to stop the application
- All of your information should be in `OutputLog.csv`
