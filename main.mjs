import * as readline from 'node:readline/promises';
import * as process from 'node:process';


async function main() {
  const board = await requestBoard();
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

main();
