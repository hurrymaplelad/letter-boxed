import * as fs from 'node:fs';
import * as readline from 'node:readline/promises';
import * as process from 'node:process';

const DICTIONARY_PATH = './words.txt';
const MIN_WORD_LENGTH = 3;
const MAX_WORD_COUNT = 2;

async function main() {
  const board = await requestBoard();
  const LetterSet = makeLetterSet(board);
  const validWords = await loadDictionary(makeWordFilter(board), LetterSet);

  console.log('Candidate words:', validWords.size);

  const solutions = Array.from(search({ board, validWords, LetterSet }));
  solutions.sort((a, b) => b.join().length - a.join().length);
  for (const solution of solutions) {
    console.log(...solution, `(${solution.join().length})`);
  }
  process.exit(0);
}

function* search({ board, validWords, LetterSet }) {
  // Build index of possible next letters from current letter
  const nextLetters = { '': board.flat() };
  for (let i = 0; i < board.length; i++) {
    const side = board[i];
    const next = board.filter((_, index) => i != index).flat();
    for (let letter of side) {
      nextLetters[letter] = next;
    }
  }

  console.log("Finding words...")
  const wordsByFirstLetter = {};
  for (const letter of board.flat()) {
    wordsByFirstLetter[letter] = [];
    for (const word of validWords.keys()) {
      if (word.startsWith(letter)) {
        wordsByFirstLetter[letter].push(word);
      }
    }
  }

  console.log("Finding solutions...")
  function* searchForSolutions(wordList) {
    const coveredLetters = LetterSet.intersect(...wordList.map(w => validWords.get(w)));
    if (coveredLetters === LetterSet.full) {
      yield wordList;
      return;
    }
    if (wordList.length >= MAX_WORD_COUNT) {
      return;
    }
    const lastWord = wordList[wordList.length - 1];
    const lastLetter = lastWord[lastWord.length - 1];
    for (const word of wordsByFirstLetter[lastLetter]) {
      yield* searchForSolutions([...wordList, word]);
    }
  }

  for (const letter of board.flat()) {
    for (const word of wordsByFirstLetter[letter])
      yield* searchForSolutions([word]);
  }
}

async function requestBoard() {
  const sides = [];
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log("Enter the board, one side per line:");
  for (let i = 0; i < 4; i++) {
    const input = await rl.question('');
    sides.push(input.replaceAll(/\s/g, '').toLowerCase().split(''));
  }
  return sides;
}

function makeLetterSet(board) {
  const masksByLetter = {};
  const letters = board.flat();
  letters.forEach((letter, i) => { masksByLetter[letter] = 1 << i });


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
  const letterRegExp = new RegExp(`^[${board.flat().join()}]+$`, '');
  const invalidMoveRegExp = new RegExp(board.map(side => `[${side.join()}]{2}`).join('|'));
  return word => (
    // Is long enough
    word.length >= MIN_WORD_LENGTH &&
    // Only uses lower case letters on the board
    letterRegExp.test(word) &&
    // No adjacent letters from the same side of the board
    !invalidMoveRegExp.test(word)
  );
}

async function loadDictionary(wordFilter, LetterSet) {
  const words = new Map();
  const file = fs.createReadStream(DICTIONARY_PATH);
  const lines = readline.createInterface({ input: file, crlfDelay: Infinity });

  for await (const rawLine of lines) {
    const line = rawLine.toLowerCase();
    if (wordFilter(line)) {
      words.set(line, LetterSet.make(line));
    }
  }
  return words;
}

function printProgress(...terms) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(terms.join(' '));
}

main();
