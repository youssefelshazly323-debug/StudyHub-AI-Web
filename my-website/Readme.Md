# StudyHub AI 📚

StudyHub AI is a website I made to help university students stay organised. It brings tasks, study files, schedules, and study help into one place.


## Main Pages

* **Home** – Introduction to StudyHub AI
* **Fees** – Pricing information
* **Contact** – Contact form and FAQ
* **Sign Up / Log In** – User entry
* **Home** – Study dashboard
* **Profile** – User information
* **Files** – Study files
* **AI Summary** – Study summaries
* **To-Do** – Tasks and deadlines
* **Schedule** – Weekly schedule
* **Chat** – Study questions

## Project Structure

```text id="y5j2gd"
studyhub-web/
├── index.html
├── fees.html
├── contact.html
├── signup.html
└── app/
    ├── app.css
    ├── home.html
    ├── profile.html
    ├── files.html
    ├── summary.html
    ├── todo.html
    ├── schedule.html
    └── chat.html
```

## Current Features

The website includes a basic to-do list, task filters, chat, FAQ, login/sign-up pages, study files, schedule, and AI summary pages.

Most features use demo data and are not connected to a backend. The chat has limited offline demo replies and can use OpenAI for real answers when run through the local chat server:

1. Use Node.js 20.6 or newer.
2. Copy `.env.example` to `.env` and set `OPENAI_API_KEY` to your OpenAI API key.
3. Run `npm run chat` from this folder and open `http://localhost:3000/app/chat.html`.

The API key stays on the server and must not be added to browser code or committed. File uploads and citations are not connected to the chat yet.

## Future Plans

I plan to add real user accounts, a database, PDF uploads, working AI features, and saved tasks and schedules.

## About

I created StudyHub AI as a project to make it easier for students to manage their study work in one place. The website is still a work in progress.
