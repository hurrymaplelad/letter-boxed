Solver for 
https://www.nytimes.com/puzzles/letter-boxed

## Usage

Requires [Node](https://nodejs.org/) v18+

```
node ./main.mjs
```

## Credits

Word list is from https://github.com/taikuukaits/SimpleWordlists
with proper nouns, repeated letters, and punctuation filtered out:

grep -Ev "(.)\1|[^a-z]"
