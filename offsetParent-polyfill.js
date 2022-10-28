function flatTreeParent(element) {
  if (element.assignedSlot) {
    return element.assignedSlot;
  }
  if (element.parentNode instanceof ShadowRoot) {
    return element.parentNode.host;
  }
  return element.parentNode;
}

function ancestorTreeScopes(element) {
  const scopes = new Set();
  let currentScope = element.getRootNode();
  while (currentScope) {
    scopes.add(currentScope);
    currentScope = currentScope.parentNode
      ? currentScope.parentNode.getRootNode()
      : null;
  }
  return scopes;
}

function offsetParentPolyfill(element, isNewBehavior) {
  // Do an initial walk to check for display:none ancestors.
  for (let ancestor = element; ancestor; ancestor = flatTreeParent(ancestor)) {
    if (!(ancestor instanceof Element))
      continue;
    if (getComputedStyle(ancestor).display === 'none')
      return null;
  }

  let scopes = null;
  if (isNewBehavior)
    scopes = ancestorTreeScopes(element);
  
  for (let ancestor = flatTreeParent(element); ancestor; ancestor = flatTreeParent(ancestor)) {
    if (!(ancestor instanceof Element))
      continue;
    const style = getComputedStyle(ancestor);
    // display:contents nodes aren't in the layout tree so they should be skipped.
    if (style.display === 'contents')
      continue;
    if (style.position !== 'static') {
      if (isNewBehavior) {
        if (scopes.has(ancestor.getRootNode())) {
          return ancestor;
        }
      } else {
        return ancestor;
      }
    }
    if (ancestor.tagName === 'BODY')
      return ancestor;
  }
  return null;
}

function offsetTopLeftPolyfill(element, originalFn) {
  // TODO check for new vs old behavior here and cache the result.
  // assuming new behavior.
  let value = originalFn.apply(element);
  let nextOffsetParent = offsetParentPolyfill(element, /*isNewBehavior=*/false);
  const scopes = ancestorTreeScopes(element);

  while (!scopes.has(nextOffsetParent.getRootNode())) {
    value -= originalFn.apply(nextOffsetParent);
    nextOffsetParent = offsetParentPolyfill(nextOffsetParent, /*isNewBehavior=*/false);
  }

  return value;
}

const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetParent').get;
Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
  get() {
    const originalValue = original.apply(this);
    const polyfillValue = offsetParentPolyfill(this, /*isNewBehavior=*/false);
    if (originalValue !== polyfillValue) {
        console.log('polyfill didnt work. this, originalValue, polyfillValue: ', this, originalValue, polyfillValue);
      debugger;
    } else {
        console.log('polyfill worked');
    }
    return originalValue;
  }
});

const originalOffsetTop = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetTop').get;
Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
  get() {
    return offsetTopLeftPolyfill(this, originalOffsetTop);
  }
});

const originalOffsetLeft = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetLeft').get;
Object.defineProperty(HTMLElement.prototype, 'offsetLeft', {
  get() {
    return offsetTopLeftPolyfill(this, originalOffsetLeft);
  }
});
