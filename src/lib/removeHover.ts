const removeHoverStyles = () => {
  // Check if the device supports touch
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (isTouchDevice) {
    // Add a class to the body to indicate touch device
    document.body.classList.add('touch-device');

    // Remove hover styles when touch is detected
    const style = document.createElement('style');
    style.innerHTML = `
      /* Preserve layout but disable hover effects */
      .touch-device *:hover {
        transform: none !important;
        transition: none !important;
      }
      
      /* Target specific hover classes */
      .touch-device [class*="hover:"] {
        transition: none !important;
      }

      /* Keep button states visible */
      .touch-device button:active,
      .touch-device [role="button"]:active {
        opacity: 0.7;
      }

      /* Prevent unwanted hover effects on cards and interactive elements */
      .touch-device .hover\\:bg-slate\\/5:hover {
        background: inherit !important;
      }

      /* Ensure touch feedback is visible but not disruptive */
      .touch-device *:active {
        transform: none !important;
      }
    `;
    document.head.appendChild(style);
  }
};

export default removeHoverStyles; 