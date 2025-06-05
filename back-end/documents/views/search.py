from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from ..serializers import FileListSerializer
from ..utils.mongodb import get_collection

class SearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            # Get search parameters
            query = request.query_params.get('q', '')
            file_type = request.query_params.get('type', None)
            field = request.query_params.get('field', 'all')
            
            if not query:
                return Response({'detail': 'Search query parameter "q" is required.'}, 
                               status=status.HTTP_400_BAD_REQUEST)
            
            collection = get_collection('documents')
            
            # Base filter to only include files the user has access to
            access_filter = {
                '$or': [
                    {'owner_id': str(request.user.id)},
                    {'permissions.user_id': str(request.user.id)}
                ],
                'is_trashed': False
            }
            
            # Add file type filter if specified
            if file_type:
                access_filter['type'] = file_type
            
            # Build search query based on the field parameter
            if field == 'title':
                search_filter = {'title': {'$regex': query, '$options': 'i'}}
            elif field == 'author':
                search_filter = {'author': {'$regex': query, '$options': 'i'}}
            elif field == 'description':
                search_filter = {'description': {'$regex': query, '$options': 'i'}}
            elif field == 'tags':
                search_filter = {'tags': {'$elemMatch': {'$regex': query, '$options': 'i'}}}
            else:
                # Search in all fields
                search_filter = {
                    '$or': [
                        {'title': {'$regex': query, '$options': 'i'}},
                        {'author': {'$regex': query, '$options': 'i'}},
                        {'description': {'$regex': query, '$options': 'i'}},
                        {'tags': {'$elemMatch': {'$regex': query, '$options': 'i'}}},
                        {'original_filename': {'$regex': query, '$options': 'i'}}
                    ]
                }
            
            # Combine filters
            combined_filter = {**access_filter, **search_filter}
            
            # Execute search
            results = list(collection.find(combined_filter).sort('updated_at', -1).limit(100))
            
            # Convert MongoDB _id to string id for serialization
            for file in results:
                file['id'] = str(file.get('_id'))
                del file['_id']
            
            serializer = FileListSerializer(results, many=True)
            
            return Response({
                'count': len(results),
                'results': serializer.data
            })
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)