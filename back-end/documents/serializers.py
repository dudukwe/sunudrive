from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'password', 'email', 'first_name', 'last_name')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        token['name'] = f"{user.first_name} {user.last_name}"
        return token

class CommentSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    user_id = serializers.CharField()
    text = serializers.CharField()
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

class FileVersionSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    file_path = serializers.CharField()
    version_number = serializers.IntegerField()
    size = serializers.IntegerField()
    created_at = serializers.DateTimeField(read_only=True)
    created_by = serializers.CharField()

class FileActivitySerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    user_id = serializers.CharField()
    action = serializers.CharField()
    timestamp = serializers.DateTimeField(read_only=True)
    details = serializers.DictField(required=False)

class FilePermissionSerializer(serializers.Serializer):
    user_id = serializers.CharField()
    access_level = serializers.ChoiceField(choices=['view', 'edit', 'admin'])
    granted_at = serializers.DateTimeField(read_only=True)
    granted_by = serializers.CharField()

class FolderSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField()
    owner_id = serializers.CharField()
    parent_folder = serializers.CharField(allow_null=True, required=False)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    is_trashed = serializers.BooleanField(default=False)
    trashed_at = serializers.DateTimeField(allow_null=True, required=False)
    permissions = FilePermissionSerializer(many=True, required=False)

class FileSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    title = serializers.CharField()
    type = serializers.ChoiceField(choices=["pdf", "image", "video", "document", "other"])
    description = serializers.CharField(allow_null=True, required=False)
    author = serializers.CharField()
    tags = serializers.ListField(child=serializers.CharField(), required=False)
    
    file_path = serializers.CharField(read_only=True)
    original_filename = serializers.CharField(read_only=True)
    size = serializers.IntegerField(read_only=True)
    
    owner_id = serializers.CharField()
    folder = serializers.CharField(allow_null=True, required=False)
    
    uploaded_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    last_opened = serializers.DateTimeField(allow_null=True, required=False)
    
    is_favorite = serializers.BooleanField(default=False)
    is_trashed = serializers.BooleanField(default=False, read_only=True)
    trashed_at = serializers.DateTimeField(allow_null=True, required=False, read_only=True)
    
    permissions = FilePermissionSerializer(many=True, required=False)
    versions = FileVersionSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    activities = FileActivitySerializer(many=True, read_only=True)
    
    extension = serializers.CharField(read_only=True)

class FileListSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    title = serializers.CharField()
    type = serializers.CharField()
    author = serializers.CharField()
    size = serializers.IntegerField()
    uploaded_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    is_favorite = serializers.BooleanField()
    tags = serializers.ListField(child=serializers.CharField())

class NotificationSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    user_id = serializers.CharField()
    type = serializers.ChoiceField(choices=['share', 'comment', 'edit', 'system'])
    message = serializers.CharField()
    file = serializers.CharField(allow_null=True, required=False)
    created_at = serializers.DateTimeField(read_only=True)
    is_read = serializers.BooleanField(default=False)
    read_at = serializers.DateTimeField(allow_null=True, required=False)
    details = serializers.DictField(required=False)

class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    title = serializers.CharField()
    description = serializers.CharField(allow_blank=True, required=False)
    tags = serializers.ListField(child=serializers.CharField(), required=False)
    folder = serializers.CharField(allow_null=True, required=False)  


class FileStatisticsSerializer(serializers.Serializer):
    total_files = serializers.IntegerField()
    total_size = serializers.IntegerField()
    files_by_type = serializers.DictField(child=serializers.IntegerField())
    storage_by_type = serializers.DictField(child=serializers.IntegerField())
    recent_activity = serializers.ListField(child=serializers.DictField())