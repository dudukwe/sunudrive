from django.contrib.auth.backends import BaseBackend
from django.contrib.auth import get_user_model
from .models import User

class EmailOrCellphoneBackend(BaseBackend):
    def authenticate(self, request, identifier=None, password=None, **kwargs):
        """Authenticate a user using email or cellphone"""
        if not identifier or not password:
            return None
        
        user = None
        if "@" in identifier:
            user = User.objects.filter(email=identifier).first()
        else:
            print(identifier)
            user = User.objects.filter(cellphone=identifier).first()

        if user and user.check_password(password):
            return user 
        return None
    
    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None 