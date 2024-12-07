/**
 * Create new simulator object.
 */
function Simulator()
{
    console.log(":: Create simulator");
}

/**
 * Try to compile the source.
 */
Simulator.prototype.compile = function()
{
    var DEBUG_MODE = false;
    DEBUG_MODE = true;

    if (DEBUG_MODE == true) {
        this.initialize();
    }
    else {
        try {
            this.initialize();
        }
        catch (error) {
            alert("ERROR: " + error["message"] + " -- row " + error["row"] + ", column " + error["column"]);
        }
    }
}

/**
 * Initialize the simulator.
 */
Simulator.prototype.initialize = function()
{
    console.log(":: Initialize");

    // TODO: Hide the parser to the engine! (Initialize only with the source!)
    var source = this.getSource();
    var parser = new Parser();
    var behaviour = parser.readBehaviour(source);

    this.engine = new Engine();
    this.engine.initialize(behaviour);

    this.createGui();
}

/**
 * Get the source of the behaviour description.
 */
Simulator.prototype.getSource = function()
{
    // var source = $('textarea#codearea').val();
    var source = editor.getValue();
    return source;
}

/**
 * Set the state output.
 */
Simulator.prototype.setStateReport = function(report)
{
    stateViewer.setValue(report);
}

/**
 * Create the graphical interface.
 */
Simulator.prototype.createGui = function()
{
    var indicators = this.engine.collectOutputs();
    this.createIndicators(indicators);

    var observations = this.engine.collectObservations();
    this.createSliders(observations);

    this.updateIndicators();
}

/**
 * Create indicators.
 */
Simulator.prototype.createIndicators = function(indicators)
{
    $( "#indicators" ).html("");

    for (var indicatorName in indicators) {
        if (indicators.hasOwnProperty(indicatorName)) {

            var indicator = indicators[indicatorName];

            var htmlContent = "<div>" + indicatorName;
            htmlContent += " = <span class=\"indicator\" id=\"" + indicatorName + "_indicator\">";
            htmlContent += indicator.getLowValue();
            htmlContent += "</span></div>";

            $( "#indicators" ).append(htmlContent);
        }
    }
}

/**
 * Create sliders.
 */
Simulator.prototype.createSliders = function(observations)
{
    $( "#sliders" ).html("");

    for (var observationName in observations) {
        if (observations.hasOwnProperty(observationName)) {

            var observation = observations[observationName];

            var lowPosition = observation.getLowPosition();
            var highPosition = observation.getHighPosition();

            var htmlContent = observationName;
            htmlContent += " = <span class=\"indicator\" id=\"" + observationName + "_indicator\">";
            htmlContent += lowPosition;
            htmlContent += "</span>";
            
            htmlContent += "<div class=\"slider\" id=\"" + observationName + "\"></div>";

            $( "#sliders" ).append(htmlContent);

            var stepSize = (highPosition - lowPosition) / 100;

            var sliderParameters = {"min": lowPosition, "max": highPosition, "step": stepSize};
            $( "#" + observationName ).slider(sliderParameters);

            var that = this;

            $( "#" + observationName ).on( "slide", function( event, ui ) {
                var name = event.target.id;
                $( "#" + name + "_indicator" ).text(ui.value);
                that.engine.states[name] = ui.value;
                that.engine.step();
                that.updateIndicators();
            } );

        }
    }
}

/**
 * Update the indicators.
 */
Simulator.prototype.updateIndicators = function()
{
    var indicators = this.engine.collectOutputs();

    for (var indicatorName in indicators) {
        if (indicators.hasOwnProperty(indicatorName)) {
            var indicatorValue = Math.round(this.engine.states[indicatorName] * 1000) / 1000;
            $( "#" + indicatorName + "_indicator" ).text(indicatorValue);
        }
    }
}
