# Generated by Django 4.2.16 on 2024-09-21 09:00

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('posts', '0003_alter_tenant_passcode'),
    ]

    operations = [
        migrations.AddField(
            model_name='owner',
            name='ownerface_image',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='owner',
            name='ownerfingerprint',
            field=models.BinaryField(blank=True, null=True),
        ),
    ]
