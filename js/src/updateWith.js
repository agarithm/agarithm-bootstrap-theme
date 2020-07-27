import $ from 'jquery'
import Util from './util'
import ajah from './ajah'

/**
 * --------------------------------------------------------------------------
 * Bootstrap (v4.1.3): updateWith.js
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * --------------------------------------------------------------------------
 */

const UpdateWith = (($) => {
  /**
   * ------------------------------------------------------------------------
   * Constants
   * ------------------------------------------------------------------------
   */

  const NAME               = 'updateWith'
  const VERSION            = '4.1.3'
  const DATA_KEY           = 'lc.updateWith'
  const EVENT_KEY          = `.${DATA_KEY}`
  const DATA_API_KEY       = '.data-api'
  const JQUERY_NO_CONFLICT = $.fn[NAME]

  const Default = {
    url          : '',
    params       : false,
    scrollOffset : -14,
    spinner      : true,
    scrollTo     : true
  }

  const DefaultType = {
    url          : 'string',
    params       :'(boolean|string)',
    scrollOffset : 'number',
    spinner      : 'boolean',
    scrollTo     : 'boolean'
  }

  const Selector = {
    DATA_TOGGLE : '[data-toggle="updateWith"]'
  }

  const Event = {
    HIDE              : `hide${EVENT_KEY}`,
    HIDDEN            : `hidden${EVENT_KEY}`,
    SHOW              : `show${EVENT_KEY}`,
    SHOWN             : `shown${EVENT_KEY}`,
    CLICK_DATA_API    : `click${EVENT_KEY}${DATA_API_KEY}`
  }

  const ClassName = {
    FADE               : 'fade',
    SHOW               : 'show'
  }

  /**
   * ------------------------------------------------------------------------
   * Class Definition
   * ------------------------------------------------------------------------
   */

  class UpdateWith {
    constructor(element, config) {
      this._config              = this._getConfig(config)
      this._element             = element
      this._isShown             = true
      this.that                 = $(`#${element.id}`)
      this._ajax()
    }

    // Getters

    static get VERSION() {
      return VERSION
    }

    static get Default() {
      return Default
    }

    // Public

    toggle(relatedTarget) {
      return this._isShown ? this.hide() : this.show(relatedTarget)
    }

    show(relatedTarget) {
      if (this._isTransitioning || this._isShown) {
        return
      }

      if ($(this._element).hasClass(ClassName.FADE)) {
        this._isTransitioning = true
      }

      const showEvent = $.Event(Event.SHOW, {
        relatedTarget
      })

      $(this._element).trigger(showEvent)

      if (this._isShown || showEvent.isDefaultPrevented()) {
        return
      }

      this._isShown = true
    }

    hide(event) {
      if (event) {
        event.preventDefault()
      }

      if (this._isTransitioning || !this._isShown) {
        return
      }

      const hideEvent = $.Event(Event.HIDE)

      $(this._element).trigger(hideEvent)

      if (!this._isShown || hideEvent.isDefaultPrevented()) {
        return
      }

      this._isShown = false
      const transition = $(this._element).hasClass(ClassName.FADE)

      if (transition) {
        this._isTransitioning = true
      }

      $(this._element).removeClass(ClassName.SHOW)

      if (transition) {
        const transitionDuration  = Util.getTransitionDurationFromElement(this._element)

        $(this._element)
          .one(Util.TRANSITION_END, (event) => this._hideUpdateWith(event))
          .emulateTransitionEnd(transitionDuration)
      } else {
        this._hideUpdateWith()
      }
    }

    dispose() {
      $.removeData(this._element, DATA_KEY)

      $(window, document, this._element, this._backdrop).off(EVENT_KEY)

      this._config              = null
      this._element             = null
      this._isShown             = null
    }

    // Private

    _getConfig(config) {
      config = {
        ...Default,
        ...config
      }
      Util.typeCheckConfig(NAME, config, DefaultType)
      return config
    }

    _ajax() {
      const spinner = '<div class="col w-100 p-4"><div class="progress"><div class="progress-bar progress-bar-striped bg-secondary progress-bar-animated p-4" role="progressbar" style="width: 100%" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div></div></div>'
      const scroll = 618
      const tweak = 206
      const now = 1
      const elementTop = this.that.offset().top
      const elementBottom = this.that.offset().top + this.that.outerHeight()
      const screenBottom = $(window).scrollTop() + $(window).innerHeight()
      const screenTop = $(window).scrollTop()


      // Pop in the spinner
      const showSpinner = () => {
        if (this._config.spinner) {
          this.that.hide(tweak)
          window.setTimeout(() => {
            this.that.html(spinner)
            this.that.show(tweak)


            if (screenBottom > elementTop && screenTop < elementBottom) {
            // the spinner is already visible, don't scroll yet

            } else if (this._config.scrollTo) {
            // the spinner is not visible, give feedback and show it
              $('html').animate({
                scrollTop:this.that.offset().top + this._config.scrollOffset
              }, scroll)
            }
          }, tweak)
        }
      }
      window.setTimeout(showSpinner, now)

      const doFetch = () => {
        const painter = (text) => {
          this.that.hide()
          this.that.html(text)
          this.that.show(tweak)
          // Make it visible
          if (this._config.scrollTo) {
            $('html').animate({
              scrollTop:this.that.offset().top + this._config.scrollOffset
            }, scroll)
          }
        }

        if (this._config.params !== false) {
          ajah.DoWithPost(painter, this._config.url, this._config.params)
        } else {
          ajah.DoWith(painter, this._config.url)
        }
      }
      window.setTimeout(doFetch, scroll)
    }


    _showElement(relatedTarget) {
      const transition = $(this._element).hasClass(ClassName.FADE)

      if (!this._element.parentNode ||
         this._element.parentNode.nodeType !== Node.ELEMENT_NODE) {
        // Don't move updateWith's DOM position
        document.body.appendChild(this._element)
      }

      this._element.style.display = 'block'
      this._element.removeAttribute('aria-hidden')
      this._element.scrollTop = 0

      if (transition) {
        Util.reflow(this._element)
      }

      $(this._element).addClass(ClassName.SHOW)

      const shownEvent = $.Event(Event.SHOWN, {
        relatedTarget
      })

      const transitionComplete = () => {
        this._isTransitioning = false
        $(this._element).trigger(shownEvent)
      }

      if (transition) {
        const transitionDuration  = Util.getTransitionDurationFromElement(this._element)

        $(this._dialog)
          .one(Util.TRANSITION_END, transitionComplete)
          .emulateTransitionEnd(transitionDuration)
      } else {
        transitionComplete()
      }
    }

    _hideUpdateWith() {
      this._element.style.display = 'none'
      this._element.setAttribute('aria-hidden', true)
      this._isTransitioning = false
    }

    // Static

    static _jQueryInterface(config, relatedTarget) {
      return this.each(function () {
        let data = $(this).data(DATA_KEY)
        const _config = {
          ...Default,
          ...$(this).data(),
          ...typeof config === 'object' && config ? config : {}
        }

        // Always start with a new object
        data = new UpdateWith(this, _config)
        $(this).data(DATA_KEY, data)

        if (typeof config === 'string') {
          if (typeof data[config] === 'undefined') {
            throw new TypeError(`No method named "${config}"`)
          }
          data[config](relatedTarget)
        } else if (_config.show) {
          data.show(relatedTarget)
        }
      })
    }
  }

  /**
   * ------------------------------------------------------------------------
   * Data Api implementation
   * ------------------------------------------------------------------------
   */

  $(document).on(Event.CLICK_DATA_API, Selector.DATA_TOGGLE, function (event) {
    let target
    const selector = Util.getSelectorFromElement(this)

    if (selector) {
      target = document.querySelector(selector)
    }

    const config = $(target).data(DATA_KEY)
      ? 'toggle' : {
        ...$(target).data(),
        ...$(this).data()
      }

    if (this.tagName === 'A' || this.tagName === 'AREA') {
      event.preventDefault()
    }

    const $target = $(target).one(Event.SHOW, (showEvent) => {
      if (showEvent.isDefaultPrevented()) {
        // Only register focus restorer if updateWith will actually get shown
        return
      }

      $target.one(Event.HIDDEN, () => {
        if ($(this).is(':visible')) {
          this.focus()
        }
      })
    })

    UpdateWith._jQueryInterface.call($(target), config, this)
  })

  /**
   * ------------------------------------------------------------------------
   * jQuery
   * ------------------------------------------------------------------------
   */

  $.fn[NAME] = UpdateWith._jQueryInterface
  $.fn[NAME].Constructor = UpdateWith
  $.fn[NAME].noConflict = function () {
    $.fn[NAME] = JQUERY_NO_CONFLICT
    return UpdateWith._jQueryInterface
  }

  return UpdateWith
})($)

export default UpdateWith
