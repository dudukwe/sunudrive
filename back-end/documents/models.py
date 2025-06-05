from django.db import models
from django.contrib.auth.models import User
from mongoengine import (
    Document, EmbeddedDocument, StringField, DateTimeField, 
    ListField, ReferenceField, BooleanField, IntField,
    EmbeddedDocumentField, EmbeddedDocumentListField,
    FileField, DictField, CASCADE
)
from datetime import datetime
import os
import uuid

class Comment(EmbeddedDocument):
    """Embedded document for file comments"""
    id = StringField(primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = StringField(required=True)
    text = StringField(required=True)
    created_at = DateTimeField(default=datetime.now)
    updated_at = DateTimeField(default=datetime.now)
    
    meta = {'allow_inheritance': True}

class FileVersion(EmbeddedDocument):
    """Embedded document for file versions"""
    id = StringField(primary_key=True, default=lambda: str(uuid.uuid4()))
    file_path = StringField(required=True)
    version_number = IntField(required=True)
    size = IntField(required=True)
    created_at = DateTimeField(default=datetime.now)
    created_by = StringField(required=True)
    
    meta = {'allow_inheritance': True}

class FileActivity(EmbeddedDocument):
    """Embedded document for tracking file activities"""
    id = StringField(primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = StringField(required=True)
    action = StringField(required=True, choices=['view', 'edit', 'download', 'share', 'delete', 'restore'])
    timestamp = DateTimeField(default=datetime.now)
    details = DictField()
    
    meta = {'allow_inheritance': True}

class FilePermission(EmbeddedDocument):
    """Embedded document for file sharing permissions"""
    user_id = StringField(required=True)
    access_level = StringField(required=True, choices=['view', 'edit', 'admin'])
    granted_at = DateTimeField(default=datetime.now)
    granted_by = StringField(required=True)
    
    meta = {'allow_inheritance': True}

class Folder(Document):
    """Model for document folders"""
    name = StringField(required=True)
    owner_id = StringField(required=True)
    parent_folder = ReferenceField('self', reverse_delete_rule=CASCADE, null=True)
    created_at = DateTimeField(default=datetime.now)
    updated_at = DateTimeField(default=datetime.now)
    is_trashed = BooleanField(default=False)
    trashed_at = DateTimeField()
    permissions = EmbeddedDocumentListField(FilePermission)
    
    meta = {
        'collection': 'folders',
        'indexes': [
            {'fields': ['owner_id']},
            {'fields': ['parent_folder']},
            {'fields': ['is_trashed']}
        ]
    }

class File(Document):
    """Main document model for storing files and their metadata"""
    title = StringField(required=True)
    type = StringField(required=True, choices=["pdf", "image", "video", "document", "other"])
    description = StringField()
    author = StringField(required=True)
    tags = ListField(StringField())
    
    file_path = StringField(required=True, unique=True)
    original_filename = StringField(required=True)
    size = IntField(required=True)  # Size in bytes
    
    owner_id = StringField(required=True)
    folder = ReferenceField(Folder, null=True)
    
    uploaded_at = DateTimeField(default=datetime.now)
    updated_at = DateTimeField(default=datetime.now)
    last_opened = DateTimeField()
    
    is_favorite = BooleanField(default=False)
    is_trashed = BooleanField(default=False)
    trashed_at = DateTimeField()
    
    permissions = EmbeddedDocumentListField(FilePermission)
    versions = EmbeddedDocumentListField(FileVersion)
    comments = EmbeddedDocumentListField(Comment)
    activities = EmbeddedDocumentListField(FileActivity)
    
    meta = {
        'collection': 'documents',
        'indexes': [
            {'fields': ['title']},
            {'fields': ['author']},
            {'fields': ['tags']},
            {'fields': ['type']},
            {'fields': ['owner_id']},
            {'fields': ['folder']},
            {'fields': ['uploaded_at']},
            {'fields': ['is_favorite']},
            {'fields': ['is_trashed']}
        ]
    }
    
    @property
    def extension(self):
        _, ext = os.path.splitext(self.original_filename)
        return ext.lower()
    
    @property
    def current_version(self):
        if self.versions:
            return max(self.versions, key=lambda v: v.version_number)
        return None

class Notification(Document):
    """Model for storing user notifications"""
    user_id = StringField(required=True)
    type = StringField(required=True, choices=['share', 'comment', 'edit', 'system'])
    message = StringField(required=True)
    file = ReferenceField(File, null=True)
    created_at = DateTimeField(default=datetime.now)
    is_read = BooleanField(default=False)
    read_at = DateTimeField()
    details = DictField()
    
    meta = {
        'collection': 'notifications',
        'indexes': [
            {'fields': ['user_id']},
            {'fields': ['is_read']},
            {'fields': ['created_at']}
        ]
    }