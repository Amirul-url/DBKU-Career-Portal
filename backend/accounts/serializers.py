from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.cache import cache
from rest_framework import serializers

from .models import AccountActivity
from .otp_delivery import normalize_phone_number, password_reset_cache_key

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    profile_photo_url = serializers.SerializerMethodField()
    resume_file_url = serializers.SerializerMethodField()
    video_resume_file_url = serializers.SerializerMethodField()
    remove_profile_photo = serializers.BooleanField(write_only=True, required=False)
    remove_resume_file = serializers.BooleanField(write_only=True, required=False)
    remove_video_resume_file = serializers.BooleanField(write_only=True, required=False)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "department",
            "mykad_number",
            "mobile_number",
            "address",
            "profile_photo",
            "profile_photo_url",
            "resume_file",
            "resume_file_url",
            "video_resume_file",
            "video_resume_file_url",
            "remove_profile_photo",
            "remove_resume_file",
            "remove_video_resume_file",
            "is_staff",
            "is_superuser",
        )
        read_only_fields = (
            "id",
            "profile_photo_url",
            "resume_file_url",
            "video_resume_file_url",
            "is_staff",
            "is_superuser",
        )

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_file_url(self, file_field):
        if not file_field:
            return ""

        request = self.context.get("request")
        url = file_field.url
        return request.build_absolute_uri(url) if request else url

    def get_profile_photo_url(self, obj):
        return self.get_file_url(obj.profile_photo)

    def get_resume_file_url(self, obj):
        return self.get_file_url(obj.resume_file)

    def get_video_resume_file_url(self, obj):
        return self.get_file_url(obj.video_resume_file)

    def validate_upload(self, value, valid_content_types, valid_extensions, error_message):
        if not value:
            return value

        content_type = getattr(value, "content_type", "")
        file_name = value.name.lower()

        if content_type not in valid_content_types or not file_name.endswith(valid_extensions):
            raise serializers.ValidationError(error_message)

        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Saiz fail maksimum ialah 5MB.")

        return value

    def validate_profile_photo(self, value):
        return self.validate_upload(
            value,
            {"image/jpeg", "image/png"},
            (".jpg", ".jpeg", ".png"),
            "Sila pilih fail .jpg atau .png sahaja.",
        )

    def validate_resume_file(self, value):
        return self.validate_upload(
            value,
            {
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            },
            (".pdf", ".doc", ".docx"),
            "Sila pilih fail Word atau PDF sahaja.",
        )

    def validate_video_resume_file(self, value):
        return self.validate_upload(
            value,
            {"video/mp4"},
            (".mp4",),
            "Sila pilih fail .mp4 sahaja.",
        )

    def update(self, instance, validated_data):
        file_fields = (
            ("profile_photo", "remove_profile_photo"),
            ("resume_file", "remove_resume_file"),
            ("video_resume_file", "remove_video_resume_file"),
        )
        old_files = {field: getattr(instance, field) for field, _remove_field in file_fields}

        for field, remove_field in file_fields:
            if validated_data.pop(remove_field, False) and old_files[field]:
                old_files[field].delete(save=False)
                setattr(instance, field, "")

        instance = super().update(instance, validated_data)

        for field, _remove_field in file_fields:
            new_file = validated_data.get(field)
            old_file = old_files[field]

            if new_file and old_file and old_file.name != getattr(instance, field).name:
                old_file.delete(save=False)

        return instance


class RegisterSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(write_only=True, required=False, allow_blank=False)
    username = serializers.CharField(required=False)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "full_name",
            "first_name",
            "last_name",
            "mykad_number",
            "mobile_number",
            "address",
            "password",
            "password2",
        )

    def validate(self, attrs):
        email = attrs["email"].strip().lower()
        attrs["email"] = email
        attrs["username"] = email

        if User.objects.filter(username__iexact=email).exists() or User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "Emel ini sudah didaftarkan."})
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": "Kata laluan tidak sepadan."})
        validate_password(attrs["password"])
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")
        full_name = validated_data.pop("full_name", "").strip()
        if full_name and not validated_data.get("first_name"):
            validated_data["first_name"] = full_name
        user = User(**validated_data, role="applicant")
        user.set_password(password)
        user.save()
        return user


class InternalHrmAccountSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Emel ini sudah digunakan.")
        return email

    def create(self, validated_data):
        full_name = validated_data["full_name"].strip()
        email = validated_data["email"]
        user = User(username=email, email=email, first_name=full_name, role="admin", department="Pengurusan Sumber Manusia (HRM)", is_staff=True)
        user.set_password(validated_data["password"])
        user.save()
        return user


class SuperAdminAccountSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=8)

    class Meta:
        model = User
        fields = (
            "id",
            "full_name",
            "first_name",
            "email",
            "mobile_number",
            "department",
            "role",
            "is_active",
            "last_login",
            "password",
        )
        read_only_fields = ("id", "last_login", "role", "is_active")

    def validate_email(self, value):
        email = value.strip().lower()
        queryset = User.objects.filter(email__iexact=email)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Emel ini sudah digunakan.")
        return email

    def validate(self, attrs):
        if not self.instance and not attrs.get("password"):
            raise serializers.ValidationError({"password": "Kata laluan diperlukan."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password", "")
        full_name = validated_data.pop("full_name", "").strip()
        email = validated_data["email"]
        account_role = self.context.get("account_role", "admin")
        user = User(username=email, is_staff=True, is_active=True, role=account_role, **validated_data)
        if account_role == "superadmin":
            user.is_superuser = True
        if full_name:
            user.first_name = full_name
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", "")
        full_name = validated_data.pop("full_name", "").strip()
        if full_name:
            instance.first_name = full_name
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if instance.email:
            instance.username = instance.email
        if password:
            instance.set_password(password)
        instance.is_staff = True
        instance.save()
        return instance


class AccountActivitySerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    full_name = serializers.SerializerMethodField()
    role = serializers.CharField(source="user.role", read_only=True)
    role_label = serializers.SerializerMethodField()
    action_label = serializers.CharField(source="get_action_display", read_only=True)

    class Meta:
        model = AccountActivity
        fields = (
            "id",
            "email",
            "full_name",
            "role",
            "role_label",
            "action",
            "action_label",
            "duration_seconds",
            "created_at",
        )

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_role_label(self, obj):
        return {
            "superadmin": "Super Admin",
            "admin": "Pentadbir",
            "applicant": "Pemohon",
        }.get(obj.user.role, obj.user.role)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    username = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        identifier = (attrs.get("email") or attrs.get("username") or "").strip().lower()
        if not identifier:
            raise serializers.ValidationError({"email": "Emel diperlukan."})

        login_username = identifier
        existing_user = User.objects.filter(email__iexact=identifier).first()
        if existing_user:
            login_username = existing_user.username

        user = authenticate(
            request=self.context.get("request"),
            username=login_username,
            password=attrs.get("password"),
        )
        if not user:
            raise serializers.ValidationError("Emel atau kata laluan tidak sah.")
        if not user.is_active:
            raise serializers.ValidationError("Akaun ini tidak aktif.")
        attrs["user"] = user
        return attrs


def resolve_password_reset_user(email):
    normalized_email = (email or "").strip().lower()
    if not normalized_email:
        raise serializers.ValidationError({"email": "Emel diperlukan."})

    user = User.objects.filter(email__iexact=normalized_email).first()
    if not user:
        raise serializers.ValidationError({"email": "Tiada akaun ditemui untuk emel ini."})
    if not user.is_active:
        raise serializers.ValidationError({"email": "Akaun ini tidak aktif."})

    return normalized_email, user


def resolve_password_reset_identity(attrs):
    method = attrs.get("method") or ForgotPasswordSendSerializer.METHOD_EMAIL
    if method == ForgotPasswordSendSerializer.METHOD_EMAIL:
        email, user = resolve_password_reset_user(attrs.get("email"))
        return {
            "method": method,
            "email": email,
            "user": user,
            "identifier": email,
        }

    phone_number = normalize_phone_number(attrs.get("phone_number"))
    if not phone_number:
        raise serializers.ValidationError({"phone_number": "Nombor WhatsApp diperlukan."})

    user = next(
        (
            candidate
            for candidate in User.objects.exclude(mobile_number="")
            if normalize_phone_number(candidate.mobile_number) == phone_number
        ),
        None,
    )
    if not user:
        raise serializers.ValidationError({"phone_number": "Tiada akaun ditemui untuk nombor WhatsApp ini."})
    if not user.is_active:
        raise serializers.ValidationError({"phone_number": "Akaun ini tidak aktif."})

    return {
        "method": method,
        "phone_number": phone_number,
        "email": user.email,
        "user": user,
        "identifier": phone_number,
    }


class ForgotPasswordSendSerializer(serializers.Serializer):
    METHOD_EMAIL = "email"
    METHOD_WHATSAPP = "whatsapp"

    method = serializers.ChoiceField(
        choices=[METHOD_EMAIL, METHOD_WHATSAPP],
        default=METHOD_EMAIL,
        required=False,
    )
    email = serializers.EmailField(required=False, allow_blank=True)
    phone_number = serializers.CharField(max_length=30, required=False, allow_blank=True)

    def validate(self, attrs):
        attrs.update(resolve_password_reset_identity(attrs))
        return attrs

    @property
    def cache_key(self):
        return password_reset_cache_key(
            self.validated_data["method"],
            self.validated_data["identifier"],
        )


class ForgotPasswordVerifySerializer(serializers.Serializer):
    method = serializers.ChoiceField(
        choices=[ForgotPasswordSendSerializer.METHOD_EMAIL, ForgotPasswordSendSerializer.METHOD_WHATSAPP],
        default=ForgotPasswordSendSerializer.METHOD_EMAIL,
        required=False,
    )
    email = serializers.EmailField(required=False, allow_blank=True)
    phone_number = serializers.CharField(max_length=30, required=False, allow_blank=True)
    otp = serializers.CharField(min_length=6, max_length=6)

    def validate(self, attrs):
        attrs.update(resolve_password_reset_identity(attrs))
        expected = cache.get(password_reset_cache_key(attrs["method"], attrs["identifier"]))
        if not expected or expected != attrs.get("otp"):
            raise serializers.ValidationError({"otp": "OTP tidak sah atau telah tamat tempoh."})

        return attrs


class ResetPasswordSerializer(serializers.Serializer):
    method = serializers.ChoiceField(
        choices=[ForgotPasswordSendSerializer.METHOD_EMAIL, ForgotPasswordSendSerializer.METHOD_WHATSAPP],
        default=ForgotPasswordSendSerializer.METHOD_EMAIL,
        required=False,
    )
    email = serializers.EmailField(required=False, allow_blank=True)
    phone_number = serializers.CharField(max_length=30, required=False, allow_blank=True)
    otp = serializers.CharField(min_length=6, max_length=6)
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        attrs.update(resolve_password_reset_identity(attrs))
        expected = cache.get(password_reset_cache_key(attrs["method"], attrs["identifier"]))
        if not expected or expected != attrs.get("otp"):
            raise serializers.ValidationError({"otp": "OTP tidak sah atau telah tamat tempoh."})
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": "Kata laluan tidak sepadan."})

        validate_password(attrs["password"], attrs["user"])
        return attrs

    def save(self):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["password"])
        user.save(update_fields=["password"])
        cache.delete(password_reset_cache_key(self.validated_data["method"], self.validated_data["identifier"]))
        return user
