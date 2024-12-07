/**
 * Construct new universe object.
 */
function Universe()
{
    this.symbols = {};
}

/**
 * Count the symbols.
 */
Universe.prototype.countSymbols = function()
{
    return Object.keys(this.symbols).length;
}

/**
 * Add new symbol to the universe.
 */
Universe.prototype.addSymbol = function(name, position, value)
{
    if (name in this.symbols) {
        var message = "The '" + name + "' symbol has been already defined in universe!";
        throw {"message": message};
    }

    for (var symbol in this.symbols) {
        if (this.symbols.hasOwnProperty(symbol)) {
            var p = this.symbols[symbol]["position"];
            if (p == position) {
                throw {"message": "Duplicated position in the universe!"};
            }
        }
    } 

    this.symbols[name] = {"position": position, "value": value};

    this.checkMonotonity();
}

/**
 * Check the monotonity of the universe function and raise error
 * when it is not true.
 */
Universe.prototype.checkMonotonity = function()
{
    var orderedSymbols = [];

    for (var symbol in this.symbols) {
        if (this.symbols.hasOwnProperty(symbol)) {
            var position = this.symbols[symbol]["position"];
            var value = this.symbols[symbol]["value"];
            var item = {
                "name": symbol,
                "position": position,
                "value": value
            };
            if (orderedSymbols.length == 0) {
                orderedSymbols.push(item);
            }
            else {
                if (position < orderedSymbols[0]["position"]) {
                    orderedSymbols.unshift(item);
                }
                else {
                    orderedSymbols.push(item);
                }
            }
        }
    }

    for (var i = 1; i < orderedSymbols.length; ++i) {
        if (orderedSymbols[i]["value"] < orderedSymbols[i - 1]["value"]) {
            throw {"message": "The universe function must be monoton!"};
        }
    }
}

/**
 * Get low position.
 */
Universe.prototype.getLowPosition = function()
{
    var position = Infinity;
    for (var symbol in this.symbols) {
        if (this.symbols.hasOwnProperty(symbol)) {
            var p = this.symbols[symbol]["position"];
            if (p < position) {
                position = p;
            }
        }
    } 
    return position;
}

/**
 * Get high position.
 */
Universe.prototype.getHighPosition = function()
{
    var position = -Infinity;
    for (var symbol in this.symbols) {
        if (this.symbols.hasOwnProperty(symbol)) {
            var p = this.symbols[symbol]["position"];
            if (p > position) {
                position = p;
            }
        }
    } 
    return position;
}

/**
 * Get low value.
 */
Universe.prototype.getLowValue = function()
{
    var position = Infinity;
    var value = null;
    for (var symbol in this.symbols) {
        if (this.symbols.hasOwnProperty(symbol)) {
            var p = this.symbols[symbol]["position"];
            var v = this.symbols[symbol]["value"];
            if (p < position) {
                position = p;
                value = v;
            }
        }
    } 
    return value;
}

/**
 * Get high value.
 */
Universe.prototype.getHighValue = function()
{
    var position = -Infinity;
    var value = null;
    for (var symbol in this.symbols) {
        if (this.symbols.hasOwnProperty(symbol)) {
            var p = this.symbols[symbol]["position"];
            var v = this.symbols[symbol]["value"];
            if (p > position) {
                position = p;
                value = v;
            }
        }
    } 
    return value;
}

/**
 * Calc the value at given position.
 */
Universe.prototype.calcValue = function(observation)
{
    if (this.countSymbols() == 0) {
        throw {"message": "Unable to calc on empty universe!"};
    }

    var leftSymbol = this.findClosestSymbolOnLeft(observation);
    var rightSymbol = this.findClosestSymbolOnRight(observation);

    // TODO: Handle when the symbol is null!

    var leftPosition = this.symbols[leftSymbol]["position"];
    var rightPosition = this.symbols[rightSymbol]["position"];

    var leftValue = this.symbols[leftSymbol]["value"];
    var rightValue = this.symbols[rightSymbol]["value"];

    var positionDistance = rightPosition - leftPosition;
    if (positionDistance == 0.0) {
        return leftValue;
    }

    var t = (observation - leftPosition) / positionDistance;
    var value = leftValue + t * (rightValue - leftValue);

    return value;
}

/**
 * Find the closest symbol on the left side.
 */
Universe.prototype.findClosestSymbolOnLeft = function(observation)
{
    if (this.countSymbols() == 0) {
        throw {"message": "Cannot find symbol on empty universe!"};
    }
    
    if (this.countSymbols() == 1) {
        throw {"message": "At least two symbols should be defined on the universe!"};
    }

    this.checkBounds(observation);

    var leftSymbol = null;
    var leftPosition = null;

    for (var symbol in this.symbols) {
        if (this.symbols.hasOwnProperty(symbol)) {
            var position = this.symbols[symbol]["position"];
            if (leftSymbol == null) {
                leftSymbol = symbol;
                leftPosition = position;
            }
            else {
                if (leftPosition > observation && position < leftPosition) {
                    leftSymbol = symbol;
                    leftPosition = position;
                }
                else {
                    if (position < observation && position >= leftPosition) {
                        leftSymbol = symbol;
                        leftPosition = position;
                    }
                }
            }
        }
    }

    return leftSymbol;
}

/**
 * Find the closest symbol on the right side.
 */
Universe.prototype.findClosestSymbolOnRight = function(observation)
{
    if (this.countSymbols() == 0) {
        throw {"message": "Cannot find symbol on empty universe!"};
    }

    if (this.countSymbols() == 1) {
        throw {"message": "At least two symbols should be defined on the universe!"};
    }

    this.checkBounds(observation);

    var rightSymbol = null;
    var rightPosition = null;

    for (var symbol in this.symbols) {
        if (this.symbols.hasOwnProperty(symbol)) {
            var position = this.symbols[symbol]["position"];
            if (rightSymbol == null) {
                rightSymbol = symbol;
                rightPosition = position;
            }
            else {
                if (rightPosition < observation && position > rightPosition) {
                    rightSymbol = symbol;
                    rightPosition = position;
                }
                else {
                    if (position > observation && position <= rightPosition) {
                        rightSymbol = symbol;
                        rightPosition = position;
                    }
                }
            }
        }
    }

    return rightSymbol;
}

/**
 * Check that the observation is between the bounds!
 */
Universe.prototype.checkBounds = function(observation)
{
    var lowPosition = this.getLowPosition(observation);
    var highPosition = this.getHighPosition(observation);

    if (observation < lowPosition) {
        throw {"message": "The value is below the universe bounds! (" + observation + " < " + lowPosition + ")"};
    }

    if (observation > highPosition) {
        throw {"message": "The value is above the universe bounds! (" + observation + " > " + highPosition + ")"};
    }
}

/**
 * Calculate the distance between positions.
 */
Universe.prototype.calcDistance = function(aPosition, bPosition)
{
    var aValue = this.calcValue(aPosition);
    var bValue = this.calcValue(bPosition);
    var distance = Math.abs(aValue - bValue);
    distance /= this.getHighValue() - this.getLowValue();
    return distance;
}

