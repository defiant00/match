class Functions {
    static any = 'any';
    static followed_by = 'followed-by';
    static not_followed_by = 'not-followed-by';
    static optional = 'optional';
    static or = 'or';
    static preceded_by = 'preceded-by';
    static not_preceded_by = 'not-preceded-by';
    static some = 'some';

    static std_line_start = 'line-start';
    static std_line_end = 'line-end';
    static std_newline = 'newline';
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
        let prop = '';
        if (array[0] && array[0].type === Token.Identifier) {
            prop = array[0].value;
        }
        switch (prop) {
            case Functions.any:
            case Functions.optional:
            case Functions.or:
            case Functions.some:
                val += '(?:';
                break;
            case Functions.followed_by:
                val += '(?=';
                break;
            case Functions.not_followed_by:
                val += '(?!';
                break;
            case Functions.preceded_by:
                val += '(?<=';
                break;
            case Functions.not_preceded_by:
                val += '(?<!';
                break;
        }
        let first = true;
        for (let item of array) {
            if (!first) {
                if (prop === Functions.or) {
                    val += '|';
                }
            }
            if (Array.isArray(item)) {
                val += TextMatcher.regexString(item);
                first = false;
            } else if (item.type === Token.Identifier) {
                val += TextMatcher.stdLibraryRegex(item.value);
            } else if (item.type === Token.String) {
                val += TextMatcher.escapeString(item.value.slice(1, item.value.length - 1));
                first = false;
            }
        }
        switch (prop) {
            case Functions.followed_by:
            case Functions.not_followed_by:
            case Functions.preceded_by:
            case Functions.not_preceded_by:
                val += ')';
                break;
            case Functions.any:
                val += ')*';
                break;
            case Functions.optional:
                val += ')?';
                break;
            case Functions.or:
                val += ')';
                break;
            case Functions.some:
                val += ')+';
                break;
        }
        return val;
    }

    static stdLibraryRegex(identifier) {
        switch (identifier) {
            case Functions.std_line_start: return '^';
            case Functions.std_line_end: return '$';
            case Functions.std_newline: return '(?:\\r\\n|\\r|\\n)';
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
                val += this.arrayString(item);
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
                    this.tokens.push(new Token(Token.String, value.slice(startIndex, ++currentIndex)));
                    startIndex = currentIndex;
                    break;
                default:
                    if (this.isStartingIdentifierChar(val)) {
                        currentIndex++;
                        while (currentIndex < value.length && this.isIdentifierChar(value[currentIndex])) {
                            currentIndex++;
                        }
                        this.tokens.push(new Token(Token.Identifier, value.slice(startIndex, currentIndex)));
                        startIndex = currentIndex;
                    } else {
                        startIndex = ++currentIndex;
                    }
                    break;
            }
        }
    }

    isStartingIdentifierChar(c) {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
    }

    isIdentifierChar(c) {
        return this.isStartingIdentifierChar(c) || (c >= '0' && c <= '9') || c === '.' || c === '-';
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

    constructor(type, value) {
        this.type = type;
        this.value = value;
    }

    toString() {
        switch (this.type) {
            case Token.LeftParen: return '(';
            case Token.RightParen: return ')';
            default: return this.value;
        }
    }
}