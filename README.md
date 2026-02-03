# CSCIA614

This is the Master's Level Advanced Web Development Course.

# Assignment 1

---

### Part 1:

- Instruction: Write Several paragraphs analyzing the website based on your inspection.

**Website:** [sive.rs](https://sive.rs/)
**Author:** Derek Sivers (Founder of CD Baby)
**Tech Stack:** Renders Pure HTML.

---

### Analysis:

- Clean Structure and Semantics: Analyzing the source code of Derek Sivers reveals a lot about keeping the portfolio simplistic and minimal design aspect to it. Unlike modern sites that suffers layers of div tags, Sivers' code is flat and readable. He uses standard tags like header, h1, p and article exactly as they were intended.

There are almost no CSS classes cluttering the HTML. The styling is applied to the tags themselves (e.g., article {width: 600px;}), which keeps HTML source looking like a clean document rather than a software application.

- Maintainability: Since the site relies heavily on pure HTML and CSS and no Tech heavy framework, it has been ranked exceptionally high for maintainability. By serving simple, static-like HTML, his site is future-proof.
  If a typo or a bug were to appear in his website it would be really easy to fix because the content isn't buried in a complex JavaScript Framework.

- Scalability: Sivers hosts thousands of book notes, articles, and podcasts transcripts. Because the site has zero client-side JavaScript frameworks, the payload size is tiny (often under 10kb per page.)

- Performance: This means that the site can handle a lot of traffic spikes without crashing or costing any server fees. The browser has to do no work to render the page, making it accessible even to users with slow internet.

### Assignment 2:

You are asking to style your HTML portfolio page and focus not just on the visual design, but also on a maintainable design system.

### Requirements

Layout Architecture:

- Use CSS Grid with named grid-template-areas for the main page layout.
- Use Flexbox for internal component alignment (e.g., navigation menus, card layouts).

Scalability:

- Define a global scheme using CSS Variables (Custom Properties). You must use these variables throughout the sheet; do not hard-code values in your components.
- Integrate at least one Web Font (e.g., Google Fonts).

Responsiveness:

- The site must be fully responsive. Implement at least two breakpoints (media queries) to adjust the layout for mobile and tablet screens.

Polished UI:

- The design must look neat, clean, and professional. Include visual feedback such as :hover, include transition/transform/animation.

Presentation:

- Demonstrate the scalability of your CSS design. Justify your layout logic.

### Assignment 3:

You are asking to design and implement a browser-based game using JavaScript. It could be any game that you'd like, but you need to demonstrate your understanding of advanced Javascript topics.

Requirements:
State Encapsulation :

- You cannot use global variables for critical game state instead you need to create it using the Module Pattern(closure).
- For example, the score variable must be private. It can only be modified via method increase or decrease
  Use "this":
- You must successfully handle the this context binding so that when an event triggers, the method can still access the object's properties
  Memory Managment:
- Your game must have a "Game Over" and "Restart" state, and there is no memory leak. If you added addEventListener to the window, you must removeEventListener at the end of the Game.  
  Security:
- At the end of the game, allow the user to input their name for a "High Score" display. You must process this name safely. If I enter <img src=x onerror=alert(1)> as my name, the alert could not pop up.
