# FBDL to C Converter

![HTML](https://img.shields.io/badge/HTML-E34F26?logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-E4A126?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyBmaWxsPSIjZmZmIiByb2xlPSJpbWciIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU%2BSmF2YVNjcmlwdDwvdGl0bGU%2BPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMS41IDBoMjFsLTEuOTEgMjEuNTYzTDExLjk3NyAyNGwtOC41NjUtMi40MzhMMS41IDB6TTguOCA0LjQxSDExLjRWMTkuMTlMNi41NzggMTcuOTAxTDYuNDQgMTUuM0w4LjggMTUuOTNaTTEyLjIgNC40MUwxOC41ODggNC40MTNMMTguMzU4IDcuMDNIMTQuOFY5Ljc1TDE4LjEyMyA5Ljc1MUwxNy4zNzkgMTcuOTA4TDEyLjIgMTkuMjk4VjE2LjdMMTUuMjUgMTUuODhMMTUuNSAxMi40MkgxMi4yWiIvPjwvc3ZnPg%3D%3D)
![CSS](https://img.shields.io/badge/CSS-1572B6?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyBmaWxsPSIjZmZmIiByb2xlPSJpbWciIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU%2BQ1NTMzwvdGl0bGU%2BPHBhdGggZD0iTTEuNSAwaDIxbC0xLjkxIDIxLjU2M0wxMS45NzcgMjRsLTguNTY1LTIuNDM4TDEuNSAwem0xNy4wOSA0LjQxM0w1LjQxIDQuNDFsLjIxMyAyLjYyMiAxMC4xMjUuMDAyLS4yNTUgMi43MTZoLTYuNjRsLjI0IDIuNTczaDYuMTgybC0uMzY2IDMuNTIzLTIuOTEuODA0LTIuOTU2LS44MS0uMTg4LTIuMTFoLTIuNjFsLjI5IDMuODU1TDEyIDE5LjI4OGw1LjM3My0xLjUzTDE4LjU5IDQuNDE0eiIvPjwvc3ZnPg%3D%3D)

FBDL to C Converter is a web application that converts behavior descriptions written in **FBDL** (Fuzzy Behavior Description Language) into C code for the **μFRI** library. It runs fully in the browser, so no installation is needed.

Access the tool at **[fbdlconverter.nhely.hu](http://fbdlconverter.nhely.hu/)**.

## Overview

FBDL is a declarative language for defining how robots and other autonomous agents should behave. Instead of writing program logic, the user lists rules that stay readable for people. A description has two kinds of blocks. A universe maps the linguistic symbols of an input or output variable (for example `close` or `far`) to numeric values, and a rulebase collects the rules that produce one output from the inputs. A typical rule says that the speed should be low if the distance is close.

FBDL descriptions are evaluated with fuzzy rule interpolation (FRI). In a classic fuzzy system every combination of inputs needs its own rule, so the rulebase grows very fast. FRI methods also work with a sparse rulebase, where only the important rules are defined. The method used here is **FIVE** (Fuzzy rule Interpolation based on Vague Environment). FIVE measures the distance between the current observation and each rule in a vague environment, then combines the rule conclusions with Shepard interpolation, so rules that are closer to the observation get a bigger weight. It skips the usual fuzzification and defuzzification steps, so it is fast and needs little memory, which suits embedded systems.

μFRI is a lightweight C library that implements FIVE for microcontrollers and other embedded systems. Its universes and rulebases can be built at runtime with function calls, or loaded through a communication interface. Writing these function calls by hand for a larger FBDL description is slow, and one wrong index can change the behavior. This tool generates these calls automatically from the FBDL code, so they do not have to be written by hand. A built-in simulation also makes it possible to try out a behavior description before it is used on the target system.

## Features

- **μFRI-compatible output.** The generated calls follow the function names and parameter order of the μFRI library.
- **No server or build step.** The whole tool is a single static HTML page.
- **Problems stay visible in the output.** Invalid antecedent and rulebase references are written with `-1` and an `INVALID` comment, so they are easy to find.

## How It Works

When **Convert** is clicked, the FBDL code from the editor is processed and converted into C code. If the code has a syntax error, the conversion stops and the error is shown in the output panel.

### Processing the FBDL Code

1. **Tokenization.** `tokenizer.js` breaks the source text into quoted literals, numbers and keywords, and ignores spaces, tabs and line breaks. The simulation relies on the same tokenizer.
2. **Code generation.** `converter.js` processes the universes and rulebases one by one and builds the C code from them.

### Generated C Code

The generated code always follows the same order. First it initializes μFRI with the number of universes and rulebases. Then it adds the universes with their elements, and the rulebases with their rules and antecedents. At the end, it sets the observations and runs the calculation for all rulebases. A full output is shown in the [Example](#example) section.

The generated code is a starting point, not a complete program. The observation values (`m_observation` in the example) come from the target system, for example from sensors, so they have to be provided there.

### Simulation

Besides the converter, the page has a small simulation for checking a behavior description. Each input universe gets its own slider, and moving a slider updates the computed outputs immediately.

## Usage

1. **Open the page.** Use the online version at [fbdlconverter.nhely.hu](http://fbdlconverter.nhely.hu/), or open `fbdl_converter.html` from a local copy.
2. **Write or paste FBDL code** into the editor.
3. **Press Convert.** The C code is shown in the output panel.
4. **Press Copy** to put the code on the clipboard.
5. **Try the simulation.** Move the sliders below the editor to change the input values, and watch the outputs update.

## Example

The editor starts with the following FBDL description.

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

Clicking **Convert** generates this C code.

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

## Error Handling

**Syntax errors** stop the conversion, and the output panel reports the row and column of the problem. Typical causes are a misspelled keyword (`univers`), a missing `end` or closing quote, or a universe element without a value.

**Semantic errors**, such as a reference to a universe or element that does not exist, do not stop the processing. The converter handles them as follows.

- A rule with an unknown consequent is left out of the generated code.
- An antecedent with an unknown universe or element is written with `-1` as the ID and marked with an `// INVALID` comment.
- A rulebase without a matching universe is written as an `INVALID` line, and its rules are ignored.
- A universe or rulebase with a duplicate name is ignored.
- Each of these cases is also logged to the browser console (`warn` or `error`).

## License

The code written for this project is licensed under the [MIT License](LICENSE). The simulation and the tokenizer (`simulator.js`, `engine.js`, `parser.js`, `universe.js`, `tokenizer.js`) are adapted from [Ethology](http://mazsola.iit.uni-miskolc.hu/~qgeroli5/etho/) and are not covered by this license.
