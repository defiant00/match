class Functions {
    static repeat = 'repeat';
    static repeat_lazy = 'repeat-lazy';

    static or = 'or';

    static lookahead = 'followed-by';
    static negative_lookahead = 'not-followed-by';
    static lookbehind = 'preceded-by';
    static negative_lookbehind = 'not-preceded-by';
}

class Constants {
    static any = 'any';
    static line_start = 'line-start';
    static line_end = 'line-end';
    static newline = 'newline';
    static or_more = 'or-more';
}

class TextMatcher {
    errors = [];
    tokens = [];
    tree = [];

    constructor(value) {
        this.lex(value);
        this.parse(0, this.tree);
    }

    get debug() {
        let val = '';

        // errors
        if (this.errors.length > 0) {
            val = 'Errors:\n' + this.errors.reduce((res, val) => res += val + '\n', '') + '\n';
        }

        // tokens
        val += 'Tokens: ' + this.tokens.join(' ');

        // tree
        val += '\n\nTree: ' + TextMatcher.arrayString(this.tree);

        // regex
        val += '\n\nRegex: ' + TextMatcher.regexString(this.tree);

        return val;
    }

    static regexString(array) {
        let val = '';
        let [func, fnStart, fnEnd, startIndex] = TextMatcher.regexFuncValues(array);
        val += fnStart;
        let first = true;
        for (let i = startIndex; i < array.length; i++) {
            let item = array[i];
            if (first) {
                first = false;
            } else {
                if (func === Functions.or) {
                    val += '|';
                }
            }
            if (Array.isArray(item)) {
                val += TextMatcher.regexString(item);
            } else if (item.type === Token.Identifier) {
                val += TextMatcher.stdLibraryRegex(item.value);
            } else if (item.type === Token.String) {
                val += TextMatcher.escapeString(item.value);
            }
        }
        val += fnEnd;
        return val;
    }

    static regexFuncValues(array) {
        let funcName = '';
        let start = '';
        let end = '';
        let startingIndex = 0;
        if (array[0] && array[0].type === Token.Identifier) {
            funcName = array[0].value;

            switch (funcName) {
                case Functions.or:
                    start = '(?:';
                    end = ')';
                    startingIndex = 1;
                    break;
                case Functions.repeat:
                case Functions.repeat_lazy:
                    start = '(?:';
                    end = ')*';
                    startingIndex = 1;
                    let v1 = array[1];
                    if (v1 && v1.type === Token.Number) {
                        let v2 = array[2];
                        if (v2 && v2.type === Token.Number) {
                            if (v1.value === 0 && v2.value === 1) {
                                end = ')?';
                            } else {
                                end = '){' + v1.value + ',' + v2.value + '}';
                            }
                            startingIndex = 3;
                        } else if (v2 && v2.type === Token.Identifier && v2.value === Constants.or_more) {
                            if (v1.value === 0) {
                                end = ')*';
                            } else if (v1.value === 1) {
                                end = ')+';
                            } else {
                                end = '){' + v1.value + ',}';
                            }
                            startingIndex = 3;
                        } else {
                            end = '){' + array[1].value + '}';
                            startingIndex = 2;
                        }
                    }
                    if (funcName === Functions.repeat_lazy) {
                        end += '?';
                    }
                    break;
                case Functions.lookahead:
                    start = '(?=';
                    end = ')';
                    startingIndex = 1;
                    break;
                case Functions.negative_lookahead:
                    start = '(?!';
                    end = ')';
                    startingIndex = 1;
                    break;
                case Functions.lookbehind:
                    start = '(?<=';
                    end = ')';
                    startingIndex = 1;
                    break;
                case Functions.negative_lookbehind:
                    start = '(?<!';
                    end = ')';
                    startingIndex = 1;
                    break;
            }
        }

        // function name, starting string, ending string, starting array value index
        return [funcName, start, end, startingIndex];
    }

    static stdLibraryRegex(identifier) {
        switch (identifier) {
            case Constants.any: return '.';
            case Constants.line_start: return '^';
            case Constants.line_end: return '$';
            case Constants.newline: return '(?:\\r\\n|\\r|\\n)';
        }
        return '';
    }

    static escapeString(val) {
        let result = val.replaceAll('""', '"').replaceAll("''", "'");
        const escChars = '\\{}[]()^$.|*+?';
        for (let char of escChars) {
            result = result.replaceAll(char, '\\' + char);
        }
        return result;
    }

    static arrayString(array) {
        let val = '(';
        let first = true;
        for (let item of array) {
            if (first) {
                first = false;
            } else {
                val += ' ';
            }
            if (Array.isArray(item)) {
                val += TextMatcher.arrayString(item);
            } else {
                val += item;
            }
        }
        return val + ')';
    }

    lex(value) {
        let startIndex = 0;
        let currentIndex = 0;
        while (currentIndex < value.length) {
            let val = value[currentIndex];
            switch (val) {
                case ' ':
                case '\t':
                case '\r':
                case '\n':
                    startIndex = ++currentIndex;
                    break;
                case '(':
                    this.tokens.push(new Token(Token.LeftParen));
                    startIndex = ++currentIndex;
                    break;
                case ')':
                    this.tokens.push(new Token(Token.RightParen));
                    startIndex = ++currentIndex;
                    break;
                case '"':
                case "'":
                    currentIndex++;
                    while (currentIndex < value.length) {
                        if (value[currentIndex] === val) {
                            if (value[currentIndex] === value[currentIndex + 1]) {
                                currentIndex++;
                            } else {
                                break;
                            }
                        }
                        currentIndex++;
                    }
                    if (value[currentIndex] !== val) {
                        this.errors.push('unclosed ' + val);
                    }
                    this.tokens.push(new Token(Token.String, value.slice(startIndex + 1, currentIndex++)));
                    startIndex = currentIndex;
                    break;
                default:
                    if (TextMatcher.isStartingIdentifierChar(val)) {
                        currentIndex++;
                        while (currentIndex < value.length && TextMatcher.isIdentifierChar(value[currentIndex])) {
                            currentIndex++;
                        }
                        this.tokens.push(new Token(Token.Identifier, value.slice(startIndex, currentIndex)));
                        startIndex = currentIndex;
                    } else if (TextMatcher.isDigit(val)) {
                        currentIndex++;
                        while (currentIndex < value.length && TextMatcher.isDigit(value[currentIndex])) {
                            currentIndex++;
                        }
                        this.tokens.push(new Token(Token.Number, Number(value.slice(startIndex, currentIndex))));
                        startIndex = currentIndex;
                    } else {
                        startIndex = ++currentIndex;
                    }
                    break;
            }
        }
    }

    static isStartingIdentifierChar(c) {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
    }

    static isIdentifierChar(c) {
        return TextMatcher.isStartingIdentifierChar(c) || (c >= '0' && c <= '9') || c === '.' || c === '-';
    }

    static isDigit(c) {
        return c >= '0' && c <= '9';
    }

    parse(index, parent) {
        let needsRightParen = index > 0;
        let loop = true;
        while (index < this.tokens.length && loop) {
            let val = this.tokens[index++];
            switch (val.type) {
                case Token.LeftParen:
                    let child = [];
                    parent.push(child);
                    index = this.parse(index, child);
                    break;
                case Token.RightParen:
                    loop = false;
                    break;
                default:
                    parent.push(val);
                    break;
            }
        }
        // ran out of tokens
        if (loop && needsRightParen) {
            this.errors.push('unclosed (')
        }
        return index;
    }
}

class Token {
    static LeftParen = 0;
    static RightParen = 1;
    static Identifier = 2;
    static String = 3;
    static Number = 4;

    constructor(type, value) {
        this.type = type;
        this.value = value;
    }

    toString() {
        switch (this.type) {
            case Token.LeftParen: return '(';
            case Token.RightParen: return ')';
            case Token.String: return '"' + this.value + '"';
            default: return this.value;
        }
    }
}
