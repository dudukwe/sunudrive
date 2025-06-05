# Document Storage Platform API

A comprehensive document storage and management API built with Django, Django REST Framework, and MongoDB.

## Features

- User authentication with JWT tokens
- Document upload and management (PDFs, images, videos)
- File organization with folders and tags
- File sharing with granular access controls
- Advanced search functionality
- File versions and activity history
- Favorites, trash management, and recent files
- File comments and notifications
- Statistics and analytics

## Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/document-storage-platform.git
cd document-storage-platform
```

2. Install Python dependencies:
```
pip install -r requirements.txt
```

3. Configure settings:
   - Update MongoDB connection settings in `masterdrive/settings.py`

4. Run migrations and start the server:
```
python manage.py migrate
python manage.py runserver
```

5. Seed the database with sample data (optional):
```
python manage.py seed_db
```

## API Documentation

Once the server is running, API documentation is available at:
- Swagger UI: http://localhost:8000/swagger/
- ReDoc: http://localhost:8000/redoc/

## Core Endpoints

### Authentication
- `POST /api/v1/auth/register/`: Register a new user
- `POST /api/v1/auth/login/`: Log in and get JWT tokens
- `POST /api/v1/auth/refresh/`: Refresh JWT token

### Files
- `GET /api/v1/files/`: List all files
- `POST /api/v1/files/`: Upload a new file
- `GET /api/v1/files/{file_id}/`: Get file details
- `PUT /api/v1/files/{file_id}/`: Update file metadata
- `DELETE /api/v1/files/{file_id}/`: Move file to trash

### Search
- `GET /api/v1/search/?q=query`: Search files by title, description, or tags

### Organization
- `GET /api/v1/favorites/`: List favorite files
- `GET /api/v1/shared/`: List files shared with the user
- `GET /api/v1/recent/`: List recently accessed files
- `GET /api/v1/trash/`: List files in trash

### Folders
- `GET /api/v1/folders/`: List root folders
- `POST /api/v1/folders/`: Create a new folder
- `GET /api/v1/folders/{folder_id}/files`: List files in a folder

### Statistics
- `GET /api/v1/statistics/`: Get user's file statistics
