// This matches the behavior of chrome before any of my changes, probably
// wait no this actually matches the chrome new behavior AND firefox! maybe chrome new is actually the same as firefox????

function flatTreeParent(element) {
  if (element.assignedSlot) {
    return element.assignedSlot;
  }
  if (element.parentNode instanceof ShadowRoot) {
    return element.parentNode.host;
  }
  return element.parentNode;
}

function isClosedShadowHidden(base, candidate) {
  const candidateRoot = candidate.getRootNode();
  let ancestorRoot = base.getRootNode();
  while (true) {
    if (ancestorRoot === candidateRoot) {
      return false;
    }
    if (ancestorRoot instanceof ShadowRoot) {
      ancestorRoot = ancestorRoot.host.getRootNode();
    } else {
      return true;
    }
  }
}

function offsetParentPolyfillOld(element) {
    // Do an initial walk to check for display:none ancestors.
    for (let ancestor = element; ancestor; ancestor = flatTreeParent(ancestor)) {
      if (!(ancestor instanceof Element))
        continue;
      if (getComputedStyle(ancestor).display === 'none')
        return null;
    }
    
    for (let ancestor = flatTreeParent(element); ancestor; ancestor = flatTreeParent(ancestor)) {
      if (!(ancestor instanceof Element))
        continue;
      const style = getComputedStyle(ancestor);
      // display:contents nodes aren't in the layout tree so they should be skipped.
      if (style.display === 'contents')
        continue;
      if (isClosedShadowHidden(element, ancestor))
        continue;
      if (style.position !== 'static')
        return ancestor;
      if (ancestor.tagName === 'BODY')
        return ancestor;
    }
    return null;
}

const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetParent').get;
Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
  get() {
    const originalValue = original.apply(this);
    const polyfillValue = offsetParentPolyfillOld(this);
    if (originalValue !== polyfillValue) {
        console.log('polyfill didnt work. this, originalValue, polyfillValue: ', this, originalValue, polyfillValue);
    } else {
        console.log('polyfill worked');
    }
    return originalValue;
  }
});
