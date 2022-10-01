import * as fs from 'node:fs';
import * as readline from 'node:readline/promises';
import * as process from 'node:process';

const DICTIONARY_PATH = '/usr/share/dict/words';


async function main() {
  const board = await requestBoard();
  const LetterSet = makeLetterSet(board);
  const validWords = await loadDictionary(makeWordFilter(board), LetterSet);
  for (const [word, mask] of validWords) {
    console.log(word, "\t", LetterSet.maskToString(mask));
  }
  console.log('full', "\t", LetterSet.maskToString(LetterSet.full));
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
    sides.push(input.replaceAll(/\s/g, '').toLowerCase().split(''));
  }
  return sides;
}

function makeLetterSet(board) {
  const masksByLetter = {};
  const letters = board.flat();
  letters.forEach((letter, i) => {masksByLetter[letter] = 1 << i});


  const LetterSet = {
    make(word) {
      return LetterSet.intersect(...word.split('').map(x => masksByLetter[x]));
    },
    intersect(...sets) {
      return sets.reduce((left, right) => left | right, LetterSet.empty);
    },
    empty: 0,
    full: (1 << letters.length) - 1,
    maskToString(mask) {
      const suffix = (mask >>> 0).toString(2);
      return '0'.repeat(letters.length - suffix.length) + suffix;
    },
  };
  return LetterSet;
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

async function loadDictionary(wordFilter, LetterSet) {
 const words = new Map();
 const file = fs.createReadStream(DICTIONARY_PATH);
 const lines = readline.createInterface({input: file, crlfDelay: Infinity});

 for await (const rawLine of lines) {
  const line = rawLine.toLowerCase();
  if (wordFilter(line)) {
    words.set(line, LetterSet.make(line));
  }
 }
 return words;
}

main();
