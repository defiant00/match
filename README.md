# match

Text matching and replacement.

---

1. Goal is more readable and flexible text processing than regexes
2. Define patterns and processors
3. Variables are scoped to the parent that they are defined in
4. String (capture) and numeric (counter) variables
5. Assignment using `:` or `=`? `variable = pattern/value/etc`
6. Literal strings are quoted using `'` or `"`, quotes are escaped in strings by doubling. `'You probably shouldn''t...'`

## Syntax

### Constants

* `any` - matches any single character
* `line-start` - matches the start of the line
* `line-end` - matches the end of the line
* `newline` - matches the various newline combinations `\r\n`, `\r`, `\n`

### Pattern Functions

* `repeat pattern` - repeat the pattern 0 or more times
* `repeat num pattern` - repeat the pattern `num` times
* `repeat min max pattern` - repeat the pattern `min` to `max` times, you can use `or-more` for `max` for an unbound maximum
* `repeat-lazy` - same parameters as `repeat`
* `or pattern1 pattern2 ...` - accept the first matching pattern in the specified order
* `followed-by pattern` - perform positive lookahead
* `not-followed-by pattern` - perform negative lookahead
* `preceded-by pattern` - perform positive lookbehind
* `not-predeced-by pattern` - perform negative lookbehind

### Processor Functions

* tbd

---

## Todo

* Character class
  * Normal
  * Negated
  * Range
  * Subtraction
  * Intersection
  * Shorthand
    * Digits
    * Word character
    * Whitespace
    * Negated
* Word boundary and negated
* Capture group
  * Reference
* Comment
* Unicode
* Atomic grouping
* Possessive quantifier
* Conditional
* Balancing/recursion
* Named patterns and references

---

## Old Notes

### Pattern Commands
* `pattern` - define a pattern
* `processor` - define a processor
* `var` - define variables
* `set` - takes a variable and a value to set it to
* `+, -, *, /, %` - basic math
* `length` - takes a string and returns the length
* `matches` - takes a pattern and string and returns the number of matches
* `number` - takes a string and tries to convert it to a number

### Processor Commands
* `->` - define a processor step
* repeat - takes a string and number and repeats the string that many times
* some sort of conditional output
* nested processors
