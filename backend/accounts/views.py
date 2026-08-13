import secrets

from django.core.cache import cache
from rest_framework import permissions, status
from rest_framework.decorators import api_view, authentication_classes, parser_classes, permission_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.db import DatabaseError
from django.db.models import Q

from .models import AccountActivity, ApplicantProfileData, LoginSession, User
from .otp_delivery import OTPDeliveryError, send_password_reset_email, send_password_reset_whatsapp
from .serializers import AccountActivitySerializer, ForgotPasswordSendSerializer, ForgotPasswordVerifySerializer, InternalHrmAccountSerializer, LoginSerializer, RegisterSerializer, ResetPasswordSerializer, SuperAdminAccountSerializer, UserSerializer
from .services import build_auth_response, notify_applicant_registration_success
from .session_services import close_login_session, close_open_login_sessions


def safe_record_activity(user, action, duration_seconds=0):
    try:
        AccountActivity.objects.create(user=user, action=action, duration_seconds=duration_seconds)
    except DatabaseError:
        pass


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    notify_applicant_registration_success(user)
    return Response({"message": "Pendaftaran akaun berjaya. Sila log masuk untuk meneruskan."}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@authentication_classes([])
@permission_classes([permissions.AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]
    now = timezone.now()
    close_open_login_sessions(user, now)
    login_session = LoginSession.objects.create(user=user, login_at=now)
    user.last_login = now
    user.save(update_fields=["last_login"])
    safe_record_activity(user, "login")
    return Response(build_auth_response(user, request, login_session))


@api_view(["POST"])
@authentication_classes([])
@permission_classes([permissions.AllowAny])
def forgot_password_send_otp_view(request):
    serializer = ForgotPasswordSendSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    otp = f"{secrets.randbelow(1000000):06d}"
    cache.set(serializer.cache_key, otp, timeout=600)

    try:
        if serializer.validated_data["method"] == "whatsapp":
            send_password_reset_whatsapp(serializer.validated_data["phone_number"], otp)
        else:
            send_password_reset_email(serializer.validated_data["user"], otp)
    except OTPDeliveryError as exc:
        cache.delete(serializer.cache_key)
        return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

    return Response({"message": "OTP berjaya dihantar ke emel berdaftar."})


@api_view(["POST"])
@authentication_classes([])
@permission_classes([permissions.AllowAny])
def forgot_password_verify_otp_view(request):
    serializer = ForgotPasswordVerifySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    return Response({"message": "OTP berjaya disahkan.", "redirect_url": "/reset-password"})


@api_view(["POST"])
@authentication_classes([])
@permission_classes([permissions.AllowAny])
def reset_password_submit_view(request):
    serializer = ResetPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({"message": "Kata laluan berjaya ditetapkan semula."})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    try:
        session_id = request.data.get("login_session_id")
        session = None
        if session_id:
            session = LoginSession.objects.filter(
                pk=session_id,
                user=request.user,
                logout_at__isnull=True,
            ).first()
        if not session:
            session = LoginSession.objects.filter(
                user=request.user,
                logout_at__isnull=True,
            ).order_by("-login_at").first()
        if session:
            close_login_session(session, timezone.now())

        latest_login = AccountActivity.objects.filter(user=request.user, action="login").order_by("-created_at").first()
        latest_logout = AccountActivity.objects.filter(user=request.user, action="logout").order_by("-created_at").first()
        duration_seconds = 0
        if latest_login and (not latest_logout or latest_logout.created_at < latest_login.created_at):
            duration_seconds = max(0, int((timezone.now() - latest_login.created_at).total_seconds()))
        safe_record_activity(request.user, "logout", duration_seconds)
    except DatabaseError:
        pass
    return Response({"message": "Logged out."}, status=status.HTTP_200_OK)


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


@api_view(["GET"])
def superadmin_account_activities_view(request):
    if request.user.role != "superadmin":
        return Response({"detail": "Akses Super Admin diperlukan."}, status=status.HTTP_403_FORBIDDEN)

    try:
        queryset = AccountActivity.objects.select_related("user").all()
        selected_date = parse_date(request.query_params.get("date", ""))
        if selected_date:
            queryset = queryset.filter(created_at__date=selected_date)
        try:
            limit = min(max(int(request.query_params.get("limit", 5)), 1), 50)
        except ValueError:
            limit = 5
        return Response(AccountActivitySerializer(queryset[:limit], many=True).data)
    except DatabaseError:
        return Response([])


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
