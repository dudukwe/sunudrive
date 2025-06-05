from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
import random
import secrets
from datetime import timedelta
from django.utils import timezone

def generate_random_cellphone():
    """Function used to generate phone number when creating superuser"""
    return f"77{''.join(random.choices('0123456789', k=7))}"

class UserManager(BaseUserManager):
    def create_user(self, email, first_name, last_name, cellphone, password, **extra_fields):
        if not email:
            raise ValueError('Provide email')
        email = self.normalize_email(email)
        user = self.model(first_name=first_name, last_name=last_name, cellphone=cellphone, email=email, **extra_fields)
        user.set_password(password)
        user.save()

        return user
    
    
    def create_superuser(self, email, first_name, password, **extra_fields):

        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Staff privilege must be assigned to superuser')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser privilege must be assigned to superuser')
        
        return self.create_user(email, first_name=first_name, last_name='', cellphone=generate_random_cellphone(), password=password, **extra_fields)


class User(AbstractUser):
    first_name = models.CharField(max_length=150, blank=False, null=False)
    last_name = models.CharField(max_length=150, blank=False, null=False)
    email = models.EmailField(unique=True)
    cellphone = models.CharField(max_length=20, unique=True, blank=False, null=False)
    username = None  
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name']

    objects = UserManager() 
    
    def __str__(self):
        return self.email
    
    


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def save(self, *args, **kwargs):
        """Override save method to set expiration date."""
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=15)  
        super().save(*args, **kwargs)

    @classmethod
    def generate_token(cls, user):
        """Generate and save a unique token for password reset."""
        token = secrets.token_hex(2).upper()  
        reset_token = cls(user=user, token=token)
        reset_token.save()
        return reset_token

    def is_expired(self):
        """Check if the token is expired."""
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"Reset Token for {self.user} : {self.token}"

