# PowerPoint Template Manager

A web application for creating and using PowerPoint templates with dynamic fields. This application allows users to upload PowerPoint presentations, define dynamic fields, and generate new presentations by filling in those fields.

## Features

- User authentication (register, login, logout)
- Upload PowerPoint presentations
- Convert PowerPoint slides to images
- Define dynamic fields on slides
- Position fields using drag and drop
- Fill templates with custom values
- Generate PDF or PowerPoint documents

## Tech Stack

### Backend
- Node.js with Express
- PostgreSQL database
- Sequelize ORM
- JWT authentication
- ConvertAPI for PPTX to image conversion
- PptxGenJS for PowerPoint generation
- PDFKit for PDF generation

### Frontend
- React
- React Router
- Axios for API requests
- Tailwind CSS for styling

## Getting Started

### Prerequisites

- Node.js (v14+)
- PostgreSQL
- ConvertAPI account (for PPTX conversion)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ppt-template-manager.git
cd ppt-template-manager
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables:

Create a `.env` file in the backend directory:
```
PORT=12000
JWT_SECRET=your_jwt_secret_key_here
DATABASE_URL=postgres://postgres:postgres@localhost:5432/ppt_template_manager
CONVERT_API_SECRET=your_convert_api_secret
```

Create a `.env` file in the frontend directory:
```
REACT_APP_API_URL=http://localhost:12000/api
```

4. Initialize the database:
```bash
cd backend
node scripts/initDb.js
```

5. Start the application:
```bash
# From the root directory
chmod +x start.sh
./start.sh
```

## Usage

1. Register a new account or login with the demo account:
   - Email: demo@example.com
   - Password: password123

2. Upload a PowerPoint template by clicking "New Template"

3. Edit the template by adding dynamic fields and positioning them on slides

4. Use the template by filling in the fields and generating a PDF or PowerPoint document

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Templates
- `GET /api/templates` - Get all templates
- `GET /api/templates/:id` - Get a template by ID
- `POST /api/templates` - Create a new template
- `PUT /api/templates/:id` - Update a template
- `DELETE /api/templates/:id` - Delete a template

### Fields
- `POST /api/templates/:id/fields` - Add a field to a template
- `PUT /api/templates/:id/fields/:fieldId` - Update a field
- `DELETE /api/templates/:id/fields/:fieldId` - Delete a field

### Document Generation
- `POST /api/templates/:id/generate` - Generate a document from a template

## License

This project is licensed under the MIT License - see the LICENSE file for details.