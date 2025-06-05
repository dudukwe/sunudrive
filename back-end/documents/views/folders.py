from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from mongoengine.errors import DoesNotExist
from datetime import datetime
import uuid
from bson import ObjectId
from ..models import Folder, File
from ..serializers import FolderSerializer, FileListSerializer
from ..utils.mongodb import get_collection
from bson import ObjectId
from datetime import datetime
from rest_framework.response import Response
from rest_framework import status


class FolderListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            collection = get_collection('folders')
      
            # Get parent folder parameter for nested folders
            parent_folder = request.query_params.get('parent_folder', None)
            
            # Base query
            query = {
                'owner_id': str(request.user.id),
                'is_trashed': False
            }
            
            # Add parent folder filter if provided
            if parent_folder:
                query['parent_folder'] = ObjectId(parent_folder)
            else:
                query['parent_folder'] = None  # Root folders by default
            
            folders = list(collection.find(query).sort('name', 1))
            # Convert MongoDB _id to string id for serialization
            for folder in folders:
                folder['id'] = str(folder.get('_id'))
                del folder['_id']
            
            return Response(folders)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        try:
            if 'name' not in request.data:
                return Response({'detail': 'Folder name is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
            folder_name = request.data['name'].strip()
            if not folder_name:
                return Response({'detail': 'Folder name cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

            parent_folder = request.data.get('parent_folder')
            if parent_folder:
                try:
                    parent_folder = ObjectId(parent_folder)
                except Exception:
                    return Response({'detail': 'Invalid parent folder ID.'}, status=status.HTTP_400_BAD_REQUEST)

            folder_collection = get_collection('folders')

            # Vérifier l'existence d'un dossier avec le même nom pour le même utilisateur et le même parent
            duplicate_folder = folder_collection.find_one({
                'name': folder_name,
                'owner_id': str(request.user.id),
                'parent_folder': parent_folder,
                'is_trashed': False
            })

            if duplicate_folder:
                return Response({'detail': 'A folder with the same name already exists in this location.'},
                                status=status.HTTP_400_BAD_REQUEST)

            # Si un parent est fourni, vérifier son existence et l'accès
            if parent_folder:
                parent = folder_collection.find_one({
                    '_id': parent_folder,
                    '$or': [
                        {'owner_id': str(request.user.id)},
                        {'permissions.user_id': str(request.user.id), 'permissions.access_level': 'admin'}
                    ]
                })
                if not parent:
                    return Response({'detail': 'Parent folder not found or permission denied.'},
                                    status=status.HTTP_404_NOT_FOUND)

            now = datetime.now()
            folder_data = {
                'name': folder_name,
                'owner_id': str(request.user.id),
                'parent_folder': parent_folder,
                'created_at': now,
                'updated_at': now,
                'is_trashed': False,
                'permissions': []
            }

            result = folder_collection.insert_one(folder_data)

            response_data = {
                'id': str(result.inserted_id),
                'name': folder_data['name'],
                'owner_id': folder_data['owner_id'],
                'parent_folder': str(parent_folder) if parent_folder else None,
                'created_at': now.isoformat(),
                'updated_at': now.isoformat(),
                'is_trashed': folder_data['is_trashed'],
                'permissions': folder_data['permissions']
            }

            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FolderDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, folder_id):
        folder_id = ObjectId(folder_id)
        try:
            folders_collection = get_collection('folders')
            
            # Récupérer le dossier principal
            folder = folders_collection.find_one({'_id': folder_id})
            if not folder:
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Vérification des permissions
            if folder.get('owner_id') != str(request.user.id):
                has_permission = False
                for perm in folder.get('permissions', []):
                    if perm.get('user_id') == str(request.user.id) and perm.get('access_level') in ['view', 'edit', 'admin']:
                        has_permission = True
                        break
                
                if not has_permission:
                    return Response({'detail': 'You do not have permission to view this folder.'}, 
                                    status=status.HTTP_403_FORBIDDEN)
            
            # Récupération des sous-dossiers
            subfolders = list(folders_collection.find({
                'parent_folder': folder_id,
                'is_trashed': False
            }).sort('name', 1))

            for sub in subfolders:
                sub['id'] = str(sub['_id'])
                del sub['_id']
            
            # Préparation de la réponse
            folder_detail = {
                'id': str(folder['_id']),
                'name': folder.get('name'),
                'parent_folder': str(folder.get('parent_folder')) if folder.get('parent_folder') else None,
                'subfolders': subfolders
            }

            return Response(folder_detail)
        
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, folder_id):
        folder_id = ObjectId(folder_id)
        try:
            collection = get_collection('folders')
            folder = collection.find_one({'_id': folder_id})
            
            if not folder:
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check permissions
            if folder.get('owner_id') != str(request.user.id):
                has_permission = False
                for perm in folder.get('permissions', []):
                    if perm.get('user_id') == str(request.user.id) and perm.get('access_level') in ['edit', 'admin']:
                        has_permission = True
                        break
                
                if not has_permission:
                    return Response({'detail': 'You do not have permission to edit this folder.'}, 
                                   status=status.HTTP_403_FORBIDDEN)
            
            # Update folder
            updates = {}
            if 'name' in request.data:
                updates['name'] = request.data['name']
            
            if 'parent_folder' in request.data:
                parent_folder = request.data['parent_folder']
                
                # Check if the parent_folder is valid
                if parent_folder:
                    parent = collection.find_one({'_id': parent_folder})
                    if not parent:
                        return Response({'detail': 'Parent folder not found.'}, status=status.HTTP_404_NOT_FOUND)
                    
                    # Check for circular references
                    if parent_folder == folder_id:
                        return Response({'detail': 'A folder cannot be its own parent.'}, 
                                       status=status.HTTP_400_BAD_REQUEST)
                    
                    # Check if any child of this folder is being set as the parent
                    def is_descendant(potential_child_id, of_folder_id):
                        child = collection.find_one({'_id': potential_child_id})
                        if not child:
                            return False
                        
                        if child.get('parent_folder') == of_folder_id:
                            return True
                        
                        if child.get('parent_folder'):
                            return is_descendant(child.get('parent_folder'), of_folder_id)
                        
                        return False
                    
                    if is_descendant(parent_folder, folder_id):
                        return Response({'detail': 'Cannot create circular folder structure.'}, 
                                       status=status.HTTP_400_BAD_REQUEST)
                
                updates['parent_folder'] = parent_folder
            
            if updates:
                updates['updated_at'] = datetime.now()
                collection.update_one({'_id': folder_id}, {'$set': updates})
            
            # Get updated folder
            updated_folder = collection.find_one({'_id': folder_id})
            updated_folder['id'] = str(updated_folder.get('_id'))
            del updated_folder['_id']
            
            return Response(updated_folder)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, folder_id):
        folder_id = ObjectId(folder_id)
        try:
            collection = get_collection('folders')
            folder = collection.find_one({'_id': folder_id})
            
            if not folder:
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check permissions
            if folder.get('owner_id') != str(request.user.id):
                has_permission = False
                for perm in folder.get('permissions', []):
                    if perm.get('user_id') == str(request.user.id) and perm.get('access_level') == 'admin':
                        has_permission = True
                        break
                
                if not has_permission:
                    return Response({'detail': 'You do not have permission to delete this folder.'}, 
                                   status=status.HTTP_403_FORBIDDEN)
            
            # Move folder to trash
            now = datetime.now()
            collection.update_one(
                {'_id': folder_id},
                {
                    '$set': {
                        'is_trashed': True,
                        'trashed_at': now
                    }
                }
            )
            
            # Also move all files in this folder to trash
            files_collection = get_collection('documents')
            files_collection.update_many(
                {'folder': folder_id, 'is_trashed': False},
                {
                    '$set': {
                        'is_trashed': True,
                        'trashed_at': now
                    }
                }
            )
            
            # Also move all sub-folders to trash
            def trash_subfolders(parent_id):
                subfolders = list(collection.find({'parent_folder': parent_id, 'is_trashed': False}))
                for subfolder in subfolders:
                    subfolder_id = subfolder.get('_id')
                    
                    # Move subfolder to trash
                    collection.update_one(
                        {'_id': subfolder_id},
                        {
                            '$set': {
                                'is_trashed': True,
                                'trashed_at': now
                            }
                        }
                    )
                    
                    # Move files in subfolder to trash
                    files_collection.update_many(
                        {'folder': subfolder_id, 'is_trashed': False},
                        {
                            '$set': {
                                'is_trashed': True,
                                'trashed_at': now
                            }
                        }
                    )
                    
                    # Recursively trash sub-subfolders
                    trash_subfolders(subfolder_id)
            
            trash_subfolders(folder_id)
            
            return Response({'detail': 'Folder and contents moved to trash.'})
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FolderFilesView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, folder_id):
        folder_id = ObjectId(folder_id)
        try:
            # First check if folder exists and user has access
            folders_collection = get_collection('folders')
            folder = folders_collection.find_one({'_id': folder_id})
            
            if not folder:
                return Response({'detail': 'Folder not found.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check permissions
            if folder.get('owner_id') != str(request.user.id):
                has_permission = False
                for perm in folder.get('permissions', []):
                    if perm.get('user_id') == str(request.user.id) and perm.get('access_level') in ['view', 'edit', 'admin']:
                        has_permission = True
                        break
                
                if not has_permission:
                    return Response({'detail': 'You do not have permission to view this folder.'}, 
                                   status=status.HTTP_403_FORBIDDEN)
            
        
            files_collection = get_collection('documents')

            # Exécution de la requête
            files_cursor = files_collection.find({
                'folder': str(folder_id),
                'is_trashed': False
            }).sort('title', 1)

            files = list(files_cursor)
            
            # Convert MongoDB _id to string id for serialization
            for file in files:
                file['id'] = str(file.get('_id'))
                del file['_id']
            
            serializer = FileListSerializer(files, many=True)
            
            # Get subfolders
            subfolders = list(folders_collection.find({
                'parent_folder': folder_id,
                'is_trashed': False
            }).sort('name', 1))

            # Convert MongoDB _id to string id for serialization
            for subfolder in subfolders:
                subfolder['id'] = str(subfolder.get('_id'))
                del subfolder['_id']
            
            return Response({
                'folder': {
                    'id': str(folder_id),
                    'name': str(folder.get('name')),
                    'parent_folder': str(folder.get('parent_folder'))
                },
                'files': serializer.data,
                'subfolders': subfolders
            })
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)