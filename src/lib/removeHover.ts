const removeHoverStyles = () => {
  // Check if the device supports touch
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (isTouchDevice) {
    // Add a class to the body to indicate touch device
    document.body.classList.add('touch-device');

    // Remove hover styles when touch is detected
    const style = document.createElement('style');
    style.innerHTML = `
      .touch-device *:hover {
        all: unset !important;
      }
      
      /* Reset any specific hover styles */
      .touch-device *[class*="hover:"] {
        transition: none !important;
        transform: none !important;
        box-shadow: none !important;
        background: inherit !important;
        color: inherit !important;
      }
    `;
    document.head.appendChild(style);
  }
};

export default removeHoverStyles; 