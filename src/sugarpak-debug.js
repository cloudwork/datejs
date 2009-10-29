/**
 * @version: 1.0 Alpha-1
 * @author: Coolite Inc. http://www.coolite.com/
 * @date: 26-Nov-2007
 * @copyright: Copyright (c) 2006-2007, Coolite Inc. (http://www.coolite.com/). All rights reserved.
 * @license: Licensed under The MIT License. See license.txt and http://www.datejs.com/license/. 
 * @website: http://www.datejs.com/
 */

/**
 **************************************************************
 ** SugarPak - Domain Specific Language -  Syntactical Sugar **
 **************************************************************
 */

(function () {
    var $D = Date, $P = $D.prototype, $C = $D.CultureInfo, $N = Number.prototype, _isSecond = false;

    /** 
     * Returns yesterdays date. The time is set to the start of the day (00:00 or 12:00 AM).
     * @return {Date}    date.
     */
    $D.yesterday = $D.yes = function () {
        return $D.tod().addDays(-1);
    };

    /** 
     * Returns tomorrows date. The time is set to the start of the day (00:00 or 12:00 AM).
     * @return {Date}    date.
     */
    $D.tomorrow = $D.tom = function () {
        return $D.tod().addDays(1);
    };
     
    // private
    $P._orient = +1;

    // private
    $P._nth = null;

    // private
    $P._is = false;

    // private
    $N._dateElement = "day";

    /** 
     * Moves the date to the next instance of a date as specified by a trailing date element function (eg. .day(), .month()), month name function (eg. .january(), .jan()) or day name function (eg. .friday(), fri()).
     * Example
    <pre><code>
    Date.today().next().friday();
    Date.today().next().fri();
    Date.today().next().march();
    Date.today().next().mar();
    Date.today().next().week();
    </code></pre>
     * 
     * @return {Date}    date
     */
    $P.next = function () {
        this._orient = +1;
        return this;
    };

    /** 
     * Moves the date to the previous instance of a date as specified by a trailing date element function (eg. .day(), .month()), month name function (eg. .january(), .jan()) or day name function (eg. .friday(), fri()).
     * Example
    <pre><code>
    Date.today().last().friday();
    Date.today().last().fri();
    Date.today().last().march();
    Date.today().last().mar();
    Date.today().last().week();
    </code></pre>
     *  
     * @return {Date}    date
     */
    $P.last = $P.prev = $P.previous = function () {
        this._orient = -1;
        return this;
    };

    /** 
     * Performs a equality check when followed by either a month name or day name function.
     * Example
    <pre><code>
    Date.today().is().friday(); // true|false
    Date.today().is().fri();
    Date.today().is().march();
    Date.today().is().mar();
    </code></pre>
     *  
     * @return {Boolean}    true|false
     */
    $P.is = function () { 
        this._is = true; 
        return this; 
    };

    /** 
     * Sets the Time of the current Date instance. A string "6:15 pm" or config object {hour:18, minute:15} are accepted.
     * Example
    <pre><code>
    // Set time to 6:15pm with a String
    Date.today().at("6:15pm");

    // Set time to 6:15pm with a config object
    Date.today().at({hour:18, minute:15});
    </code></pre>
     *  
     * @return {Date}    date
     */
    $P.at = function (time) {
        if (typeof time === "string") {
            return $D.parse(this.toShortDateString() + " " + time);
        }
        return this.set(time);
    }; 

    /** 
     * Creates a new Date() and adds this (Number) to the date based on the preceding date element function (eg. second|minute|hour|day|month|year).
     * Example
    <pre><code>
    // Undeclared Numbers must be wrapped with parentheses. Requirment of JavaScript.
    (3).days().fromNow();
    (6).months().fromNow();

    // Declared Number variables do not require parentheses. 
    var n = 6;
    n.months().fromNow();
    </code></pre>
     *  
     * @return {Date}    A new Date instance
     */
    $N.fromNow = $N.after = function (date) {
        var c = {};
        c[this._dateElement] = this;
        return ((!date) ? new Date() : date.clone()).add(c);
    };

    /** 
     * Creates a new Date() and subtract this (Number) from the date based on the preceding date element function (eg. second|minute|hour|day|month|year).
     * Example
    <pre><code>
    // Undeclared Numbers must be wrapped with parentheses. Requirment of JavaScript.
    (3).days().ago();
    (6).months().ago();

    // Declared Number variables do not require parentheses. 
    var n = 6;
    n.months().ago();
    </code></pre>
     *  
     * @return {Date}    A new Date instance
     */
    $N.ago = $N.before = function (date) {
        var c = {};
        c[this._dateElement] = this * -1;
        return ((!date) ? new Date() : date.clone()).add(c);
    };

    // Do NOT modify the following string tokens. These tokens are used to build dynamic functions.
    // All culture-specific strings can be found in the CultureInfo files. See /trunk/src/globalization/.
    var dx = ("sunday monday tuesday wednesday thursday friday saturday").split(/\s/),
        mx = ("january february march april may june july august september october november december").split(/\s/),
        px = ("Millisecond Second Minute Hour Day Week Month Year").split(/\s/),
		nth = ("final first second third forth fifth").split(/\s/),
        de;
    
    // Create day name functions and abbreviated day name functions (eg. monday(), friday(), fri()).
    var df = function (n) {
        return function () { 
            if (this._is) { 
                this._is = false; 
                return this.getDay() == n; 
            }
            if (this._nth !== null) {
                // If the .second() function was called earlier, remove the _orient 
                // from the date, and then continue.
                // The problem happens because 'second' can be used in two different context.
                // 
                // Example
                //
                //   Date.today().add(1).second();
                //   Date.march().second().monday();
                // 
                // Things get crazy with the following...
                //   Date.march().add(1).second().second().monday(); // but it works!!
                //  
                if (this._isSecond) {
                    this.addSeconds(this._orient * -1);
                }
                // make sure we reset _isSecond
                this._isSecond = false;

                var ntemp = this._nth;
                this._nth = null;
                var temp = this.clone().moveToLastDayOfMonth();
                this.moveToNthOccurrence(n, ntemp);
                if (this > temp) {
                    throw new RangeError($D.getDayName(n) + " does not occur " + ntemp + " times in the month of " + temp.getMonthName() + " " + temp.getFullYear() + ".");
                }
                return this;
            }			
            return this.moveToDayOfWeek(n, this._orient);
        };
    };
    
    var sdf = function (n) {
        return function () {
            var t = $D.tod(), shift = n - t.getDay();
            if (n === 0 && $C.firstDayOfWeek === 1 && t.getDay() !== 0) {
                shift = shift + 7;
            }
            return t.addDays(shift);
        };
    };
	
    for (var i = 0 ; i < dx.length ; i++) {
        // Create constant static Day Name variables. Example: Date.MONDAY or Date.MON
        Date[dx[i].toUpperCase()] = Date[dx[i].toUpperCase().substring(0, 3)] = i;

        // Create Day Name functions. Example: Date.monday() or Date.mon()
        Date[dx[i]] = Date[dx[i].substring(0, 3)] = sdf(i);

        // Cretae Day Name instance functions. Example: Date.today().next().monday()
        $P[dx[i]] = $P[dx[i].substring(0, 3)] = df(i);
    }
    
    // Create month name functions and abbreviated month name functions (eg. january(), march(), mar()).
    var mf = function (n) { 
        return function () {
            if (this._is) { 
                this._is = false; 
                return this.getMonth() === n; 
            }
            return this.moveToMonth(n, this._orient); 
        };
    };
    
    var smf = function (n) {
        return function () {
            return $D.tod().set({ month: n, day: 1 });
        };
    };
    
    for (var j = 0 ; j < mx.length ; j++) {
        // Create constant static Month Name variables. Example: Date.MARCH or Date.MAR
        Date[mx[j].toUpperCase()] = Date[mx[j].toUpperCase().substring(0, 3)] = j;

        // Create Month Name functions. Example: Date.march() or Date.mar()
        Date[mx[j]] = Date[mx[j].substring(0, 3)] = smf(j);

        // Cretae Month Name instance functions. Example: Date.today().next().march()
        $P[mx[j]] = $P[mx[j].substring(0, 3)] = mf(j);
    }
    
    // Create date element functions and plural date element functions used with Date (eg. day(), days(), months()).
    var ef = function (j) {
        return function () {
            // if the .second() function was called earlier, the _orient 
            // has alread been added. Just return this and reset _isSecond.
            if (this._isSecond) {
                this._isSecond = false;
                return this;
            }
            if (j.substring(j.length - 1) != "s") {
                j += "s"; 
            }
            return this["add" + j](this._orient);
        };
    };
    
    
    var nf = function (n) {
        return function () {
            this._dateElement = n;
            return this;
        };
    };
    
    for (var k = 0 ; k < px.length ; k++) {
        de = px[k].toLowerCase();
    
        // Create date element functions and plural date element functions used with Date (eg. day(), days(), months()).
        $P[de] = $P[de + "s"] = ef(px[k]);
        
        // Create date element functions and plural date element functions used with Number (eg. day(), days(), months()).
        $N[de] = $N[de + "s"] = nf(de);
    }
	
    var nthfn = function (n) {
        return function (dayOfWeek) {
            if (dayOfWeek || dayOfWeek === 0) {
                return this.moveToNthOccurrence(dayOfWeek, n);
            }
            this._nth = n;

            // if the operator is 'second' add the _orient, then deal with it later...
            if (n === 2 && (dayOfWeek === undefined || dayOfWeek === null)) {
                this._isSecond = true;
                return this.addSeconds(this._orient);
            }
            return this;
        };
    };

    for (var l = 0 ; l < nth.length ; l++) {
        $P[nth[l]] = (l === 0) ? nthfn(-1) : nthfn(l);
    }
    
    /**
     * Converts the current date instance into a JSON string value.
     * @return {String}  JSON string of date
     */
    $P.toJSONString = function () {
        return this.toString("yyyy-MM-ddThh:mm:ssZ");
    };

    /**
     * Converts the current date instance to a string using the culture specific shortDatePattern.
     * @return {String}  A string formatted as per the culture specific shortDatePattern
     */
    $P.toShortDateString = function () {
        return this.toString($C.formatPatterns.shortDate);
    };

    /**
     * Converts the current date instance to a string using the culture specific longDatePattern.
     * @return {String}  A string formatted as per the culture specific longDatePattern
     */
    $P.toLongDateString = function () {
        return this.toString($C.formatPatterns.longDate);
    };

    /**
     * Converts the current date instance to a string using the culture specific shortTimePattern.
     * @return {String}  A string formatted as per the culture specific shortTimePattern
     */
    $P.toShortTimeString = function () {
        return this.toString($C.formatPatterns.shortTime);
    };

    /**
     * Converts the current date instance to a string using the culture specific longTimePattern.
     * @return {String}  A string formatted as per the culture specific longTimePattern
     */
    $P.toLongTimeString = function () {
        return this.toString($C.formatPatterns.longTime);
    };

    /**
     * Get the ordinal suffix of the current day.
     * @return {String}  "st, "nd", "rd" or "th"
     */
    $P.getOrdinal = function () {
        switch (this.getDate()) {
        case 1: 
        case 21: 
        case 31: 
            return "st";
        case 2: 
        case 22: 
            return "nd";
        case 3: 
        case 23: 
            return "rd";
        default: 
            return "th";
        }
    };    
}());