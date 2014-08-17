/**
 * Watch for unsaved changes within a context (eg. <form></form> or <div class="faux-form"></div>)
 *
 * Example HTML

    <form class="js-watch-changes"
          data-watch-changes-alert="Custom warning message"
          data-watch-changes-status="There are unsaved changes on this page"
          data-watch-changes-status-element=".js-watch-changes-status"
          data-watch-changes-exceptions="[type=sumbit], [data-submit]">
          data-watch-changes-ignored="[data-ignore-changes]">
      ...
    </form>

  *
  * Example JS (with default override)

      var options = { watchChangesAlert: "Custom warning message" };
      watchChanges( '.js-watch-changes', options );

 *
 * Exceptions are watched fields that will permit the page to be unloaded without
 * showing the warning alert (eg. a "save" button). Default selectors are
 * [type="submit"] and [data-submit].
 *
 * Completly ignore any field by adding [data-ignore-changes] to the field.
 *
 * rsg
 */

define([
  'jquery',
  'app/modules/helpers/util'
],

function ($, util) {

  'use strict';

  /**
   * Defaults can be overridden with HTML5 data-attributes or by passing options when
   * initializing watchChanges().
   * @type {Object}
   */
  var  _defaults = {
    watchChangesStatus: "There are unsaved changes on this page",
    watchChangesAlert: "You've made changes on this page that are NOT SAVED and will be LOST if you leave this page. Are you sure you want continue?",
    watchChangesStatusElement: ".js-watch-changes-status",
    watchChangesSavedElement: ".js-watch-changes-saved",
    watchChangesExceptions: '[type=submit], [data-submit]',
    watchChangesSubmits: '[type=submit], [data-submit]',
    watchChangesIgnored: '[data-ignore-changes]',
    onUnload: function () { },  // optional callback
    onSetAlert: function () { },  // optional callback
    onUnsetAlert: function () { }   // optional callback
    };

  /**
   * Constructor
   *
   * @param  object scope   the context or scope of the fields you want watched
   * @param  object options override any default options
   * @return null
   */
  function watchChanges( scope, options ) {

    this.hasChanges  = false;
    this.isException = false;
    this.$scope      = util.jqCheck( scope );

    if ( !this.$scope.length )
      return false;

    this.dataOptions = this.$scope.data();
    this.options     = $.extend( _defaults, options, this.dataOptions );
    this.$statusNote = $( this.options.watchChangesStatusElement );
    this.$savedChanges = $(this.options.watchChangesSavedElement);

    this.init();

  };

  watchChanges.prototype = {

    init: function( options ){

      // store context reference
      var self = this;

      options = $.extend( this.options, options );

      // Use a seperate click event and delegation to watch for exceptions;
      // unload the alert if target is an exception
      self.$scope.on('click', options.watchChangesSubmits, function(e){

        e.stopImmediatePropagation();
        self.unsetAlert();

      });

      // use event delegation to watch for and catch changes that bubble up
      self.$scope.on('keyup change', 'input, select, textarea', function(e) {

        var $element = $( e.target ),
            ignored  = options.watchChangesIgnored;

        // do nothing if we're ignoring the field
        if ( $element.is(ignored) )
          return;

        // check for exceptions and set instance isException and hasChanges
        self.checkForException( $element );

        // update the changes status note text
        self.updateStatusNote();

        if ( !self.isException && self.hasChanges ){
          self.setAlert();
        }

        else if ( self.isException ) {
          self.unsetAlert();
        }

      });

    },

    // @todo abstract setAlert() and unsetAlert()
    // provide options for different events.

    /**
     * Sets the alert
     * @param  object options override default options
     * @return null
     */
    setAlert: function( options ) {

      options = $.extend( this.options, options );

      // fire callback
      options.onSetAlert( options );

      if ( !window.onbeforeunload ) {
        window.onbeforeunload = function ( e ) {

          // fire callback
          options.onUnload( e );

          return options.watchChangesAlert;

        };
      };

    },

    unsetAlert: function() {

      // fire callback
      this.options.onUnsetAlert();

      // clear event
      //set it to null since the setAlert function does a check before setting
      window.onbeforeunload = null; //function() {};

    },

    /**
     * Check if an element contians an exception selector
     *
     * @param  object  element    the element
     * @param  object  options    override default options
     * @return {Boolean}
     */
    checkForException: function( element ) {

      var $element   = util.jqCheck( element ),
          exceptions = this.options.watchChangesExceptions;

      if ( !$element.length )
        return true;

      this.isException = $element.is( exceptions );

      if ( !this.isException )
        this.hasChanges  = true;

      return this.isException;

    },

    updateStatusNote: function( status ){

      status = status || this.options.watchChangesStatus;

      if ( this.hasChanges ) {
        this.$statusNote
          .text( status )
          .addClass('has-changes');

        this.hideSavedChangesMessage();
        this.setAlert();

      } else {

        this.$statusNote.removeClass('has-changes');

        this.showSavedChangesMessage();

        //remove alert
        this.unsetAlert();
      };

    },

    updateHasChanges: function (state) {

      this.hasChanges = state;
      this.updateStatusNote();

    },

    hideSavedChangesMessage: function () {
      //hide Saved message
      this.$savedChanges.addClass('hidden');
    },

    showSavedChangesMessage: function () {
      //show save message
      this.$savedChanges.removeClass('hidden');
    }

  };

  return watchChanges;

});
