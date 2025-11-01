# Book Notes App (Capstone)

A small Express + PostgreSQL app to store books you read, your reviews/notes, and fetch book covers using the Open Library API.

## Features
- Create, Read, Update, Delete books (PostgreSQL).
- Sorting by rating, recency (read_date), and title.
- Uses Open Library Books API to fetch cover images.
- EJS templating and a simple responsive UI.
- Axios for API requests, pg for DB.

## Requirements
- Node.js (v16+ recommended)
- PostgreSQL

## Setup

1. Clone or copy project files.
2. Install dependencies:
```bash
npm install