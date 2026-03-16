from rest_framework import serializers
from collections import OrderedDict


class BaseModelSerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        self._requested_fields = kwargs.pop('fields', None)
        super().__init__(*args, **kwargs)
        if self._requested_fields:
            for field_name in set(self.fields) - set(self._requested_fields):
                self.fields.pop(field_name)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if self._requested_fields:
            ordered = OrderedDict()
            for key in self._requested_fields:
                if key in data:
                    ordered[key] = data[key]
            return ordered
        return data
