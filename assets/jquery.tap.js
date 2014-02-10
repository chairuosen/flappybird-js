/**
 * @fileOverview
 * Copyright (c) 2013 Aaron Gloege
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE
 * OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * jQuery Tap Plugin
 * Using the tap event, this plugin will properly simulate a click event
 * in touch browsers using touch events, and on non-touch browsers,
 * click will automatically be used instead.
 *
 * @author Aaron Gloege
 * @version 1.1.0
 */
(function(document, $) {
    'use strict';

    /**
     * Event namespace
     *
     * @type String
     * @final
     */
    var HELPER_NAMESPACE = '._tap';

    /**
     * Event namespace
     *
     * @type String
     * @final
     */
    var HELPER_ACTIVE_NAMESPACE = '._tapActive';

    /**
     * Event name
     *
     * @type String
     * @final
     */
    var EVENT_NAME = 'tap';

    /**
     * Max distance between touchstart and touchend to be considered a tap
     *
     * @type Number
     * @final
     */
    var MAX_TAP_DELTA = 40;

    /**
     * Max duration between touchstart and touchend to be considered a tap
     *
     * @type Number
     * @final
     */
    var MAX_TAP_TIME = 400;

    /**
     * Event variables to copy to touches
     *
     * @type String[]
     * @final
     */
    var EVENT_VARIABLES = 'clientX clientY screenX screenY pageX pageY'.split(' ');

    /**
     * jQuery body object
     *
     * @type jQuery
     */
    var $BODY;

    /**
     * Last canceled tap event
     *
     * @type jQuery.Event
     * @private
     */
    var _lastCanceledTap = $.Event();

    /**
     * Object for tracking current touch
     *
     * @type Object
     * @static
     */
    var TOUCH_VALUES = {

        /**
         * Number of touches currently active on touchstart
         *
         * @property count
         * @type Number
         */
        count: 0,

        /**
         * touchstart/mousedown jQuery.Event object
         *
         * @property event
         * @type jQuery.Event
         */
        event: 0

    };

    /**
     * Create a new event from the original event
     * Copy over EVENT_VARIABLES from the original jQuery.Event
     *
     * @param {String} type
     * @param {jQuery.Event} e
     * @return {jQuery.Event}
     * @private
     */
    var _createEvent = function(type, e) {
        var originalEvent = e.originalEvent;
        var event = $.Event(originalEvent);

        event.type = type;

        var i = 0;
        var length = EVENT_VARIABLES.length;

        for (; i < length; i++) {
            event[EVENT_VARIABLES[i]] = e[EVENT_VARIABLES[i]];
        }

        return event;
    };

    /**
     * Determine if a valid tap event
     *
     * @param {jQuery.Event} e
     * @return {Boolean}
     * @private
     */
    var _isTap = function(e) {
        if (e.isTrigger) {
            return false;
        }

        var startEvent = TOUCH_VALUES.event;
        var xDelta = Math.abs(e.pageX - startEvent.pageX);
        var yDelta = Math.abs(e.pageY - startEvent.pageY);
        var delta = Math.max(xDelta, yDelta);

        return (
            e.timeStamp - startEvent.timeStamp < MAX_TAP_TIME &&
            delta < MAX_TAP_DELTA &&
            (!startEvent.touches || TOUCH_VALUES.count === 1) &&
            Tap.isTracking
        );
    };

    /**
     * Normalize touch events with data from first touch in the jQuery.Event
     *
     * @param {jQuery.Event} event
     * @private
     */
    var _normalizeEvent = function(event) {
        if (event.type.indexOf('touch') === 0) {
            var touch = event.originalEvent.changedTouches[0];

            event.touches = event.originalEvent.changedTouches;

            var i = 0;
            var length = EVENT_VARIABLES.length;

            for (; i < length; i++) {
                event[EVENT_VARIABLES[i]] = touch[EVENT_VARIABLES[i]];
            }
        }
    };

    /**
     * Tap object that will track touch events and
     * trigger the tap event when necessary
     *
     * @class Tap
     * @static
     */
    var Tap = {

        /**
         * Flag to determine if touch events are currently enabled
         *
         * @property isEnabled
         * @type Boolean
         */
        isEnabled: false,

        /**
         * Are we currently tracking a tap event?
         *
         * @property isTracking
         * @type Boolean
         */
        isTracking: false,

        /**
         * Enable touch event listeners
         *
         * @method enable
         */
        enable: function() {
            if (Tap.isEnabled) {
                return;
            }

            Tap.isEnabled = true;

            // Set body element
            $BODY = $(document.body)
                .on('touchstart' + HELPER_NAMESPACE, Tap.onStart)
                .on('mousedown' + HELPER_NAMESPACE, Tap.onStart)
                .on('click' + HELPER_NAMESPACE, Tap.onClick);
        },

        /**
         * Disable touch event listeners
         *
         * @method disable
         */
        disable: function() {
            if (!Tap.isEnabled) {
                return;
            }

            Tap.isEnabled = false;

            // unbind all events with namespace
            $BODY.off(HELPER_NAMESPACE);
        },

        /**
         * Store touch start values and target
         *
         * @method onTouchStart
         * @param {jQuery.Event} e
         */
        onStart: function(e) {
            if (e.isTrigger) {
                return;
            }

            _normalizeEvent(e);

            if (e.touches) {
                TOUCH_VALUES.count = e.touches.length;
            }

            if (Tap.isTracking) {
                return;
            }

            Tap.isTracking = true;

            TOUCH_VALUES.event = e;

            if (e.touches) {
                $BODY
                    .on('touchend' + HELPER_NAMESPACE + HELPER_ACTIVE_NAMESPACE, Tap.onEnd)
                    .on('touchcancel' + HELPER_NAMESPACE + HELPER_ACTIVE_NAMESPACE, Tap.onCancel);
            } else {
                $BODY.on('mouseup' + HELPER_NAMESPACE + HELPER_ACTIVE_NAMESPACE, Tap.onEnd);
            }
        },

        /**
         * If touch has not been canceled, create a
         * tap event and trigger it on the target element
         *
         * @method onTouchEnd
         * @param {jQuery.Event} e
         */
        onEnd: function(e) {
            var event;

            _normalizeEvent(e);

            if (_isTap(e)) {
                event = _createEvent(EVENT_NAME, e);
                $(TOUCH_VALUES.event.target).trigger(event);
            }

            // Cancel tap tracking
            Tap.onCancel(e);

            // prevent `click` event from firing if tap event was canceled (using `preventDefault()`)
            if (event && event.isDefaultPrevented()) {
                _lastCanceledTap = event;
            }
        },

        /**
         * Cancel tap and remove event listeners for active tap tracking
         *
         * @method onTouchCancel
         * @param {jQuery.Event} e
         */
        onCancel: function(e) {
            Tap.isTracking = false;

            $BODY.off(HELPER_ACTIVE_NAMESPACE);
        },

        /**
         * If tap was canceled, cancel click event
         *
         * @method onClick
         * @param {jQuery.Event} e
         * @return {void|Boolean}
         */
        onClick: function(e) {
            if (
                !e.isTrigger &&
                _lastCanceledTap.target === e.target &&
                _lastCanceledTap.pageX === e.pageX &&
                _lastCanceledTap.pageY === e.pageY &&
                e.timeStamp - _lastCanceledTap.timeStamp < MAX_TAP_TIME
            ) {
                return false;
            }
        }

    };

    // Setup special event and enable
    // tap only if a tap event is bound
    $.event.special[EVENT_NAME] = {
        setup: Tap.enable
    };

}(document, jQuery));
(function($) {
    var TAP_AND_HOLD_TRIGGER_TIMER = 1000;
    var MAX_DISTANCE_ALLOWED_IN_TAP_AND_HOLD_EVENT = 40;
    var TOUCHSTART = "touchstart";
    var TOUCHEND = "touchend";
    var TOUCHMOVE = "touchmove";

    // For debugging only
    // var TOUCHSTART = "mousedown";
    // var TOUCHEND = "mouseup";
    // var TOUCHMOVE = "mousemove";

    var tapAndHoldTimer = null;

    function calculateEuclideanDistance(x1, y1, x2, y2) {
        var diffX = (x2 - x1);
        var diffY = (y2 - y1);
        return Math.sqrt((diffX * diffX) + (diffY * diffY));
    };

    function onTouchStart(event) {
        var e = event.originalEvent;

        // Only start detector if and only if one finger is over the widget
        if (!e.touches || (e.targetTouches.length === 1 && e.touches.length === 1)) {
            startTapAndHoldDetector.call(this, event)
            var element = $(this);
            element.bind(TOUCHMOVE, onTouchMove);
            element.bind(TOUCHEND, onTouchEnd); 
        } else {
            stopTapAndHoldDetector.call(this);
        }   
    };

    function onTouchMove(event) {
        if (tapAndHoldTimer == null) {
            return;
        }

        var e = event.originalEvent;
        var x = (e.changedTouches) ? e.changedTouches[0].pageX: e.pageX;
        var y = (e.changedTouches) ? e.changedTouches[0].pageY: e.pageY;
        
        var tapAndHoldPoint = $(this).data("taphold.point");
        var euclideanDistance = calculateEuclideanDistance(tapAndHoldPoint.x, tapAndHoldPoint.y, x, y);
                
        if (euclideanDistance > MAX_DISTANCE_ALLOWED_IN_TAP_AND_HOLD_EVENT) {
            stopTapAndHoldDetector.call(this);
        }
    };

    function onTouchEnd(event) {
        stopTapAndHoldDetector.call(this);
    };

    function onTapAndHold(event) {
        clear.call(this);
        $(this).data("taphold.handler").call(this, event);
    };

    function clear() {
        tapAndHoldTimer = null;
        $(this).unbind(TOUCHMOVE, onTouchMove);
        $(this).unbind(TOUCHEND, onTouchEnd);   
    };

    function startTapAndHoldDetector(event) {
        if (tapAndHoldTimer != null) {
            return;
        }
        var self = this;
        tapAndHoldTimer = setTimeout(function(){
            onTapAndHold.call(self, event)
        }, TAP_AND_HOLD_TRIGGER_TIMER);

        // Stores tap x & y
        var e = event.originalEvent;
        var tapAndHoldPoint = {};
        tapAndHoldPoint.x = (e.changedTouches) ? e.changedTouches[0].pageX: e.pageX;
        tapAndHoldPoint.y = (e.changedTouches) ? e.changedTouches[0].pageY: e.pageY;
        $(this).data("taphold.point", tapAndHoldPoint);
    };

    function stopTapAndHoldDetector() {
        clearTimeout(tapAndHoldTimer);
        clear.call(this);   
    };

    $.event.special["taphold"] = {
        setup: function() {
            
        },

        add: function(handleObj) {
            $(this).data("taphold.handler", handleObj.handler);
            if (handleObj.data) {
                $(this).bind(TOUCHSTART, handleObj.data, onTouchStart);
            } else {
                $(this).bind(TOUCHSTART, onTouchStart);
            }
        },

        remove: function(handleObj) {
            stopTapAndHoldDetector.call(this);
            if (handleObj.data) {
                $(this).unbind(TOUCHSTART, handleObj.data, onTouchStart);
            } else {
                $(this).unbind(TOUCHSTART, onTouchStart);
            }
        },

        teardown: function() {
            
        }
    };

})(jQuery);