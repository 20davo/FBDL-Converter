# FBDL to C Converter

## Overview
The **FBDL to C Converter** is a JavaScript-based tool that converts **Fuzzy Behavior Description Language (FBDL)** code into C code. This tool processes FBDL code and generates corresponding C code that defines universes, rulebases, and their respective rules, ensuring compatibility with the **FRI (Fuzzy Rule Interpolation)** framework.

In addition to its core functionality, the tool now includes an interactive **simulation section** where behavior can be simulated.

Access the tool [here](http://fbdlconverter.nhely.hu/).

---

## Features
- **Token Parsing**: Uses a tokenizer to parse FBDL syntax into structured tokens.
- **Universe Handling**: Converts FBDL `universe` definitions into FRI-based C code `FRI_initUniverseById` and `FRI_addUniverseElement`.
- **Rulebase Management**: Translates `rulebase` and its associated `rules` into FRI-based C code `FRI_initRuleBaseById` and `FRI_addRuleToRulebase`.
- **Antecedent & Consequent Mapping**: Processes antecedents and consequents to handle universes and conditions.
- **Error Handling**:
  - Ensures no duplicate `universe` and `rulebase` names are allowed. If a duplicate is found, the code generation is aborted with an error message.
  - Handles invalid references to universes or conditions by assigning `-1` in the generated code and logging warnings.
  - Skips invalid `rulebases` and prevents their associated rules from being generated.
  - Validates that each `rule`'s consequent exists in the corresponding `rulebase` universe. If not, the invalid rule is skipped, and a warning is logged.
- **Simulation**: A live simulation feature that allows you to interact with the generated code and visualize how the universes, rulebases, and rules interact in real-time.

---

## How It Works
1. **Input**: The user pastes or writes FBDL source code into the web editor.
2. **Tokenization**: The `tokenizer.js` module parses the text into tokens, each representing syntactic elements (e.g., `universe`, `rulebase`, `rule`, etc.).
3. **Validation**: The converter checks the model for structural correctness:
   - Detects duplicate universe or rulebase identifiers.
   - Ensures all antecedents and consequents reference valid universes.
   - Logs warnings for skipped or invalid rules.
4. **Code Generation**: The `converter.js` module generates equivalent C code with proper FRI function calls such as  
   `FRI_initUniverseById`, `FRI_addUniverseElement`, and `FRI_addRuleToRulebase`.
5. **Output**: The generated C code is displayed in the output editor, ready to be copied.
6. **Simulation**:
   - Once the conversion is successful, the interpreted FBDL model is passed to the `simulator.js` engine.
   - The simulator (adapted from *Ethology*’s engine) dynamically builds universes and rulebases based on the parsed structure.
   - Users can manipulate input observations (antecedent values) and immediately observe the resulting consequent values, mimicking real-time FRI behavior.

---

## Usage
1. **Open the Converter**  
   Visit [fbdlconverter.nhely.hu](http://fbdlconverter.nhely.hu/) to access the tool.
2. **Convert FBDL Code**
   - Paste your FBDL description into the input editor.
   - Click **Convert** to generate C code and initialize the simulation model.
3. **Review the Output**
   - Inspect the generated C code in the right panel.
   - Check the browser console for validation warnings (e.g., duplicate names or invalid rule references).
4. **Run the Simulation**
   - Scroll to the **Simulation** section below the editors.
   - Modify observation values for each universe using the sliders or input boxes.
   - Observe the live calculation of consequents and rulebase outputs.
   - The simulator recomputes results through the JavaScript implementation of the FRI logic each time inputs change.
5. **Export or Integrate**
   - Copy the generated C code and integrate it into your own FRI/FIVE-based embedded or desktop application.

---

## Example FBDL Input
```fbdl
universe "distance"
    "close" 0 0
    "mid" 5 2
    "far" 10 10
end

universe "range"
    "close" 0 0
    "mid" 5 2
    "far" 10 10
end

universe "speed"
    "low" 0 0
    "high" 10 10
end

rulebase "speed"
    rule
        "low" when "distance" is "close" and "range" is "close"
    end
    rule
        "high" when "distance" is "far" and "range" is "mid"
    end
end
```
## Generated C Code
```c
int main(){

FRI_init(3, 1);

FRI_initUniverseById(0, 3); // Universe: distance
FRI_addUniverseElement(0, 0);
FRI_addUniverseElement(5, 2);
FRI_addUniverseElement(10, 10);

FRI_initUniverseById(1, 3); // Universe: range
FRI_addUniverseElement(0, 0);
FRI_addUniverseElement(5, 2);
FRI_addUniverseElement(10, 10);

FRI_initUniverseById(2, 2); // Universe: speed
FRI_addUniverseElement(0, 0);
FRI_addUniverseElement(10, 10);

FRI_initRuleBaseById(0, 2, 2); // Rulebase: speed
FRI_addRuleToRulebase(0, 2);
FRI_addAntecedentToRule(0, 0);
FRI_addAntecedentToRule(1, 0);

FRI_addRuleToRulebase(1, 2);
FRI_addAntecedentToRule(0, 2);
FRI_addAntecedentToRule(1, 1);


FRI_setObservationForUniverseById(0, m_observation);
FRI_setObservationForUniverseById(1, m_observation);
FRI_setObservationForUniverseById(2, m_observation);

FRI_calculateAllRuleBases();

printf("**Rulebase: %lf\n\n", FRI_getObservationById(0));
printf("**Rulebase: %lf\n\n", FRI_getObservationById(1));
printf("**Rulebase: %lf\n\n", FRI_getObservationById(2));

return 0;
}
```

---

## Access the Tool
The tool can be accessed and used directly through the following URL:  
[**FBDL to C Converter**](http://fbdlconverter.nhely.hu/)