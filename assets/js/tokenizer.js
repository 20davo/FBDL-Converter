/**
 * Construct new tokenizer object.
 */
function Tokenizer()
{
}

/**
 * Set the text for tokenization.
 */
Tokenizer.prototype.setText = function(text)
{
    // The source text.
    this.text = text;

    // Index of the next character in the source.
    this.index = 0;

    // Store the actual cursor position.
    this.row = 1;
    this.column = 1;
}

/**
 * Get the next token.
 */
Tokenizer.prototype.getNextToken = function()
{
    this.skipWhiteSpaces();
    token = this.readToken();
    return token;
}

/**
 * Skip the whitespaces in the text.
 */
Tokenizer.prototype.skipWhiteSpaces = function()
{
    while (this.isWhiteSpace(this.readNextCharacter())) {
        this.getNextCharacter();
    }
}

/**
 * Is the character is whitespace?
 */
Tokenizer.prototype.isWhiteSpace = function(c)
{
    if (c == ' ' || c == '\n' || c == '\t') {
        return true;
    }
    return false;
}

/**
 * Read the next token.
 */
Tokenizer.prototype.readToken = function()
{
    if (this.hasNextCharacter() == false) {
        return {"type": "empty"};
    }

    var c = this.readNextCharacter();
    if (c == '"') {
        return this.readLiteral();
    }
    else if (this.isNumericChar(c)) {
        return this.readNumber();
    }
    else {
        return this.readKeyword();
    }
}

/**
 * Checks that the character is numeric.
 */
Tokenizer.prototype.isNumericChar = function(c)
{
    if ((c >= '0' && c <= '9') || c == '-' || c == '.') {
        return true;
    }
    return false;
}

/**
 * Read keyword token.
 */
Tokenizer.prototype.readKeyword = function()
{
    var value = "";
    do {
        value += this.getNextCharacter();
    } while (this.hasNextCharacter() && this.isKeywordChar(this.readNextCharacter()));
    return {"type": "keyword", "value": value};
}

/**
 * Is the character is valid keyword character?
 */
Tokenizer.prototype.isKeywordChar = function(c)
{
    if (c == '\n' || c == ' ' || c == '"' || c == '\t') {
        return false;
    }
    else {
        return true;
    }
}

/**
 * Read number token.
 */
Tokenizer.prototype.readNumber = function()
{
    var value = "";
    do {
        value += this.getNextCharacter();
    } while (this.hasNextCharacter() && this.isNumericChar(this.readNextCharacter()));
    return {"type": "number", "value": value};
}

/**
 * Read literal token.
 */
Tokenizer.prototype.readLiteral = function()
{
    // Skip the first " character.
    this.getNextCharacter();

    var value = "";
    while (this.hasNextCharacter() && this.readNextCharacter() != '"') {
        value += this.getNextCharacter();
    }
    if (this.index == this.text.length) {
        throw {"message": "Unexpected end of string literal!"};
    }

    // Skip the last " character.
    this.getNextCharacter();

    return {"type": "literal", "value": value};
}

/**
 * Check that there is at least one further character.
 */
Tokenizer.prototype.hasNextCharacter = function()
{
    if (this.index < this.text.length) {
        return true;
    }
    else {
        return false;
    }
}

/**
 * Read the next character.
 */
Tokenizer.prototype.readNextCharacter = function()
{
    var character = this.text[this.index];
    return character;
}

/**
 * Get the next character.
 */
Tokenizer.prototype.getNextCharacter = function()
{
    var character = this.text[this.index];

    if (character == '\n') {
        ++this.row;
        this.column = 1;
    }
    else {
        ++this.column;
    }

    ++this.index;
    return character;
}

/**
 * Get the current position.
 */
Tokenizer.prototype.getPosition = function()
{
    return {"row": this.row, "column": this.column};
}

