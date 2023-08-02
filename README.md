# grade-managment-system
 

 ## Installation

To run this application locally, follow the steps below:

1. Clone the repository: `git clone <repository-url>`
2. Install the dependencies: `npm install`
3. Start the server: `npm start`
4. Access the application in your browser at `http://localhost:<port>`, where `<port>` is the port number specified in the `process.env.port` or `4000` if not defined.

## Routes

This application provides the following routes:

- `/user`: Handles user-related operations.
- `/course`: Handles course-related operations.
- `/student`: Handles student-related operations.
- `/teaching`: Handles teaching-related operations.
- `/home`: Handles home-related operations.

## Additional Features

- File Upload: This application allows users to upload files using the `multer` middleware. The uploaded files are stored in the `files` directory.

- Automatic File Cleanup: The application periodically clears the files in the `files` directory every 10 seconds.

- Excel File Generation: The application generates Excel files in the `analytical` and `typical` directories.

- Student Grade Update: The application checks for updated grades in students every 24.8 days and removes them from the course array if the updated grade timestamp is greater than the current date.

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Handlebars (hbs)
- Multer
- Body Parser
- Cookie Parser
- fs (File System)
- jwt (JSON Web Token)
- xlsx
- exceljs

 
