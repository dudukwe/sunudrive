from django.contrib import admin
from .models import User, PasswordResetToken

admin.site.register(User)
admin.site.register(PasswordResetToken)