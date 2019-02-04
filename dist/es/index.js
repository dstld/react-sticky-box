import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import React from "react";
import PropTypes from "prop-types";
import ResizeObserver from "resize-observer-polyfill";

var getScrollParent = function (node) {
  var parent = node;

  while (parent = parent.parentElement) {
    var overflowYVal = getComputedStyle(parent, null).getPropertyValue("overflow-y");
    if (parent === document.body) return window;
    if (overflowYVal === "auto" || overflowYVal === "scroll") return parent;
  }

  return window;
};

var offsetTill = function (node, target) {
  var current = node;
  var offset = 0; // If target is not an offsetParent itself, subtract its offsetTop and set correct target

  if (target.firstChild && target.firstChild.offsetParent !== target) {
    offset += node.offsetTop - target.offsetTop;
    target = node.offsetParent;
    offset += -node.offsetTop;
  }

  do {
    offset += current.offsetTop;
    current = current.offsetParent;
  } while (current && current !== target);

  return offset;
};

var stickyProp = null;

if (typeof CSS !== "undefined" && CSS.supports) {
  if (CSS.supports("position", "sticky")) stickyProp = "sticky";else if (CSS.supports("position", "-webkit-sticky")) stickyProp = "-webkit-sticky";
} // Inspired by https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md#feature-detection


var passiveArg = false;

try {
  var opts = Object.defineProperty({}, "passive", {
    // eslint-disable-next-line getter-return
    get: function get() {
      passiveArg = {
        passive: true
      };
    }
  });
  window.addEventListener("testPassive", null, opts);
  window.removeEventListener("testPassive", null, opts);
} catch (e) {}

var StickyBox =
/*#__PURE__*/
function (_React$Component) {
  _inheritsLoose(StickyBox, _React$Component);

  function StickyBox(props) {
    var _this = _React$Component.call(this, props) || this;

    _this.registerContainerRef = function (n) {
      if (!stickyProp) return;
      _this.node = n;

      if (n) {
        _this.scrollPane = getScrollParent(_this.node);
        _this.latestScrollY = _this.scrollPane === window ? window.scrollY : _this.scrollPane.scrollTop;

        _this.scrollPane.addEventListener("scroll", _this.handleScroll, passiveArg);

        _this.scrollPane.addEventListener("mousewheel", _this.handleScroll, passiveArg);

        if (_this.scrollPane === window) {
          window.addEventListener("resize", _this.updateViewport);

          _this.updateViewport();
        } else {
          _this.rosp = new ResizeObserver(_this.updateScrollPane);

          _this.rosp.observe(_this.scrollPane);

          _this.updateScrollPane();
        }

        _this.ropn = new ResizeObserver(_this.updateParentNode);

        _this.ropn.observe(_this.node.parentNode);

        _this.updateParentNode();

        _this.ron = new ResizeObserver(function (e) {
          return _this.updateNode(e, true);
        });

        _this.ron.observe(_this.node);

        _this.updateNode({
          initial: true
        });

        _this.initial();
      } else {
        _this.scrollPane.removeEventListener("mousewheel", _this.handleScroll, passiveArg);

        _this.scrollPane.removeEventListener("scroll", _this.handleScroll, passiveArg);

        if (_this.scrollPane === window) {
          window.removeEventListener("resize", _this.getMeasurements);
        } else {
          _this.rosp.disconnect();
        }

        _this.ropn.disconnect();

        _this.ron.disconnect();

        _this.scrollPane = null;
      }
    };

    _this.updateViewport = function () {
      _this.viewPortHeight = window.innerHeight;
      _this.scrollPaneOffset = 0;
    };

    _this.updateScrollPane = function () {
      _this.viewPortHeight = _this.scrollPane.offsetHeight;

      if (process.env.NODE_ENV !== "production" && _this.viewPortHeight === 0) {
        console.warn("react-sticky-box's scroll pane has a height of 0. This seems odd. Please check this node:", _this.scrollPane);
      } // Only applicable if scrollPane is an offsetParent


      if (_this.scrollPane.firstChild.offsetParent === _this.scrollPane) {
        _this.scrollPaneOffset = _this.scrollPane.getBoundingClientRect().top;
      } else {
        _this.scrollPaneOffset = 0;
      }
    };

    _this.updateParentNode = function () {
      var parentNode = _this.node.parentNode;
      var computedParentStyle = getComputedStyle(parentNode, null);
      var parentPaddingTop = parseInt(computedParentStyle.getPropertyValue("padding-top"), 10);
      var parentPaddingBottom = parseInt(computedParentStyle.getPropertyValue("padding-bottom"), 10);
      _this.naturalTop = offsetTill(parentNode, _this.scrollPane) + parentPaddingTop + _this.scrollPaneOffset;
      var oldParentHeight = _this.parentHeight;
      _this.parentHeight = parentNode.getBoundingClientRect().height - (parentPaddingTop + parentPaddingBottom);

      if (_this.mode === "relative") {
        // If parent height decreased...
        if (oldParentHeight > _this.parentHeight) {
          _this.changeToStickyBottomIfBoxTooLow(_this.latestScrollY);
        }
      }

      if (oldParentHeight !== _this.parentHeight && _this.mode === "relative") {
        _this.latestScrollY = Number.POSITIVE_INFINITY;

        _this.handleScroll();
      }
    };

    _this.handleScroll = function () {
      var _this$getOffsets = _this.getOffsets(),
          offsetTop = _this$getOffsets.offsetTop,
          offsetBottom = _this$getOffsets.offsetBottom;

      var scrollY = _this.scrollPane === window ? window.scrollY : _this.scrollPane.scrollTop;
      if (scrollY === _this.latestScrollY) return;

      if (_this.nodeHeight + offsetTop + offsetBottom <= _this.viewPortHeight) {
        // Just make it sticky if node smaller than viewport
        _this.initial();

        _this.latestScrollY = scrollY;
        return;
      }

      var scrollDelta = scrollY - _this.latestScrollY;

      if (scrollDelta > 0) {
        // scroll down
        if (_this.mode === "stickyTop") {
          _this.offset = Math.max(0, _this.scrollPaneOffset + _this.latestScrollY - _this.naturalTop + offsetTop);

          if (scrollY + _this.scrollPaneOffset + offsetTop > _this.naturalTop) {
            if (scrollY + _this.scrollPaneOffset + _this.viewPortHeight <= _this.naturalTop + _this.nodeHeight + _this.offset + offsetBottom) {
              _this.props.onChangeMode(_this.mode, "relative");

              _this.mode = "relative";
              _this.node.style.position = "relative";
              _this.node.style.top = _this.offset + "px";
            } else {
              _this.switchToStickyBottom();
            }
          }
        } else if (_this.mode === "relative") {
          _this.changeToStickyBottomIfBoxTooLow(scrollY);
        }
      } else {
        // scroll up
        if (_this.mode === "stickyBottom") {
          _this.offset = Math.max(0, _this.scrollPaneOffset + _this.latestScrollY + _this.viewPortHeight - (_this.naturalTop + _this.nodeHeight + offsetBottom));

          if (_this.scrollPaneOffset + scrollY + _this.viewPortHeight < _this.naturalTop + _this.parentHeight + offsetBottom) {
            if (_this.scrollPaneOffset + scrollY + offsetTop >= _this.naturalTop + _this.offset) {
              _this.props.onChangeMode(_this.mode, "relative");

              _this.mode = "relative";
              _this.node.style.position = "relative";
              _this.node.style.top = _this.offset + "px";
            } else {
              _this.switchToStickyTop();
            }
          }
        } else if (_this.mode === "relative") {
          if (_this.scrollPaneOffset + scrollY + offsetTop < _this.naturalTop + _this.offset) {
            _this.switchToStickyTop();
          }
        }
      }

      _this.latestScrollY = scrollY;
    };

    _this.switchToStickyBottom = function () {
      var _this$getOffsets2 = _this.getOffsets(),
          _ = _this$getOffsets2._,
          offsetBottom = _this$getOffsets2.offsetBottom;

      _this.props.onChangeMode(_this.mode, "stickyBottom");

      _this.mode = "stickyBottom";
      _this.node.style.position = stickyProp;
      _this.node.style.top = _this.viewPortHeight - _this.nodeHeight - offsetBottom + "px";
    };

    _this.switchToStickyTop = function () {
      var _this$getOffsets3 = _this.getOffsets(),
          offsetTop = _this$getOffsets3.offsetTop,
          _ = _this$getOffsets3._;

      _this.props.onChangeMode(_this.mode, "stickyTop");

      _this.mode = "stickyTop";
      _this.node.style.position = stickyProp;
      _this.node.style.top = offsetTop + "px";
    };

    if (props.offset && process.env.NODE_ENV !== "production") {
      console.warn("react-sticky-box's \"offset\" prop is deprecated. Please use \"offsetTop\" instead. It'll be removed in v0.8.");
    }

    return _this;
  }

  var _proto = StickyBox.prototype;

  _proto.getOffsets = function getOffsets() {
    var _this$props = this.props,
        deprecatedOffset = _this$props.offset,
        propOffsetTop = _this$props.offsetTop,
        offsetBottom = _this$props.offsetBottom;
    return {
      offsetTop: propOffsetTop || deprecatedOffset,
      offsetBottom: offsetBottom
    };
  };

  _proto.initial = function initial() {
    var bottom = this.props.bottom;

    var _this$getOffsets4 = this.getOffsets(),
        offsetTop = _this$getOffsets4.offsetTop,
        offsetBottom = _this$getOffsets4.offsetBottom;

    if (bottom) {
      if (this.mode !== "stickyBottom") {
        this.props.onChangeMode(this.mode, "stickyBottom");
        this.mode = "stickyBottom";
        this.node.style.position = stickyProp;
        this.node.style.top = this.viewPortHeight - this.nodeHeight - offsetBottom + "px";
      }
    } else {
      if (this.mode !== "stickyTop") {
        this.props.onChangeMode(this.mode, "stickyTop");
        this.mode = "stickyTop";
        this.node.style.position = stickyProp;
        this.node.style.top = offsetTop + "px";
      }
    }
  };

  _proto.changeToStickyBottomIfBoxTooLow = function changeToStickyBottomIfBoxTooLow(scrollY) {
    var _this$getOffsets5 = this.getOffsets(),
        offsetBottom = _this$getOffsets5.offsetBottom;

    if (scrollY + this.scrollPaneOffset + this.viewPortHeight >= this.naturalTop + this.nodeHeight + this.offset + offsetBottom) {
      this.switchToStickyBottom();
    }
  }
  /* 
  updateNode = ({initial} = {}, isHeighChange) => {
    const prevHeight = this.nodeHeight;
    const nodeRect = this.node.getBoundingClientRect();
    this.nodeHeight = nodeRect.height;
    
    if (!initial && prevHeight !== this.nodeHeight) {
      this.mode = undefined;
      const {offsetTop, offsetBottom} = this.getOffsets();
      if (this.nodeHeight + offsetTop + offsetBottom <= this.viewPortHeight) {
        // Just make it sticky if node smaller than viewport
        this.initial();
        return;
      } else {
        this.mode = "relative";
        this.node.style.position = "relative";
        const lowestPossible = this.parentHeight - this.nodeHeight;
        const current = this.scrollPaneOffset + this.latestScrollY - this.naturalTop + offsetTop;
        this.offset = Math.max(0, Math.min(lowestPossible, current));
         if (isHeightChange) {
          this.offset -= (this.nodeHeight - this.viewPortHeight) + offsetTop;
        };
         this.node.style.top = `${this.offset}px`;
      }
    }
  };
  */
  // updateNode = ({initial} = {}, isHeightChange) => {
  //   const prevHeight = this.nodeHeight;
  //   const nodeRect = this.node.getBoundingClientRect()
  //   this.nodeHeight = nodeRect.height;
  //   if (!initial && prevHeight !== this.nodeHeight) {
  //     this.mode = undefined;
  //     const {offsetTop, offsetBottom} = this.getOffsets();
  //     if (this.nodeHeight + offsetTop + offsetBottom <= this.viewPortHeight) {
  //       // Just make it sticky if node smaller than viewport
  //       this.initial();
  //       return;
  //     } else {
  //       this.mode = "relative";
  //       this.node.style.position = "relative";
  //       const lowestPossible = this.parentHeight - this.nodeHeight;
  //       const current = this.scrollPaneOffset + this.latestScrollY - this.naturalTop + offsetTop;
  //       this.offset = Math.max(0, Math.min(lowestPossible, current));
  //       if (isHeightChange) {
  //         this.offset -= (this.nodeHeight - this.viewPortHeight) + offsetTop;
  //       };
  //       // stay at bottom if at bottom
  //       if (nodeRect.height + this.latestScrollY >= lowestPossible) {
  //         this.offset = lowestPossible;
  //       } else {
  //         this.offset = Math.max(0, this.offset);
  //       }
  //       this.node.style.top = `${this.offset}px`;
  //     }
  //   }
  // };
  ;

  _proto.render = function render() {
    var _this$props2 = this.props,
        children = _this$props2.children,
        className = _this$props2.className,
        style = _this$props2.style;
    return React.createElement("div", {
      className: className,
      style: style,
      ref: this.registerContainerRef
    }, children);
  };

  return StickyBox;
}(React.Component);

export { StickyBox as default };
StickyBox.defaultProps = {
  onChangeMode: function onChangeMode() {},
  offset: 0,
  offsetTop: 0,
  offsetBottom: 0
};
process.env.NODE_ENV !== "production" ? StickyBox.propTypes = {
  onChangeMode: PropTypes.func,
  offset: PropTypes.number,
  // deprecated
  offsetTop: PropTypes.number,
  offsetBottom: PropTypes.number,
  bottom: PropTypes.bool
} : void 0;