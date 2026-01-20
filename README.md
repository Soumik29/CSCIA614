# CSCIA614

This is the Master's Level Advanced Web Development Course.

# Assignment 1
---
### Part 1:
- Instruction: Write Several paragraphs analyzing the website based on your inspection.

**Website:** [sive.rs](https://sive.rs/) 
**Author:** Derek Sivers (Founder of CD Baby)
**Tech Stack:** Custom Backend (PostgresSQL + Ruby) -> Renders Pure HTML.
---

### Analysis:
- Clean Structure and Semantics: Analyzing the source code of Derek Sivers reveals a lot about keeping the portfolio simplistic and minimal design aspect to it. Unlike modern sites that suffers layers of div tags, Sivers' code is flat and readable. He uses standard tags like header, h1, p and article exactly as they were intended.

There are almost no CSS classes cluttering the HTML. The styling is applied to the tags themselves (e.g., article {width: 600px;}), which keeps HTML source looking like a clean document rather than a software application.

- Maintainability: Since the site relies heavily on pure HTML and CSS and no Tech heavy framework, it has been ranked exceptionally high for maintainability. By serving simple, static-like HTML, his site is future-proof. 
If a typo or a bug were to appear in his website it would be really easy to fix because the content isn't buried in a complex JavaScript Framework. 

- Scalability: Sivers hosts thousands of book notes, articles, and podcasts transcripts. Because the site has zero client-side JavaScript frameworks, the payload size is tiny (often under 10kb per page.)

- Performance: This means that the site can handle a lot of traffic spikes without crashing or costing any server fees. The browser has to do no work to render the page, making it accessible even to users with slow internet.
