from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from ..utils.mongodb import get_collection

class TagsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            collection = get_collection('documents')
            
            # Get files accessible to user
            query = {
                '$or': [
                    {'owner_id': str(request.user.id)},
                    {'permissions.user_id': str(request.user.id)}
                ],
                'is_trashed': False
            }
            
            # Project only the tags field
            projection = {'tags': 1}
            
            files = list(collection.find(query, projection))
            
            # Extract all tags from all files
            all_tags = []
            for file in files:
                all_tags.extend(file.get('tags', []))
            
            # Count tag occurrences
            tag_counts = {}
            for tag in all_tags:
                if tag in tag_counts:
                    tag_counts[tag] += 1
                else:
                    tag_counts[tag] = 1
            
            # Convert to list of objects for response
            tag_list = [{'name': tag, 'count': count} for tag, count in tag_counts.items()]
            
            # Sort by count (descending)
            tag_list.sort(key=lambda x: x['count'], reverse=True)
            
            return Response(tag_list)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)