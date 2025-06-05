from rest_framework import serializers
from .models import User
from rest_framework.validators import UniqueValidator
from django.contrib.auth.password_validation import validate_password
from .models import User

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User 
        fields = ['id', 'first_name', 'last_name', 'email', 'cellphone', 'password']


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )    
    cellphone = serializers.CharField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(write_only=True, required=True)
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'cellphone', 'password', 'password2']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match"})
        
        return attrs

    def create(self, validated_data):
        user = User.objects.create(
           first_name = validated_data['first_name'],
           last_name = validated_data['last_name'],
           email = validated_data['email'],
           cellphone = validated_data['cellphone'],
        )

        user.set_password(validated_data['password'])
        user.save()
    
        return user
    


class LoginSerializer(serializers.ModelSerializer): 
    user = serializers.SerializerMethodField()
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'user']

    def get_user(self, instance):
        email = instance.email  
        try:
            user = User.objects.get(email=email)
            user_serializer = UserSerializer(user)
            return user_serializer.data
        except User.DoesNotExist:
            return None
    

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"new_password": "The new passwords do not match."})
        return data
