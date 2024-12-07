/**
 * Create new engine object.
 */
function Engine()
{
}

/**
 * Initialize the engine.
 */
Engine.prototype.initialize = function(behaviour)
{
    this.behaviour = behaviour;

    this.collectAntecedents();
    this.collectStates();

    this.calcDependencyGraph(behaviour);
}

/**
 * Step the behaviour engine to the next state.
 */
Engine.prototype.step = function()
{
    this.calcRuleDistances();
    this.calcNewStates();
}

/**
 * Collect antecedents in rulebases.
 *
 * Prepare "antecedents" field of the rulebase for further calculation.
 */
Engine.prototype.collectAntecedents = function()
{
    var rulebases = this.behaviour["rulebases"];
    for (var rulebaseName in rulebases) {
        if (rulebases.hasOwnProperty(rulebaseName)) {
            var rulebase = rulebases[rulebaseName];
            var antecedents = [];
            for (var k = 0; k < rulebase["rules"].length; ++k) {
                var rule = rulebase["rules"][k];
                var predicates = rule["predicates"];
                for (antecedent in predicates) {
                    if (predicates.hasOwnProperty(antecedent)) {
                        if (antecedents.indexOf(antecedent) == -1) {
                            antecedents.push(antecedent);
                        }
                    }
                }
            }
            this.behaviour["rulebases"][rulebaseName]["antecedents"] = antecedents;
        }
    }
}

/**
 * Collect the states.
 */
Engine.prototype.collectStates = function()
{
    this.states = {};
    var universes = this.behaviour["universes"];
    for (var state in universes) {
        if (universes.hasOwnProperty(state)) {
            this.states[state] = universes[state].getLowValue();
        }
    }
}

/**
 * Collect the observations.
 */
Engine.prototype.collectObservations = function()
{
    var universes = this.behaviour["universes"];
    var rulebases = this.behaviour["rulebases"];

    var observations = {};

    for (var name in universes) {
        if (universes.hasOwnProperty(name)) {
            if ((name in rulebases) == false) {
                observations[name] = universes[name];
            }
        }
    }

    return observations;
}

/**
 * Collect outputs.
 */
Engine.prototype.collectOutputs = function()
{
    var universes = this.behaviour["universes"];
    var rulebases = this.behaviour["rulebases"];

    var observations = {};

    for (var name in rulebases) {
        if (rulebases.hasOwnProperty(name)) {
            observations[name] = universes[name];
        }
    }

    return observations;
}

/**
 * Calculate the distances of the rules from the observation.
 */
Engine.prototype.calcRuleDistances = function()
{
    var universes = this.behaviour["universes"];
    var rulebases = this.behaviour["rulebases"];

    for (var rulebaseName in rulebases) {
        if (rulebases.hasOwnProperty(rulebaseName)) {
            var rulebase = rulebases[rulebaseName];
            for (var k = 0; k < rulebase["rules"].length; ++k) {
                var rule = rulebase["rules"][k];
                var predicates = rule["predicates"];

                this.behaviour["rulebases"][rulebaseName]["rules"][k]["distances"] = {};

                var ruleDistance = 0.0;
                for (antecedent in predicates) {
                    if (predicates.hasOwnProperty(antecedent)) {
                        var symbol = predicates[antecedent];
                        var observation = this.states[antecedent];
                        var distance = this.calcDistance(universes[antecedent], symbol, observation);

                        this.behaviour["rulebases"][rulebaseName]["rules"][k]["distances"][antecedent] = distance;

                        ruleDistance += distance * distance;
                    }
                }
                var nAntecedents = this.behaviour["rulebases"][rulebaseName]["antecedents"].length;
                ruleDistance = Math.sqrt(ruleDistance) / Math.sqrt(nAntecedents);

                this.behaviour["rulebases"][rulebaseName]["rules"][k]["distance"] = ruleDistance;
            }
        }
    }
}

/**
 * Calculate the distance of the observation from the rule.
 */
Engine.prototype.calcDistance = function(universe, symbol, observation)
{
    try {
        var rulePosition = universe["symbols"][symbol]["position"];
        // console.log([rulePosition, observation]);
        var distance = universe.calcDistance(rulePosition, observation);
        return distance;
    }
    catch (error) {
        console.log(error);
        return 0;
    }
}

/**
 * Calculate the new state of the behaviour engine.
 */
Engine.prototype.calcNewStates = function()
{
    var newStates = {};

    var universes = this.behaviour["universes"];
    var rulebases = this.behaviour["rulebases"];

    for (var rulebaseName in rulebases) {
        if (rulebases.hasOwnProperty(rulebaseName)) {
            var rulebase = rulebases[rulebaseName];

            var consequent = 0.0;

            // Count exact matches.
            nExactMatches = 0;
            for (var k = 0; k < rulebase["rules"].length; ++k) {

                var ruleDistance = rulebase["rules"][k]["distance"];

                // Determine rule consequent.
                var ruleConsequent = 0.0;

                var rule = rulebase["rules"][k];
                if ("consequent" in rule) {
                    var consequentName = rule["consequent"];
                    ruleConsequent = universes[rulebaseName]["symbols"][consequentName]["value"];
                }
                else if ("variable" in rule) {
                    var variableName = rule["variable"];
                    ruleConsequent = this.states[variableName];
                }
                else {
                    // ASSERT: There should no other option!
                }

                if (ruleDistance < 0.000001) {
                    consequent += ruleConsequent;
                    ++nExactMatches;
                }
            }

            if (nExactMatches > 0) {
                consequent /= nExactMatches;
            }
            else {
                // Shepard interpolation
                var weightSum = 0.0;
                for (var k = 0; k < rulebase["rules"].length; ++k) {

                    var ruleDistance = rulebase["rules"][k]["distance"];

                    // Determine rule consequent.
                    var ruleConsequent = 0.0;

                    var rule = rulebase["rules"][k];
                    if ("consequent" in rule) {
                        var consequentName = rule["consequent"];
                        ruleConsequent = universes[rulebaseName]["symbols"][consequentName]["value"];
                    }
                    else if ("variable" in rule) {
                        var variableName = rule["variable"];
                        ruleConsequent = this.states[variableName];
                    }
                    else {
                        // ASSERT: There should no other option!
                    }

                    var weight = 1.0 / ruleDistance;
                    weightSum += weight;

                    consequent += weight * ruleConsequent;
                }
                consequent /= weightSum;
            }

            newStates[rulebaseName] = consequent;
        }
    }
    
    // Swap the states.
    for (var rulebaseName in rulebases) {
        if (rulebases.hasOwnProperty(rulebaseName)) {
            this.states[rulebaseName] = newStates[rulebaseName];
        }
    }
}

/**
 * Get the actual state report.
 */
Engine.prototype.getStateReport = function()
{
    var stateReport = "";

    console.log(JSON.stringify(this.behaviour["rulebases"]));

    var rulebases = this.behaviour["rulebases"];
    for (var rulebaseName in rulebases) {
        if (rulebases.hasOwnProperty(rulebaseName)) {
            var consequent = this.states[rulebaseName];
            stateReport += "rulebase \"" + rulebaseName + "\" = " + consequent + "\n";
            var rules = rulebases[rulebaseName]["rules"];
            for (var ruleIndex = 0; ruleIndex < rules.length; ++ruleIndex) {
                var rule = rules[ruleIndex];
                var ruleDistance = rule["distance"];
                stateReport += "    rule \"" + rule["consequent"] + "\" = " + ruleDistance + "\n";
                for (var antecedent in rule["predicates"]) {
                    if (rule["predicates"].hasOwnProperty(antecedent)) {
                        var distance = rule["distances"][antecedent];
                        stateReport += "        \"" + antecedent + "\" is \"" + rule["predicates"][antecedent];
                        stateReport +=  "\" = " + distance + "\n";
                    }
                }
            }
            stateReport += "\n";
        }
    }

    return stateReport;
}

/**
 * Get the coloured state report.
 */
Engine.prototype.getColouredStateReport = function()
{
    var stateReport = "";

    console.log(JSON.stringify(this.behaviour["rulebases"]));

    var rulebases = this.behaviour["rulebases"];
    for (var rulebaseName in rulebases) {
        if (rulebases.hasOwnProperty(rulebaseName)) {
            var consequent = this.states[rulebaseName];
            var consequentIntensity = Math.floor((1.0 - consequent) * 255);
            var consequentStyle = "color: rgb(" + consequentIntensity + ", " + consequentIntensity + ", " + consequentIntensity + ");";
            stateReport += "<span style=\"" + consequentStyle + "\"> rulebase \"" + rulebaseName + "\" = " + consequent + "</span><br />";
            var rules = rulebases[rulebaseName]["rules"];
            for (var ruleIndex = 0; ruleIndex < rules.length; ++ruleIndex) {
                var rule = rules[ruleIndex];
                var ruleDistance = rule["distance"];
                var ruleIntensity = Math.floor(ruleDistance * 255);
                var ruleStyle = "color: rgb(" + ruleIntensity + ", " + ruleIntensity + ", " + ruleIntensity + ");";
                stateReport += "----<span style=\"" + ruleStyle + "\"> rule \"" + rule["consequent"] + "\" = " + ruleDistance + "</span><br />";
                for (var antecedent in rule["predicates"]) {
                    if (rule["predicates"].hasOwnProperty(antecedent)) {
                        var distance = rule["distances"][antecedent];
                        var predicateIntensity = Math.floor(distance * 255);
                        var predicateStyle = "color: rgb(" + predicateIntensity + ", " + predicateIntensity + ", " + predicateIntensity + ");";
                        stateReport += "--------<span style=\"" + predicateStyle + "\"> \"" + antecedent + "\" is \"" + rule["predicates"][antecedent];
                        stateReport +=  "\" = " + distance + "</span><br />";
                    }
                }
            }
            stateReport += "\n";
        }
    }

    return stateReport;
}

/**
 * Calculate the dependency graph.
 */
Engine.prototype.calcDependencyGraph = function(behaviour)
{
    var antecedentUsages = this.collectAntecedentUsages(behaviour);
    var dotString = this.convertToDot(antecedentUsages);

    console.log(dotString);
}

/**
 * Collect all antecedent usage in rulebases.
 */
Engine.prototype.collectAntecedentUsages = function(behaviour)
{
    var usages = {};

    var rulebases = behaviour["rulebases"];
    for (var rulebaseName in rulebases) {
        if (rulebases.hasOwnProperty(rulebaseName)) {
            var rules = rulebases[rulebaseName]["rules"];
            for (var ruleIndex = 0; ruleIndex < rules.length; ++ruleIndex) {
                var rule = rules[ruleIndex];
                if ("predicates" in rule) {
                    var predicates = rule["predicates"];
                    for (var antecedent in predicates) {
                        if (predicates.hasOwnProperty(antecedent)) {
                            if ((rulebaseName in usages) == false) {
                                usages[rulebaseName] = {};
                            }
                            usages[rulebaseName][antecedent] = true;
                        }
                    }
                }
            }
        }
    }

    return usages;
}

/**
 * Convert antecedent usage list to dot format.
 */
Engine.prototype.convertToDot = function(antecedentUsages)
{
    var dotString = "digraph G {\n";
    for (var rulebaseName in antecedentUsages) {
        if (antecedentUsages.hasOwnProperty(rulebaseName)) {
            for (var antecedent in antecedentUsages[rulebaseName]) {
                if (antecedentUsages[rulebaseName].hasOwnProperty(antecedent)) {
                    dotString += antecedent + " -> " + rulebaseName + ";\n";
                }
            }
        }
    }
    dotString += "}";
    return dotString;
}

