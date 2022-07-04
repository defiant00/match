class TextMatcher {
    errors = [];
    tree = new Node();

    constructor(value) {
        this.parse(value);
    }

    // The regex equivalent of the pattern.
    get regex() {
        return '.*';
    }

    parse(value) {
        this.tokens = this.lex(value);
    }

    lex(value) {
        let startIndex = 0;
        let currentIndex = 0;
        let tokens = [];
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
                    tokens.push('(');
                    startIndex = ++currentIndex;
                    break;
                case ')':
                    tokens.push(')');
                    startIndex = ++currentIndex;
                    break;
                case '"':
                case "'":
                    currentIndex++;
                    while (currentIndex < value.length) {
                        currentIndex++;
                        if (value[currentIndex] === val) {
                            if (value[currentIndex] === value[currentIndex + 1]) {
                                currentIndex++;
                            } else {
                                break;
                            }
                        }
                    }
                    if (value[currentIndex] !== val) {
                        this.errors.push("Unclosed " + val);
                    } else {
                        tokens.push(value.slice(startIndex, ++currentIndex))
                    }
                    startIndex = currentIndex;
                    break;
                default:
                    if (this.isStartingIdentifierChar(val)) {
                        currentIndex++;
                        while (currentIndex < value.length && this.isIdentifierChar(value[currentIndex])) {
                            currentIndex++;
                        }
                        tokens.push(value.slice(startIndex, currentIndex));
                        startIndex = currentIndex;
                    } else {
                        startIndex = ++currentIndex;
                    }
                    break;
            }
        }
        return tokens;
    }

    isStartingIdentifierChar(c) {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
    }

    isIdentifierChar(c) {
        return this.isStartingIdentifierChar(c) || (c >= '0' && c <= '9') || c === '.';
    }
}

class Node {
    left;
    right;
}