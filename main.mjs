import * as fs from 'node:fs';
import * as readline from 'node:readline/promises';
import * as process from 'node:process';

const DICTIONARY_PATH = '/usr/share/dict/words';

async function main() {
  const board = await requestBoard();
  const validWords = await loadDictionary(makeWordFilter(board));
  console.log(Array.from(validWords));
  process.exit(0);
}

async function requestBoard() {
  const sides = [];
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("Enter the board, one side per line:");
  for(let i=0; i<4; i++) {
    const input = await rl.question('');
    sides.push(input.replaceAll(/\s/g, '').split(''));
  }
  return sides;
}

function makeWordFilter(board) {
  const letterRegExp = new RegExp(`^[${board.flat().join()}]+$`, 'i');
  return word => (
    // Is long enough
    word.length > 2 &&
    // Only uses letters on the board
    letterRegExp.test(word)
  );
}

async function loadDictionary(wordFilter) {
 const words = new Set();
 const file = fs.createReadStream(DICTIONARY_PATH);
 const lines = readline.createInterface({input: file, crlfDelay: Infinity});

 for await (const line of lines) {
  if (wordFilter(line)) {
    words.add(line.toLowerCase());
  }
 }
 return words;
}

main();
