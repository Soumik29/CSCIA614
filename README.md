# CSCIA614

This is the Master's Level Advanced Web Development Course.

### Justification for Scalability

- Modular 'Article' Pattern: In the project section, I used <article> tag for every single project. This makes the site scalable because the structure is identical for Project 1, 2, and 3. If I need to add 50 more projects later, then I don't need to write new HTML structure. I can just feed the data into a article template using a loop in React.

- Sectioning: I wrapped major areas of my portfolio in section tags. This ensures that if I add a new feature, like a 'Testimonial' section, I can drop it in as a new block without breaking the flow of the other sections.

### Justification for Maintainability

- I avoided using div tags for major areas. Instead I used nav, aside and footer. The reason for this is if a developer were to fix a big 6 months from now they don't have to search through nested divs.

- In the contact form, I used fieldset and legend to group the radio buttons. This keeps the form accessible and easier to read if we need to add more options later.

- I used aside in the blog section for the 'Categories' and 'Archive' links. This is semantically correct because this content is tangentially related to the main content. 
