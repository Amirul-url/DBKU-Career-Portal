import os

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from accounts.models import User


class Command(BaseCommand):
    help = "Cipta atau kemas kini akaun Super Admin sementara untuk localhost sahaja."

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("Seed Super Admin hanya dibenarkan apabila DEBUG=True.")

        email = os.getenv("LOCAL_SUPERADMIN_EMAIL", "muhdamirulaqmal@gmail.com").strip().lower()
        password = os.getenv("LOCAL_SUPERADMIN_PASSWORD", "TempSuperAdmin123!")

        user, created = User.objects.get_or_create(
            email=email,
            defaults={"username": email, "first_name": "Super Admin"},
        )
        user.username = email
        user.email = email
        user.first_name = "Super Admin"
        user.role = "superadmin"
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()

        action = "dicipta" if created else "dikemas kini"
        self.stdout.write(self.style.SUCCESS(f"Akaun Super Admin sementara berjaya {action}: {email}"))
