from django.contrib.auth import authenticate, login
from django.core.mail import send_mail
from rest_framework import generics, status
from rest_framework.permissions import IsAdminUser, IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, PasswordResetToken
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer, ChangePasswordSerializer


class UserListView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    authentication_classes = [JWTAuthentication]

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        identifier = request.data.get('identifier')  # identifier = email || cellphone
        password = request.data.get('password')
        email = None
        cellphone = None

        if "@" in identifier:
            email = identifier
        else:
            cellphone = identifier

        if email:
            user = authenticate(identifier=email, password=password)
        elif cellphone:
            user = authenticate(identifier=cellphone, password=password)
        else:
            user = None

        if user is None:
            return Response({'error': 'email or password incorrect'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        user_serializer = UserSerializer(user)

        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": user_serializer.data  
        }, status=status.HTTP_200_OK)

    
class RequestPasswordResetView(APIView):
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "Utilisateur non trouvé"}, status=status.HTTP_404_NOT_FOUND)
        reset_token = PasswordResetToken.generate_token(user)
        email_message = f"Votre code de réinitialisation du mot de passe est : {reset_token.token}"
        send_mail(
            'Demande de réinitialisation du mot de passe',
            email_message,
            'no-reply@agriconnect.com',
            [user.email],
            fail_silently=False,
        )
        return Response({"message": "Code de réinitialisation envoyé à votre email"}, status=status.HTTP_200_OK)

class ConfirmPasswordResetView(APIView):
    def post(self, request, *args, **kwargs):
        token = request.data.get('token')
        new_password = request.data.get('password')
        password_confirm = request.data.get('password_confirm')
        if new_password != password_confirm:
            return Response({"error": "Les mots de passe ne correspondent pas"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            reset_token = PasswordResetToken.objects.get(token=token)
            print(reset_token.user.email)
        except PasswordResetToken.DoesNotExist:
            return Response({"error": "Code OTP invalide"}, status=status.HTTP_400_BAD_REQUEST)
        if reset_token.is_expired():
            return Response({"error": "Le Code OTP a expiré"}, status=status.HTTP_400_BAD_REQUEST)
        user = reset_token.user
        user.set_password(new_password)
        user.save()
        reset_token.delete()
        return Response({"message": "Mot de passe réinitialisé avec succès"}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def check_email_phone(request):
    email = request.data.get('email')
    cellphone = request.data.get('cellphone')
    
    if email and User.objects.filter(email=email).exists():
        return Response({'exists': True, 'field': 'email'}, status=status.HTTP_200_OK)
    
    if cellphone and User.objects.filter(cellphone=cellphone).exists():
        return Response({'exists': True, 'field': 'cellphone'}, status=status.HTTP_200_OK)
    
    return Response({'exists': False}, status=status.HTTP_200_OK)




class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]
    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            user = request.user 
            current_password = serializer.validated_data['current_password']
            new_password = serializer.validated_data['new_password']

            if not user.check_password(current_password):
                return Response({"error": "current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(new_password)
            user.save()
            return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
