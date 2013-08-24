enyo.kind({
    name: "SmoothPanels",
    classes: "smoothpanels",
    statics: {
        // A couple of built-in animations
        SLIDE_IN_FROM_RIGHT: "slideInFromRight",
        SLIDE_OUT_TO_LEFT: "slideOutToLeft",
        SLIDE_IN_FROM_TOP: "slideInFromTop",
        SLIDE_OUT_TO_BOTTOM: "slideOutToBottom",
        SLIDE_IN_FROM_LEFT: "slideInFromLeft",
        SLIDE_OUT_TO_RIGHT: "slideOutToRight",
        SLIDE_IN_FROM_BOTTOM: "slideInFromBottom",
        SLIDE_OUT_TO_TOP: "slideOutToTop",
        FADE_OUT: "fadeOut",
        FADE_IN: "fadeIn",
        NONE: "none"
    },
    events: {
        onInAnimationStart: "", // Fired after the in animation has started
        onOutAnimationStart: "", // Fired after the out animation has started
        onInAnimationEnd: "", // Fired after the in animation has ended
        onOutAnimationEnd: "" // Fired after the out animation has ended
    },
    published: {
        // If true, the out animation of the old panel will be started as soon as possible
        // instead of waiting for the new panel to be rendered and painted. The result
        // is a decoupled in and out animation
        async: false,
        inAnim: "slideInFromRight", // Name of the CSS animation to use of the in animation
        outAnim: "slideOutToLeft", // Name of the CSS animation to use of the out animation
        duration: 500, // Duration to use for animations
        easing: "ease" // Timing function to use for animations
    },
    create: function() {
        this.inherited(arguments);
        // Select first panel by default
        var currentPanel = this.currentPanel = this.getClientControls()[0];
        // Hide all other panels
        this.getClientControls().forEach(function(panel) {
            if (panel != currentPanel) {
                panel.hide();
            }
        });
        this.animationStartHandler = enyo.bind(this, this.animationStart);
        this.animationEndHandler = enyo.bind(this, this.animationEnd);
    },
    rendered: function() {
        this.inherited(arguments);
        // Unfortunately we have to add those listeners manually since Enyo does not support
        // handling these by default
        this.hasNode().addEventListener("webkitAnimationStart", this.animationStartHandler, false);
        this.hasNode().addEventListener("webkitAnimationEnd", this.animationEndHandler, false);
    },
    /**
     * @private
     *
     * Event listener for animationStart event. Delegates to inAnimationStart() or outAnimationStart()
     * based on where the event came from.
     * 
     * @param  {Object} event animationStart event
     */
    animationStart: function(event) {
        if (this.currentPanel && event.target == this.currentPanel.hasNode() && event.animationName == this.currOutAnim) {
            this.outAnimationStart();
        } else if (this.newPanel && event.target == this.newPanel.hasNode() && event.animationName == this.currInAnim) {
            this.inAnimationStart();
        }
    },
    /**
     * @private
     *
     * Event listener for animationEnd event. Delegates to inAnimationEnd() or outAnimationEnd()
     * based on where the event came from.
     * 
     * @param  {Object} event animationEnd event
     */
    animationEnd: function(event) {
        if (this.currentPanel && event.target == this.currentPanel.hasNode() && event.animationName == this.currOutAnim) {
            this.outAnimationEnd();
        } else if (this.newPanel && event.target == this.newPanel.hasNode() && event.animationName == this.currInAnim) {
            this.inAnimationEnd();
        }
    },
    /**
     * @private
     *
     * Shows the newly selected panel and starts the in animation.
     */
    startInAnimation: function() {
        // Prevent the new panel from flashing up on the screen before the animation start
        this.newPanel.applyStyle("opacity", 0);
        this.newPanel.show();
        // Need to start the animation asynchronously after showing because otherwise it is just being skipped in some browsers
        enyo.asyncMethod(this, function() {
            this.newPanel.applyStyle("-webkit-animation", this.currInAnim + " " + this.duration + "ms " + this.easing);
            this.newPanel.applyStyle("opacity", 1);
        });
    },
    /**
     * @private
     * 
     * Starts the out animation
     */
    startOutAnimation: function() {
        this.currentPanel.applyStyle("-webkit-animation", this.currOutAnim + " " + this.duration + "ms " + this.easing);
    },
    /**
     * @private
     * 
     * Called after the in animation has started. Fires the corresponding SmoothPanels event.
     */
    inAnimationStart: function() {
        this.doInAnimationStart({oldPanel: this.currentPanel, newPanel: this.newPanel});
    },
    /**
     * @private
     *
     * Called after the out animation has started. Fires the corresponding SmoothPanels event
     * and, if _async_ is set to true, starts the in animation.
     */
    outAnimationStart: function() {
        this.doOutAnimationStart({oldPanel: this.currentPanel, newPanel: this.newPanel});
        this.animating = true;
        if (this.async) {
            this.startInAnimation();
        }
    },
    /**
     * @private
     * 
     * Called after the in animation has ended Fires the corresponding SmoothPanes event
     * and removes the animation css property from the new panel.
     */
    inAnimationEnd: function() {
        this.doInAnimationEnd({oldPanel: this.currentPanel, newPanel: this.newPanel});
        this.newPanel.applyStyle("-webkit-animation", "none");
        this.currentPanel = this.newPanel;
    },
    /**
     * @private
     * 
     * Called after the out animation has ended Fires the corresponding SmoothPanes event,
     * hides the old panel and removes the animation css property.
     */
    outAnimationEnd: function() {
        this.doOutAnimationEnd({oldPanel: this.currentPanel, newPanel: this.newPanel});
        this.currentPanel.hide();
        this.currentPanel.applyStyle("-webkit-animation", "none");
        this.animating = false;
    },
    /**
     * Selects the specified panel
     * 
     * @param  {Object} panel   The panel that should be selected. Need to be inside the client controls
     * @param  {String} inAnim  The name of the CSS in animation to use. If specified overwrites the _inAnim_ property
     * @param  {String} outAnim The name of the CSS out animation to use. If specified overwrites the _outAnim_ property
     */
    select: function(panel, inAnim, outAnim) {
        if (!panel) {
            this.warn("The panel you selected is null or undefined!");
            return;
        }
        if (panel == this.newPanel || panel == this.currentPanel) {
            // Panel already selected
            return;
        }
        this.currInAnim = inAnim || this.inAnim;
        this.currOutAnim = outAnim || this.outAnim;
        if (this.animating) {
            // There is already an animation going on. Wrap it up prematurely
            this.inAnimationEnd();
            this.outAnimationEnd();
        }
        this.newPanel = panel;
        this.startOutAnimation();
        if (this.currOutAnim == SmoothPanels.NONE) {
            // No out animation. This means there won't be any animationStart or animationEnd events
            // so we'll have to handle that manually
            this.outAnimationStart();
            setTimeout(enyo.bind(this, function() {
                this.outAnimationEnd();
            }), this.duration + 500); // Add an extra 500 ms just to be sure
        }
        if (!this.async) {
            // The _async_ property is set to false so we don't have to wait for the out animation to start
            this.startInAnimation();
        }
    },
    /**
     * Selects a panel directly without any animation.
     * 
     * @param  {Object} panel The panel to select
     */
    selectDirect: function(panel) {
        if (this.currentPanel == panel) {
            // Panel is already selected
            return;
        }
        panel.show();
        this.currentPanel.hide();
        this.currentPanel = panel;
    },
    /**
     * Selects a panel by its index in the client controls.
     * 
     * @param  {Number} index   The index of the panel to select (0-based)
     * @param  {String} inAnim  The name of the CSS in animation to use. If specified overwrites the _inAnim_ property
     * @param  {String} outAnim The name of the CSS out animation to use. If specified overwrites the _outAnim_ property
     */
    selectByIndex: function(index, inAnim, outAnim) {
        this.select(this.getClientControls()[index], inAnim, outAnim);
    },
    /**
     * Returns the currently selected panel.
     * 
     * @return {Object} The currently selected panel
     */
    getSelectedPanel: function() {
        return this.currentPanel;
    },
    /**
     * Returns the index of the currently selected panel.
     * 
     * @return {Number} The index of the currently selected panel
     */
    getSelectedPanelIndex: function() {
        return this.getClientControls().indexOf(this.currentPanel);
    },
    destroy: function() {
        // Since we added those handlers manually, we have to remove them manually, too.
        this.hasNode().removeEventListener("webkitAnimationStart", this.animationStartHandler, false);
        this.hasNode().removeEventListener("webkitAnimationEnd", this.animationEndHandler, false);
        this.inherited(arguments);
    }
});