/**
 * DevbrosApp: main entry class. Instantiates the relevant page modules
 * on DOMContentLoaded based on data attributes present in the page.
 */
import { ApiClient } from './api-client.js';
import { NavigationController } from './navigation-controller.js';
import { UIController } from './ui-controller.js';
import { ContactFormHandler } from './contact-form-handler.js';
import { PortfolioFilter } from './portfolio-filter.js';
import { QuoteEstimator } from './quote-estimator.js';
import { RevealObserver } from './tools.js';

export class DevbrosApp {
  constructor() {
    this.apiClient = new ApiClient();
    this.uiController = new UIController();
  }

  static start() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => new DevbrosApp().init());
    } else {
      new DevbrosApp().init();
    }
  }

  init() {
    // Always-on modules
    new NavigationController();
    new RevealObserver().observeAll('.reveal');

    // Initialize Terminal Typing Component if present
    this.initTerminalComponent();

    // Page modules: instantiate only when the page's markers exist
    if (document.querySelector('[data-contact-form]')) {
      new ContactFormHandler({
        apiClient: this.apiClient,
        uiController: this.uiController
      });
    }

    if (document.querySelector('[data-projects-container]')) {
      new PortfolioFilter({
        apiClient: this.apiClient,
        uiController: this.uiController
      });
    }

    if (document.querySelector('[data-estimator]')) {
      new QuoteEstimator({
        apiClient: this.apiClient,
        uiController: this.uiController
      });
    }
  }

  initTerminalComponent() {
    const codeContainer = document.querySelector("#typing-code code");
    const terminalOutput = document.getElementById("terminal-output");
    const replayBtn = document.getElementById("replay-btn");

    if (!codeContainer) return;

    const codeLines = [
      { text: "# 🚀 Scale your business with DevBros\n", class: "token-comment" },
      { text: "from ", class: "token-keyword" },
      { text: "devbros ", class: "token-class" },
      { text: "import ", class: "token-keyword" },
      { text: "DevBrosEngine, GrowthAccelerator\n\n", class: "token-class" },
      { text: "client ", class: "token-keyword" },
      { text: "= DevBrosEngine(\n", class: "token-class" },
      { text: '    partner=', class: "token-keyword" },
      { text: '"Local Business",\n', class: "token-string" },
      { text: '    goal=', class: "token-keyword" },
      { text: '"10x Revenue"\n', class: "token-string" },
      { text: ")\n\n", class: "token-keyword" },
      { text: "# Execute pipeline\n", class: "token-comment" },
      { text: "system = GrowthAccelerator(client)\n", class: "token-keyword" },
      { text: "system.deploy_growth_engine()", class: "token-func" }
    ];

    let isAnimating = false;

    const runTypewriter = () => {
      if (isAnimating) return;
      isAnimating = true;
      codeContainer.innerHTML = "";
      if (terminalOutput) {
        terminalOutput.classList.add("hidden");
        terminalOutput.innerHTML = "";
      }

      let currentLineIndex = 0;
      let currentCharIndex = 0;

      codeContainer.classList.add("typing-cursor");

      const typeNextChar = () => {
        if (currentLineIndex < codeLines.length) {
          const currentLine = codeLines[currentLineIndex];
          
          if (currentCharIndex === 0) {
            const span = document.createElement("span");
            span.className = currentLine.class || "";
            span.id = `token-${currentLineIndex}`;
            codeContainer.appendChild(span);
          }

          const activeSpan = document.getElementById(`token-${currentLineIndex}`);
          if (activeSpan) {
            activeSpan.textContent += currentLine.text[currentCharIndex];
          }
          
          currentCharIndex++;

          if (currentCharIndex >= currentLine.text.length) {
            currentLineIndex++;
            currentCharIndex = 0;
          }

          setTimeout(typeNextChar, Math.random() * 25 + 15);
        } else {
          codeContainer.classList.remove("typing-cursor");
          isAnimating = false;
          showTerminalOutput();
        }
      };

      typeNextChar();
    };

    const showTerminalOutput = () => {
      if (!terminalOutput) return;
      terminalOutput.classList.remove("hidden");
      const outputs = [
        "> Initializing DevBros growth engine...",
        "> Optimizing local SEO & conversion funnels...",
        "> Deploying lightning-fast web architecture...",
        "> ----------------------------------------",
        "> [SUCCESS] Monthly Revenue: $6,000  ➜  $45,000 (+650%) 🚀",
        "> [STATUS]  New Customer Inquiries: Automated"
      ];

      outputs.forEach((text, index) => {
        setTimeout(() => {
          const div = document.createElement("div");
          div.className = "output-line";
          if (text.includes("SUCCESS")) div.classList.add("output-success");
          div.textContent = text;
          terminalOutput.appendChild(div);
        }, index * 250);
      });
    };

    if (replayBtn) {
      replayBtn.addEventListener("click", runTypewriter);
    }

    runTypewriter();
  }
}

DevbrosApp.start();