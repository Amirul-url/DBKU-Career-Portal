from rest_framework import permissions, status
from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from django.db.models import Q

from .models import ApplicantProfileData, User
from .serializers import InternalHrmAccountSerializer, LoginSerializer, RegisterSerializer, SuperAdminAccountSerializer, UserSerializer
from .services import build_auth_response


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response(build_auth_response(user, request), status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    return Response(build_auth_response(serializer.validated_data["user"], request))


@api_view(["GET", "PATCH"])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def me_view(request):
    if request.method == "PATCH":
        serializer = UserSerializer(request.user, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    return Response(UserSerializer(request.user, context={"request": request}).data)


@api_view(["POST"])
def internal_hrm_account_view(request):
    if request.user.role != "superadmin":
        return Response({"detail": "Akses Super Admin diperlukan."}, status=status.HTTP_403_FORBIDDEN)

    serializer = InternalHrmAccountSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response(UserSerializer(user, context={"request": request}).data, status=status.HTTP_201_CREATED)


PROFILE_SECTIONS = ("personal", "job_preferences", "experience", "academic", "skills")


def profile_payload(profile):
    return {section: getattr(profile, section) for section in PROFILE_SECTIONS} | {"updated_at": profile.updated_at}


@api_view(["GET", "PATCH"])
def applicant_profile_data_view(request):
    if request.user.role != "applicant":
        return Response({"detail": "Akses pemohon diperlukan."}, status=status.HTTP_403_FORBIDDEN)

    profile, _created = ApplicantProfileData.objects.get_or_create(user=request.user)
    if request.method == "PATCH":
        for section in PROFILE_SECTIONS:
            if section in request.data:
                value = request.data[section]
                if not isinstance(value, (dict, list)):
                    return Response({section: "Format data profil tidak sah."}, status=status.HTTP_400_BAD_REQUEST)
                setattr(profile, section, value)
        profile.save()
    return Response(profile_payload(profile))


@api_view(["GET"])
def superadmin_applicants_view(request):
    if request.user.role != "superadmin":
        return Response({"detail": "Akses Super Admin diperlukan."}, status=status.HTTP_403_FORBIDDEN)

    query = request.query_params.get("q", "").strip()
    applicants = User.objects.filter(role="applicant").order_by("first_name", "email")
    if query:
        applicants = applicants.filter(
            Q(email__icontains=query)
            | Q(first_name__icontains=query)
            | Q(mykad_number__icontains=query)
            | Q(mobile_number__icontains=query)
        )
    return Response(UserSerializer(applicants, many=True, context={"request": request}).data)


@api_view(["GET"])
def superadmin_applicant_profile_view(request, user_id):
    if request.user.role != "superadmin":
        return Response({"detail": "Akses Super Admin diperlukan."}, status=status.HTTP_403_FORBIDDEN)

    applicant = User.objects.filter(id=user_id, role="applicant").first()
    if not applicant:
        return Response({"detail": "Pemohon tidak ditemui."}, status=status.HTTP_404_NOT_FOUND)
    profile, _created = ApplicantProfileData.objects.get_or_create(user=applicant)
    return Response({"applicant": UserSerializer(applicant, context={"request": request}).data, "profile": profile_payload(profile)})


@api_view(["GET", "POST"])
def superadmin_admin_accounts_view(request):
    if request.user.role != "superadmin":
        return Response({"detail": "Akses Super Admin diperlukan."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "POST":
        serializer = SuperAdminAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(SuperAdminAccountSerializer(user).data, status=status.HTTP_201_CREATED)

    query = request.query_params.get("q", "").strip()
    department = request.query_params.get("department", "").strip()
    accounts = User.objects.filter(role="admin").order_by("first_name", "email")
    if query:
        accounts = accounts.filter(
            Q(email__icontains=query)
            | Q(first_name__icontains=query)
            | Q(mobile_number__icontains=query)
            | Q(department__icontains=query)
        )
    if department:
        department_aliases = [department]
        if department == "Pengurusan Sumber Manusia (HRM)":
            department_aliases.append("HRM")
        accounts = accounts.filter(department__in=department_aliases)
    return Response(SuperAdminAccountSerializer(accounts, many=True).data)


@api_view(["PATCH", "DELETE"])
def superadmin_admin_account_detail_view(request, user_id):
    if request.user.role != "superadmin":
        return Response({"detail": "Akses Super Admin diperlukan."}, status=status.HTTP_403_FORBIDDEN)

    account = User.objects.filter(id=user_id, role="admin").first()
    if not account:
        return Response({"detail": "Akaun pentadbir tidak ditemui."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        account.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = SuperAdminAccountSerializer(account, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(["GET", "POST"])
def superadmin_superadmin_accounts_view(request):
    if request.user.role != "superadmin":
        return Response({"detail": "Akses Super Admin diperlukan."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == "POST":
        serializer = SuperAdminAccountSerializer(data=request.data, context={"account_role": "superadmin"})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(SuperAdminAccountSerializer(user).data, status=status.HTTP_201_CREATED)

    query = request.query_params.get("q", "").strip()
    accounts = User.objects.filter(role="superadmin").order_by("first_name", "email")
    if query:
        accounts = accounts.filter(
            Q(email__icontains=query)
            | Q(first_name__icontains=query)
            | Q(mobile_number__icontains=query)
        )
    return Response(SuperAdminAccountSerializer(accounts, many=True).data)


@api_view(["PATCH", "DELETE"])
def superadmin_superadmin_account_detail_view(request, user_id):
    if request.user.role != "superadmin":
        return Response({"detail": "Akses Super Admin diperlukan."}, status=status.HTTP_403_FORBIDDEN)

    account = User.objects.filter(id=user_id, role="superadmin").first()
    if not account:
        return Response({"detail": "Akaun Super Admin tidak ditemui."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "DELETE":
        if account.id == request.user.id:
            return Response({"detail": "Akaun Super Admin sendiri tidak boleh dipadam."}, status=status.HTTP_400_BAD_REQUEST)
        account.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = SuperAdminAccountSerializer(account, data=request.data, partial=True, context={"account_role": "superadmin"})
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)
