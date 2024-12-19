var codeArea = document.getElementById("codearea");
var editor = CodeMirror.fromTextArea(codeArea, {
    lineNumbers: true,
    mode: "ruby",
    theme: "xq-light"
});

document.getElementById('fbdlForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    try {
        const fbdlCode = editor.getValue();
        
        // Initialize and display the simulator
        const simulator = new Simulator();
        simulator.getSource = () => fbdlCode; // Use the input FBDL code
        simulator.compile();
        simulator.initialize();
        simulator.createGui();
        
        const tokens = tokenizeFBDL(fbdlCode);
        console.log("Tokenized FBDL:", tokens);
    
        const cCode = convertFBDLToC(tokens);
        if (cCode) {
            document.getElementById('resultOutput').innerText = cCode;
        }
    
    } catch (error) {
        document.getElementById('resultOutput').innerText =
        `Error: ${error.message} (row: ${error.row}, column: ${error.column})`;
    }

});

document.getElementById('copyButton').addEventListener('click', function() {
    const resultOutput = document.getElementById('resultOutput').innerText;
    if (resultOutput) {
        const tempInput = document.createElement('textarea');
        tempInput.value = resultOutput;
        document.body.appendChild(tempInput);
        tempInput.select();
        try {
            const success = document.execCommand('copy');
            if (success) {
                alert('Az eredmény sikeresen másolva lett a vágólapra!');
            } else {
                alert('A másolás nem sikerült.');
            }
        } catch (err) {
            console.error('Hiba történt a másolás közben: ', err);
        }
        document.body.removeChild(tempInput);
    } else {
        alert('Nincs semmi másolható tartalom.');
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

let universes = []; // Stores the universes
let rulebases =[]; // Stores the rulebases
let universesMap = {}; // Quick lookup for universe names and their IDs

const ERROR_CODE = -1;

function convertFBDLToC(tokens) {
    // Clear previous result
    document.getElementById('resultOutput').innerText = "";

    // Reset previous data
    universes = [];
    rulebases =[];
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
            const { newIndex, code, error } = processUniverse(tokens, i, universeCounter);
            if (error) {
                console.error(error);
                continue; // Skip invalid universe and continue
            }
            cCode += code;
            universeCounter++;
            i = newIndex;
        } else if (token.type === 'keyword' && token.value === 'rulebase') {
            const { newIndex, code, error } = processRulebase(tokens, i, rulebaseCounter);
            if (error) {
                console.error(error);
                continue; // Skip invalid rulebase and continue
            }
            cCode += code;
            rulebaseCounter++;
            i = newIndex;
        } else {
            i++;
        }
    }

    cCode += generateInputData();
    cCode += "\nreturn 0;\n}\n";

    console.log("Universes:", universes);
    console.log("Rulebases:", rulebases);

    return cCode;
}

function generateInputData() {
    let cCode = "";
    
    universes.forEach(universe => {
        cCode += `FRI_setObservationForUniverseById(${universe.id}, m_observation);\n`;
    });
    
    cCode += "\n";
    cCode += `FRI_calculateAllRuleBases();\n\n`;
    
    universes.forEach(universe => {
        cCode += `printf("**Rulebase: %lf\\n\\n", FRI_getObservationById(${universe.id}));\n`;
    });

    return cCode;
}

function processUniverse(tokens, startIndex, universeCounter) {
    let cCode = "";
    const universeName = tokens[startIndex + 1].value;

    // Check for duplicate universe names
    if (universes.some(u => u.name === universeName)) {
        console.warn(`Duplicate universe name "${universeName}" detected. Skipping...`);
        cCode += `// Universe "${universeName}" is invalid (duplicate)\n\n`;
        return { newIndex: startIndex + 3, code: cCode, error: null }; // Skip to 'end'
    }

    let elements = [];
    let i = startIndex + 2;

    while (tokens[i] && tokens[i].type === 'literal') {
        const name = tokens[i].value; // The name of the element (e.g., "close")
        const x = parseFloat(tokens[i + 1].value); // The x coordinate of the element
        const y = parseFloat(tokens[i + 2].value); // The y coordinate of the element
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

    return { newIndex: i + 1, code: cCode, error: null };
}

function processRulebase(tokens, startIndex, rulebaseCounter) {
    let cCode = "";
    const rulebaseName = tokens[startIndex + 1].value;

    // Check for duplicate rulebase names
    if (rulebases.some(r => r.name === rulebaseName)) {
        console.warn(`Duplicate rulebase name "${rulebaseName}" detected. Skipping...`);
        cCode += `// Rulebase "${rulebaseName}" is invalid (duplicate)\n\n`;
        return { newIndex: startIndex + 3, code: cCode, error: null }; // Skip to 'end'
    }

    let rules = [];
    let i = startIndex + 2; // Skip 'rulebase' and its name

    const consequentUniverseID = universesMap[rulebaseName] ?? ERROR_CODE;
    const consequentUniverse = universes.find(u => u.name === rulebaseName);
    if (consequentUniverseID === ERROR_CODE) {
        console.warn(`Rulebase "${rulebaseName}" does not match any universe. Skipping...`);
        cCode += `FRI_initRuleBaseById(${rulebaseCounter}, 0, ${ERROR_CODE}); // Rulebase: ${rulebaseName} (INVALID)\n\n`;
        return { newIndex: startIndex + 3, code: cCode, error: null }; // Skip to 'end'
    }

    while (tokens[i] && tokens[i].value !== 'end') {
        if (tokens[i].value === 'rule') {
            const { rule, newIndex } = processRule(tokens, i);

            // Validate if rule consequent exists in the rulebase's universe
            const consequentExists = consequentUniverse.elements.some(el => el.name === rule.consequent);
            if (!consequentExists) {
                console.warn(`Rule consequent "${rule.consequent}" not found in universe "${rulebaseName}". Skipping rule.`);
                i = newIndex; // Skip the rule but continue processing
                continue;
            }

            rules.push(rule);
            i = newIndex; // Update index after processing the rule
        } else {
            i++;
        }
    }

    rulebases.push({
        id: rulebaseCounter,
        name: rulebaseName,
        universeID: consequentUniverseID,
        rules
    });

    cCode += `FRI_initRuleBaseById(${rulebaseCounter}, ${rules.length}, ${consequentUniverseID}); // Rulebase: ${rulebaseName}\n`;

    rules.forEach((rule, ruleID) => {
        cCode += `FRI_addRuleToRulebase(${ruleID}, ${rule.antecedents.length});\n`;
        rule.antecedents.forEach(antecedent => {
            const antecedentUniverseID = universesMap[antecedent.universe] ?? ERROR_CODE;
            if (antecedentUniverseID === ERROR_CODE) {
                console.warn(`Antecedent universe "${antecedent.universe}" not found.`);
            }

            const antecedentConditionID = findConditionID(antecedent.universe, antecedent.condition);
            if (antecedentConditionID === ERROR_CODE) {
                console.warn(`Antecedent condition "${antecedent.condition}" not found in universe "${antecedent.universe}".`);
                cCode += `FRI_addAntecedentToRule(${antecedentUniverseID}, ${antecedentConditionID}); // INVALID\n`;
            }else {
                cCode += `FRI_addAntecedentToRule(${antecedentUniverseID}, ${antecedentConditionID});\n`;
            }
        });
        cCode += "\n"; // Empty line between rules
    });

    cCode += "\n";
    return { newIndex: i + 1, code: cCode, error: null }; // Skip 'end'
}

function processRule(tokens, startIndex) {
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

        const universeName = tokens[i].value; // Universe name
        const conditionName = tokens[i + 2].value; // Condition name

        const universe = universes.find(u => u.name === universeName);
        if (!universe) {
            console.warn(`Universe "${universeName}" not found for antecedent "${conditionName}".`);
        }

        const antecedent = {
            universeID: universe ? universe.id : null, // Assign universe ID or null
            universe: universeName,
            condition: conditionName,
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
        return ERROR_CODE;
    }

    const conditionIndex = universe.elements.findIndex(el => el.name === conditionName);
    if (conditionIndex === -1) {
        console.error(`Condition ${conditionName} not found in universe ${universeName}! Returning -1.`);
    return ERROR_CODE;
    }

    return conditionIndex;
}

function getUniverseCount(tokens) {
    const uniqueUniverses = new Set(); // Store unique universe names
    tokens.forEach(token => {
        if (token.type === 'keyword' && token.value === 'universe') {
            const universeName = tokens[tokens.indexOf(token) + 1]?.value; // Get the universe name
            if (universeName) uniqueUniverses.add(universeName);
        }
    });
    return uniqueUniverses.size; // Count only unique universe names
}

function getRulebaseCount(tokens) {
    const uniqueUniverses = new Set(); // Store unique universe names
    const uniqueRulebases = new Set(); // Store unique rulebase names
    tokens.forEach(token => {
        if (token.type === 'keyword' && token.value === 'universe') {
            const universeName = tokens[tokens.indexOf(token) + 1]?.value; // Get the universe name
            if (universeName) uniqueUniverses.add(universeName);
        }
        if (token.type === 'keyword' && token.value === 'rulebase') {
            const rulebaseName = tokens[tokens.indexOf(token) + 1]?.value; // Get the rulebase name
            if (rulebaseName && uniqueUniverses.has(rulebaseName)) uniqueRulebases.add(rulebaseName);
        }
    });
    return uniqueRulebases.size; // Count only unique rulebase names
}
