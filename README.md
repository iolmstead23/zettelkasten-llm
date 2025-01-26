# Zettelkasten-LLM
Analysis and construction of Zettelkasten sysem using Large Language Models

!! THIS HAS NOT BEEN DEVELOPED FOR MOBILE USE !!

[Live Demo](https://zettelkasten-llm.vercel.app/)
Documentation Link will be included in next stable release

# Instructions

Run npm run dev to get started using the wep app in development mode after cloning. Make sure to install the dependencies.

Documentation can be generated using pnpm docs:debug for verbose logging, pnpm docs:dev for dev environment, and pnpm docs:build to generate documentation and build (not verbose and does not save log file).

For dev mode it will generate logs in the root .logs folder. I plan on extending the logging features going forward and adding more logging events.

# Intro
The intention of this project is to explore a Zettelkasten system indexed by markdown files. These markdown files are written using Obsidian as the editor. I recommend saving your vault to a Google Drive and also backing up your vault on local storage as well. These scripts run reports on the overall health of the Zettelkasten system, taking into consideration factors like the overall links-to-nodes ratio, sentiment analysis to understand tone (an important parameter to remember), and other latent quantifiable variables yet to be explored. This is the first level of functionality. The next level of functionality is the chatbot. It would be trained using large language model architecture.

The user would write short essays, which get labeled and indexed. There would be a function that checks reading comprehension and adjusts its speech to better synergize with the user. It's not about how much the user can do; it's about finding out how to provide an experience while never sacrificing control. Software should be intuitive.

# Features Overview

The dashboard for the app will include multiple features to use. The Filetree will keep track of the notes and allow for CRUD operations. The text editor will allow for editing/savings on notes.

![Screenshot 2024-12-14 232335](https://github.com/user-attachments/assets/12fec235-8c0f-415b-ba16-6cf0da819d1e)

The Plot page includes the Plotly plot that will project and orientate the notes data in a 3d space.

![Screenshot 2024-12-14 232357](https://github.com/user-attachments/assets/815ef71f-1270-49d9-9fee-48b26944c200)

# TODO
- Add custom sidebar width and allow it to be collapsible
- Enforce Unique file names
- Enforce 2 Layer Folder limit
- Add edge creation using Editor toolbar feature -Done sort of...
- Store metrics such as last save and total word count
- Create a history journal to record CRUD and Editor actions
- Add logic for search bar, analytics page, and calendar
- Polish up styles for better UI/UX
- Add physics to orientate knowledge graph nodes (currently random x,y,z coordinates)
- Add mobile support
- Integrate LLM into UI after framework is built
- Implement Playwright for component and End to End testing
- Generate more robust docs page -Done!
- Atomize and Asynchronize the codebase -WIP
