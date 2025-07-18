README.txt

CS5800 – Advanced Software Engineering  
Assignment 6 – Continuous Integration and Deployment  
Author: Daniyal Dianati


Project Overview:
-----------------
This assignment demonstrates a complete CI/CD pipeline setup for a simple full-stack web service built using Node.js and Express.js (backend) with a basic HTML frontend. The project includes automated testing, cloud deployment, and integration with GitHub Actions.

Repository Structure:
---------------------
/frontend             → Contains the HTML frontend  
/tests                → Contains unit test files written in Jest  
app.js                → Core application logic  
server.js             → Entry point for backend server  
package.json          → Node project configuration and dependencies  
Procfile              → Start command for platform compatibility (e.g. Heroku/Render)  
.github/workflows/    → GitHub Actions workflow for CI/CD  
  └── deploy.yml      → Defines steps for test, build, and deployment  
README.md / README.txt → Project documentation

CI/CD Workflow:
---------------
- The `.github/workflows/deploy.yml` file triggers on every push to `main`
- Steps include:
  - Checkout code from the repository
  - Set up Node.js and install dependencies
  - Run Jest unit tests from `/tests`
  - Trigger deployment via a Render deploy hook

Deployment:
-----------
- The backend and frontend are hosted via [Render](https://render.com/)
- Every successful push to GitHub automatically runs tests and re-deploys the updated service to the cloud

Testing:
--------
- Jest and Supertest are used to test backend routes
- Tests verify both valid and invalid API responses
- A passing pipeline confirms tests are executed and successful before deployment

Live Demo:
----------
- GitHub Repository: https://github.com/Quantom-Falcon/A6  
- Live URL (Render): https://resume-rev.onrender.com

Submission Notes:
-----------------
- All CI/CD steps verified through GitHub Actions dashboard
- Tests pass as shown in the action logs (see Run tests section)
- Repo includes complete codebase, test files, and workflow YAML

