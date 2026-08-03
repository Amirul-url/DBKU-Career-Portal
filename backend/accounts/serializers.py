from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    profile_photo_url = serializers.SerializerMethodField()
    remove_profile_photo = serializers.BooleanField(write_only=True, required=False)

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
            "remove_profile_photo",
            "is_staff",
            "is_superuser",
        )
        read_only_fields = ("id", "profile_photo_url", "is_staff", "is_superuser")

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_profile_photo_url(self, obj):
        if not obj.profile_photo:
            return ""

        request = self.context.get("request")
        url = obj.profile_photo.url
        return request.build_absolute_uri(url) if request else url

    def validate_profile_photo(self, value):
        if not value:
            return value

        valid_content_types = {"image/jpeg", "image/png"}
        valid_extensions = (".jpg", ".jpeg", ".png")
        content_type = getattr(value, "content_type", "")
        file_name = value.name.lower()

        if content_type not in valid_content_types or not file_name.endswith(valid_extensions):
            raise serializers.ValidationError("Sila pilih fail .jpg atau .png sahaja.")

        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Saiz fail maksimum ialah 5MB.")

        return value

    def update(self, instance, validated_data):
        remove_profile_photo = validated_data.pop("remove_profile_photo", False)
        new_profile_photo = validated_data.get("profile_photo")
        old_profile_photo = instance.profile_photo

        if remove_profile_photo and old_profile_photo:
            old_profile_photo.delete(save=False)
            instance.profile_photo = ""

        instance = super().update(instance, validated_data)

        if new_profile_photo and old_profile_photo and old_profile_photo.name != instance.profile_photo.name:
            old_profile_photo.delete(save=False)

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
