from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from datetime import datetime

from ..serializers import NotificationSerializer
from ..utils.mongodb import get_collection

class NotificationsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            collection = get_collection('notifications')
            
            # Get query parameters
            unread_only = request.query_params.get('unread', 'false').lower() == 'true'
            limit = int(request.query_params.get('limit', 50))
            
            # Base query
            query = {'user_id': str(request.user.id)}
            
            # Add unread filter if requested
            if unread_only:
                query['is_read'] = False
            
            # Get notifications
            notifications = list(collection.find(query).sort('created_at', -1).limit(limit))
            
            # Convert MongoDB _id to string id for serialization
            for notification in notifications:
                notification['id'] = str(notification.get('_id'))
                del notification['_id']
            
            serializer = NotificationSerializer(notifications, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MarkNotificationsReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            collection = get_collection('notifications')
            
            # Get notification IDs to mark as read
            notification_ids = request.data.get('notification_ids', [])
            mark_all = request.data.get('mark_all', False)
            
            if mark_all:
                # Mark all user's notifications as read
                result = collection.update_many(
                    {'user_id': str(request.user.id), 'is_read': False},
                    {
                        '$set': {
                            'is_read': True,
                            'read_at': datetime.now()
                        }
                    }
                )
                
                return Response({
                    'detail': f'Marked {result.modified_count} notifications as read.',
                    'count': result.modified_count
                })
            elif notification_ids:
                # Mark specific notifications as read
                result = collection.update_many(
                    {
                        '_id': {'$in': notification_ids},
                        'user_id': str(request.user.id),  # Ensure user only updates their own notifications
                        'is_read': False
                    },
                    {
                        '$set': {
                            'is_read': True,
                            'read_at': datetime.now()
                        }
                    }
                )
                
                return Response({
                    'detail': f'Marked {result.modified_count} notifications as read.',
                    'count': result.modified_count
                })
            else:
                return Response({'detail': 'Either notification_ids or mark_all must be provided.'}, 
                              status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)