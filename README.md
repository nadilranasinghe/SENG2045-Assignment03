# Django Forum Application

**Course:** Network Application Development (SENG2045)  
**Assignment:** Assignment 03  
**Framework:** Django  
**Database:** SQLite
**Programmer - Nadil Ranasinghe**

## Project Overview

This project is a web-based discussion forum developed using Django, Python, JavaScript, and Bootstrap.

Users can create posts, interact with other users, upload images, leave comments, and like or unlike posts.

The application uses AJAX to update content dynamically without requiring a full page refresh.

## Features

- User registration with Django's UserCreationForm
- User login and logout
- Authentication-aware navigation bar
- User profile pages
- Create, edit, and delete forum posts
- Categories for organizing posts
- AJAX post loading and pagination
- AJAX Like/Unlike functionality
- AJAX comments with validation
- Multiple image uploads using Dropzone.js
- Bootstrap image carousel
- Post ownership and permission checks
- CSRF protection
- Form validation and error handling
- Localized post timestamps

## Technologies Used

- Python
- Django
- SQLite
- HTML and CSS
- JavaScript (Fetch API)
- Bootstrap 5
- Dropzone.js
- Git and GitHub

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/nadilranasinghe/SENG2045-Assignment03.git
cd SENG2045-Assignment03
```

### 2. Create a Virtual Environment

```bash
python -m venv .venv
```

Activate it on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 3. Install Dependencies

If a `requirements.txt` file is included:

```bash
pip install -r requirements.txt
```

### 4. Apply Database Migrations

```bash
python manage.py migrate
```

### 5. Start the Development Server

```bash
python manage.py runserver
```
Open the application at:

http://127.0.0.1:8000/


## User Authentication

The application supports user registration, login, and logout.

### Register a New Account

1. Open http://127.0.0.1:8000/
2. Click **Register** in the navigation bar.
3. Enter a username and password.
4. Confirm the password and submit the form.
5. Log in using the newly created account.

### Login

Click **Login** in the navigation bar or visit:

http://127.0.0.1:8000/accounts/login/

### Logout

Click **Sign Out** in the navigation bar.

### User Profiles

Authenticated users can access their profiles through the **My Profile** button.

Each user can create posts, upload images to their own posts, and interact with other users through likes and comments.

Only the owner of a post can edit or delete it.


## Running Automated Tests

Run all forum tests using:

```bash
python manage.py test forum
```

The automated test suite covers:

1. Homepage loading
2. Authentication restrictions
3. Post creation validation
4. Post editing permissions
5. Post deletion permissions
6. AJAX comment validation
7. AJAX Like/Unlike functionality
8. AJAX pagination

## Security and Validation

The application implements Django authentication, CSRF protection, and permission checks to prevent unauthorized modification of posts.

Input validation is used for post creation, comments, and image uploads.

## Repository

https://github.com/nadilranasinghe/SENG2045-Assignment03

## Notes

The application uses SQLite for local development. Uploaded images are handled through Django's media configuration.
