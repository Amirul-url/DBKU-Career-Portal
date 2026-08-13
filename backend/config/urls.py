from django.conf import settings
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path, re_path
from django.views.static import serve as serve_static
from rest_framework_simplejwt.views import TokenRefreshView


def home(_request):
    return JsonResponse({"message": "DBKU Job and Internship Portal backend running"})


urlpatterns = [
    path("", home),
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/jobs/", include("jobs.urls")),
    path("api/applications/", include("applications.urls")),
    path("api/notifications/", include("notifications.urls")),
]

urlpatterns += [
    re_path(r"^media/(?P<path>.*)$", serve_static, {"document_root": settings.MEDIA_ROOT}),
]
