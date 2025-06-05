from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse
from django.conf import settings
from datetime import datetime
import os
import uuid
import mimetypes
import magic
import json
from ..serializers import (
    FileListSerializer, CommentSerializer, 
    FileVersionSerializer, FileActivitySerializer,
    FileUploadSerializer
)
from ..utils.mongodb import get_collection
from django.contrib.auth import get_user_model 
from pymongo import MongoClient
from bson import ObjectId




User = get_user_model()





# Fonction pour obtenir la connexion MongoDB
def get_db():
    mongo_uri = settings.MONGO_CLIENT['URI']
    db_name = settings.MONGO_CLIENT['DB_NAME']
    
    client = MongoClient(mongo_uri)
    return client[db_name]


class FileListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def get(self, request):
            db = get_db()
            collection = db['documents']

            query = {
                'owner_id': str(request.user.id),
                'is_trashed': False
            }

            files = list(collection.find(query).sort('uploaded_at', -1))

            serialized_files = []
            for file in files:
                file_id = str(file.pop('_id'))
                reordered_file = {'id': file_id, **file}
                serializer = FileListSerializer(instance=reordered_file)  
                serialized_files.append(serializer.data)

            return Response(serialized_files)


    
    def post(self, request):
        print("Données reçues:", request.data)
        print("Fichiers reçus:", request.FILES)
        
        # Vérifiez si un fichier a été fourni
        if 'file' not in request.FILES:
            return Response({"error": "Un fichier est requis"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Validation simple du fichier
            serializer = FileUploadSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            uploaded_file = request.FILES['file']
            
            # Obtenir le type de fichier
            mime = magic.Magic(mime=True)
            file_content = uploaded_file.read()  # Lire le contenu du fichier
            uploaded_file.seek(0)  # Réinitialiser le pointeur de fichier
            file_type = mime.from_buffer(file_content)
            
            # Déterminer la catégorie de fichier
            if file_type.startswith('image/'):
                file_category = 'image'
            elif file_type.startswith('video/'):
                file_category = 'video'
            elif file_type == 'application/pdf':
                file_category = 'pdf'
            else:
                file_category = 'other'
            
            # Générer un nom de fichier unique
            file_extension = os.path.splitext(uploaded_file.name)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            
            # Définir le chemin de stockage
            storage_path = getattr(settings, 'DOCUMENT_STORAGE_PATH', os.path.join(settings.BASE_DIR, 'uploads'))
            os.makedirs(storage_path, exist_ok=True)
            file_path = os.path.join(storage_path, unique_filename)
            
            # Enregistrer le fichier
            with open(file_path, 'wb+') as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)
            
            # Obtenir ou définir les métadonnées
            now = datetime.now()
            title = request.data.get('title', os.path.splitext(uploaded_file.name)[0])
            description = request.data.get('description', '')
            folder = request.data.get('folder', None)
            
            # Créer le document pour MongoDB (similaire à votre méthode d'échantillon)
            file_data = {
                "_id": ObjectId(),  
                "title": title,
                "type": file_category,
                "description": description,
                "author": f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username,
                "tags": json.loads(request.data.get('tags', '[]')),
                "file_path": unique_filename,
                "original_filename": uploaded_file.name,
                "size": uploaded_file.size,
                "owner_id": str(request.user.id),
                "folder": folder,
                "uploaded_at": now,
                "updated_at": now,
                "last_opened": now,
                "is_favorite": False,
                "is_trashed": False,
                "permissions": [],
                "versions": [{
                    "id": str(uuid.uuid4()),
                    "file_path": unique_filename,
                    "version_number": 1,
                    "size": uploaded_file.size,
                    "created_at": now,
                    "created_by": str(request.user.id)
                }],
                "comments": [],
                "activities": [{
                    "id": str(uuid.uuid4()),
                    "user_id": str(request.user.id),
                    "action": "upload",
                    "timestamp": now,
                    "details": {"original_filename": uploaded_file.name}
                }]
            }
            
            # Insérer dans MongoDB
            db = get_db()
            collection = db['documents']
            result = collection.insert_one(file_data)
            
            # Préparer la réponse
            response_data = file_data.copy()
            response_data['id'] = str(response_data['_id']) 
            del response_data['_id']
             
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            import traceback
            print(f"Erreur lors du traitement du fichier: {str(e)}")
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




class FileDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, file_id):
        file_id = ObjectId(file_id)
        try:
            collection = get_collection('documents')
            file = collection.find_one({'_id': file_id})            
            if not file:
                # Check if user has permission to view this file
                file = collection.find_one({
                    '_id': file_id,
                    'permissions.user_id': str(request.user.id),
                    'permissions.access_level': {'$in': ['view', 'edit', 'admin']}
                })
                
                if not file:
                    return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Update last_opened timestamp
            collection.update_one(
                {'_id': file_id},
                {
                    '$set': {'last_opened': datetime.now()},
                    '$push': {
                        'activities': {
                            'id': str(uuid.uuid4()),
                            'user_id': str(request.user.id),
                            'action': 'view',
                            'timestamp': datetime.now()
                        }
                    }
                }
            )
            
            # Convert MongoDB _id to string id for serialization
            file['id'] = str(file.get('_id'))
            del file['_id']
            
            return Response(file)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def put(self, request, file_id):
        try:
            collection = get_collection('documents')
            file = collection.find_one({'_id': file_id})
            
            if not file:
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if user has permission to edit
            if file.get('owner_id') != str(request.user.id):
                has_permission = False
                for perm in file.get('permissions', []):
                    if perm.get('user_id') == str(request.user.id) and perm.get('access_level') in ['edit', 'admin']:
                        has_permission = True
                        break
                
                if not has_permission:
                    return Response({'detail': 'You do not have permission to edit this file.'}, 
                                   status=status.HTTP_403_FORBIDDEN)
            
            # Fields that can be updated
            allowed_fields = ['title', 'description', 'tags', 'folder']
            updates = {}
            
            for field in allowed_fields:
                if field in request.data:
                    updates[field] = request.data[field]
            
            if updates:
                updates['updated_at'] = datetime.now()
                
                # Add activity record
                activity = {
                    'id': str(uuid.uuid4()),
                    'user_id': str(request.user.id),
                    'action': 'edit',
                    'timestamp': datetime.now(),
                    'details': {'fields_updated': list(updates.keys())}
                }
                
                collection.update_one(
                    {'_id': file_id},
                    {
                        '$set': updates,
                        '$push': {'activities': activity}
                    }
                )
                
                # If this is a shared file, create a notification for the owner
                if file.get('owner_id') != str(request.user.id):
                    notification = {
                        'user_id': file.get('owner_id'),
                        'type': 'edit',
                        'message': f"{request.user.username} edited your file '{file.get('title')}'",
                        'file': file_id,
                        'created_at': datetime.now(),
                        'is_read': False,
                        'details': {'fields_updated': list(updates.keys())}
                    }
                    
                    notifications_collection = get_collection('notifications')
                    notifications_collection.insert_one(notification)
            
            # Get updated file
            updated_file = collection.find_one({'_id': file_id})
            updated_file['id'] = str(updated_file.get('_id'))
            del updated_file['_id']
            
            return Response(updated_file)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, file_id):
        try:
            collection = get_collection('documents')
            file = collection.find_one({'_id': file_id})
            
            if not file:
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if user has permission to delete
            if file.get('owner_id') != str(request.user.id):
                has_permission = False
                for perm in file.get('permissions', []):
                    if perm.get('user_id') == str(request.user.id) and perm.get('access_level') == 'admin':
                        has_permission = True
                        break
                
                if not has_permission:
                    return Response({'detail': 'You do not have permission to delete this file.'}, 
                                   status=status.HTTP_403_FORBIDDEN)
            
            # Move to trash rather than permanent delete
            collection.update_one(
                {'_id': file_id},
                {
                    '$set': {
                        'is_trashed': True,
                        'trashed_at': datetime.now()
                    },
                    '$push': {
                        'activities': {
                            'id': str(uuid.uuid4()),
                            'user_id': str(request.user.id),
                            'action': 'delete',
                            'timestamp': datetime.now()
                        }
                    }
                }
            )
            
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FileDownloadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, file_id):
        file_id = ObjectId(file_id)
        try:
            collection = get_collection('documents')
            file = collection.find_one({'_id': file_id})
            
            if not file:
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if user has permission to download
            if file.get('owner_id') != str(request.user.id):
                has_permission = False
                for perm in file.get('permissions', []):
                    if perm.get('user_id') == str(request.user.id) and perm.get('access_level') in ['view', 'edit', 'admin']:
                        has_permission = True
                        break
                
                if not has_permission:
                    return Response({'detail': 'You do not have permission to download this file.'}, 
                                   status=status.HTTP_403_FORBIDDEN)
            
            # Get the file path
            file_path = os.path.join(settings.DOCUMENT_STORAGE_PATH, file.get('file_path'))
            
            if not os.path.exists(file_path):
                return Response({'detail': 'File not found on server.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Record download activity
            collection.update_one(
                {'_id': file_id},
                {
                    '$push': {
                        'activities': {
                            'id': str(uuid.uuid4()),
                            'user_id': str(request.user.id),
                            'action': 'download',
                            'timestamp': datetime.now()
                        }
                    }
                }
            )
            
            # Determine content type
            content_type, _ = mimetypes.guess_type(file.get('original_filename'))
            if not content_type:
                content_type = 'application/octet-stream'
            
            # Create file response
            response = FileResponse(
                open(file_path, 'rb'),
                content_type=content_type,
                as_attachment=True,
                filename=file.get('original_filename')
            )
            
            return response
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FilePreviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, file_id):
        file_id = ObjectId(file_id)
        try:
            collection = get_collection('documents')
            file = collection.find_one({'_id': file_id})
            
            if not file:
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if user has permission to view
            if file.get('owner_id') != str(request.user.id):
                has_permission = False
                for perm in file.get('permissions', []):
                    if perm.get('user_id') == str(request.user.id) and perm.get('access_level') in ['view', 'edit', 'admin']:
                        has_permission = True
                        break
                
                if not has_permission:
                    return Response({'detail': 'You do not have permission to view this file.'}, 
                                   status=status.HTTP_403_FORBIDDEN)
            
            # Get the file path
            file_path = os.path.join(settings.DOCUMENT_STORAGE_PATH, file.get('file_path'))
            
            if not os.path.exists(file_path):
                return Response({'detail': 'File not found on server.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Only certain file types can be previewed
            if file.get('type') not in ['image', 'pdf', 'other']:
                return Response({'detail': 'This file type cannot be previewed directly.'}, 
                               status=status.HTTP_400_BAD_REQUEST)
            
            # Record preview activity
            collection.update_one(
                {'_id': file_id},
                {
                    '$push': {
                        'activities': {
                            'id': str(uuid.uuid4()),
                            'user_id': str(request.user.id),
                            'action': 'view',
                            'timestamp': datetime.now()
                        }
                    }
                }
            )
            
            # Determine content type
            content_type, _ = mimetypes.guess_type(file.get('original_filename'))
            if not content_type:
                content_type = 'application/octet-stream'
            
            # Create file response (not as attachment for preview)
            response = FileResponse(
                open(file_path, 'rb'),
                content_type=content_type
            )
            
            return response
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FileTrashView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, file_id):
        file_id = ObjectId(file_id)
        try:
            collection = get_collection('documents')
            file = collection.find_one({'_id': file_id, 'owner_id': str(request.user.id)})
            
            if not file:
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            collection.update_one(
                {'_id': file_id},
                {
                    '$set': {
                        'is_trashed': True,
                        'trashed_at': datetime.now()
                    },
                    '$push': {
                        'activities': {
                            'id': str(uuid.uuid4()),
                            'user_id': str(request.user.id),
                            'action': 'delete',
                            'timestamp': datetime.now()
                        }
                    }
                }
            )
            
            return Response({'detail': 'File moved to trash.'})
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FileRestoreView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, file_id):
        try:
            collection = get_collection('documents')
            file = collection.find_one({
                '_id': file_id, 
                'owner_id': str(request.user.id),
                'is_trashed': True
            })
            
            if not file:
                return Response({'detail': 'Not found or not in trash.'}, status=status.HTTP_404_NOT_FOUND)
            
            collection.update_one(
                {'_id': file_id},
                {
                    '$set': {
                        'is_trashed': False,
                        'trashed_at': None
                    },
                    '$push': {
                        'activities': {
                            'id': str(uuid.uuid4()),
                            'user_id': str(request.user.id),
                            'action': 'restore',
                            'timestamp': datetime.now()
                        }
                    }
                }
            )
            
            return Response({'detail': 'File restored from trash.'})
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TrashListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            collection = get_collection('documents')
            trashed_files = list(collection.find({
                'owner_id': str(request.user.id),
                'is_trashed': True
            }).sort('trashed_at', -1))
            
            # Convert MongoDB _id to string id for serialization
            for file in trashed_files:
                file['id'] = str(file.get('_id'))
                del file['_id']
            
            serializer = FileListSerializer(trashed_files, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EmptyTrashView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def delete(self, request):
        try:
            collection = get_collection('documents')
            trashed_files = list(collection.find({
                'owner_id': str(request.user.id),
                'is_trashed': True
            }))
            
            # Get file paths to delete from disk
            file_paths = [file.get('file_path') for file in trashed_files]
            
            # Delete files from database
            result = collection.delete_many({
                'owner_id': str(request.user.id),
                'is_trashed': True
            })
            
            # Delete files from disk
            for file_path in file_paths:
                try:
                    full_path = os.path.join(settings.DOCUMENT_STORAGE_PATH, file_path)
                    if os.path.exists(full_path):
                        os.remove(full_path)
                except:
                    pass  # Continue even if one file fails to delete
            
            return Response({
                'detail': f'Deleted {result.deleted_count} files permanently.',
                'count': result.deleted_count
            })
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FileFavoriteView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, file_id):
        file_id = ObjectId(file_id)
        try:
            collection = get_collection('documents')
            file = collection.find_one({'_id': file_id})
            
            if not file:
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if user has permission to access this file
            if file.get('owner_id') != str(request.user.id):
                has_permission = False
                for perm in file.get('permissions', []):
                    if perm.get('user_id') == str(request.user.id) and perm.get('access_level') in ['view', 'edit', 'admin']:
                        has_permission = True
                        break
                
                if not has_permission:
                    return Response({'detail': 'You do not have permission to access this file.'}, 
                                   status=status.HTTP_403_FORBIDDEN)
            
            # Toggle favorite status
            is_favorite = not file.get('is_favorite', False)
            
            collection.update_one(
                {'_id': file_id},
                {
                    '$set': {'is_favorite': is_favorite},
                    '$push': {
                        'activities': {
                            'id': str(uuid.uuid4()),
                            'user_id': str(request.user.id),
                            'action': 'favorite' if is_favorite else 'unfavorite',
                            'timestamp': datetime.now()
                        }
                    }
                }
            )
            
            return Response({'is_favorite': is_favorite})
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class FavoriteListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            user_id = str(request.user.id)
            collection = get_collection('documents')

            # Fichiers accessibles (soit propriété soit partagés)
            query = {
                'is_trashed': False,
                '$or': [
                    {'owner_id': user_id},
                    {'permissions.user_id': user_id}
                ]
            }

            favorites = []
            for doc in collection.find(query):
                activities = doc.get('activities', [])

                # Filtrer les actions de l'utilisateur
                user_fav_actions = [
                    a for a in activities
                    if a.get('user_id') == user_id and a['action'] in ['favorite', 'unfavorite']
                ]

                if user_fav_actions:
                    # Dernière action : si c'est 'favorite', on garde
                    last_action = sorted(user_fav_actions, key=lambda a: a['timestamp'], reverse=True)[0]
                    if last_action['action'] == 'favorite':
                        doc['id'] = str(doc['_id'])
                        del doc['_id']
                        doc['_favorite_timestamp'] = last_action['timestamp']  # Temporaire pour tri
                        favorites.append(doc)

            favorites = sorted(favorites, key=lambda d: d['_favorite_timestamp'], reverse=True)

            for doc in favorites:
                del doc['_favorite_timestamp']

            serializer = FileListSerializer(favorites, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FileShareView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, file_id):
        file_id = ObjectId(file_id)
        try:
            if 'email' not in request.data or 'access_level' not in request.data:
                return Response({'detail': 'email and access_level are required.'}, 
                               status=status.HTTP_400_BAD_REQUEST)
            
            email = request.data['email']
            access_level = request.data['access_level']
            
            # Validate access level
            if access_level not in ['view', 'edit', 'admin']:
                return Response({'detail': 'access_level must be one of: view, edit, admin'}, 
                               status=status.HTTP_400_BAD_REQUEST)
            
            # Check if user exists by email
            try:
                user = User.objects.get(email=email)
                user_id = str(user.id)
            except User.DoesNotExist:
                return Response({'detail': 'User with this email does not exist.'}, 
                               status=status.HTTP_404_NOT_FOUND)
            
            # Prevent sharing with self
            if user_id == str(request.user.id):
                return Response({'detail': 'You cannot share a file with yourself.'}, 
                               status=status.HTTP_400_BAD_REQUEST)
            
            collection = get_collection('documents')
            file = collection.find_one({'_id': file_id, 'owner_id': str(request.user.id)})
            
            if not file:
                return Response({'detail': 'Not found or you are not the owner.'}, 
                               status=status.HTTP_404_NOT_FOUND)
            
            # Check if user already has permission
            permissions = file.get('permissions', [])
            for i, perm in enumerate(permissions):
                if perm.get('user_id') == user_id:
                    # Update existing permission
                    permissions[i]['access_level'] = access_level
                    permissions[i]['granted_at'] = datetime.now()
                    
                    collection.update_one(
                        {'_id': file_id},
                        {'$set': {'permissions': permissions}}
                    )
                    
                    return Response({'detail': 'Permission updated successfully.'})
            
            # Add new permission
            new_permission = {
                'user_id': user_id,
                'email': email,
                'access_level': access_level,
                'granted_at': datetime.now(),
                'granted_by': str(request.user.id)
            }
            
            collection.update_one(
                {'_id': file_id},
                {
                    '$push': {
                        'permissions': new_permission,
                        'activities': {
                            'id': str(uuid.uuid4()),
                            'user_id': str(request.user.id),
                            'action': 'share',
                            'timestamp': datetime.now(),
                            'details': {'shared_with': email, 'access_level': access_level}
                        }
                    }
                }
            )
            
            # Create notification for shared user
            notification = {
                'user_id': user_id,
                'type': 'share',
                'message': f"{request.user.username} shared '{file.get('title')}' with you",
                'file': file_id,
                'created_at': datetime.now(),
                'is_read': False,
                'details': {'access_level': access_level}
            }
            
            notifications_collection = get_collection('notifications')
            notifications_collection.insert_one(notification)
            
            return Response({'detail': 'File shared successfully.'})
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FilePermissionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, file_id):
        file_id = ObjectId(file_id)
        try:
            collection = get_collection('documents')
            file = collection.find_one({'_id': file_id})
            
            if not file:
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if user is the owner or has admin permission
            if file.get('owner_id') != str(request.user.id):
                has_permission = False
                for perm in file.get('permissions', []):
                    if perm.get('user_id') == str(request.user.id) and perm.get('access_level') == 'admin':
                        has_permission = True
                        break
                
                if not has_permission:
                    return Response({'detail': 'You do not have permission to view sharing settings.'}, 
                                   status=status.HTTP_403_FORBIDDEN)
            
            # Get user details for each permission
            permissions = file.get('permissions', [])
            detailed_permissions = []
            
            for perm in permissions:
                try:
                    user = User.objects.get(id=perm.get('user_id'))
                    detailed_permissions.append({
                        'user_id': perm.get('user_id'),
                        'email': user.email,
                        'name': f"{user.first_name} {user.last_name}".strip() or user.username,
                        'access_level': perm.get('access_level'),
                        'granted_at': perm.get('granted_at'),
                    })
                except User.DoesNotExist:
                    # Skip users that no longer exist
                    pass
            
            return Response({
                'owner': {
                    'user_id': file.get('owner_id'),
                    'name': file.get('author')
                },
                'permissions': detailed_permissions
            })
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, file_id):
        try:
            if 'email' not in request.data:
                return Response({'detail': 'email is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
            email = request.data['email']
            
            # Get user ID from email
            try:
                user = User.objects.get(email=email)
                user_id = str(user.id)
            except User.DoesNotExist:
                return Response({'detail': 'User with this email does not exist.'}, 
                               status=status.HTTP_404_NOT_FOUND)
            
            collection = get_collection('documents')
            file = collection.find_one({'_id': file_id})
            
            if not file:
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if user is the owner or has admin permission
            if file.get('owner_id') != str(request.user.id):
                has_permission = False
                for perm in file.get('permissions', []):
                    if perm.get('user_id') == str(request.user.id) and perm.get('access_level') == 'admin':
                        has_permission = True
                        break
                
                if not has_permission:
                    return Response({'detail': 'You do not have permission to modify sharing settings.'}, 
                                   status=status.HTTP_403_FORBIDDEN)
            
            # Remove the permission
            collection.update_one(
                {'_id': file_id},
                {
                    '$pull': {'permissions': {'user_id': user_id}},
                    '$push': {
                        'activities': {
                            'id': str(uuid.uuid4()),
                            'user_id': str(request.user.id),
                            'action': 'unshare',
                            'timestamp': datetime.now(),
                            'details': {'email': email}
                        }
                    }
                }
            )
            
            return Response({'detail': 'Permission revoked successfully.'})
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FileRevokePermissionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, file_id):
        file_id = ObjectId(file_id)
        try:
            if 'email' not in request.data:
                return Response({'detail': 'email is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
            email = request.data['email']
            
            # Get user ID from email
            try:
                user = User.objects.get(email=email)
                user_id = str(user.id)
            except User.DoesNotExist:
                return Response({'detail': 'User with this email does not exist.'}, 
                               status=status.HTTP_404_NOT_FOUND)
            
            collection = get_collection('documents')
            file = collection.find_one({'_id': file_id})
            
            if not file:
                return Response({'detail': 'File not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if user is the owner or has admin permission
            if file.get('owner_id') != str(request.user.id):
                has_permission = False
                for perm in file.get('permissions', []):
                    if perm.get('user_id') == str(request.user.id) and perm.get('access_level') == 'admin':
                        has_permission = True
                        break
                
                if not has_permission:
                    return Response({'detail': 'You do not have permission to modify sharing settings.'}, 
                                   status=status.HTTP_403_FORBIDDEN)
            
            # Check if the user actually has permission to revoke
            has_existing_permission = False
            for perm in file.get('permissions', []):
                if perm.get('user_id') == user_id:
                    has_existing_permission = True
                    break
            
            if not has_existing_permission:
                return Response({'detail': 'User does not have permission on this file.'}, 
                               status=status.HTTP_400_BAD_REQUEST)
            
            # Remove the permission
            result = collection.update_one(
                {'_id': file_id},
                {
                    '$pull': {'permissions': {'user_id': user_id}},
                    '$push': {
                        'activities': {
                            'id': str(uuid.uuid4()),
                            'user_id': str(request.user.id),
                            'action': 'unshare',
                            'timestamp': datetime.now(),
                            'details': {'email': email}
                        }
                    }
                }
            )
            
            if result.modified_count > 0:
                return Response({'detail': 'Permission revoked successfully.'})
            else:
                return Response({'detail': 'Failed to revoke permission.'}, 
                               status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SharedFilesView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            collection = get_collection('documents')
            shared_files = list(collection.find({
                'permissions.user_id': str(request.user.id),
                'is_trashed': False
            }).sort('updated_at', -1))
            
            # Convert MongoDB _id to string id for serialization
            for file in shared_files:
                file['id'] = str(file.get('_id'))
                del file['_id']
                
                # Add access level information
                for perm in file.get('permissions', []):
                    if perm.get('user_id') == str(request.user.id):
                        file['access_level'] = perm.get('access_level')
                        break
            
            serializer = FileListSerializer(shared_files, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FileCommentsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, file_id):
        file_id = ObjectId(file_id)
        try:
            collection = get_collection('documents')
            file = collection.find_one({'_id': file_id})
            
            if not file:
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if user has permission to view comments
            if file.get('owner_id') != str(request.user.id):
                has_permission = False
                for perm in file.get('permissions', []):
                    if perm.get('user_id') == str(request.user.id) and perm.get('access_level') in ['view', 'edit', 'admin']:
                        has_permission = True
                        break
                
                if not has_permission:
                    return Response({'detail': 'You do not have permission to view comments.'}, 
                                   status=status.HTTP_403_FORBIDDEN)
            
            comments = file.get('comments', [])
            
            # Add user details to comments
            for comment in comments:
                try:
                    user = User.objects.get(id=comment.get('user_id'))
                    comment['username'] = user.username
                    comment['user_name'] = f"{user.first_name} {user.last_name}".strip() or user.username
                except User.DoesNotExist:
                    comment['username'] = 'Unknown User'
                    comment['user_name'] = 'Unknown User'
            
            # Sort comments by created_at
            comments.sort(key=lambda x: x.get('created_at', ''), reverse=True)
            
            serializer = CommentSerializer(comments, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request, file_id):
        file_id = ObjectId(file_id)
        try:
            if 'text' not in request.data:
                return Response({'detail': 'Comment text is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
            collection = get_collection('documents')
            file = collection.find_one({'_id': file_id})
            
            if not file:
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if user has permission to comment
            if file.get('owner_id') != str(request.user.id):
                has_permission = False
                for perm in file.get('permissions', []):
                    if perm.get('user_id') == str(request.user.id) and perm.get('access_level') in ['edit', 'admin']:
                        has_permission = True
                        break
                
                if not has_permission:
                    return Response({'detail': 'You do not have permission to comment on this file.'}, 
                                   status=status.HTTP_403_FORBIDDEN)
            
            # Create new comment
            now = datetime.now()
            comment = {
                'id': str(uuid.uuid4()),
                'user_id': str(request.user.id),
                'text': request.data['text'],
                'created_at': now,
                'updated_at': now
            }
            
            collection.update_one(
                {'_id': file_id},
                {
                    '$push': {
                        'comments': comment,
                        'activities': {
                            'id': str(uuid.uuid4()),
                            'user_id': str(request.user.id),
                            'action': 'comment',
                            'timestamp': now,
                            'details': {'comment_id': comment['id']}
                        }
                    }
                }
            )
            
            # Add user details to the response
            comment['user_name'] = f"{request.user.first_name} {request.user.last_name}".strip()
            
            # Create notification for the file owner if comment was made by someone else
            if file.get('owner_id') != str(request.user.id):
                notification = {
                    'user_id': file.get('owner_id'),
                    'type': 'comment',
                    'message': f"{request.user.username} commented on your file '{file.get('title')}'",
                    'file': file_id,
                    'created_at': now,
                    'is_read': False,
                    'details': {
                        'comment_id': comment['id'],
                        'comment_text': comment['text'][:50] + ('...' if len(comment['text']) > 50 else '')
                    }
                }
                
                notifications_collection = get_collection('notifications')
                notifications_collection.insert_one(notification)
            
            return Response(comment)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FileCommentDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def put(self, request, file_id, comment_id):
        file_id = ObjectId(file_id)
        try:
            if 'text' not in request.data:
                return Response({'detail': 'Comment text is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
            collection = get_collection('documents')
            file = collection.find_one({'_id': file_id})
            
            if not file:
                return Response({'detail': 'File not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Find the comment
            comment_found = False
            comments = file.get('comments', [])
            for i, comment in enumerate(comments):
                if comment.get('id') == comment_id:
                    # Check if user is the comment author
                    if comment.get('user_id') != str(request.user.id):
                        return Response({'detail': 'You can only edit your own comments.'}, 
                                       status=status.HTTP_403_FORBIDDEN)
                    
                    # Update the comment
                    comments[i]['text'] = request.data['text']
                    comments[i]['updated_at'] = datetime.now()
                    comment_found = True
                    break
            
            if not comment_found:
                return Response({'detail': 'Comment not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Update the file with modified comments
            collection.update_one(
                {'_id': file_id},
                {'$set': {'comments': comments}}
            )
            
            return Response({'detail': 'Comment updated.'})
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, file_id, comment_id):
        file_id = ObjectId(file_id)
        try:
            collection = get_collection('documents')
            file = collection.find_one({'_id': file_id})
            
            if not file:
                return Response({'detail': 'File not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Find the comment
            comment_found = False
            comment_user_id = None
            comments = file.get('comments', [])
            for comment in comments:
                if comment.get('id') == comment_id:
                    comment_user_id = comment.get('user_id')
                    comment_found = True
                    break
            
            if not comment_found:
                return Response({'detail': 'Comment not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check permissions: either comment author or file owner can delete
            if comment_user_id != str(request.user.id) and file.get('owner_id') != str(request.user.id):
                return Response({'detail': 'You can only delete your own comments or comments on your files.'}, 
                               status=status.HTTP_403_FORBIDDEN)
            
            # Remove the comment
            collection.update_one(
                {'_id': file_id},
                {'$pull': {'comments': {'id': comment_id}}}
            )
            
            return Response({'detail': 'Comment deleted.'}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FileVersionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, file_id):
        file_id = ObjectId(file_id)
        try:
            collection = get_collection('documents')
            file = collection.find_one({'_id': file_id})
            
            if not file:
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if user has permission to view versions
            if file.get('owner_id') != str(request.user.id):
                has_permission = False
                for perm in file.get('permissions', []):
                    if perm.get('user_id') == str(request.user.id) and perm.get('access_level') in ['view', 'edit', 'admin']:
                        has_permission = True
                        break
                
                if not has_permission:
                    return Response({'detail': 'You do not have permission to view file versions.'}, 
                                   status=status.HTTP_403_FORBIDDEN)
            
            versions = file.get('versions', [])
            
            # Add user details to versions
            for version in versions:
                try:
                    user = User.objects.get(id=version.get('created_by'))
                    version['created_by_username'] = user.username
                    version['created_by_name'] = f"{user.first_name} {user.last_name}".strip() or user.username
                except User.DoesNotExist:
                    version['created_by_username'] = 'Unknown User'
                    version['created_by_name'] = 'Unknown User'
            
            # Sort versions by version number
            versions.sort(key=lambda x: x.get('version_number', 0), reverse=True)
            
            serializer = FileVersionSerializer(versions, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request, file_id):
        file_id = ObjectId(file_id)
        try:
            if 'file' not in request.FILES:
                return Response({'detail': 'File is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
            collection = get_collection('documents')
            file = collection.find_one({'_id': file_id})
            
            if not file:
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if user has permission to add versions
            if file.get('owner_id') != str(request.user.id):
                has_permission = False
                for perm in file.get('permissions', []):
                    if perm.get('user_id') == str(request.user.id) and perm.get('access_level') in ['edit', 'admin']:
                        has_permission = True
                        break
                
                if not has_permission:
                    return Response({'detail': 'You do not have permission to add versions to this file.'}, 
                                   status=status.HTTP_403_FORBIDDEN)
            
            uploaded_file = request.FILES['file']
            
            # Generate a unique filename for the new version
            file_extension = os.path.splitext(uploaded_file.name)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            
            # Save file to disk
            file_path = os.path.join(settings.DOCUMENT_STORAGE_PATH, unique_filename)
            with open(file_path, 'wb+') as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)
            
            # Get next version number
            versions = file.get('versions', [])
            next_version = 1
            if versions:
                next_version = max(v.get('version_number', 0) for v in versions) + 1
            
            # Create new version
            now = datetime.now()
            new_version = {
                'id': str(uuid.uuid4()),
                'file_path': unique_filename,
                'version_number': next_version,
                'size': uploaded_file.size,
                'created_at': now,
                'created_by': str(request.user.id)
            }
            
            # Update file with new version
            collection.update_one(
                {'_id': file_id},
                {
                    '$push': {
                        'versions': new_version,
                        'activities': {
                            'id': str(uuid.uuid4()),
                            'user_id': str(request.user.id),
                            'action': 'version',
                            'timestamp': now,
                            'details': {'version_number': next_version}
                        }
                    },
                    '$set': {
                        'file_path': unique_filename,  # Update main file to point to newest version
                        'size': uploaded_file.size,
                        'updated_at': now
                    }
                }
            )
            
            # Add user details to the response
            new_version['created_by_username'] = request.user.username
            new_version['created_by_name'] = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
            
            # Create notification for the file owner if version was added by someone else
            if file.get('owner_id') != str(request.user.id):
                notification = {
                    'user_id': file.get('owner_id'),
                    'type': 'edit',
                    'message': f"{request.user.username} added a new version to your file '{file.get('title')}'",
                    'file': file_id,
                    'created_at': now,
                    'is_read': False,
                    'details': {'version_number': next_version}
                }
                
                notifications_collection = get_collection('notifications')
                notifications_collection.insert_one(notification)
            
            return Response(new_version)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FileVersionDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, file_id, version_id):
        file_id = ObjectId(file_id)
        try:
            collection = get_collection('documents')
            file = collection.find_one({'_id': file_id})
            
            if not file:
                return Response({'detail': 'File not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if user has permission to view versions
            if file.get('owner_id') != str(request.user.id):
                has_permission = False
                for perm in file.get('permissions', []):
                    if perm.get('user_id') == str(request.user.id) and perm.get('access_level') in ['view', 'edit', 'admin']:
                        has_permission = True
                        break
                
                if not has_permission:
                    return Response({'detail': 'You do not have permission to view file versions.'}, 
                                   status=status.HTTP_403_FORBIDDEN)
            
            # Find the specific version
            version = None
            for v in file.get('versions', []):
                if v.get('id') == version_id:
                    version = v
                    break
            
            if not version:
                return Response({'detail': 'Version not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Get the file path for the version
            file_path = os.path.join(settings.DOCUMENT_STORAGE_PATH, version.get('file_path'))
            
            if not os.path.exists(file_path):
                return Response({'detail': 'Version file not found on server.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Determine content type
            content_type, _ = mimetypes.guess_type(file.get('original_filename'))
            if not content_type:
                content_type = 'application/octet-stream'
            
            # Create file response
            response = FileResponse(
                open(file_path, 'rb'),
                content_type=content_type,
                as_attachment=True,
                filename=f"{os.path.splitext(file.get('original_filename'))[0]}_v{version.get('version_number')}{os.path.splitext(file.get('original_filename'))[1]}"
            )
            
            return response
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request, file_id, version_id):
        file_id = ObjectId(file_id)
        try:
            collection = get_collection('documents')
            file = collection.find_one({'_id': file_id})
            
            if not file:
                return Response({'detail': 'File not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if user has permission to restore versions
            if file.get('owner_id') != str(request.user.id):
                has_permission = False
                for perm in file.get('permissions', []):
                    if perm.get('user_id') == str(request.user.id) and perm.get('access_level') in ['edit', 'admin']:
                        has_permission = True
                        break
                
                if not has_permission:
                    return Response({'detail': 'You do not have permission to restore file versions.'}, 
                                   status=status.HTTP_403_FORBIDDEN)
            
            # Find the specific version
            version = None
            for v in file.get('versions', []):
                if v.get('id') == version_id:
                    version = v
                    break
            
            if not version:
                return Response({'detail': 'Version not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Update the file to use this version as the current one
            collection.update_one(
                {'_id': file_id},
                {
                    '$set': {
                        'file_path': version.get('file_path'),
                        'size': version.get('size'),
                        'updated_at': datetime.now()
                    },
                    '$push': {
                        'activities': {
                            'id': str(uuid.uuid4()),
                            'user_id': str(request.user.id),
                            'action': 'restore',
                            'timestamp': datetime.now(),
                            'details': {'version_number': version.get('version_number')}
                        }
                    }
                }
            )
            
            return Response({'detail': f"Restored to version {version.get('version_number')}."})
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FileActivityView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, file_id):
        file_id = ObjectId(file_id)
        try:
            collection = get_collection('documents')
            file = collection.find_one({'_id': file_id})
            
            if not file:
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if user has permission to view activity
            if file.get('owner_id') != str(request.user.id):
                has_permission = False
                for perm in file.get('permissions', []):
                    if perm.get('user_id') == str(request.user.id) and perm.get('access_level') in ['view', 'edit', 'admin']:
                        has_permission = True
                        break
                
                if not has_permission:
                    return Response({'detail': 'You do not have permission to view file activity.'}, 
                                   status=status.HTTP_403_FORBIDDEN)
            
            activities = file.get('activities', [])
            
            # Add user details to activities
            for activity in activities:
                try:
                    user = User.objects.get(id=activity.get('user_id'))
                    activity['username'] = user.username
                    activity['user_name'] = f"{user.first_name} {user.last_name}".strip() or user.username
                except User.DoesNotExist:
                    activity['username'] = 'Unknown User'
                    activity['user_name'] = 'Unknown User'
            
            # Sort activities by timestamp (newest first)
            activities.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            
            serializer = FileActivitySerializer(activities, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserActivityView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            collection = get_collection('documents')
            
            # Find all files where user is owner or has permissions
            files = list(collection.find({
                '$or': [
                    {'owner_id': str(request.user.id)},
                    {'permissions.user_id': str(request.user.id)}
                ]
            }))
            
            all_activities = []
            
            for file in files:
                file_id = str(file.get('_id'))
                file_title = file.get('title')
                
                for activity in file.get('activities', []):
                    # Add file info to each activity
                    activity['file_id'] = file_id
                    activity['file_title'] = file_title
                    all_activities.append(activity)
            
            # Sort by timestamp (newest first)
            all_activities.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            
            # Add user details to activities
            for activity in all_activities:
                try:
                    user = User.objects.get(id=activity.get('user_id'))
                    activity['username'] = user.username
                    activity['user_name'] = f"{user.first_name} {user.last_name}".strip() or user.username
                except User.DoesNotExist:
                    activity['username'] = 'Unknown User'
                    activity['user_name'] = 'Unknown User'
            
            # Limit to most recent activities
            recent_activities = all_activities[:50]  # Show last 50 activities
            
            return Response(recent_activities)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RecentFilesView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            collection = get_collection('documents')
            
            # Find recently opened files (where the user is either owner or has permissions)
            recent_files = list(collection.find({
                '$or': [
                    {'owner_id': str(request.user.id)},
                    {'permissions.user_id': str(request.user.id)}
                ],
                'is_trashed': False,
                'last_opened': {'$exists': True}
            }).sort('last_opened', -1).limit(10))
            
            # Convert MongoDB _id to string id for serialization
            for file in recent_files:
                file['id'] = str(file.get('_id'))
                del file['_id']
            
            serializer = FileListSerializer(recent_files, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        




        from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import get_user_model
from datetime import datetime
from bson import ObjectId
import json

User = get_user_model()

class FileSortByDateView(APIView):
    """
    Endpoint pour trier les fichiers par date
    Query parameters:
    - order: 'asc' ou 'desc' (default: 'desc')
    - date_field: 'uploaded_at', 'updated_at', ou 'last_opened' (default: 'uploaded_at')
    - include_shared: 'true' ou 'false' pour inclure les fichiers partagés (default: 'false')
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            # Récupérer les paramètres de requête
            order = request.GET.get('order', 'desc').lower()
            date_field = request.GET.get('date_field', 'uploaded_at')
            include_shared = request.GET.get('include_shared', 'false').lower() == 'true'
            
            # Valider les paramètres
            if order not in ['asc', 'desc']:
                return Response({'error': 'order must be "asc" or "desc"'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            if date_field not in ['uploaded_at', 'updated_at', 'last_opened']:
                return Response({'error': 'date_field must be "uploaded_at", "updated_at", or "last_opened"'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            # Construire la requête MongoDB
            db = get_db()
            collection = db['documents']
            
            if include_shared:
                query = {
                    '$or': [
                        {'owner_id': str(request.user.id)},
                        {'permissions.user_id': str(request.user.id)}
                    ],
                    'is_trashed': False
                }
            else:
                query = {
                    'owner_id': str(request.user.id),
                    'is_trashed': False
                }
            
            # Déterminer l'ordre de tri MongoDB
            sort_order = -1 if order == 'desc' else 1
            
            # Exécuter la requête avec tri
            files = list(collection.find(query).sort(date_field, sort_order))
            
            # Traiter les résultats
            serialized_files = []
            for file in files:
                file_id = str(file.pop('_id'))
                reordered_file = {'id': file_id, **file}
                
                # Ajouter des informations sur l'accès si c'est un fichier partagé
                if include_shared and file.get('owner_id') != str(request.user.id):
                    for perm in file.get('permissions', []):
                        if perm.get('user_id') == str(request.user.id):
                            reordered_file['access_level'] = perm.get('access_level')
                            break
                
                from ..serializers import FileListSerializer
                serializer = FileListSerializer(instance=reordered_file)
                serialized_files.append(serializer.data)
            
            return Response({
                'files': serialized_files,
                'sort_info': {
                    'field': date_field,
                    'order': order,
                    'count': len(serialized_files),
                    'include_shared': include_shared
                }
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FileSortBySizeView(APIView):
    """
    Endpoint pour trier les fichiers par taille
    Query parameters:
    - order: 'asc' ou 'desc' (default: 'desc' pour les plus gros fichiers en premier)
    - include_shared: 'true' ou 'false' pour inclure les fichiers partagés (default: 'false')
    - min_size: taille minimale en bytes (optionnel)
    - max_size: taille maximale en bytes (optionnel)
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            # Récupérer les paramètres de requête
            order = request.GET.get('order', 'desc').lower()
            include_shared = request.GET.get('include_shared', 'false').lower() == 'true'
            min_size = request.GET.get('min_size')
            max_size = request.GET.get('max_size')
            
            # Valider les paramètres
            if order not in ['asc', 'desc']:
                return Response({'error': 'order must be "asc" or "desc"'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            # Construire la requête MongoDB
            db = get_db()
            collection = db['documents']
            
            if include_shared:
                query = {
                    '$or': [
                        {'owner_id': str(request.user.id)},
                        {'permissions.user_id': str(request.user.id)}
                    ],
                    'is_trashed': False
                }
            else:
                query = {
                    'owner_id': str(request.user.id),
                    'is_trashed': False
                }
            
            # Ajouter les filtres de taille si spécifiés
            size_filter = {}
            if min_size:
                try:
                    size_filter['$gte'] = int(min_size)
                except ValueError:
                    return Response({'error': 'min_size must be a valid integer'}, 
                                  status=status.HTTP_400_BAD_REQUEST)
            
            if max_size:
                try:
                    size_filter['$lte'] = int(max_size)
                except ValueError:
                    return Response({'error': 'max_size must be a valid integer'}, 
                                  status=status.HTTP_400_BAD_REQUEST)
            
            if size_filter:
                query['size'] = size_filter
            
            # Déterminer l'ordre de tri MongoDB
            sort_order = -1 if order == 'desc' else 1
            
            # Exécuter la requête avec tri
            files = list(collection.find(query).sort('size', sort_order))
            
            # Traiter les résultats et calculer les statistiques
            total_size = 0
            serialized_files = []
            
            for file in files:
                file_id = str(file.pop('_id'))
                reordered_file = {'id': file_id, **file}
                total_size += file.get('size', 0)
                
                # Ajouter des informations lisibles sur la taille
                size_bytes = file.get('size', 0)
                if size_bytes < 1024:
                    size_human = f"{size_bytes} B"
                elif size_bytes < 1024 * 1024:
                    size_human = f"{size_bytes / 1024:.1f} KB"
                elif size_bytes < 1024 * 1024 * 1024:
                    size_human = f"{size_bytes / (1024 * 1024):.1f} MB"
                else:
                    size_human = f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"
                
                reordered_file['size_human'] = size_human
                
                # Ajouter des informations sur l'accès si c'est un fichier partagé
                if include_shared and file.get('owner_id') != str(request.user.id):
                    for perm in file.get('permissions', []):
                        if perm.get('user_id') == str(request.user.id):
                            reordered_file['access_level'] = perm.get('access_level')
                            break
                
                from ..serializers import FileListSerializer
                serializer = FileListSerializer(instance=reordered_file)
                serialized_files.append(serializer.data)
            
            # Calculer la taille totale lisible
            if total_size < 1024:
                total_size_human = f"{total_size} B"
            elif total_size < 1024 * 1024:
                total_size_human = f"{total_size / 1024:.1f} KB"
            elif total_size < 1024 * 1024 * 1024:
                total_size_human = f"{total_size / (1024 * 1024):.1f} MB"
            else:
                total_size_human = f"{total_size / (1024 * 1024 * 1024):.1f} GB"
            
            return Response({
                'files': serialized_files,
                'sort_info': {
                    'field': 'size',
                    'order': order,
                    'count': len(serialized_files),
                    'include_shared': include_shared,
                    'total_size': total_size,
                    'total_size_human': total_size_human,
                    'filters': {
                        'min_size': min_size,
                        'max_size': max_size
                    }
                }
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FileSortByTypeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            # Récupérer les paramètres de requête
            order = request.GET.get('order', 'asc').lower()
            include_shared = request.GET.get('include_shared', 'false').lower() == 'true'
            type_filter = request.GET.get('type_filter')
            group_by_type = request.GET.get('group_by_type', 'false').lower() == 'true'
            
            # Valider les paramètres
            if order not in ['asc', 'desc']:
                return Response({'error': 'order must be "asc" or "desc"'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            if type_filter and type_filter not in ['image', 'video', 'pdf', 'other']:
                return Response({'error': 'type_filter must be one of: image, video, pdf, other'}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            # Construire la requête MongoDB
            db = get_db()
            collection = db['documents']
            
            if include_shared:
                query = {
                    '$or': [
                        {'owner_id': str(request.user.id)},
                        {'permissions.user_id': str(request.user.id)}
                    ],
                    'is_trashed': False
                }
            else:
                query = {
                    'owner_id': str(request.user.id),
                    'is_trashed': False
                }
            
            # Ajouter le filtre de type si spécifié
            if type_filter:
                query['type'] = type_filter
            
            # Déterminer l'ordre de tri MongoDB
            sort_order = -1 if order == 'desc' else 1
            
            # Exécuter la requête avec tri par type puis par titre
            files = list(collection.find(query).sort([('type', sort_order), ('title', 1)]))
            
            # Traiter les résultats
            serialized_files = []
            type_counts = {}
            
            for file in files:
                file_id = str(file.pop('_id'))
                reordered_file = {'id': file_id, **file}
                
                # Compter les types
                file_type = file.get('type', 'other')
                type_counts[file_type] = type_counts.get(file_type, 0) + 1
                
                # Ajouter des informations sur l'accès si c'est un fichier partagé
                if include_shared and file.get('owner_id') != str(request.user.id):
                    for perm in file.get('permissions', []):
                        if perm.get('user_id') == str(request.user.id):
                            reordered_file['access_level'] = perm.get('access_level')
                            break
                
                from ..serializers import FileListSerializer
                serializer = FileListSerializer(instance=reordered_file)
                serialized_files.append(serializer.data)
            
            # Grouper par type si demandé
            if group_by_type:
                grouped_files = {}
                for file_data in serialized_files:
                    file_type = file_data.get('type', 'other')
                    if file_type not in grouped_files:
                        grouped_files[file_type] = []
                    grouped_files[file_type].append(file_data)
                
                # Trier les groupes
                type_order = ['image', 'video', 'pdf', 'other']
                if order == 'desc':
                    type_order = type_order[::-1]
                
                ordered_groups = {}
                for file_type in type_order:
                    if file_type in grouped_files:
                        ordered_groups[file_type] = grouped_files[file_type]
                
                # Ajouter les types non standards à la fin
                for file_type in grouped_files:
                    if file_type not in ordered_groups:
                        ordered_groups[file_type] = grouped_files[file_type]
                
                response_data = {
                    'files_grouped': ordered_groups,
                    'sort_info': {
                        'field': 'type',
                        'order': order,
                        'total_count': len(serialized_files),
                        'include_shared': include_shared,
                        'type_filter': type_filter,
                        'grouped': True,
                        'type_counts': type_counts
                    }
                }
            else:
                response_data = {
                    'files': serialized_files,
                    'sort_info': {
                        'field': 'type',
                        'order': order,
                        'count': len(serialized_files),
                        'include_shared': include_shared,
                        'type_filter': type_filter,
                        'grouped': False,
                        'type_counts': type_counts
                    }
                }
            
            return Response(response_data)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FileSortByDateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            # Get query parameters
            folder_id = request.query_params.get('folder_id', None)
            order = request.query_params.get('order', 'desc')  # 'asc' or 'desc'
            
            collection = get_collection('documents')
            
            # Build query filter
            query_filter = {
                'owner_id': str(request.user.id),
                'is_trashed': False
            }
            
            # Add folder filter if specified
            if folder_id:
                if folder_id.lower() == 'root':
                    query_filter['folder_id'] = None
                else:
                    try:
                        query_filter['folder_id'] = ObjectId(folder_id)
                    except:
                        return Response({'detail': 'Invalid folder_id format.'}, 
                                      status=status.HTTP_400_BAD_REQUEST)
            
            # Sort direction
            sort_direction = -1 if order == 'desc' else 1
            
            # Get files sorted by date
            files = list(collection.find(query_filter).sort('updated_at', sort_direction))
            
            # Convert MongoDB _id to string and add formatted date
            for file in files:
                file['id'] = str(file.get('_id'))
                del file['_id']
                
                # Add formatted dates for easier display
                if file.get('created_at'):
                    file['created_at_formatted'] = file['created_at'].strftime('%Y-%m-%d %H:%M:%S')
                if file.get('updated_at'):
                    file['updated_at_formatted'] = file['updated_at'].strftime('%Y-%m-%d %H:%M:%S')
                
                # Convert folder_id to string if exists
                if file.get('folder_id'):
                    file['folder_id'] = str(file['folder_id'])
            
            return Response({
                'files': files,
                'total_count': len(files),
                'sort_by': 'date',
                'order': order,
                'folder_id': folder_id
            })
            
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FileSortByTypeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            # Get query parameters
            folder_id = request.query_params.get('folder_id', None)
            order = request.query_params.get('order', 'asc')  # 'asc' or 'desc'
            
            collection = get_collection('documents')
            
            # Build query filter
            query_filter = {
                'owner_id': str(request.user.id),
                'is_trashed': False
            }
            
            # Add folder filter if specified
            if folder_id:
                if folder_id.lower() == 'root':
                    query_filter['folder_id'] = None
                else:
                    try:
                        query_filter['folder_id'] = ObjectId(folder_id)
                    except:
                        return Response({'detail': 'Invalid folder_id format.'}, 
                                      status=status.HTTP_400_BAD_REQUEST)
            
            # Get all files
            files = list(collection.find(query_filter))
            
            # Sort by file type (extension)
            def get_file_extension(filename):
                if not filename:
                    return ''
                return os.path.splitext(filename.lower())[1]
            
            files.sort(
                key=lambda x: get_file_extension(x.get('title', '')),
                reverse=(order == 'desc')
            )
            
            # Convert MongoDB _id and organize by type
            files_by_type = {}
            processed_files = []
            
            for file in files:
                file['id'] = str(file.get('_id'))
                del file['_id']
                
                # Get file extension
                extension = get_file_extension(file.get('title', ''))
                if not extension:
                    extension = 'no_extension'
                
                file['file_type'] = extension
                file['file_category'] = self._get_file_category(extension)
                
                # Convert folder_id to string if exists
                if file.get('folder_id'):
                    file['folder_id'] = str(file['folder_id'])
                
                # Group by type
                if extension not in files_by_type:
                    files_by_type[extension] = []
                files_by_type[extension].append(file)
                
                processed_files.append(file)
            
            return Response({
                'files': processed_files,
                'files_by_type': files_by_type,
                'total_count': len(processed_files),
                'sort_by': 'type',
                'order': order,
                'folder_id': folder_id
            })
            
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _get_file_category(self, extension):
        """Categorize file types"""
        categories = {
            'image': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'],
            'document': ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
            'spreadsheet': ['.xls', '.xlsx', '.csv', '.ods'],
            'presentation': ['.ppt', '.pptx', '.odp'],
            'video': ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm'],
            'audio': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'],
            'archive': ['.zip', '.rar', '.7z', '.tar', '.gz'],
            'code': ['.py', '.js', '.html', '.css', '.java', '.cpp', '.c', '.php']
        }
        
        for category, extensions in categories.items():
            if extension.lower() in extensions:
                return category
        
        return 'other'

class FileSortBySizeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            # Get query parameters
            folder_id = request.query_params.get('folder_id', None)
            order = request.query_params.get('order', 'desc')  # 'asc' or 'desc'
            
            collection = get_collection('documents')
            
            # Build query filter
            query_filter = {
                'owner_id': str(request.user.id),
                'is_trashed': False
            }
            
            # Add folder filter if specified
            if folder_id:
                if folder_id.lower() == 'root':
                    query_filter['folder_id'] = None
                else:
                    try:
                        query_filter['folder_id'] = ObjectId(folder_id)
                    except:
                        return Response({'detail': 'Invalid folder_id format.'}, 
                                      status=status.HTTP_400_BAD_REQUEST)
            
            # Get all files
            files = list(collection.find(query_filter))
            
            # Sort by file size
            files.sort(
                key=lambda x: x.get('size', 0),
                reverse=(order == 'desc')
            )
            
            # Convert MongoDB _id and add formatted size
            total_size = 0
            for file in files:
                file['id'] = str(file.get('_id'))
                del file['_id']
                
                # Add formatted size
                size = file.get('size', 0)
                file['size_formatted'] = self._format_file_size(size)
                total_size += size
                
                # Convert folder_id to string if exists
                if file.get('folder_id'):
                    file['folder_id'] = str(file['folder_id'])
            
            # Size statistics
            size_stats = {
                'total_size': total_size,
                'total_size_formatted': self._format_file_size(total_size),
                'average_size': total_size / len(files) if files else 0,
                'largest_file': max(files, key=lambda x: x.get('size', 0)) if files else None,
                'smallest_file': min(files, key=lambda x: x.get('size', 0)) if files else None
            }
            
            if size_stats['largest_file']:
                size_stats['largest_file'] = {
                    'title': size_stats['largest_file'].get('title'),
                    'size': size_stats['largest_file'].get('size'),
                    'size_formatted': self._format_file_size(size_stats['largest_file'].get('size', 0))
                }
            
            if size_stats['smallest_file']:
                size_stats['smallest_file'] = {
                    'title': size_stats['smallest_file'].get('title'),
                    'size': size_stats['smallest_file'].get('size'),
                    'size_formatted': self._format_file_size(size_stats['smallest_file'].get('size', 0))
                }
            
            return Response({
                'files': files,
                'total_count': len(files),
                'size_stats': size_stats,
                'sort_by': 'size',
                'order': order,
                'folder_id': folder_id
            })
            
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _format_file_size(self, size_bytes):
        """Format file size in human readable format"""
        if size_bytes == 0:
            return "0 B"
        
        size_names = ["B", "KB", "MB", "GB", "TB"]
        i = 0
        while size_bytes >= 1024 and i < len(size_names) - 1:
            size_bytes /= 1024.0
            i += 1
        
        return f"{size_bytes:.1f} {size_names[i]}"