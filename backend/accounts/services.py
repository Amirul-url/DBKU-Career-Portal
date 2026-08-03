from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import UserSerializer


def build_auth_response(user, request=None):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user": UserSerializer(user, context={"request": request}).data,
    }
