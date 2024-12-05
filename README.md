# FBDL to C Converter

## Overview
The **Converter** is a JavaScript-based tool designed to convert **Fuzzy Behavior Description Language (FBDL)** code into C code. It processes FBDL tokens to generate C code that defines universes, rulebases, and their respective rules, maintaining compatibility with the **FRI (Fuzzy Rule Interpolation)** framework.

---

## Features
- **Token Parsing**: Uses a tokenizer to parse FBDL syntax into structured tokens.
- **Universe Handling**: Converts FBDL `universe` definitions into C code using `FRI_initUniverseById` and `FRI_addUniverseElement`.
- **Rulebase Management**: Translates `rulebase` and its associated `rules` into C code using `FRI_initRuleBaseById` and `FRI_addRuleToRulebase`.
- **Antecedent & Consequent Mapping**: Processes antecedents and consequents to handle universes and conditions.
- **Error Handling**:
  - Ensures no duplicate `universe` and `rulebase` names are allowed. If a duplicate is found, the code generation is aborted with an error message.
  - Handles invalid references to universes or conditions by assigning `-1` in the generated code and logging warnings.
  - Skips invalid `rulebases` and prevents their associated rules from being generated.
  - Validates that each `rule`'s consequent exists in the corresponding `rulebase` universe. If not, the invalid rule is skipped, and a warning is logged:
    - Example below: `Rule consequent "close" not found in universe "speed". Skipping rule.`


---

## How It Works
1. **Input**: Paste your FBDL code into the input field.
2. **Tokenization**: The FBDL code is parsed into tokens for structured processing.
3. **Validation**:
   - Checks for duplicate rulebases.
   - Validates references to universes and conditions.
4. **Code Generation**: Produces the corresponding C code with proper FRI function calls.
5. **Output**: The generated C code is displayed in the output area.

---

## Usage
1. **Run the Converter**:
   - Paste FBDL code into the input editor.
   - Click the **Convert** button to generate the C code.
2. **Check Output**:
   - Review the generated C code for correctness.
   - Any errors (e.g., duplicate rulebase names, invalid references) will be logged in the browser console.
3. **Copy the C Code**:
   - Use the generated code in your FRI-based projects.

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