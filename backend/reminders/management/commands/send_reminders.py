from django.core.management.base import BaseCommand
from reminders.utils import tenant_due_reminder  # Import the utility function

class Command(BaseCommand):
    help = 'Send reminders to tenants'

    def handle(self, *args, **options):
        tenant_due_reminder()  # Call the function without passing any arguments
        self.stdout.write(self.style.SUCCESS('Successfully sent reminders!'))
