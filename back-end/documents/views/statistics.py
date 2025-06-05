from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from datetime import datetime, timedelta

from ..serializers import FileStatisticsSerializer
from ..utils.mongodb import get_collection

class StatisticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            collection = get_collection('documents')
            
            # Get user's files (not in trash)
            user_files = list(collection.find({
                'owner_id': str(request.user.id),
                'is_trashed': False
            }))
            
            # Basic statistics
            total_files = len(user_files)
            total_size = sum(file.get('size', 0) for file in user_files)
            
            # Files by type
            files_by_type = {}
            storage_by_type = {}
            
            for file in user_files:
                file_type = file.get('type', 'other')
                
                # Count files by type
                if file_type in files_by_type:
                    files_by_type[file_type] += 1
                else:
                    files_by_type[file_type] = 1
                
                # Sum storage by type
                if file_type in storage_by_type:
                    storage_by_type[file_type] += file.get('size', 0)
                else:
                    storage_by_type[file_type] = file.get('size', 0)
            
            # Recent activity
            one_week_ago = datetime.now() - timedelta(days=7)
            
            # Get activities across all user's files
            recent_activities = []
            
            for file in user_files:
                file_id = str(file.get('_id'))
                file_title = file.get('title')
                
                for activity in file.get('activities', []):
                    activity_time = activity.get('timestamp')
                    
                    # Skip activities older than a week
                    if activity_time and activity_time < one_week_ago:
                        continue
                    
                    # Add file info to activity
                    activity_with_context = {
                        'id': activity.get('id'),
                        'user_id': activity.get('user_id'),
                        'action': activity.get('action'),
                        'timestamp': activity.get('timestamp'),
                        'file_id': file_id,
                        'file_title': file_title
                    }
                    
                    recent_activities.append(activity_with_context)
            
            # Sort activities by timestamp (newest first)
            recent_activities.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            
            # Limit to top 20 most recent activities
            recent_activities = recent_activities[:20]
            
            # Compile statistics
            statistics = {
                'total_files': total_files,
                'total_size': total_size,
                'files_by_type': files_by_type,
                'storage_by_type': storage_by_type,
                'recent_activity': recent_activities
            }
            
            serializer = FileStatisticsSerializer(statistics)
            return Response(serializer.data)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)