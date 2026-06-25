/**
 * Form utilities for accessibility and smooth validation experience.
 */

/**
 * Finds the first error message or invalid input field in the document,
 * scrolls to it smoothly, and focuses the input.
 */
export function scrollToErrorAndFocus() {
  // Use a slight delay to ensure React state updates and DOM elements are rendered
  setTimeout(() => {
    // 1. Look for error alert containers or error text elements
    const errorContainers = document.querySelectorAll('.bg-red-50, [role="alert"], .text-red-600, .text-red-700, .text-red-500');
    
    // 2. Look for HTML5 invalid inputs
    const invalidInputs = document.querySelectorAll('input:invalid, select:invalid, textarea:invalid');
    
    let target: Element | null = null;
    
    if (errorContainers.length > 0) {
      target = errorContainers[0];
    } else if (invalidInputs.length > 0) {
      target = invalidInputs[0];
    }
    
    if (target) {
      // Scroll smoothly to the target
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Attempt to focus the input element
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLTextAreaElement
      ) {
        target.focus();
      } else {
        // If it's a container, find the first input inside it or immediately following it
        const innerInput = target.querySelector('input, select, textarea');
        if (innerInput instanceof HTMLElement) {
          innerInput.focus();
        } else {
          // Check sibling elements for inputs
          const siblingInput = target.parentElement?.querySelector('input, select, textarea');
          if (siblingInput instanceof HTMLElement) {
            siblingInput.focus();
          }
        }
      }
    } else {
      // Fallback: scroll to top of screen if no error target was matched
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, 150);
}
