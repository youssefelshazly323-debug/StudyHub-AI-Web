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

Most features use demo data and are not connected to a backend. The chat has a few offline demo replies and can use OpenAI for real answers when run through the local chat server:

1. Use Node.js 20.6 or newer.
2. To enable generated answers, copy `.env.example` to `.env` and set `OPENAI_API_KEY` to your OpenAI API key. This is optional for offline demo replies.
3. Run `npm run chat` from this folder and open `http://127.0.0.1:3000/app/chat.html`.

The API key stays on the server and must not be added to browser code or committed. File uploads and citations are not connected to the chat yet.

The local server binds to `127.0.0.1` by default. It serves the static pages and the chat API; static hosts such as GitHub Pages do not run that API.

Account creation and login are not connected to an account service. The contact form opens an email draft for the visitor to review, and the files page only validates selected files locally. Dashboard content and pricing are demo data; no account details, files, tasks, or payments are stored by this site. Do not use it to collect real user data or payments until those services are implemented and configured.

The GitHub Actions workflow publishes the contents of `my-website` to GitHub Pages when changes are pushed to `main`. On GitHub Pages, the chat uses only its built-in offline examples; generated answers require a separately hosted and protected API.

Live website: https://youssefelshazly323-debug.github.io/StudyHub-AI-Web/

## Future Plans

I plan to add real user accounts, a database, PDF uploads, working AI features, and saved tasks and schedules.

## About

I created StudyHub AI as a project to make it easier for students to manage their study work in one place. The website is still a work in progress.

## Youtube Video Link
(https://youtu.be/aVfj2vlHIsE)