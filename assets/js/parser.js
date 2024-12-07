/**
 * Create new parser object.
 */
function Parser()
{
}

/**
 * Read the behaviour definition from the text.
 */
Parser.prototype.readBehaviour = function(text)
{
    var behaviour = {};

    behaviour["universes"] = {};
    behaviour["rulebases"] = {};

    this.tokenizer = new Tokenizer();

    this.tokenizer.setText(text);

    var token = {};
    do {
        token = this.tokenizer.getNextToken();
        if (token["type"] == "keyword") {
            if (token["value"] == "universe") {
                var universe = this.readUniverse();
                if (universe["name"] in behaviour["universes"]) {
                    var cursor = this.tokenizer.getPosition();
                    throw {
                        "message": "The '" + universe["name"] + "' universe already defined!",
                        "row": cursor["row"],
                        "column": cursor["column"]
                    };
                }
                behaviour["universes"][universe["name"]] = universe["value"];
            }
            else if (token["value"] == "rulebase") {
                var rulebase = this.readRulebase();
                if (rulebase["name"] in behaviour["rulebases"]) {
                    var cursor = this.tokenizer.getPosition();
                    throw {
                        "message": "The '" + rulebase["name"] + "' rulebase already defined!",
                        "row": cursor["row"],
                        "column": cursor["column"]
                    };
                }
                behaviour["rulebases"][rulebase["name"]] = rulebase["value"];
            }
        }
        else if (token["type"] != "empty") {
            var cursor = this.tokenizer.getPosition();
            throw {
                "message": "The 'rulebase' keyword is missing!",
                "row": cursor["row"],
                "column": cursor["column"]
            };
        }
    } while (token["type"] != "empty");

    this.checkBehaviour(behaviour);

    return behaviour;
}

/**
 * Read the universe definition.
 */
Parser.prototype.readUniverse = function()
{
    var universe = {};

    var token = this.tokenizer.getNextToken();
    if (token["type"] == "literal") {

        // Get the name.
        var name = token["value"];

        // Get the universe.
        var universe = new Universe();

        token = this.tokenizer.getNextToken();
        while (token["type"] == "literal") {

            var symbol = token["value"];
            var position = null;
            var value = null;

            token = this.tokenizer.getNextToken();
            if (token["type"] == "number") {
                position = parseFloat(token["value"]);
            }
            else {
                var cursor = this.tokenizer.getPosition();
                throw {
                    "message": "Invalid position in universe definition!",
                    "row": cursor["row"],
                    "column": cursor["column"]
                };
            }

            token = this.tokenizer.getNextToken();
            if (token["type"] == "number") {
                value = parseFloat(token["value"]);
            }
            else {
                var cursor = this.tokenizer.getPosition();
                throw {
                    "message": "Invalid value in universe definition!",
                    "row": cursor["row"],
                    "column": cursor["column"]
                };
            }

            universe.addSymbol(symbol, position, value);

            token = this.tokenizer.getNextToken();
        }

        if (token["type"] == "keyword" && token["value"] == "end") {
            return {"name": name, "value": universe};
        }
        else {
            var cursor = this.tokenizer.getPosition();
            throw {
                "message": "The 'end' keyword is missing at the end of universe definition!",
                "row": cursor["row"],
                "column": cursor["column"]
            };
        }

    }
    else {
        var cursor = this.tokenizer.getPosition();
        throw {
            "message": "The name of the universe is missing!",
            "row": cursor["row"],
            "column": cursor["column"]
        };
    }
}

/**
 * Read the rulebase definition.
 */
Parser.prototype.readRulebase = function()
{
    var rulebase = {};

    var rulebaseName = "";
    var rulebaseValue = {};

    var token = this.tokenizer.getNextToken();
    if (token["type"] == "literal") {
        rulebaseName = token["value"]; 
        rulebaseValue["rules"] = [];
        do {
            token = this.tokenizer.getNextToken();
            if (token["type"] == "keyword") {
                if (token["value"] == "rule") {
                    var rule = this.readRule();
                    rulebaseValue["rules"].push(rule);
                }
            }
            else {
                var cursor = this.tokenizer.getPosition();
                throw {
                    "message": "Invalid syntax in rulebase definition file!",
                    "row": cursor["row"],
                    "column": cursor["column"]
                };
            }
        } while (!(token["type"] == "keyword" && token["value"] == "end"));
    }
    else {
        var cursor = this.tokenizer.getPosition();
        throw {
            "message": "The rulebase name is missing!",
            "row": cursor["row"],
            "column": cursor["column"]
        };
    }

    return {"name": rulebaseName, "value": rulebaseValue};
}

/**
 * Read the rule.
 */
Parser.prototype.readRule = function()
{
    var rule = {};

    var token = this.tokenizer.getNextToken();
    if (token["type"] == "literal" || token["type"] == "keyword") {

        if (token["type"] == "keyword") {
            if (token["value"] == "use") {
                token = this.tokenizer.getNextToken();
                if (token["type"] == "literal") {
                    rule["variable"] = token["value"];
                }
                else {
                    // ERROR: Literal required!
                }
            }
            else {
                // ERROR: Invalid keyword! (Only 'use' accepted yet!)
            }
        }
        else {
            rule["consequent"] = token["value"];
        }

        rule["predicates"] = {};

        token = this.tokenizer.getNextToken();
        if (token["type"] == "keyword" && token["value"] == "when") {
            do {
                var predicateAntecedent = "";
                var predicateValue = "";

                token = this.tokenizer.getNextToken();
                if (token["type"] == "literal") {
                    predicateAntecedent = token["value"];
                }
                else {
                    var cursor = this.tokenizer.getPosition();
                    throw {
                        "message": "Literal required on antecedent side!",
                        "row": cursor["row"],
                        "column": cursor["column"]
                    };
                }

                token = this.tokenizer.getNextToken();
                if (token["type"] == "keyword" && token["value"] == "is") {
                }
                else {
                    var cursor = this.tokenizer.getPosition();
                    throw {
                        "message": "Missing 'is' keyword!",
                        "row": cursor["row"],
                        "column": cursor["column"]
                    };
                }

                token = this.tokenizer.getNextToken();
                if (token["type"] == "literal") {
                    predicateValue = token["value"];
                }
                else {
                    var cursor = this.tokenizer.getPosition();
                    throw {
                        "message": "The consequent value must be literal!",
                        "row": cursor["row"],
                        "column": cursor["column"]
                    };
                }

                if (predicateAntecedent in rule["predicates"]) {
                    throw {"message": "The '" + predicateAntecedent + "' antecedent is duplicated in rule!"};
                }

                rule["predicates"][predicateAntecedent] = predicateValue;

                token = this.tokenizer.getNextToken();
                if (token["type"] != "keyword") {
                    var cursor = this.tokenizer.getPosition();
                    throw {
                        "message": "'and' or 'end' keyword is required instead of literal!",
                        "row": cursor["row"],
                        "column": cursor["column"]
                    };
                }

            } while (token["value"] != "end");
        }
        else {
            var cursor = this.tokenizer.getPosition();
            throw {
                "message": "Missing 'when' keyword!",
                "row": cursor["row"],
                "column": cursor["column"]
            };
        }
    }
    else {
        var cursor = this.tokenizer.getPosition();
        throw {
            "message": "Missing consequent value from rule!",
            "row": cursor["row"],
            "column": cursor["column"]
        };
    }

    return rule;
}

/**
 * Check the integrity of the behaviour description.
 */
Parser.prototype.checkBehaviour = function(behaviour)
{
    this.checkRulebases(behaviour);
}

/**
 * Check the symbols in rulebases.
 */
Parser.prototype.checkRulebases = function(behaviour)
{
    var universes = behaviour["universes"];
    var rulebases = behaviour["rulebases"];

    this.checkRulebaseNames(rulebases, universes);
    this.checkRulebaseRules(rulebases, universes);
}

/**
 * Check that the rulebase names have defined universe.
 */
Parser.prototype.checkRulebaseNames = function(behaviour)
{
    var universes = behaviour["universes"];
    var rulebases = behaviour["rulebases"];

    for (var rulebaseName in rulebases) {
        if (rulebases.hasOwnProperty(rulebaseName)) {
            if ((rulebaseName in universes) == false) {
                var cursor = this.tokenizer.getPosition();
                throw {
                    "message": "Missing universe definition for '" + rulebaseName + "' rulebase!",
                    "row": cursor["row"],
                    "column": cursor["column"]
                };
            }
        }
    }
}

/**
 * Check the rules in the rulebases.
 */
Parser.prototype.checkRulebaseRules = function(rulebases, universes)
{
    for (var rulebaseName in rulebases) {
        if (rulebases.hasOwnProperty(rulebaseName)) {
            var rulebase = rulebases[rulebaseName];
            this.checkRulebase(rulebase, universes);
        }
    }
}

/**
 * Check the rulebase.
 */
Parser.prototype.checkRulebase = function(name, rules, universes)
{
    for (var j = 0; j < rules.length; ++j) {
        var rule = rules[j];
        this.checkRule(name, rule, universes);
    }
}

/**
 * Check the rule.
 */
Parser.prototype.checkRule = function(name, rule, universes)
{
    if ("consequent" in rule) {
        this.checkConsequent(name, rule["consequent"], universes);
    }
    else if ("variable" in rule) {
        this.checkVariable(name, rule["variable"], universes);
    }
    else {
        throw {
            "message": "Missing consequent or variable in '" + name + "' rulebase!"
        };
    }

    if ("predicates" in rule) {
        this.checkPredicates(rule["predicates"], universes);
    }
    else {
        throw {
            "message": "The predicates are missing in '" + name + "' rulebase!"
        };
    }
}

/**
 * Check the consequent in the universes.
 */
Parser.prototype.checkConsequent = function(name, consequent, universes)
{
    var universe = universes[name];
    if (name in universe == false) {
        throw {
            "message": "The '" + consequent + "' consequent name is invalid in '" + name + "' rulebase!"
        }
    }
}

/**
 * Check the variable in the universes.
 */
Parser.prototype.checkVariable = function(name, variable, universes)
{
    if (variable in universes == false) {
        throw {
            "message": "The '" + variable + "' variable name is invalid in '" + name + "' rulebase!"
        };
    }
}

/**
 * Check the predicates.
 */
Parser.prototype.checkPredicates = function(predicates, universes)
{
    for (var antecedent in predicates) {
        if (predicates.hasOwnProperty(antecedent)) {
            if (antecedent in universes) {
                var value = predicates[antecedent];
                if (value in universes[antecedent]["symbols"] == false) {
                    throw {
                        "message": "The '" + value + "' value is invalid!"
                    };
                }
            }
            else {
                throw {
                    "message": "The '" + antecedent + "' is invalid!"
                };
            }
        }
    }
}

