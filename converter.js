var codeArea = document.getElementById("codearea");
var editor = CodeMirror.fromTextArea(codeArea, {
    lineNumbers: true,
    mode: "ruby",
    theme: "xq-light"
});

document.getElementById('fbdlForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const fbdlCode = editor.getValue();
    const tokens = tokenizeFBDL(fbdlCode);
    console.log("Tokenized FBDL:", tokens);

    const cCode = convertFBDLToC(tokens);
    if (cCode) {
        document.getElementById('resultOutput').innerText = cCode;
    }
});

// Tokenize FBDL code
function tokenizeFBDL(fbdlCode) {
    let tokenizer = new Tokenizer();
    tokenizer.setText(fbdlCode);
    
    let tokens = [];
    let token;
    while ((token = tokenizer.getNextToken()).type !== "empty") {
        tokens.push(token);
    }
    
    return tokens;
}

let universes = []; // Tárolja az univerzumokat
let universesMap = {}; // Univerzumok neve és ID-ja közti gyors kereséshez
let rulebaseNames = []; // A rulebase nevek listája az egyediség ellenőrzéséhez

function convertFBDLToC(tokens) {
    rulebaseNames = [];
    universes = [];
    universesMap = {};

    let cCode = "int main(){\n\n";
    let universeCounter = 0;
    let rulebaseCounter = 0;

    // Initialize FRI
    cCode += `FRI_init(${getUniverseCount(tokens)}, ${getRulebaseCount(tokens)});\n\n`;

    let i = 0;
    while (i < tokens.length) {
        const token = tokens[i];

        if (token.type === 'keyword' && token.value === 'universe') {
            const { newIndex, code } = processUniverse(tokens, i, universeCounter);
            cCode += code;
            universeCounter++;
            i = newIndex;
        } else if (token.type === 'keyword' && token.value === 'rulebase') {
            const { newIndex, code, error } = processRulebase(tokens, i, rulebaseCounter);
            if (error) {
                console.error(error);
                return null; // Hibás állapot, megszakítjuk a generálást
            }
            cCode += code;
            rulebaseCounter++;
            i = newIndex;
        } else {
            i++;
        }
    }

    cCode += "\nreturn 0;\n}\n";
    return cCode;
}

function processUniverse(tokens, startIndex, universeCounter) {
    let cCode = "";
    const universeName = tokens[startIndex + 1].value;

    let elements = [];
    let i = startIndex + 2;

    while (tokens[i] && tokens[i].type === 'literal') {
        const name = tokens[i].value; // Az elem neve (pl. "close")
        const x = parseFloat(tokens[i + 1].value); // Az elem x koordinátája
        const y = parseFloat(tokens[i + 2].value); // Az elem y koordinátája
        elements.push({ name, x, y });
        i += 3;
    }

    universes.push({ id: universeCounter, name: universeName, elements });
    universesMap[universeName] = universeCounter;

    cCode += `FRI_initUniverseById(${universeCounter}, ${elements.length}); // Universe: ${universeName}\n`;
    elements.forEach(element => {
        cCode += `FRI_addUniverseElement(${element.x}, ${element.y});\n`;
    });
    cCode += "\n";

    return { newIndex: i + 1, code: cCode };
}

function processRulebase(tokens, startIndex, rulebaseCounter) {
    let cCode = "";
    const rulebaseName = tokens[startIndex + 1].value;

    // Duplikált rulebase név ellenőrzése
    if (rulebaseNames.includes(rulebaseName)) {
        return { newIndex: null, code: null, error: `Duplicate rulebase name "${rulebaseName}" detected. Aborting generation.` };
    }
    rulebaseNames.push(rulebaseName);

    let rules = [];
    let i = startIndex + 2; // Skip 'rulebase' and its name

    const consequentUniverseID = universesMap[rulebaseName] ?? -1;
    if (consequentUniverseID === -1) {
        console.warn(`Rulebase "${rulebaseName}" does not match any universe. Skipping...`);
        cCode += `FRI_initRuleBaseById(${rulebaseCounter}, 0, -1); // Rulebase: ${rulebaseName} (INVALID)\n\n`;
        return { newIndex: startIndex + 3, code: cCode, error: null }; // Skip to 'end'
    }

    while (tokens[i] && tokens[i].value !== 'end') {
        if (tokens[i].value === 'rule') {
            const { rule, newIndex } = processRule(tokens, i, rulebaseCounter, rules.length);
            rules.push(rule);
            i = newIndex; // Update index after processing the rule
        } else {
            i++;
        }
    }

    cCode += `FRI_initRuleBaseById(${rulebaseCounter}, ${rules.length}, ${consequentUniverseID}); // Rulebase: ${rulebaseName}\n`;

    rules.forEach((rule, ruleID) => {
        cCode += `FRI_addRuleToRulebase(${ruleID}, ${rule.antecedents.length});\n`;
        rule.antecedents.forEach(antecedent => {
            const antecedentUniverseID = universesMap[antecedent.universe] ?? -1;
            if (antecedentUniverseID === -1) {
                console.warn(`Antecedent universe "${antecedent.universe}" not found.`);
            }

            const antecedentConditionID = findConditionID(antecedent.universe, antecedent.condition);
            if (antecedentConditionID === -1) {
                console.warn(`Antecedent condition "${antecedent.condition}" not found in universe "${antecedent.universe}".`);
            }

            cCode += `FRI_addAntecedentToRule(${antecedentUniverseID}, ${antecedentConditionID});\n`;
        });
        cCode += "\n"; // Üres sor a szabályok között
    });

    cCode += "\n";
    return { newIndex: i + 1, code: cCode, error: null }; // Skip 'end'
}

function processRule(tokens, startIndex, rulebaseCounter, ruleID) {
    let rule = { antecedents: [] };
    let i = startIndex + 1; // Skip 'rule'

    // Extract rule consequent
    rule.consequent = tokens[i].value;
    i += 2; // Skip consequent and 'when'

    // Extract antecedents
    while (tokens[i].value !== 'end') {
        if (tokens[i].value === 'and') {
            i++; // Skip 'and'
        }

        const antecedent = {
            universe: tokens[i].value,       // Universe name
            condition: tokens[i + 2].value, // Condition name
        };
        rule.antecedents.push(antecedent);
        i += 3; // Move to the next antecedent or 'end'
    }

    return { rule, newIndex: i + 1 }; // Skip 'end'
}

function findConditionID(universeName, conditionName) {
    const universe = universes.find(u => u.name === universeName);
    if (!universe) {
        console.error(`Universe ${universeName} not found! Returning -1.`);
        return -1;
    }

    const conditionIndex = universe.elements.findIndex(el => el.name === conditionName);
    if (conditionIndex === -1) {
        console.error(`Condition ${conditionName} not found in universe ${universeName}! Returning -1.`);
        return -1;
    }

    return conditionIndex;
}

function getUniverseCount(tokens) {
    return tokens.filter(token => token.type === 'keyword' && token.value === 'universe').length;
}

function getRulebaseCount(tokens) {
    return tokens.filter(token => token.type === 'keyword' && token.value === 'rulebase').length;
}
