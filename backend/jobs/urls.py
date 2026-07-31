from rest_framework.routers import DefaultRouter

from .views import VacancyViewSet

router = DefaultRouter()
router.register(r"", VacancyViewSet, basename="jobs")

urlpatterns = router.urls

