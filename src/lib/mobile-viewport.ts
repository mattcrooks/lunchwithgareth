/**
 * Mobile viewport and keyboard handling utilities
 * Helps manage the viewport when virtual keyboard appears on mobile devices
 */

export class MobileViewportHandler {
  private static instance: MobileViewportHandler;
  private originalViewportHeight: number = 0;
  private isKeyboardOpen: boolean = false;
  private resizeTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.init();
  }

  public static getInstance(): MobileViewportHandler {
    if (!MobileViewportHandler.instance) {
      MobileViewportHandler.instance = new MobileViewportHandler();
    }
    return MobileViewportHandler.instance;
  }

  private init() {
    // Store initial viewport height
    this.originalViewportHeight = window.innerHeight;

    // Listen for viewport changes
    window.addEventListener("resize", this.handleResize.bind(this));

    // Listen for input focus/blur events
    document.addEventListener("focusin", this.handleInputFocus.bind(this));
    document.addEventListener("focusout", this.handleInputBlur.bind(this));

    // Set CSS custom properties for viewport height
    this.updateViewportHeight();
  }

  private handleResize() {
    // Debounce resize events
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    this.resizeTimeout = setTimeout(() => {
      this.updateViewportHeight();
      this.detectKeyboard();
    }, 150);
  }

  private handleInputFocus(event: FocusEvent) {
    const target = event.target as HTMLElement;
    if (this.isInputElement(target)) {
      // Add a slight delay to allow keyboard to appear
      setTimeout(() => {
        this.scrollInputIntoView(target);
      }, 300);
    }
  }

  private handleInputBlur() {
    // Reset any custom scrolling when input loses focus
    setTimeout(() => {
      this.updateViewportHeight();
    }, 100);
  }

  private isInputElement(element: HTMLElement): boolean {
    const inputTypes = ["input", "textarea", "select"];
    return (
      inputTypes.includes(element.tagName.toLowerCase()) ||
      element.contentEditable === "true"
    );
  }

  private scrollInputIntoView(element: HTMLElement) {
    // Get the navigation bar height (approximately 80px)
    const navHeight = 80;

    // Calculate if input is in view
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // If input is hidden by keyboard, scroll it into view
    if (rect.bottom > viewportHeight - navHeight) {
      const scrollOffset = rect.bottom - viewportHeight + navHeight + 20; // 20px padding
      window.scrollBy({
        top: scrollOffset,
        behavior: "smooth",
      });
    }
  }

  private detectKeyboard() {
    const currentHeight = window.innerHeight;
    const heightDifference = this.originalViewportHeight - currentHeight;

    // Keyboard is likely open if viewport height decreased significantly
    const wasKeyboardOpen = this.isKeyboardOpen;
    this.isKeyboardOpen = heightDifference > 150; // 150px threshold

    // Update body class for CSS targeting
    if (this.isKeyboardOpen !== wasKeyboardOpen) {
      document.body.classList.toggle("keyboard-open", this.isKeyboardOpen);
    }
  }

  private updateViewportHeight() {
    // Update CSS custom properties for dynamic viewport height
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);

    // Update static viewport height
    const svh = this.originalViewportHeight * 0.01;
    document.documentElement.style.setProperty("--svh", `${svh}px`);
  }

  public destroy() {
    window.removeEventListener("resize", this.handleResize.bind(this));
    document.removeEventListener("focusin", this.handleInputFocus.bind(this));
    document.removeEventListener("focusout", this.handleInputBlur.bind(this));

    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
  }
}

// Initialize the handler when the module is imported
export const initMobileViewport = () => {
  if (typeof window !== "undefined") {
    MobileViewportHandler.getInstance();
  }
};
