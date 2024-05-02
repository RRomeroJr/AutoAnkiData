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

<b>Setting up the extension</b>:
- In the address bar type `about:debugging`
- On the left, `click This Firefox`
- Under `Temporary Extensions` click `Load Temporary Add-on`
- Go to where you cloned the repository
- Open `AutoAnkiExt`  and select `manifest.json`

<b>Setting up the Node app</b>:
- Browse to where you have cloned the repo and open NodeServerApp
- Make sure there is a file in this directory called "words.txt"
- Add any words you want to search for in that file
- Open a terminal in this directory. (if on windows, you can type cmd in the address bar)
- run `node app.js`
- When you are done close the terminal or press `ctrl + c` to stop the application
